import { useLayoutEffect, useRef, useState } from "react";
import ScrollTrack from "./ScrollTrack";

export default function PosterLayout({
  titleLarge = "",
  rightLabel = "",
  children,
}) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontPx, setFontPx] = useState(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    const txt = textRef.current;
    if (!el || !txt || !titleLarge) return;

    const fit = () => {
      const pad = 24; // small safe padding
      const W = el.clientWidth - pad * 2;
      const H = el.clientHeight - pad * 2;
      if (W <= 0 || H <= 0) return;

      // Start size based on length and container width
      const len = String(titleLarge).length || 1;
      // Bigger for short words, smaller for long phrases
      let size = Math.min(W * (len < 8 ? 0.24 : len < 14 ? 0.18 : 0.14), 800);
      size = Math.max(size, 48);

      // Iteratively shrink until it fits both width and height
      txt.style.fontSize = `${size}px`;
      txt.style.lineHeight = 0.85;
      // allow wrapping at spaces
      txt.style.whiteSpace = "pre-wrap";
      txt.style.wordBreak = "break-word";

      let guard = 0;
      while (guard < 20 && (txt.scrollWidth > W || txt.scrollHeight > H)) {
        size *= 0.92; // shrink 8%
        txt.style.fontSize = `${size}px`;
        guard++;
      }
      setFontPx(size);
    };

    fit();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [titleLarge]);

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[var(--color-bg)]">
      {/* Giant background title */}
      {titleLarge ? (
        <div
          aria-hidden
          className="pointer-events-none select-none absolute inset-0 flex overflow-hidden"
          ref={containerRef}
        >
          <div className="flex-1 flex items-center">
            <div className="px-6 md:px-12 lg:px-16">
              <div
                ref={textRef}
                className="poster-title outline-title font-black tracking-tight whitespace-pre-wrap"
                style={{ fontSize: fontPx ? `${fontPx}px` : undefined, lineHeight: 0.85 }}
              >
                {titleLarge}
              </div>
            </div>
          </div>
          {rightLabel ? (
            <div className="hidden md:flex items-center justify-center pr-6">
              <div className="h-[70vh] w-px bg-white/10 rounded-full" />
              <div className="ml-3 rotate-90 origin-left text-white/40 font-semibold tracking-widest">
                {rightLabel}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Foreground content */}
      <div className="relative z-10">
        {children}
      </div>
      {/* Custom vertical scroll track */}
      <ScrollTrack />
    </div>
  );
}

