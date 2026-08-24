/** Leveling curve for the player's saved character. Kept deliberately simple:
 * a linearly growing XP requirement, and a modest, capped stat bonus per level
 * (see `statBonusForLevel` in engine.ts, which every FighterProfile — player or
 * rival — already runs through via `makeProfile(name, className, level)`). */

const XP_BASE = 40;

/** XP required to go from `level` to `level + 1`. */
export function xpToNextLevel(level: number): number {
  return XP_BASE + (level - 1) * 22;
}

/** XP awarded for a finished fight. Winning always grants more, and both grow
 * a little with the rival's level so tougher fights stay worth entering. */
export function xpReward(won: boolean, rivalLevel: number): number {
  return won ? 26 + rivalLevel * 6 : 9 + rivalLevel * 2;
}

export type LevelState = { level: number; xp: number };

/** Applies an XP gain, rolling over into as many level-ups as it earns. */
export function applyXpGain(current: LevelState, gained: number): LevelState {
  let level = current.level;
  let xp = current.xp + Math.max(0, gained);
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
  }
  return { level, xp };
}
