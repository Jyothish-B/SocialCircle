import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Ring radii in world units: 0 = centre person, 1 = friends,
// 2 = friends of friends, 3 = suggested people outside both rings
const RING_RADIUS = [0, 150, 330, 430];
const LINK_LENGTH = { "0-1": 130, "1-1": 70, "1-2": 120, "2-2": 80 };

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Theme colours come from the shadcn CSS variables, so the graph follows light/dark mode
function readPalette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  const hsl = (name, a = 1) => `hsl(${v(name)} / ${a})`;
  return {
    primary: (a) => hsl("--primary", a),
    accent: (a) => hsl("--accent", a),
    muted: (a) => hsl("--muted-foreground", a),
    border: (a) => hsl("--border", a),
    fg: (a) => hsl("--foreground", a),
    bg: (a) => hsl("--background", a),
    suggested: (a) => `hsl(38 92% 50% / ${a})`,
  };
}

function buildSimulation(graph) {
  const byId = new Map();
  const degree = new Map();
  for (const l of graph.links) {
    degree.set(l.source, (degree.get(l.source) || 0) + 1);
    degree.set(l.target, (degree.get(l.target) || 0) + 1);
  }
  const ring1 = graph.nodes.filter((n) => n.ring === 1);
  const nodes = graph.nodes.map((n) => {
    const local = degree.get(n.id) || 0;
    return {
      ...n,
      local,
      r: n.ring === 0 ? 16 : Math.min(13, 4 + Math.sqrt(local) * 1.6),
      x: 0, y: 0, vx: 0, vy: 0, fixed: false,
    };
  });
  for (const n of nodes) byId.set(n.id, n);

  // Deterministic starting layout: friends evenly on their ring, everyone else
  // placed near a friend they connect to, so the first frame is already readable
  const angleOf = new Map(ring1.map((n, i) => [n.id, (i / Math.max(1, ring1.length)) * Math.PI * 2]));
  const neighbours = new Map(nodes.map((n) => [n.id, []]));
  const links = graph.links
    .filter((l) => byId.has(l.source) && byId.has(l.target))
    .map((l) => {
      const a = byId.get(l.source), b = byId.get(l.target);
      neighbours.get(a.id).push(b.id);
      neighbours.get(b.id).push(a.id);
      const rings = [a.ring, b.ring].sort().join("-");
      return { a, b, strength: l.strength, length: LINK_LENGTH[rings] ?? 100 };
    });
  let spread = 0;
  for (const n of nodes) {
    if (n.ring === 0) continue;
    let angle = angleOf.get(n.id);
    if (angle == null) {
      const friend = neighbours.get(n.id).find((id) => angleOf.has(id));
      angle = friend != null ? angleOf.get(friend) + ((spread++ % 7) - 3) * 0.05 : (spread++ * 2.39996) % (Math.PI * 2);
    }
    n.x = Math.cos(angle) * RING_RADIUS[n.ring];
    n.y = Math.sin(angle) * RING_RADIUS[n.ring];
  }
  return { nodes, links, byId, neighbours, alpha: 1 };
}

function tick(sim) {
  const { nodes, links } = sim;
  const alpha = sim.alpha;
  for (const l of links) {
    const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y;
    const d = Math.hypot(dx, dy) || 1;
    // spokes to the centre pull hard; links between friends pull gently, so a
    // tight friend group does not collapse the whole ring into one wedge
    const pull = l.a.ring === 0 || l.b.ring === 0 ? 0.03 : 0.004;
    const k = ((d - l.length) / d) * pull * (0.5 + l.strength) * alpha;
    l.a.vx += dx * k; l.a.vy += dy * k;
    l.b.vx -= dx * k; l.b.vy -= dy * k;
  }
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 160000) continue;
      const d = Math.sqrt(d2) || 0.1;
      const f = (1600 / Math.max(d2, 16)) * alpha;
      a.vx -= (dx / d) * f; a.vy -= (dy / d) * f;
      b.vx += (dx / d) * f; b.vy += (dy / d) * f;
      const min = a.r + b.r + 3;
      if (d < min) {
        const p = (min - d) / 2;
        a.x -= (dx / d) * p; a.y -= (dy / d) * p;
        b.x += (dx / d) * p; b.y += (dy / d) * p;
      }
    }
  }
  for (const n of nodes) {
    if (n.ring === 0) { n.x = 0; n.y = 0; continue; }
    // radial force keeps the rings legible: distance from the centre means degrees of separation
    const d = Math.hypot(n.x, n.y) || 1;
    const k = ((RING_RADIUS[n.ring] - d) / d) * 0.06 * alpha;
    n.vx += n.x * k; n.vy += n.y * k;
    if (!n.fixed) { n.x += n.vx; n.y += n.vy; }
    n.vx *= 0.6; n.vy *= 0.6;
  }
  sim.alpha *= 0.985;
}

