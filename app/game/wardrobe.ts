export type HairStyle = "ninguno" | "corto" | "mohawk" | "largo";

export type Outfit = {
  hairStyle: HairStyle;
  hairColor: string;
  shirtColor: string | null;
  pantsColor: string | null;
  glovesColor: string | null;
  bootsColor: string | null;
};

export const DEFAULT_OUTFIT: Outfit = {
  hairStyle: "corto",
  hairColor: "#3b2313",
  shirtColor: "#2d6f91",
  pantsColor: "#33261a",
  glovesColor: "#7a1f1f",
  bootsColor: "#241a12",
};

export const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: "ninguno", label: "Sin pelo" },
  { id: "corto", label: "Corto" },
  { id: "mohawk", label: "Cresta" },
  { id: "largo", label: "Largo" },
];

export const HAIR_COLORS = ["#1c1c1c", "#3b2313", "#8a5a2b", "#d4a017", "#c94f4f", "#e8e8e8"];
export const SHIRT_COLORS = ["#2d6f91", "#a83b32", "#3d8b4c", "#6b3fa0", "#e0a316", "#1c1c1c"];
export const PANTS_COLORS = ["#33261a", "#274b6d", "#4a4a4a", "#5c3a21", "#1c1c1c", "#6d5b3e"];
export const GLOVES_COLORS = ["#7a1f1f", "#1c1c1c", "#8a5a2b", "#2d6f91", "#e0a316", "#e8e8e8"];
export const BOOTS_COLORS = ["#241a12", "#1c1c1c", "#4a2c14", "#3d3d3d", "#5c3a21", "#7a1f1f"];

const STORAGE_KEY = "liga-de-brutos:outfit:v1";

/** Reads the saved outfit from localStorage. Safe to call during SSR (returns the default). */
export function loadOutfit(): Outfit {
  if (typeof window === "undefined") return DEFAULT_OUTFIT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OUTFIT;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_OUTFIT, ...parsed };
  } catch {
    return DEFAULT_OUTFIT;
  }
}

/** Persists the outfit to localStorage. No-op during SSR or if storage is unavailable. */
export function saveOutfit(outfit: Outfit) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(outfit));
  } catch {
    // localStorage puede fallar en modo privado/incógnito: ignoramos el error,
    // el vestuario simplemente no persistirá entre sesiones en ese caso.
  }
}
