/* Pure geometry and routing; no DOM or dependencies.
 * Units: centimetres. A cell represents a 10 cm square. Rectangles are
 * rasterized by cell-centre inclusion. Chebyshev distance to occupied cell
 * boundaries = (8-neighbour distance - 0.5) * cell size; walls are analytic.
 * Four-neighbour routes prevent diagonal corner cutting. Seat access means
 * the square mover's footprint touches the OUTER seat edge: its centre is
 * half its width from the rasterized edge, rounded outward to the next grid
 * centre (under 10 cm). Using the raster edge also avoids false blockage
 * from chairs whose 45 cm outlines fall between grid boundaries.
 * Geometry and reported gaps have grid resolution, not survey accuracy.
 * Classic-script export intentionally supports file://, including tests.html.
 */
(function (root) {
  'use strict';
  const CELL = 10;
  const ROOM = Object.freeze({ width: 1200, height: 800, cell: CELL, entrance: { start: 90, end: 210 } });
  function geometry(table) {
    const vertical = !!table.rotated;
    const w = vertical ? 75 : 180, h = vertical ? 180 : 75;
    const seats = [];
    for (let side = 0; side < 2; side++) for (let n = 0; n < 3; n++) {
      const along = 7.5 + n * 60;
      seats.push({ id: table.id + '-' + side + '-' + n, tableId: table.id,
        x: table.x + (vertical ? (side ? w : -45) : along),
        y: table.y + (vertical ? along : (side ? h : -45)),
        w: 45, h: 45, dx: vertical ? (side ? 1 : -1) : 0, dy: vertical ? 0 : (side ? 1 : -1) });
    }
    return { ...table, w, h, seats };
  }
  function rasterize(tables, room = ROOM) {
    const cols = room.width / room.cell, rows = room.height / room.cell;
    const occupied = new Uint8Array(cols * rows);
    const shapes = tables.map(geometry);
    for (const table of shapes) for (const r of [table, ...table.seats]) {
      const x0 = Math.max(0, Math.ceil(r.x / room.cell - .5));
      const y0 = Math.max(0, Math.ceil(r.y / room.cell - .5));
      const x1 = Math.min(cols, Math.ceil((r.x + r.w) / room.cell - .5));
      const y1 = Math.min(rows, Math.ceil((r.y + r.h) / room.cell - .5));
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) occupied[y * cols + x] = 1;
    }
    return { occupied, cols, rows, shapes };
  }
  function clearanceMap(occupied, cols, rows, cell = CELL, entrance = null) {
    const distance = new Float32Array(occupied.length);
    for (let i = 0; i < distance.length; i++) distance[i] = occupied[i] ? 0 : 1e6;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      if (x) distance[i] = Math.min(distance[i], distance[i - 1] + 1);
      if (y) {
        distance[i] = Math.min(distance[i], distance[i - cols] + 1);
        if (x) distance[i] = Math.min(distance[i], distance[i - cols - 1] + 1);
        if (x + 1 < cols) distance[i] = Math.min(distance[i], distance[i - cols + 1] + 1);
      }
    }
    for (let y = rows - 1; y >= 0; y--) for (let x = cols - 1; x >= 0; x--) {
      const i = y * cols + x;
      if (x + 1 < cols) distance[i] = Math.min(distance[i], distance[i + 1] + 1);
      if (y + 1 < rows) {
        distance[i] = Math.min(distance[i], distance[i + cols] + 1);
        if (x) distance[i] = Math.min(distance[i], distance[i + cols - 1] + 1);
        if (x + 1 < cols) distance[i] = Math.min(distance[i], distance[i + cols + 1] + 1);
      }
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x, cx = (x + .5) * cell, cy = (y + .5) * cell;
      let bottom = rows * cell - cy;
      if (entrance && cx >= entrance.start && cx <= entrance.end)
        bottom = Math.max(bottom, Math.min(cx - entrance.start, entrance.end - cx));
      distance[i] = occupied[i] ? 0 : Math.max(0, Math.min((distance[i] - .5) * cell, cx, cols * cell - cx, cy, bottom));
    }
    return distance;
  }
  function neighbours(i, cols, rows, visit) {
    const x = i % cols;
    if (x) visit(i - 1);
    if (x + 1 < cols) visit(i + 1);
    if (i >= cols) visit(i - cols);
    if (i < (rows - 1) * cols) visit(i + cols);
  }
  function flood(clearance, cols, rows, starts, width) {
    const reached = new Uint8Array(clearance.length), queue = new Int32Array(clearance.length);
    let head = 0, tail = 0;
    for (const i of starts) if (!reached[i] && clearance[i] >= width / 2 && clearance[i] > 0) { reached[i] = 1; queue[tail++] = i; }
    while (head < tail) neighbours(queue[head++], cols, rows, i => {
      if (!reached[i] && clearance[i] > 0 && clearance[i] >= width / 2) { reached[i] = 1; queue[tail++] = i; }
    });
    return reached;
  }
  function widestPaths(clearance, cols, rows, starts) {
    const best = new Float32Array(clearance.length), parent = new Int32Array(clearance.length).fill(-1);
    const heap = [];
    function push(i, value) {
      let p = heap.length; heap.push([i, value]);
      while (p > 0) { const q = (p - 1) >> 1; if (heap[q][1] >= value) break; heap[p] = heap[q]; p = q; }
      heap[p] = [i, value];
    }
    function pop() {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        let p = 0;
        while (p * 2 + 1 < heap.length) {
          let q = p * 2 + 1;
          if (q + 1 < heap.length && heap[q + 1][1] > heap[q][1]) q++;
          if (heap[q][1] <= last[1]) break;
          heap[p] = heap[q]; p = q;
        }
        heap[p] = last;
      }
      return top;
    }
    for (const i of starts) if (clearance[i] > best[i]) { best[i] = clearance[i]; push(i, best[i]); }
    while (heap.length) {
      const [i, value] = pop();
      if (value !== best[i]) continue;
      neighbours(i, cols, rows, n => {
        const candidate = Math.min(value, clearance[n]);
        if (candidate > best[n]) { best[n] = candidate; parent[n] = i; push(n, candidate); }
      });
    }
    return { best, parent };
  }
  function tracePath(target, paths, clearance, cols = 0) {
    if (target < 0 || !paths.best[target]) return { cells: [], pinch: -1, gap: 0 };
    const cells = []; let i = target, pinch = target, minimum = Infinity, bounded = false;
    // Prefer a bottleneck with opposing boundaries on its cross-section,
    // rather than an equally narrow cell merely following one distant wall.
    const acrossGap = i => {
      if (!cols) return false;
      const n = Math.ceil(clearance[i] / CELL + .5), x = i % cols;
      return ((x - n < 0 || clearance[i - n] === 0) && (x + n >= cols || clearance[i + n] === 0)) ||
        ((i - n * cols < 0 || clearance[i - n * cols] === 0) && (i + n * cols >= clearance.length || clearance[i + n * cols] === 0));
    };
    while (i >= 0 && cells.length <= clearance.length) {
      cells.push(i);
      const constrained = acrossGap(i);
      if (clearance[i] < minimum || (clearance[i] === minimum && (constrained || !bounded))) {
        minimum = clearance[i]; pinch = i; bounded = constrained;
      }
      i = paths.parent[i];
    }
    cells.reverse();
    return { cells, pinch, gap: 2 * paths.best[target] };
  }
  function approachCells(seat, width, cols, rows, cell = CELL) {
    const result = [], half = width / 2;
    let x0, x1, y0, y1;
    if (seat.dx) {
      const edge = Math.ceil((seat.dx < 0 ? seat.x : seat.x + seat.w) / cell - .5) * cell;
      const cx = seat.dx < 0 ? Math.floor((edge - half) / cell - .5) : Math.ceil((edge + half) / cell - .5);
      x0 = cx; x1 = cx + 1; y0 = Math.ceil(seat.y / cell - .5); y1 = Math.ceil((seat.y + seat.h) / cell - .5);
    } else {
      const edge = Math.ceil((seat.dy < 0 ? seat.y : seat.y + seat.h) / cell - .5) * cell;
      const cy = seat.dy < 0 ? Math.floor((edge - half) / cell - .5) : Math.ceil((edge + half) / cell - .5);
      y0 = cy; y1 = cy + 1; x0 = Math.ceil(seat.x / cell - .5); x1 = Math.ceil((seat.x + seat.w) / cell - .5);
    }
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (x >= 0 && y >= 0 && x < cols && y < rows) result.push(y * cols + x);
    return result;
  }
  function analyze(tables, width = 90, room = ROOM) {
    const grid = rasterize(tables, room), { occupied, cols, rows, shapes } = grid;
    const clearance = clearanceMap(occupied, cols, rows, room.cell, room.entrance);
    const starts = [];
    for (let x = 0; x < cols; x++) if ((x + .5) * room.cell >= room.entrance.start && (x + .5) * room.cell <= room.entrance.end) starts.push((rows - 1) * cols + x);
    const reached = flood(clearance, cols, rows, starts, width);
    const paths = widestPaths(clearance, cols, rows, starts);
    const seats = shapes.flatMap(t => t.seats).map(seat => {
      const targets = approachCells(seat, width, cols, rows, room.cell);
      let target = -1;
      for (const i of targets) if (target < 0 || paths.best[i] > paths.best[target]) target = i;
      const reachable = targets.some(i => reached[i]);
      // A blocked seat's best route uses the largest mover that can reach it.
      // Reusing the requested width's centre offset would invent a narrower
      // wall gap when that oversized mover cannot fit at the destination.
      if (!reachable) {
        target = -1;
        for (let candidate = 120; candidate >= 5 && target < 0; candidate -= 5) {
          for (const i of approachCells(seat, candidate, cols, rows, room.cell))
            if (paths.best[i] >= candidate / 2 && (target < 0 || paths.best[i] > paths.best[target])) target = i;
        }
      }
      return { ...seat, target, reachable, ...tracePath(target, paths, clearance, cols) };
    });
    const pinches = [];
    for (const seat of seats) if (!seat.reachable && seat.pinch >= 0 && !pinches.some(p => p.cell === seat.pinch)) pinches.push({ cell: seat.pinch, gap: seat.gap });
    return { ...grid, clearance, starts, reached, paths, seats, pinches, reachable: seats.filter(s => s.reachable).length, width };
  }
  function preset() {
    return [
      { id: 'T1', x: 120, y: 170, rotated: false },
      { id: 'T2', x: 440, y: 170, rotated: false },
      { id: 'T3', x: 120, y: 540, rotated: false },
      { id: 'T4', x: 440, y: 540, rotated: false },
      { id: 'T5', x: 950, y: 160, rotated: true },
      { id: 'T6', x: 1010, y: 510, rotated: true }
    ];
  }
  function canPlace(candidate, tables, room = ROOM) {
    const g = geometry(candidate), parts = [g, ...g.seats];
    if (parts.some(r => r.x < 0 || r.y < 0 || r.x + r.w > room.width || r.y + r.h > room.height)) return false;
    return !tables.filter(t => t.id !== candidate.id).map(geometry).some(t => parts.some(a => [t, ...t.seats].some(b => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y)));
  }
  root.SeatReachCore = Object.freeze({ CELL, ROOM, geometry, rasterize, clearanceMap, flood, widestPaths, tracePath, approachCells, analyze, preset, canPlace });
})(globalThis);
