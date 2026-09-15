// Games and Marketplace items. These mirror the Unity project (PlayerData.cs, HatCatalog, AvatarBundles)
// and the PlayFab "Marketplace" catalog, so item IDs and prices must stay in sync with both.

export const BODY_PARTS = ["Head", "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"] as const;

export type ItemType = "color" | "face" | "hat" | "bundle";

export type ColorItem = { id: string; name: string; hex: string; price: number };
export type FaceItem = { id: string; name: string; price: number; starter?: boolean; image: string };
export type HatItem = { id: string; name: string; price: number; image: string };
export type BundleItem = { id: string; name: string; price: number; starter?: boolean; image?: string };

const color = (name: string, hex: string, price = 0): ColorItem => ({ id: name, name, hex, price });

export const COLORS: ColorItem[] = [
  color("White", "#F2F3F3"),
  color("Light stone grey", "#E5E4DF"),
  color("Medium stone grey", "#A3A2A5"),
  color("Dark stone grey", "#635F62"),
  color("Black", "#1B2A35"),
  color("Bright red", "#C4281C"),
  color("Bright orange", "#DA8541"),
  color("Bright yellow", "#F5CD30"),
  color("Br. yellowish green", "#A4BD47"),
  color("Bright green", "#4B974B"),
  color("Medium blue", "#6E99CA"),
  color("Bright blue", "#0D69AC"),
  color("Bright violet", "#6B327C"),
  color("Pastel brown", "#FFCC99"),
  color("Nougat", "#CC8E69"),
  color("Reddish brown", "#694028"),
  color("Hot pink", "#FF66CC", 25),
  color("Toothpaste", "#00FFFF", 50),
  color("Lime green", "#00FF00", 75),
  color("Really red", "#FF0000", 100),
  color("Deep orange", "#FFB000", 125),
  color("Royal purple", "#6225D1", 150),
  color("Gold", "#EFB838", 250),
  color("Obsidian", "#140F1E", 500),
];

const face = (id: string, name: string, price: number, starter = false): FaceItem => ({
  id,
  name,
  price,
  starter,
  image: `/images/faces/${id}.png`,
});

export const FACES: FaceItem[] = [
  face("smile", "Smile", 0, true),
  face("sad-cursed-eyes", "Sad Cursed Eyes", 50),
  face("chill", "Chill", 25),
  face("female", "Female", 25),
  face("anime-male", "Anime Male", 60),
  face("anime-female", "Anime Female", 60),
  face("radical-face", "Radical Face", 100),
];

export const HATS: HatItem[] = [
  { id: "baseball-cap", name: "Baseball Cap", price: 75, image: "/images/hat-baseball-cap.png" },
];

export const BUNDLES: BundleItem[] = [
  { id: "classic", name: "Classic", price: 0, starter: true },
  { id: "female", name: "Female", price: 0, image: "/images/bundle-female.png" },
];

// Same as PlayerData.ItemId in Unity: "face" + "sad-cursed-eyes" is "face_sad_cursed_eyes".
export function itemId(type: ItemType, id: string) {
  return `${type}_${id.toLowerCase().replace(/[ -]/g, "_")}`;
}

export const findFace = (id: string) => FACES.find((f) => f.id === id) ?? FACES[0];
export const findHat = (id: string) => HATS.find((h) => h.id === id);
export const findBundle = (id: string) => BUNDLES.find((b) => b.id === id) ?? BUNDLES[0];

export type Game = {
  id: string;
  title: string;
  creator: string;
  description: string;
  genre: string;
  thumbnail: string;
  multiplayer: boolean;
};

// ponytail: only the built-in game. Studio games are saved on the creator's computer; they need
// cloud publishing (PlayFab files or a database) before the website can list them.
export const GAMES: Game[] = [
  {
    id: "playground",
    title: "Plyria Playground",
    creator: "Plyria",
    description:
      "Run, jump and climb around the classic Plyria baseplate. Beat the obby over the kill floor, push crates around and climb the stairs.\n\n" +
      "Controls: WASD to move, Space to jump, hold right mouse to turn the camera, scroll to zoom, Shift for shift lock, Esc for the menu.",
    genre: "All Genres",
    thumbnail: "/images/playground.png",
    multiplayer: true,
  },
];

export const findGame = (id: string) => GAMES.find((g) => g.id === id);

// ---------- PlayerData (saved in PlayFab User Data "PlayerData", read by the Unity game) ----------

// Unity's JsonUtility writes colors as 0-1 floats.
export type Rgba = { r: number; g: number; b: number; a: number };

export type PlayerData = {
  username: string;
  face: string;
  hat: string;
  plyrium: number;
  owned: string[];
  bodyColors: Rgba[];
  bodyPartBundles: string[];
  visits: number;
  likedGames: string[];
  dislikedGames: string[];
  favoritedGames: string[];
};

export function hexToRgba(hex: string): Rgba {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
}

export function rgbaToHex(c: Rgba) {
  const byte = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0");
  return `#${byte(c.r)}${byte(c.g)}${byte(c.b)}`.toUpperCase();
}

// Fills in anything missing, like PlayerData.Normalize in Unity.
export function normalizePlayerData(raw: unknown): PlayerData {
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<PlayerData>;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const white = hexToRgba(COLORS[0].hex);
  return {
    username: typeof d.username === "string" ? d.username : "Player",
    face: typeof d.face === "string" && d.face ? d.face : "smile",
    hat: typeof d.hat === "string" ? d.hat : "",
    plyrium: typeof d.plyrium === "number" ? d.plyrium : 0,
    owned: list(d.owned),
    bodyColors:
      Array.isArray(d.bodyColors) && d.bodyColors.length === BODY_PARTS.length ? d.bodyColors : BODY_PARTS.map(() => white),
    bodyPartBundles:
      Array.isArray(d.bodyPartBundles) && d.bodyPartBundles.length === BODY_PARTS.length
        ? d.bodyPartBundles
        : BODY_PARTS.map(() => "classic"),
    visits: typeof d.visits === "number" ? d.visits : 0,
    likedGames: list(d.likedGames),
    dislikedGames: list(d.dislikedGames),
    favoritedGames: list(d.favoritedGames),
  };
}

export const ownsColor = (d: PlayerData, c: ColorItem) => c.price === 0 || d.owned.includes(itemId("color", c.id));
export const ownsFace = (d: PlayerData, f: FaceItem) => !!f.starter || d.owned.includes(itemId("face", f.id));
export const ownsHat = (d: PlayerData, h: HatItem) => d.owned.includes(itemId("hat", h.id));
export const ownsBundle = (d: PlayerData, b: BundleItem) => !!b.starter || d.owned.includes(itemId("bundle", b.id));
