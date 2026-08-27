/** Central source of truth for the character's competitive league/division.
 * The league is always DERIVED from `level` — it is never stored on its own,
 * so it can never drift out of sync with the character's real progress.
 * Levels run 1-100. Levels 1-99 map onto 11 normal leagues of 9 levels each
 * (3 levels per division, III -> II -> I -> next league's III). Level 100 is
 * a unique top tier, "Bruto Supremo", with no division. */

export type Division = "III" | "II" | "I";

/** The 11 normal leagues, in ascending order. Index in this array doubles as
 * the league index used by the level -> league calculation below. */
export const LEAGUE_NAMES = [
    "Barro",
    "Piedra",
    "Cobre",
    "Bronce",
    "Hierro",
    "Acero",
    "Plata",
    "Oro",
    "Platino",
    "Diamante",
    "Leyenda",
  ] as const;

export type LeagueName = (typeof LEAGUE_NAMES)[number];

/** Level 100's unique tier name. Has no division: never "Bruto Supremo I/II/III". */
export const SUPREME_TIER_LABEL = "Bruto Supremo";

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 100;
const LEVELS_PER_LEAGUE = 9;
const LEVELS_PER_DIVISION = 3;

export type LeagueTier = {
    /** The level this tier was computed for. */
    level: number;
    /** One of LEAGUE_NAMES for levels 1-99, or `null` for level 100 (Bruto Supremo). */
    league: LeagueName | null;
    /** "III" | "II" | "I" for levels 1-99, or `null` for level 100 (no division). */
    division: Division | null;
    /** Ready-to-display name, e.g. "Barro III", "Leyenda I", or "Bruto Supremo". */
    label: string;
};

/** Throws if `level` isn't a whole number in the valid 1-100 range, so an
 * invalid level can never silently resolve to an incorrect league. */
function assertValidLevel(level: number): void {
    if (typeof level !== "number" || !Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
          throw new RangeError(`getLeagueForLevel: level must be an integer between ${MIN_LEVEL} and ${MAX_LEVEL} (received ${level})`);
    }
}

/** The single central helper for turning a character level into its league
 * and division. Every place in the app that needs to know or display a
 * character's league/rank should call this (or `leagueLabel`) instead of
 * re-deriving or storing the value independently. */
export function getLeagueForLevel(level: number): LeagueTier {
    assertValidLevel(level);
    if (level === MAX_LEVEL) {
          return { level, league: null, division: null, label: SUPREME_TIER_LABEL };
    }
    const leagueIndex = Math.floor((level - MIN_LEVEL) / LEVELS_PER_LEAGUE);
    const positionInLeague = (level - MIN_LEVEL) % LEVELS_PER_LEAGUE;
    const division: Division = positionInLeague < LEVELS_PER_DIVISION ? "III" : positionInLeague < LEVELS_PER_DIVISION * 2 ? "II" : "I";
    const league = LEAGUE_NAMES[leagueIndex];
    return { level, league, division, label: `${league} ${division}` };
}

/** Convenience for UI code that only needs the display label
 * (e.g. "Oro III", "Diamante I", "Bruto Supremo"). */
export function leagueLabel(level: number): string {
    return getLeagueForLevel(level).label;
}
