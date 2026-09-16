// Games made in Plyria Studio. The game writes the list to the player's PlayFab user data under "Places"
// (public, like "PlayerData"), so the website can list them and change their details.
// The place itself stays on the computer that built it, so Edit opens Studio there and only Plyria
// Playground can be played from the website for now.

import { maskBadWords } from "./filter";
import { getUserData, updateUserData } from "./playfab";

export const GENRES = [
  "All",
  "Adventure",
  "Building",
  "Comedy",
  "Fighting",
  "Horror",
  "Obby",
  "Racing",
  "RPG",
  "Sci-Fi",
  "Sports",
  "Town and City",
] as const;

export type Genre = (typeof GENRES)[number];

export type Place = {
  id: string;
  name: string;
  description: string;
  genre: string;
  published: boolean;
  visits: number;
  updated?: string;
};

const PLACES_KEY = "Places";

function toPlace(raw: unknown): Place | null {
  if (typeof raw !== "object" || raw === null) return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string" || !p.id) return null;
  return {
    id: p.id,
    name: maskBadWords(typeof p.name === "string" && p.name ? p.name : "Untitled Game"),
    description: maskBadWords(typeof p.description === "string" ? p.description : ""),
    genre: typeof p.genre === "string" && GENRES.includes(p.genre as Genre) ? p.genre : "All",
    published: p.published === true,
    visits: typeof p.visits === "number" ? p.visits : 0,
    updated: typeof p.updated === "string" ? p.updated : undefined,
  };
}

export function parsePlaces(value: string | undefined): Place[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    const list = (parsed as { places?: unknown }).places;
    if (!Array.isArray(list)) return [];
    return list.map(toPlace).filter((p): p is Place => p !== null);
  } catch {
    return [];
  }
}

// Every game of a player. Pass a PlayFab ID for someone else; their list only ever holds published games.
export async function getPlaces(playFabId?: string): Promise<Place[]> {
  const data = await getUserData([PLACES_KEY], playFabId).catch(() => ({}) as Record<string, string>);
  return parsePlaces(data[PLACES_KEY]);
}

// Saves your own list back. The game reads it when Studio opens, so website changes reach Studio.
export const savePlaces = (places: Place[]) => updateUserData({ [PLACES_KEY]: JSON.stringify({ places }) });