const NetworkCanvas = forwardRef(function NetworkCanvas({ graph, selectedId, onSelect, onRecenter }, ref) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const state = useRef({ sim: null, view: { k: 1, x: 0, y: 0 }, hover: null, selectedId: null, size: { w: 0, h: 0 }, palette: null, raf: 0 });
  const callbacks = useRef({ onSelect, onRecenter });
  callbacks.current = { onSelect, onRecenter };

  const draw = () => {
    const s = state.current;
    const canvas = canvasRef.current;
    if (!canvas || !s.sim) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = s.size;
    const { k, x: tx, y: ty } = s.view;
    const P = s.palette;
    const focusId = s.hover?.id ?? s.selectedId;
    const focusSet = focusId != null ? new Set([focusId, ...(s.sim.neighbours.get(focusId) || [])]) : null;
    const toScreen = (n) => [w / 2 + tx + n.x * k, h / 2 + ty + n.y * k];

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // ring guides
    ctx.setLineDash([3, 6]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = P.border(0.9);
    for (const r of [RING_RADIUS[1], RING_RADIUS[2]]) {
      ctx.beginPath();
      ctx.arc(w / 2 + tx, h / 2 + ty, r * k, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // links
    for (const l of s.sim.links) {
      const lit = focusSet && (l.a.id === focusId || l.b.id === focusId);
      const toCentre = l.a.ring === 0 || l.b.ring === 0;
      ctx.strokeStyle = lit
        ? P.primary(0.85)
        : focusSet
          ? P.border(0.25)
          : toCentre ? P.primary(0.35) : P.muted(0.13);
      ctx.lineWidth = lit ? 1.8 : toCentre ? 1 + l.strength : 0.7;
      const [ax, ay] = toScreen(l.a), [bx, by] = toScreen(l.b);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    // nodes, far rings first so the centre stays on top
    const ordered = [...s.sim.nodes].sort((a, b) => b.ring - a.ring);
    for (const n of ordered) {
      const [x, y] = toScreen(n);
      const r = Math.max(2.5, n.r * Math.min(1.4, Math.max(0.6, k)));
      const dim = focusSet && !focusSet.has(n.id);
      ctx.globalAlpha = dim ? 0.25 : 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle =
        n.ring === 0 ? P.primary(1)
        : n.suggestedRank ? P.suggested(0.9)
        : n.ring === 1 ? P.primary(0.75)
        : P.muted(0.45);
      ctx.fill();
      ctx.lineWidth = n.id === s.selectedId ? 3 : 1.5;
      ctx.strokeStyle = n.id === s.selectedId ? P.fg(0.9) : P.bg(0.9);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // labels: centre, focus, its neighbours, suggestions, and friends once zoomed in
    ctx.font = "500 11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const n of ordered) {
      const show =
        n.ring === 0 || n.id === focusId ||
        (focusSet && focusSet.size <= 16 && focusSet.has(n.id)) ||
        (!focusSet && (n.suggestedRank || (n.ring === 1 && k > 0.9) || k > 1.8));
      if (!show) continue;
      const [x, y] = toScreen(n);
      const r = Math.max(2.5, n.r * Math.min(1.4, Math.max(0.6, k)));
      const label = n.suggestedRank ? `#${n.suggestedRank} ${n.name}` : n.name;
      ctx.lineWidth = 3;
      ctx.strokeStyle = P.bg(0.85);
      ctx.strokeText(label, x, y + r + 3);
      ctx.fillStyle = n.ring === 0 || n.id === focusId ? P.fg(1) : P.fg(0.75);
      ctx.fillText(label, x, y + r + 3);
    }
  };

  const loop = () => {
    const s = state.current;
    tick(s.sim);
    draw();
    s.raf = s.sim.alpha > 0.004 || s.dragging ? requestAnimationFrame(loop) : 0;
  };
  const kick = (alpha = 0.3) => {
    const s = state.current;
    s.sim.alpha = Math.max(s.sim.alpha, alpha);
    if (prefersReducedMotion()) {
      while (s.sim.alpha > 0.004) tick(s.sim);
      draw();
    } else if (!s.raf) s.raf = requestAnimationFrame(loop);
  };

  const fit = () => {
    const s = state.current;
    if (!s.sim) return;
    const extent = Math.max(150, ...s.sim.nodes.map((n) => Math.hypot(n.x, n.y) + n.r + 20));
    s.view = { k: Math.min(2, Math.min(s.size.w, s.size.h) / (2 * extent)), x: 0, y: 0 };
    draw();
  };
  const zoomBy = (factor, cx = state.current.size.w / 2, cy = state.current.size.h / 2) => {
    const s = state.current;
    const k = Math.min(4, Math.max(0.2, s.view.k * factor));
    const wx = (cx - s.size.w / 2 - s.view.x) / s.view.k;
    const wy = (cy - s.size.h / 2 - s.view.y) / s.view.k;
    s.view = { k, x: cx - s.size.w / 2 - wx * k, y: cy - s.size.h / 2 - wy * k };
    draw();
  };
  useImperativeHandle(ref, () => ({ fit, zoomIn: () => zoomBy(1.25), zoomOut: () => zoomBy(0.8) }));

  // new data -> new simulation
  useEffect(() => {
    if (!graph) return;
    const s = state.current;
    if (s.raf) cancelAnimationFrame(s.raf);
    s.raf = 0;
    s.sim = buildSimulation(graph);
    s.hover = null;
    for (let i = 0; i < 40; i++) tick(s.sim); // settle the worst overlaps before the first frame
    fit();
    kick(0.6);
    return () => { if (s.raf) cancelAnimationFrame(s.raf); s.raf = 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  useEffect(() => {
    state.current.selectedId = selectedId;
    draw();
     
  }, [selectedId]);

  // size, theme and pointer handling
  useEffect(() => {
    const s = state.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    s.palette = readPalette();

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      s.size = { w: width, h: height };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const themeWatch = new MutationObserver(() => { s.palette = readPalette(); draw(); });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

    const local = (e) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const hit = ({ x, y }) => {
      if (!s.sim) return null;
      const wx = (x - s.size.w / 2 - s.view.x) / s.view.k;
      const wy = (y - s.size.h / 2 - s.view.y) / s.view.k;
      let best = null, bestD = Infinity;
      for (const n of s.sim.nodes) {
        const d = Math.hypot(n.x - wx, n.y - wy);
        const reach = n.r + 6 / s.view.k;
        if (d < reach && d < bestD) { best = n; bestD = d; }
      }
      return best;
    };

    let press = null;
    const down = (e) => {
      const p = local(e);
      const node = hit(p);
      press = { p, node, moved: false, view: { ...s.view } };
      canvas.setPointerCapture(e.pointerId);
      if (node && node.ring !== 0) { node.fixed = true; s.dragging = true; }
    };
    const move = (e) => {
      const p = local(e);
      if (!press) {
        const node = hit(p);
        if (node?.id !== s.hover?.id) { s.hover = node; draw(); }
        canvas.style.cursor = node ? "pointer" : "grab";
        return;
      }
      if (Math.hypot(p.x - press.p.x, p.y - press.p.y) > 3) press.moved = true;
      if (!press.moved) return;
      if (press.node && press.node.ring !== 0) {
        press.node.x = (p.x - s.size.w / 2 - s.view.x) / s.view.k;
        press.node.y = (p.y - s.size.h / 2 - s.view.y) / s.view.k;
        kick(0.15);
      } else {
        canvas.style.cursor = "grabbing";
        s.view = { ...press.view, x: press.view.x + p.x - press.p.x, y: press.view.y + p.y - press.p.y };
        draw();
      }
    };
    const up = () => {
      if (!press) return;
      if (press.node) { press.node.fixed = false; s.dragging = false; }
      if (!press.moved) callbacks.current.onSelect?.(press.node ?? null);
      press = null;
      canvas.style.cursor = "grab";
    };
    const leave = () => { if (s.hover) { s.hover = null; draw(); } };
    const wheel = (e) => {
      e.preventDefault();
      const p = local(e);
      zoomBy(e.deltaY < 0 ? 1.12 : 0.89, p.x, p.y);
    };
    const dbl = (e) => {
      const node = hit(local(e));
      if (node && node.ring !== 0) callbacks.current.onRecenter?.(node);
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("dblclick", dbl);
    return () => {
      ro.disconnect();
      themeWatch.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("dblclick", dbl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="block touch-none"
        style={{ cursor: "grab" }}
        role="img"
        aria-label={
          graph
            ? `Network graph with ${graph.nodes.length} people and ${graph.links.length} friendships. Use the list beside it to browse by keyboard.`
            : "Network graph loading"
        }
      />
    </div>
  );
});

export default NetworkCanvas;
