import { useEffect, useRef, useState } from "react";

export default function ScrollTrack() {
  const [pos, setPos] = useState({ top: 0, height: 40 });
  const raf = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const total = doc.scrollHeight - doc.clientHeight;
        const ratio = total > 0 ? window.scrollY / total : 0;
        const minH = 40; // px
        const h = Math.max(minH, (doc.clientHeight / doc.scrollHeight) * (window.innerHeight - 120));
        const t = 60 + ratio * (window.innerHeight - 120 - h);
        setPos({ top: t, height: h });
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div className="fixed right-6 top-[60px] bottom-[60px] w-[2px] bg-white/20 z-30 pointer-events-none">
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[4px] bg-white"
        style={{ top: pos.top - 60, height: pos.height, borderRadius: 2 }}
      />
    </div>
  );
}

