import { useMemo, useRef, useState } from "react";

// 0.5-step star rating component with hover support
export default function StarRating({ value = 0, onChange, max = 10, size = 24 }) {
  const [hover, setHover] = useState(null);
  const refs = useRef([]);
  const display = hover ?? value;

  const stars = useMemo(() => Array.from({ length: max }, (_, i) => i + 1), [max]);

  const handleMove = (i, e) => {
    const el = refs.current[i];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2 ? 0.5 : 1;
    setHover(i + (half - 1)); // i is 1-based visually; adjust to 0.5 increments
  };

  const handleLeave = () => setHover(null);

  const handleClick = (i, e) => {
    const el = refs.current[i];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2 ? 0.5 : 1;
    const newVal = i - (1 - half);
    onChange?.(newVal);
  };

  const Star = ({ kind, idx }) => {
    const id = `grad-${idx}`;
    const fill = "#3B82F6"; // sky
    const empty = "#E5E7EB"; // light gray
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className="inline-block cursor-pointer select-none"
        aria-hidden
      >
        <defs>
          <linearGradient id={id} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="50%" stopColor={fill} />
            <stop offset="50%" stopColor={empty} />
          </linearGradient>
        </defs>
        <path
          d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.401 8.168L12 18.896l-7.335 3.868 1.401-8.168L.132 9.21l8.2-1.192z"
          fill={kind === "full" ? fill : kind === "half" ? `url(#${id})` : empty}
        />
      </svg>
    );
  };

  return (
    <div className="flex items-center gap-1" onMouseLeave={handleLeave}>
      {stars.map((s, index) => {
        const i = s; // 1..max
        const kind = display >= i ? "full" : display >= i - 0.5 ? "half" : "empty";
        return (
          <span
            key={i}
            ref={(el) => (refs.current[i] = el)}
            onMouseMove={(e) => handleMove(i, e)}
            onClick={(e) => handleClick(i, e)}
            role="radio"
            aria-checked={value >= i}
          >
            <Star kind={kind} idx={i} />
          </span>
        );
      })}
      <span className="ml-2 text-sm text-dark/70">{display.toFixed(1)}/{max}</span>
    </div>
  );
}

