/** Besondere Würfe, die nach dem Würfeln hervorgehoben werden. */
export type Combo = "kniffel" | "bigStraight" | "smallStraight" | "fullHouse" | "fourKind";

/**
 * Bester besonderer Wurf und welche Würfel dazugehören (Dreierpasch ist zu häufig, um ihn zu
 * feiern). Bei der kleinen Straße zählt je Augenzahl nur ein Würfel.
 */
export function findCombo(dice: number[]): { combo: Combo; dice: number[] } | null {
  const all = dice.map((_, i) => i);
  const counts = [0, 0, 0, 0, 0, 0, 0];
  dice.forEach((d) => counts[d]++);
  const max = Math.max(...counts);

  if (max === 5) return { combo: "kniffel", dice: all };
  if (straight(counts, 5)) return { combo: "bigStraight", dice: all };
  const small = straight(counts, 4);
  if (small) {
    const run = [small, small + 1, small + 2, small + 3];
    return { combo: "smallStraight", dice: run.map((face) => dice.indexOf(face)) };
  }
  if (counts.includes(3) && counts.includes(2)) return { combo: "fullHouse", dice: all };
  if (max === 4) {
    const face = counts.indexOf(4);
    return { combo: "fourKind", dice: all.filter((i) => dice[i] === face) };
  }
  return null;
}

/** Niedrigste Augenzahl einer Folge der Länge `length`, sonst 0. */
function straight(counts: number[], length: number): number {
  for (let start = 1; start + length - 1 <= 6; start++) {
    let ok = true;
    for (let f = start; f < start + length; f++) if (!counts[f]) ok = false;
    if (ok) return start;
  }
  return 0;
}
