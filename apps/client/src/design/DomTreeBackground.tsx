import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  highlight: boolean;
}

/**
 * Slow-drifting node/link canvas background evoking an abstract DOM tree.
 * Entirely decorative — respects reduced-motion by rendering one static frame.
 */
export function DomTreeBackground({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let nodes: Node[] = [];
    let raf = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(18, Math.floor((width * height) / 42000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.6 + 1,
        highlight: Math.random() < 0.12,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const maxDist = Math.min(220, Math.max(140, width / 8));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        if (!reducedMotion) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.14;
            ctx.strokeStyle = `rgba(79, 216, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.highlight ? "rgba(79, 216, 255, 0.55)" : "rgba(148, 163, 184, 0.35)";
        ctx.fill();
      }

      if (!reducedMotion) raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
