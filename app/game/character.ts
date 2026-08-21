import type { FighterClass } from "./engine";
import type { Outfit } from "./wardrobe";

/** Skin tone presets. Applied as a CSS `filter` on the shared base texture image
 * (there's only one skin texture, so tone is simulated with a color filter until
 * we have separate tinted textures). `swatch` is only used to color the picker button. */
export type SkinTone = { id: string; label: string; swatch: string; filter: string };

export const SKIN_TONES: SkinTone[] = [
  { id: "palida", label: "Pálida", swatch: "#f2cfa8", filter: "none" },
  { id: "clara", label: "Clara", swatch: "#e8b48a", filter: "sepia(.25) saturate(1.05) brightness(1.02)" },
  { id: "media", label: "Media", swatch: "#c98b5c", filter: "sepia(.45) saturate(1.15) brightness(.96) hue-rotate(-6deg)" },
  { id: "morena", label: "Morena", swatch: "#9c6540", filter: "sepia(.7) saturate(1.3) brightness(.84) hue-rotate(-8deg)" },
  { id: "oscura", label: "Oscura", swatch: "#6b4327", filter: "sepia(.85) saturate(1.4) brightness(.62) hue-rotate(-4deg)" },
];

export const DEFAULT_SKIN_TONE_ID = "clara";

/** A face-feature style. `asset` is the path where the real artwork should live once
 * it exists — dropping a PNG/SVG there and wiring it into `SkeletonCharacterRig` is the
 * only change needed later. Until then we draw a simple placeholder shape from the
 * geometry fields so the picker is already functional. */
export type EyeStyle = { id: string; label: string; asset: string; rx: number; ry: number };
export type EyebrowStyle = { id: string; label: string; asset: string; width: number; height: number; angle: number };

export const EYE_STYLES: EyeStyle[] = [
  { id: "estandar", label: "Estándar", asset: "/characters/features/eyes/estandar.png", rx: 24, ry: 15 },
  { id: "afilados", label: "Afilados", asset: "/characters/features/eyes/afilados.png", rx: 27, ry: 10 },
  { id: "redondos", label: "Redondos", asset: "/characters/features/eyes/redondos.png", rx: 20, ry: 20 },
];

export const EYE_COLORS = ["#3b2313", "#2d6f91", "#3d8b4c", "#6b3fa0", "#c94f4f", "#1c1c1c"];

export const EYEBROW_STYLES: EyebrowStyle[] = [
  { id: "finas", label: "Finas", asset: "/characters/features/eyebrows/finas.png", width: 58, height: 7, angle: 0 },
  { id: "pobladas", label: "Pobladas", asset: "/characters/features/eyebrows/pobladas.png", width: 62, height: 13, angle: 0 },
  { id: "angulosas", label: "Angulosas", asset: "/characters/features/eyebrows/angulosas.png", width: 60, height: 10, angle: -10 },
];

/** Approximate placement for eyes/eyebrows on the `rostro_mandibula` layer, in the
 * rig's own 979×1606 canvas space. These are estimates for the placeholder shapes —
 * once real artwork exists it will be cropped/positioned by its own layer instead. */
export const FACE_PLACEHOLDER_GEOMETRY = {
  eyeCenterX: 500,
  eyeCenterY: 302,
  eyeOffsetX: 72,
  eyebrowCenterY: 266,
};

export type PlayerIdentity = {
  name: string;
  skinToneId: string;
  eyeStyleId: string;
  eyeColor: string;
  eyebrowStyleId: string;
};

export const DEFAULT_IDENTITY: PlayerIdentity = {
  name: "Ragnar",
  skinToneId: DEFAULT_SKIN_TONE_ID,
  eyeStyleId: "estandar",
  eyeColor: "#3b2313",
  eyebrowStyleId: "pobladas",
};

/** Initial clothing colors per class. Hair stays independent of class (the player
 * picks it separately) — only shirt/pants/gloves/boots follow the chosen class. */
export const CLASS_CLOTHING: Record<FighterClass, Pick<Outfit, "shirtColor" | "pantsColor" | "glovesColor" | "bootsColor">> = {
  Luchador: { shirtColor: "#2d6f91", pantsColor: "#1c1c1c", glovesColor: "#a83b32", bootsColor: "#241a12" },
  Aventurero: { shirtColor: "#3d8b4c", pantsColor: "#5c3a21", glovesColor: "#5c3a21", bootsColor: "#4a2c14" },
  Atleta: { shirtColor: "#e0a316", pantsColor: "#1c1c1c", glovesColor: "#e8e8e8", bootsColor: "#3d3d3d" },
  Coloso: { shirtColor: null, pantsColor: "#4a4a4a", glovesColor: "#1c1c1c", bootsColor: "#1c1c1c" },
};

/** Per-class body texture: each class has its own body proportions, laid out on the
 * exact same 979×1606 canvas and 43-region layout as `rig.json`, so the shared skeleton
 * geometry, clip paths and clothing/hair patches keep working unchanged — only the
 * source image swaps. Falls back to the original shared texture if a class is missing. */
export const CLASS_BODY_TEXTURE: Record<FighterClass, string> = {
  Coloso: "/characters/classes/coloso/montaje-verificacion.png",
  Luchador: "/characters/classes/luchador/montaje-verificacion.png",
  Atleta: "/characters/classes/atleta/montaje-verificacion.png",
  Aventurero: "/characters/classes/aventurero/montaje-verificacion.png",
};
export const DEFAULT_BODY_TEXTURE = "/characters/active/montaje-verificacion.png";

export type FaceAppearance = {
  skinFilter: string;
  eyeColor: string;
  eye: { rx: number; ry: number };
  eyebrow: { width: number; height: number; angle: number };
};

/** Resolves an identity's style ids into the concrete values needed to render the
 * placeholder shapes (or, later, to pick the right asset). Falls back to the first
 * preset of each list if a stored id no longer exists (e.g. after removing a style). */
export function resolveFaceAppearance(identity: PlayerIdentity): FaceAppearance {
  const skinTone = SKIN_TONES.find(tone => tone.id === identity.skinToneId) ?? SKIN_TONES[0];
  const eyeStyle = EYE_STYLES.find(style => style.id === identity.eyeStyleId) ?? EYE_STYLES[0];
  const eyebrowStyle = EYEBROW_STYLES.find(style => style.id === identity.eyebrowStyleId) ?? EYEBROW_STYLES[0];
  return {
    skinFilter: skinTone.filter,
    eyeColor: identity.eyeColor,
    eye: { rx: eyeStyle.rx, ry: eyeStyle.ry },
    eyebrow: { width: eyebrowStyle.width, height: eyebrowStyle.height, angle: eyebrowStyle.angle },
  };
}

const STORAGE_KEY = "liga-de-brutos:identity:v1";

export function loadIdentity(): PlayerIdentity {
  if (typeof window === "undefined") return DEFAULT_IDENTITY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_IDENTITY;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_IDENTITY, ...parsed };
  } catch {
    return DEFAULT_IDENTITY;
  }
}

export function saveIdentity(identity: PlayerIdentity) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // localStorage puede fallar en modo privado: lo ignoramos, simplemente no persistirá.
  }
}
