// Games and Marketplace items. These mirror the Unity project (PlayerData.cs, HatCatalog, AvatarBundles)
// and the PlayFab "Marketplace" catalog, so item IDs and prices must stay in sync with both.

export const BODY_PARTS = ["Head", "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"] as const;

export type ItemType = "color" | "face" | "hat" | "bundle" | "shirt" | "pants";

export type ColorItem = { id: string; name: string; hex: string; price: number };
export type FaceItem = { id: string; name: string; price: number; starter?: boolean; image: string };
export type HatItem = { id: string; name: string; price: number; image: string };
// A bundle of body parts. parts lists which of BODY_PARTS it provides, by index; leave it out for a whole
// body. A bundle that only provides some parts (a head on its own, say) leaves the rest as they are.
export type BundleItem = { id: string; name: string; price: number; starter?: boolean; image?: string; parts?: number[] };
// A classic shirt or pants: a 585x559 Roblox template PNG (template) and a flat front view for tiles (image).
export type ClothingItem = { id: string; name: string; price: number; starter?: boolean; template: string; image: string };

const color = (name: string, hex: string, price = 0): ColorItem => ({ id: name, name, hex, price });

// Body colors, all free. Same list and order as PlayerData.Catalog in Unity.
export const COLORS: ColorItem[] = [
  color("Dirt brown", "#564236"),
  color("Reddish brown", "#694028"),
  color("Brown", "#7C5C46"),
  color("Sand red", "#957977"),
  color("Linen", "#AF9483"),
  color("Burlap", "#C7AC78"),
  color("Brick yellow", "#D7C59A"),
  color("Medium red", "#DA867A"),
  color("Dusty Rose", "#A34B4B"),
  color("CGA brown", "#AA5500"),
  color("Dark orange", "#A05F35"),
  color("Nougat", "#CC8E69"),
  color("Light orange", "#EAB892"),
  color("Pastel brown", "#FFCC99"),
  color("Neon orange", "#D5733D"),
  color("Bright orange", "#DA8541"),
  color("Bright yellowish orange", "#E29B40"),
  color("Deep orange", "#FFAF00"),
  color("Bright yellow", "#F5CD30"),
  color("Daisy orange", "#F8D96D"),
  color("Cool yellow", "#FDEA8D"),
  color("Earth green", "#27462D"),
  color("Camo", "#3A7D15"),
  color("Dark green", "#287F47"),
  color("Bright green", "#4B974B"),
  color("Shamrock", "#5B9A4C"),
  color("Moss", "#7C9C6B"),
  color("Bright yellowish green", "#A4BD47"),
  color("Navy blue", "#002060"),
  color("Deep blue", "#2154B9"),
  color("Really blue", "#0000FF"),
  color("Bright blue", "#0D69AC"),
  color("Steel blue", "#527CAE"),
  color("Medium blue", "#6E99CA"),
  color("Light blue", "#B4D2E4"),
  color("Bright bluish green", "#008F9C"),
  color("Teal", "#12EED4"),
  color("Pastel blue-green", "#9FF3E9"),
  color("Toothpaste", "#00FFFF"),
  color("Cyan", "#04AFEC"),
  color("Pastel Blue", "#80BBDC"),
  color("Pastel light blue", "#AFDDFF"),
  color("Bright violet", "#6B327C"),
  color("Lavender", "#8C5B9F"),
  color("Lilac", "#A75E9B"),
  color("Magenta", "#AA00AA"),
  color("Royal purple", "#6225D1"),
  color("Alder", "#B480FF"),
  color("Pastel violet", "#B1A7FF"),
  color("Bright red", "#C4281C"),
  color("Really red", "#FF0000"),
  color("Hot pink", "#FF00BF"),
  color("Pink", "#FF66CC"),
  color("Carnation pink", "#FF98DC"),
  color("Light reddish violet", "#E8BAC8"),
  color("Pastel orange", "#FFC9C9"),
  color("Dark taupe", "#5A4C42"),
  color("Cork", "#BC9B5D"),
  color("Olive", "#C1BE42"),
  color("Medium green", "#A1C48C"),
  color("Grime", "#7F8E64"),
  color("Sand green", "#789082"),
  color("Sand blue", "#74869D"),
  color("Lime green", "#00FF00"),
  color("Pastel green", "#CCFFCC"),
  color("New Yeller", "#FFFF00"),
  color("Pastel yellow", "#FFFFCC"),
  color("Really black", "#111111"),
  color("Black", "#1B2A35"),
  color("Dark stone grey", "#635F62"),
  color("Medium stone grey", "#A3A2A5"),
  color("Mid gray", "#CDCDCD"),
  color("Light stone grey", "#E5E4DF"),
  color("White", "#F2F3F3"),
  color("Institutional white", "#F8F8F8"),
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

const clothing = (id: string, name: string, price: number, starter = false): ClothingItem => ({
  id,
  name,
  price,
  starter,
  template: `/images/clothing/${id}.png`,
  image: `/images/clothing/${id}-icon.png`,
});

// Same files as Assets/Resources/Shirts and Assets/Resources/Pants in Unity.
export const SHIRTS: ClothingItem[] = [
  clothing("plyria-tee", "Plyria Tee", 0, true),
  clothing("leather-jacket", "Leather Jacket", 75),
];
export const PANTS: ClothingItem[] = [
  clothing("blue-jeans", "Blue Jeans", 0, true),
  clothing("black-jeans", "Black Jeans", 50),
];

export const BUNDLES: BundleItem[] = [
  { id: "classic", name: "Classic", price: 0, starter: true },
  { id: "female", name: "Female", price: 0, image: "/images/bundle-female.png" },
  { id: "wedge-head", name: "Wedge Head", price: 65, image: "/images/bundle-wedge-head.png", parts: [0] },
  { id: "animatronic", name: "Animatronic", price: 120, image: "/images/bundle-animatronic.png" },
];

// True when this bundle has a mesh for that body part.
export const bundleHasPart = (b: BundleItem, part: number) => !b.parts || b.parts.includes(part);

// Bundles that can be worn on a body part, so a head-only bundle only shows up under Head.
export const bundlesForPart = (part: number) => BUNDLES.filter((b) => bundleHasPart(b, part));

// The bundle a body part is actually wearing. Anything that does not provide the part falls back to Classic,
// which is what the game does when a bundle has no mesh for it.
export function bundleForPart(d: PlayerData, part: number) {
  const chosen = findBundle(d.bodyPartBundles[part]);
  return bundleHasPart(chosen, part) ? chosen : BUNDLES[0];
}

// Same as PlayerData.ItemId in Unity: "face" + "sad-cursed-eyes" is "face_sad_cursed_eyes".
export function itemId(type: ItemType, id: string) {
  return `${type}_${id.toLowerCase().replace(/[ -]/g, "_")}`;
}

export const findFace = (id: string) => FACES.find((f) => f.id === id) ?? FACES[0];
export const findHat = (id: string) => HATS.find((h) => h.id === id);
export const findShirt = (id: string) => SHIRTS.find((s) => s.id === id);
export const findPants = (id: string) => PANTS.find((p) => p.id === id);
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
  shirt: string;
  pants: string;
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
  const white = hexToRgba(COLORS.find((c) => c.name === "White")!.hex); // new avatars start white
  return {
    username: typeof d.username === "string" ? d.username : "Player",
    face: typeof d.face === "string" && d.face ? d.face : "smile",
    hat: typeof d.hat === "string" ? d.hat : "",
    shirt: typeof d.shirt === "string" ? d.shirt : "",
    pants: typeof d.pants === "string" ? d.pants : "",
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
export const ownsShirt = (d: PlayerData, s: ClothingItem) => !!s.starter || d.owned.includes(itemId("shirt", s.id));
export const ownsPants = (d: PlayerData, p: ClothingItem) => !!p.starter || d.owned.includes(itemId("pants", p.id));
