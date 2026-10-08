/** Augenpositionen je Würfelseite (in einem 100×100-Raster). */
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 26],
    [72, 26],
    [28, 50],
    [72, 50],
    [28, 74],
    [72, 74],
  ],
};

/** Würfelseite mit Augen. */
function Die({ value, size = 40 }: { value: number; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="20"
        className="fill-(--bg-primary) stroke-(--accent)"
        strokeWidth="6"
      />
      {PIPS[value].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" className="fill-(--text-primary)" />
      ))}
    </svg>
  );
}

export default Die;
