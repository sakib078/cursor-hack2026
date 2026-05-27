import { useEffect, useRef } from "react";

// Slow, layered sine waves drifting across the bottom of the screen in dark
// peach — the "soul waves" of the brief. Pure canvas, sits behind everything.
export default function SoulWaves() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let w, h, dpr;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Each layer: a flowing band of dark peach with its own speed/phase.
    const layers = [
      { amp: 34, len: 0.0042, speed: 0.00045, y: 0.62, color: "rgba(217,140,102,0.18)" },
      { amp: 46, len: 0.0031, speed: 0.00032, y: 0.74, color: "rgba(194,106,69,0.16)" },
      { amp: 60, len: 0.0024, speed: 0.00022, y: 0.86, color: "rgba(166,84,52,0.14)" },
    ];

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const L of layers) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 6) {
          const y =
            h * L.y +
            Math.sin(x * L.len + t * L.speed) * L.amp +
            Math.sin(x * L.len * 0.5 + t * L.speed * 1.7) * (L.amp * 0.4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = L.color;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="soul-waves" aria-hidden="true" />;
}
