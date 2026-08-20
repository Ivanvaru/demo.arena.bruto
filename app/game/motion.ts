export type MotionAttack = "punch" | "kick";

export type MotionTiming = {
  total: number;
  contact: number;
  settle: number;
};

export const MOTION_TIMINGS: Record<MotionAttack, MotionTiming> = {
  punch: { total: 1120, contact: 590, settle: 210 },
  kick: { total: 1260, contact: 690, settle: 240 },
};

export const REACTION_TIMINGS = {
  hit: 430,
  block: 520,
  dodge: 560,
  knockdown: 780,
  stun: 520,
} as const;

export function motionTiming(attack: MotionAttack, slowed = false): MotionTiming {
  const timing = MOTION_TIMINGS[attack];
  if (!slowed) return timing;
  return {
    total: Math.round(timing.total * 1.12),
    contact: Math.round(timing.contact * 1.12),
    settle: Math.round(timing.settle * 1.12),
  };
}
