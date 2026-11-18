// A one-time wave of colorful balloons floating up over the final screen.

const COLORS = ["#ff8fab", "#ffc6a5", "#ffd86b", "#8ee3c2", "#8cc8ff", "#b9a4ff", "#ff7a6b"];
const COUNT = 18;

// Fixed pseudo-random layout (same every time, no Math.random during render).
function seeded(seed: number) {
  let state = seed;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

const random = seeded(181126);
const BALLOONS = Array.from({ length: COUNT }, (_, i) => ({
  left: 3 + (((i * 7) % COUNT) / COUNT) * 88 + random() * 4, // spread across the width, shuffled
  width: 44 + random() * 30,
  duration: 7 + random() * 4,
  delay: 1.2 + i * 0.22 + random() * 0.8,
  sway: 2.2 + random() * 1.6,
  color: COLORS[i % COLORS.length],
}));

export function Balloons() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {BALLOONS.map((b, i) => (
        <div
          key={i}
          className="balloon"
          style={{ left: `${b.left}%`, width: b.width, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s` }}
        >
          <svg viewBox="0 0 60 104" className="balloon-sway" style={{ animationDuration: `${b.sway}s` }}>
            <path d="M30 63 q -7 10 0 20 t 0 20" fill="none" stroke="rgb(245 239 232 / 0.45)" strokeWidth="1.2" />
            <path d="M25.5 64 L34.5 64 L30 58 Z" fill={b.color} />
            <ellipse cx="30" cy="31" rx="26" ry="30" fill={b.color} />
            <ellipse cx="20" cy="20" rx="5.5" ry="9" fill="white" opacity="0.35" transform="rotate(-20 20 20)" />
          </svg>
        </div>
      ))}
    </div>
  );
}
