'use strict';
const APP_NAME = "SeatReach";
const Core = globalThis.SeatReachCore;
const $ = id => document.getElementById(id);
const canvas = $('plan'), ctx = canvas.getContext('2d');
const ink = '#293630', teal = '#28675f', orange = '#c54c20', paper = '#f8f5ed';
let tables = Core.preset(), width = 90, selectedTable = 'T6', selectedSeat = '';
let analysis, drag = null, view = null, nextId = 7, framePending = false;
$('app-name').textContent = APP_NAME;
let summaryText = '';

function feedback(message) { $('feedback').textContent = message; }
function refresh() {
  analysis = Core.analyze(tables, width);
  summaryText = `${analysis.reachable} of ${analysis.seats.length} seats reachable at ${width} cm`;
  $('summary').textContent = summaryText;
  $('width-value').innerHTML = `${width} <small>cm</small>`;
  $('width').setAttribute('aria-valuetext', `${width} centimetres`);
  const blocked = analysis.seats.length - analysis.reachable;
  $('summary-status').textContent = blocked ? `!  ${blocked} seats need attention` : analysis.seats.length ? '✓  Every seat connected' : 'No tables on plan';
  $('summary-status').classList.toggle('clear', !blocked);
  $('insight').classList.toggle('clear', !blocked);
  $('insight').querySelector('.insight-icon').textContent = blocked ? '!' : '✓';
  const tightest = analysis.pinches.reduce((a, b) => !a || b.gap < a.gap ? b : a, null);
  const t6 = tables.find(t => t.id === 'T6');
  const demo = width === 90 && t6 && t6.x === 1010 && t6.y === 510 && t6.rotated && blocked === 3;
  $('insight-text').textContent = demo
    ? 'Try it: move T6 left 30 cm. Click the table, then press ← three times.'
    : blocked ? (tightest ? `${Math.round(tightest.gap)} cm tightest gap; ${width} cm needed. Move a nearby table to open the route.` : 'No route to these seats. Move a table to create an approach from the entrance.')
    : tables.length ? `Every seat has a route at ${width} cm. Click a seat to trace its path.` : 'Add a table to start checking seat access.';
  updateSelectors();
  describeRoute();
  requestDraw();
}
function updateSelectors() {
  const tableSelect = $('table-select');
  tableSelect.replaceChildren();
  if (!tables.length) tableSelect.add(new Option('No tables', ''));
  for (const t of tables) tableSelect.add(new Option(`${t.id} · ${(t.x / 100).toFixed(1)}, ${(t.y / 100).toFixed(1)} m`, t.id));
  tableSelect.value = selectedTable;
  $('rotate').disabled = $('delete').disabled = !selectedTable;
  tableSelect.disabled = !tables.length;
  const seatSelect = $('seat-select');
  seatSelect.replaceChildren(new Option('Select a seat on the plan', ''));
  for (const s of analysis.seats) {
    const parts = s.id.split('-');
    seatSelect.add(new Option(`${s.tableId} / seat ${Number(parts[1]) * 3 + Number(parts[2]) + 1} · ${s.reachable ? 'reachable' : 'blocked'}`, s.id));
  }
  if (!analysis.seats.some(s => s.id === selectedSeat)) selectedSeat = '';
  seatSelect.value = selectedSeat;
}
function describeRoute() {
  const seat = analysis.seats.find(s => s.id === selectedSeat);
  $('route-note').textContent = seat
    ? seat.cells.length ? `${seat.tableId}: ${seat.reachable ? 'reachable' : 'blocked'}. Best route has ${Math.round(seat.gap)} cm minimum clearance width.${seat.reachable ? '' : ' Dashed path is too narrow.'}` : `${seat.tableId}: no route to this seat.`
    : 'Dashed routes are too narrow for this width.';
}
function requestDraw() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(() => { framePending = false; draw(); });
}
function draw() {
  const rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 3);
  if (!rect.width || !rect.height) return;
  canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  view = renderPlan(ctx, rect.width, rect.height, { interactive: true });
}
function renderPlan(c, w, h, options = {}) {
  c.clearRect(0, 0, w, h);
  if (options.paper) { c.fillStyle = paper; c.fillRect(0, 0, w, h); }
  const scale = Math.min((w - 65) / 1200, (h - 65) / 800);
  const ox = (w - 1200 * scale) / 2, oy = (h - 800 * scale) / 2 - 5;
  c.save(); c.translate(ox, oy); c.scale(scale, scale);
  const line = (x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
  const font = (px, weight = 400) => { c.font = `${weight} ${px / scale}px system-ui, sans-serif`; };
  c.fillStyle = paper; c.fillRect(0, 0, 1200, 800);
  c.fillStyle = '#dde8de';
  for (let i = 0; i < analysis.reached.length; i++) if (analysis.reached[i]) c.fillRect((i % 120) * 10, Math.floor(i / 120) * 10, 10, 10);
  c.strokeStyle = '#8a9b7e24'; c.lineWidth = .55 / scale;
  for (let x = 50; x < 1200; x += 50) line(x, 0, x, 800);
  for (let y = 50; y < 800; y += 50) line(0, y, 1200, y);
  c.fillStyle = '#70766b'; font(9); c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let x = 0; x <= 1200; x += 200) c.fillText(`${x / 100}${x === 1200 ? ' m' : ''}`, x, -18 / scale);
  c.textAlign = 'right';
  for (let y = 200; y <= 800; y += 200) c.fillText(`${y / 100}${y === 800 ? ' m' : ''}`, -11 / scale, y);
  const seat = analysis.seats.find(s => s.id === selectedSeat);
  if (seat && seat.cells.length) {
    c.strokeStyle = seat.reachable ? teal : orange;
    c.lineWidth = 2 / scale;
    c.setLineDash(seat.reachable ? [] : [6 / scale, 4 / scale]);
    c.lineJoin = 'round'; c.beginPath();
    c.moveTo(150, 800);
    for (const i of seat.cells) c.lineTo((i % 120 + .5) * 10, (Math.floor(i / 120) + .5) * 10);
    c.stroke(); c.setLineDash([]);
    const last = seat.cells[seat.cells.length - 1];
    c.fillStyle = seat.reachable ? teal : orange; c.beginPath(); c.arc((last % 120 + .5) * 10, (Math.floor(last / 120) + .5) * 10, 3 / scale, 0, Math.PI * 2); c.fill();
  }
  for (const s of analysis.seats) {
    c.fillStyle = s.reachable ? '#c2d8cc' : orange;
    c.strokeStyle = s.reachable ? teal : '#a43d18'; c.lineWidth = 1 / scale;
    c.fillRect(s.x, s.y, s.w, s.h); c.strokeRect(s.x, s.y, s.w, s.h);
    // A small outward tick indicates the approach edge, including in monochrome.
    c.strokeStyle = s.reachable ? teal : '#fff4e8'; c.lineWidth = 1.6 / scale;
    const cx = s.x + 22.5, cy = s.y + 22.5;
    if (s.reachable) line(cx + s.dx * 16 - s.dy * 7, cy + s.dy * 16 + s.dx * 7, cx + s.dx * 16 + s.dy * 7, cy + s.dy * 16 - s.dx * 7);
    else { c.fillStyle = '#fff7ed'; font(12, 800); c.textAlign = 'center'; c.fillText('!', cx, cy + .5); }
    if (s.id === selectedSeat) { c.strokeStyle = ink; c.lineWidth = 1.5 / scale; c.strokeRect(s.x - 5, s.y - 5, 55, 55); }
  }
  for (const t of analysis.shapes) {
    c.save(); c.shadowColor = '#29363022'; c.shadowBlur = 4 / scale; c.shadowOffsetY = 2 / scale;
    c.fillStyle = '#4a514a'; c.fillRect(t.x, t.y, t.w, t.h); c.restore();
    c.strokeStyle = ink; c.lineWidth = 1 / scale; c.strokeRect(t.x, t.y, t.w, t.h);
    c.fillStyle = '#faf8ef'; c.textAlign = 'center'; font(11, 600); c.fillText(t.id, t.x + t.w / 2, t.y + t.h / 2);
    if (options.interactive && t.id === selectedTable) {
      c.strokeStyle = ink; c.lineWidth = 1 / scale; c.setLineDash([4 / scale, 3 / scale]);
      c.strokeRect(t.x - 7, t.y - 7, t.w + 14, t.h + 14); c.setLineDash([]);
      for (const [x, y] of [[t.x,t.y],[t.x+t.w,t.y],[t.x,t.y+t.h],[t.x+t.w,t.y+t.h]]) { c.fillStyle = paper; c.strokeStyle = ink; c.fillRect(x - 3 / scale, y - 3 / scale, 6 / scale, 6 / scale); c.strokeRect(x - 3 / scale, y - 3 / scale, 6 / scale, 6 / scale); }
    }
  }
  // Draw a single worst bottleneck, or the selected blocked seat's bottleneck.
  const pinch = seat && !seat.reachable && seat.pinch >= 0 ? { cell: seat.pinch, gap: seat.gap } : analysis.pinches.reduce((a,b) => !a || b.gap < a.gap ? b : a, null);
  if (pinch) {
    const i = pinch.cell, x = (i % 120 + .5) * 10, y = (Math.floor(i / 120) + .5) * 10;
    const horizontal = i % 120 > 0 && i % 120 < 119 && analysis.clearance[i - 1] <= analysis.clearance[i] && analysis.clearance[i + 1] <= analysis.clearance[i];
    const dx = horizontal ? pinch.gap / 2 : 0, dy = horizontal ? 0 : pinch.gap / 2;
    c.strokeStyle = orange; c.lineWidth = 2.5 / scale;
    line(x - dx, y - dy, x + dx, y + dy);
    const cap = 4 / scale;
    if (horizontal) { line(x - dx, y - cap, x - dx, y + cap); line(x + dx, y - cap, x + dx, y + cap); }
    else { line(x - cap, y - dy, x + cap, y - dy); line(x - cap, y + dy, x + cap, y + dy); }
    const label = `${Math.round(pinch.gap)} cm gap - needs ${width} cm`;
    font(11, 650); const tw = c.measureText(label).width, pad = 7 / scale;
    const lx = Math.max(pad, Math.min(x - tw / 2, 1200 - tw - pad * 2));
    const ly = y > 650 ? Math.min(765, y + 85) : Math.max(35, y - 70);
    c.lineWidth = 1 / scale; line(x, y, Math.max(lx, Math.min(x, lx + tw)), ly);
    c.fillStyle = '#fff4e8'; c.fillRect(lx - pad, ly - 12 / scale, tw + pad * 2, 24 / scale);
    c.strokeStyle = orange; c.strokeRect(lx - pad, ly - 12 / scale, tw + pad * 2, 24 / scale);
    c.fillStyle = orange; c.textAlign = 'left'; c.fillText(label, lx, ly);
  }
  c.strokeStyle = ink; c.lineWidth = 2 / scale;
  c.beginPath(); c.moveTo(90, 800); c.lineTo(0, 800); c.lineTo(0, 0); c.lineTo(1200, 0); c.lineTo(1200, 800); c.lineTo(210, 800); c.stroke();
  c.strokeStyle = teal; c.lineWidth = 1.5 / scale;
  line(150, 824, 150, 788); line(150, 788, 142, 798); line(150, 788, 158, 798);
  c.fillStyle = teal; font(9, 600); c.textAlign = 'left'; c.fillText('ENTRANCE · 1.2 m', 225, 800 + 20 / scale);
  c.restore();
  return { scale, ox, oy };
}
function planPoint(event) {
  const r = canvas.getBoundingClientRect();
  return { x: (event.clientX - r.left - view.ox) / view.scale, y: (event.clientY - r.top - view.oy) / view.scale };
}
function hit(rect, p) { return p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h; }
function moveTable(candidate, quiet = false) {
  if (!Core.canPlace(candidate, tables)) { if (!quiet) feedback('That position overlaps a table, chair, or wall.'); return false; }
  tables = tables.map(t => t.id === candidate.id ? candidate : t);
  if (!quiet) feedback(`${candidate.id} placed at ${(candidate.x / 100).toFixed(1)}, ${(candidate.y / 100).toFixed(1)} m.`);
  refresh(); return true;
}
canvas.addEventListener('pointerdown', event => {
  if (!view || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const p = planPoint(event);
  const seat = analysis.seats.find(s => hit(s, p));
  canvas.focus({ preventScroll: true });
  if (seat) { selectedSeat = seat.id; $('seat-select').value = selectedSeat; describeRoute(); requestDraw(); return; }
  const table = [...analysis.shapes].reverse().find(t => hit(t, p));
  if (!table) { selectedSeat = ''; $('seat-select').value = ''; describeRoute(); requestDraw(); return; }
  selectedTable = table.id; updateSelectors(); requestDraw();
  drag = { id: table.id, dx: p.x - table.x, dy: p.y - table.y, pointerId: event.pointerId };
  canvas.setPointerCapture(event.pointerId); canvas.style.cursor = 'grabbing';
});
canvas.addEventListener('pointermove', event => {
  if (!view) return;
  const p = planPoint(event);
  if (!drag) { canvas.style.cursor = analysis.shapes.some(t => hit(t, p)) ? 'grab' : analysis.seats.some(s => hit(s, p)) ? 'pointer' : 'default'; return; }
  if (event.pointerId !== drag.pointerId) return;
  const table = tables.find(t => t.id === drag.id);
  const x = Math.round((p.x - drag.dx) / 10) * 10, y = Math.round((p.y - drag.dy) / 10) * 10;
  if (x !== table.x || y !== table.y) {
    if (moveTable({ ...table, x, y }, true)) feedback('');
    else feedback('Keep tables and chairs inside the room without overlap.');
  }
});
function endDrag(event) {
  if (!drag || (event.pointerId !== undefined && event.pointerId !== drag.pointerId)) return;
  if (canvas.hasPointerCapture(drag.pointerId)) canvas.releasePointerCapture(drag.pointerId);
  drag = null; canvas.style.cursor = 'grab';
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('lostpointercapture', () => { drag = null; });
function rotateSelected() {
  const t = tables.find(t => t.id === selectedTable); if (!t) return;
  const g = Core.geometry(t);
  const candidate = { ...t, rotated: !t.rotated, x: Math.round((t.x + (g.w - g.h) / 2) / 10) * 10, y: Math.round((t.y + (g.h - g.w) / 2) / 10) * 10 };
  moveTable(candidate);
}
canvas.addEventListener('dblclick', event => {
  if (!view) return; const p = planPoint(event), t = analysis.shapes.find(t => hit(t, p));
  if (t) { selectedTable = t.id; rotateSelected(); }
});
$('rotate').addEventListener('click', rotateSelected);
$('table-select').addEventListener('change', event => { selectedTable = event.target.value; requestDraw(); });
$('seat-select').addEventListener('change', event => { selectedSeat = event.target.value; describeRoute(); requestDraw(); });
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
  if (/INPUT|SELECT|TEXTAREA/.test(event.target.tagName) || $('copy-dialog').open) return;
  const t = tables.find(t => t.id === selectedTable); if (!t) return;
  event.preventDefault();
  const directions = { ArrowLeft: [-10,0], ArrowRight: [10,0], ArrowUp: [0,-10], ArrowDown: [0,10] }, [dx,dy] = directions[event.key];
  moveTable({ ...t, x: t.x + dx, y: t.y + dy });
});
$('width').addEventListener('input', event => { width = Number(event.target.value); refresh(); });
$('add').addEventListener('click', () => {
  let candidate = null;
  // Prefer somewhere with comfortable spacing; fall back to any legal spot.
  for (const margin of [100, 0]) {
    for (let y = 140; y <= 650 && !candidate; y += 10) for (let x = 100; x <= 920 && !candidate; x += 10) {
      const t = { id: 'T' + nextId, x, y, rotated: false }, g = Core.geometry(t);
      const crowded = tables.some(o => { const b = Core.geometry(o); return x < b.x + b.w + margin && x + g.w + margin > b.x && y - 45 < b.y + b.h + 45 + margin && y + g.h + 45 + margin > b.y - 45; });
      if ((!margin || !crowded) && Core.canPlace(t, tables)) candidate = t;
    }
    if (candidate) break;
  }
  if (!candidate) { feedback('There is no free space for another table and its six chairs.'); return; }
  nextId++; tables.push(candidate); selectedTable = candidate.id; refresh(); feedback(`Added ${candidate.id} with six seats.`);
});
$('delete').addEventListener('click', () => {
  const id = selectedTable; if (!id) return;
  tables = tables.filter(t => t.id !== id); selectedTable = tables.length ? tables[tables.length - 1].id : '';
  refresh(); feedback(`Deleted ${id} and its six seats.`);
});
$('preset').addEventListener('click', () => {
  tables = Core.preset(); width = 90; $('width').value = width; selectedTable = 'T6'; selectedSeat = ''; nextId = 7;
  refresh(); feedback('Community hall restored. T6 is selected.');
});
$('download').addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas'); exportCanvas.width = 1800; exportCanvas.height = 1390;
  const c = exportCanvas.getContext('2d'); c.fillStyle = paper; c.fillRect(0, 0, 1800, 1390);
  c.fillStyle = ink; c.font = '600 34px system-ui, sans-serif'; c.fillText(APP_NAME + ' / Community hall', 65, 65);
  c.font = '25px system-ui, sans-serif'; c.fillText(summaryText, 65, 110);
  c.font = '18px system-ui, sans-serif'; c.fillStyle = '#70766b'; c.fillText(`Required clear width: ${width} cm · Room: 12.0 × 8.0 m · Grid: 10 cm`, 65, 146);
  c.save(); c.translate(0, 175); renderPlan(c, 1800, 1150, { paper: true }); c.restore();
  c.fillStyle = '#70766b'; c.font = '17px system-ui, sans-serif';
  c.fillText('Planning aid on a simplified plan. It does not certify accessibility or fire-code compliance.', 65, 1360);
  exportCanvas.toBlob(blob => {
    if (!blob) { feedback('PNG export failed. Please try again.'); return; }
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `${APP_NAME.toLowerCase()}-plan.png`; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000); feedback('Plan PNG downloaded.');
  }, 'image/png');
});
$('copy').addEventListener('click', async () => {
  const json = JSON.stringify({ app: APP_NAME, version: 1, units: 'cm', room: Core.ROOM, requiredWidth: width, tables }, null, 2);
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Manual copy required');
    await navigator.clipboard.writeText(json); feedback('Layout JSON copied.');
  } catch {
    $('json-text').value = json; $('copy-dialog').showModal(); $('json-text').focus(); $('json-text').select();
    feedback('Use the text box to copy your layout.');
  }
});
$('close-copy').addEventListener('click', () => $('copy-dialog').close());
if (typeof ResizeObserver === 'function') new ResizeObserver(requestDraw).observe(canvas.parentElement);
else window.addEventListener('resize', requestDraw);
refresh();
