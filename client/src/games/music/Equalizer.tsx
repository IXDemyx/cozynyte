/** Tanzende Balken, solange ein Song läuft. */
function Equalizer() {
  return (
    <div className="flex h-16 items-end justify-center gap-1.5" aria-hidden="true">
      {[0, 0.3, 0.15, 0.45, 0.1, 0.35, 0.2].map((delay, i) => (
        <span
          key={i}
          className="eq-bar h-full w-2 rounded-full bg-(--accent)"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}

export default Equalizer;
