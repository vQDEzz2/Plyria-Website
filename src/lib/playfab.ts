// PlayFab Client API over plain fetch (title 10C4D2). The browser talks to PlayFab directly, the same
// accounts, inventory and friends the Unity game uses. There are no secrets here: client calls only.

import { maskBadWords } from "./filter";

export const TITLE_ID = "10C4D2";
const API = `https://${TITLE_ID}.playfabapi.com/Client`;
const SESSION_KEY = "plyria.session";

export type Session = { playFabId: string; ticket: string };

export class PlayFabError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
  }
}

// ---------- Session (the ticket lasts 24 hours) ----------

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function setSession(session: Session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // private windows can block storage; the login still works until the tab closes
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

// ---------- Requests ----------

type PlayFabErrorBody = {
  error?: string;
  errorMessage?: string;
  errorDetails?: Record<string, string[]>;
};

const FRIENDLY: Record<string, string> = {
  AccountNotFound: "No account with that username.",
  InvalidUsernameOrPassword: "Wrong username or password.",
  UsernameNotAvailable: "That username is already taken.",
  NameNotAvailable: "That display name is already taken.",
  EmailAddressNotAvailable: "That email is already used by another account.",
  InvalidEmailAddress: "That email address isn't valid.",
  UsersAlreadyFriends: "You're already friends.",
  InsufficientFunds: "You don't have enough Plyrium.",
  ItemNotFound: "This item isn't for sale in the Marketplace catalog.",
  WrongPrice: "This item's price changed. Reload the page and try again.",
  WrongVirtualCurrency: "This item's price changed. Reload the page and try again.",
  NotAuthenticated: "Your session ended. Please log in again.",
};

function describe(body: PlayFabErrorBody | null) {
  if (!body) return "Can't reach Plyria's servers. Check your internet connection.";
  if (body.error && FRIENDLY[body.error]) return FRIENDLY[body.error];
  const details = body.errorDetails ? Object.values(body.errorDetails).flat() : [];
  return details.length ? details.join(" ") : body.errorMessage || body.error || "Something went wrong.";
}

async function call<T>(api: string, body: object, authenticated = true): Promise<T> {
  const session = getSession();
  if (authenticated && !session) throw new PlayFabError("Please log in.", "NotAuthenticated");
  let json: ({ code: number; data: T } & PlayFabErrorBody) | null = null;
  try {
    const response = await fetch(`${API}/${api}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authenticated && session ? { "X-Authorization": session.ticket } : {}),
      },
      body: JSON.stringify(body),
      // A blocked or stalled request (for example by a browser extension) fails instead of loading forever.
      signal: AbortSignal.timeout(15000),
    });
    json = await response.json();
  } catch {
    json = null;
  }
  if (!json || json.code !== 200) {
    if (json?.error === "NotAuthenticated") clearSession();
    throw new PlayFabError(describe(json), json?.error ?? "ConnectionError");
  }
  return json.data;
}

// ---------- User IDs (like Roblox: the PlayFab ID's 16 hex digits read as one number) ----------

export const toUserId = (playFabId: string) => BigInt(`0x${playFabId}`).toString();
export const toPlayFabId = (userId: string) => BigInt(userId).toString(16).toUpperCase().padStart(16, "0");

// ---------- Accounts ----------

export async function logIn(username: string, password: string) {
  const data = await call<{ PlayFabId: string; SessionTicket: string }>(
    "LoginWithPlayFab",
    { TitleId: TITLE_ID, Username: username, Password: password },
    false,
  );
  setSession({ playFabId: data.PlayFabId, ticket: data.SessionTicket });
}

export async function signUp(username: string, password: string, email: string) {
  const data = await call<{ PlayFabId: string; SessionTicket: string }>(
    "RegisterPlayFabUser",
    {
      TitleId: TITLE_ID,
      Username: username,
      Password: password,
      DisplayName: username,
      Email: email.trim() || undefined,
      RequireBothUsernameAndEmail: false,
    },
    false,
  );
  setSession({ playFabId: data.PlayFabId, ticket: data.SessionTicket });
}

export const sendPasswordReset = (email: string) =>
  call("SendAccountRecoveryEmail", { Email: email.trim(), TitleId: TITLE_ID }, false);

export type AccountInfo = {
  PlayFabId: string;
  Username?: string;
  Created?: string;
  TitleInfo?: { DisplayName?: string };
  PrivateInfo?: { Email?: string };
};

export const getAccountInfo = (lookup: { PlayFabId?: string; Username?: string } = {}) =>
  call<{ AccountInfo: AccountInfo }>("GetAccountInfo", lookup).then((d) => d.AccountInfo);

export const setDisplayName = (name: string) =>
  call<{ DisplayName: string }>("UpdateUserTitleDisplayName", { DisplayName: name }).then((d) => d.DisplayName);

export const getLastLogin = (playFabId: string) =>
  call<{ PlayerProfile?: { LastLogin?: string } }>("GetPlayerProfile", {
    PlayFabId: playFabId,
    ProfileConstraints: { ShowLastLogin: true },
  })
    .then((d) => d.PlayerProfile?.LastLogin)
    .catch(() => undefined); // needs "Last login time" allowed in Client Profile Options

// Finds a player by username or numeric user ID; gives back their PlayFab ID.
export async function findPlayer(query: string) {
  query = query.trim();
  if (!query) throw new PlayFabError("Enter a username or user ID.", "InvalidParams");
  try {
    const info = await getAccountInfo(/^\d+$/.test(query) ? { PlayFabId: toPlayFabId(query) } : { Username: query });
    return info.PlayFabId;
  } catch (e) {
    if (e instanceof PlayFabError && (e.code === "AccountNotFound" || e.code === "InvalidParams"))
      throw new PlayFabError(`No player found for "${query}".`, e.code);
    throw e;
  }
}

// ---------- User Data ("PlayerData" and "Blurb" are public so profiles can show them) ----------

// The title only accepts valid JSON in player data, so plain text is stored as a JSON string.
// Text saved before this change is read back unchanged.
export const packText = (text: string) => JSON.stringify(text ?? "");

export function unpackText(value: string | undefined): string {
  if (!value) return "";
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "string" ? parsed : value;
  } catch {
    return value;
  }
}

export const getUserData = (keys: string[], playFabId?: string) =>
  call<{ Data?: Record<string, { Value: string }> }>("GetUserData", { Keys: keys, PlayFabId: playFabId }).then(
    (d) => Object.fromEntries(Object.entries(d.Data ?? {}).map(([k, v]) => [k, v.Value])) as Record<string, string>,
  );

export const updateUserData = (data: Record<string, string>, keysToRemove: string[] = []) =>
  call("UpdateUserData", { Data: data, KeysToRemove: keysToRemove, Permission: "Public" });

// ---------- Plyrium and items (Legacy economy: currency "PL", catalog "Marketplace") ----------

export const getInventory = () =>
  call<{ Inventory?: { ItemId: string }[]; VirtualCurrency?: Record<string, number> }>("GetUserInventory", {}).then(
    (d) => ({ plyrium: d.VirtualCurrency?.PL ?? 0, items: (d.Inventory ?? []).map((i) => i.ItemId) }),
  );

// PlayFab checks the price and takes the Plyrium.
export const purchase = (itemId: string, price: number) =>
  call("PurchaseItem", { CatalogVersion: "Marketplace", ItemId: itemId, VirtualCurrency: "PL", Price: price });

// ---------- Friends (requests run in PlayFab/CloudScript.js in the Unity project) ----------

export type FriendStatus = "friends" | "incoming" | "sent";
export type Friend = { playFabId: string; username: string; displayName: string; lastLogin?: string; status: FriendStatus };

type FriendInfo = {
  FriendPlayFabId: string;
  Username?: string;
  TitleDisplayName?: string;
  Profile?: { DisplayName?: string; LastLogin?: string };
  Tags?: string[];
};

const STATUS: Record<string, FriendStatus> = { confirmed: "friends", pending: "incoming", requested: "sent" };

export async function getFriends(): Promise<Friend[]> {
  const list = await call<{ Friends?: FriendInfo[] }>("GetFriendsList", {
    ProfileConstraints: { ShowDisplayName: true, ShowLastLogin: true },
  }).catch(() => call<{ Friends?: FriendInfo[] }>("GetFriendsList", {}));
  return (list.Friends ?? [])
    .filter((f) => STATUS[f.Tags?.[0] ?? ""])
    .map((f) => ({
      playFabId: f.FriendPlayFabId,
      username: maskBadWords(f.Username ?? ""),
      displayName: maskBadWords(f.Profile?.DisplayName || f.TitleDisplayName || f.Username || "Player"),
      lastLogin: f.Profile?.LastLogin,
      status: STATUS[f.Tags![0]],
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

async function friendScript(functionName: string, friendId: string) {
  const data = await call<{ FunctionResult?: { ok?: boolean; message?: string }; Error?: { Error?: string; Message?: string } }>(
    "ExecuteCloudScript",
    { FunctionName: functionName, FunctionParameter: { friendId } },
  );
  if (data.Error)
    throw new PlayFabError(
      data.Error.Error === "CloudScriptNotFound" ? "Friend requests aren't set up yet (CloudScript missing)." : data.Error.Message ?? "Error",
      data.Error.Error ?? "CloudScriptError",
    );
  if (!data.FunctionResult) throw new PlayFabError("Friend requests aren't set up yet (CloudScript missing).", "CloudScriptNotFound");
  if (!data.FunctionResult.ok) throw new PlayFabError(data.FunctionResult.message ?? "Error", "FriendError");
  return data.FunctionResult.message ?? "";
}

// Any player's confirmed friends, for their profile page (CloudScript: the client API only reads your own).
export type PublicFriend = { playFabId: string; username: string; displayName: string };

export async function getPlayerFriends(playFabId: string): Promise<PublicFriend[]> {
  const data = await call<{ FunctionResult?: { friends?: PublicFriend[] } }>("ExecuteCloudScript", {
    FunctionName: "GetPlayerFriends",
    FunctionParameter: { playerId: playFabId },
  });
  return (data.FunctionResult?.friends ?? []).map((f) => ({
    playFabId: f.playFabId,
    username: maskBadWords(f.username),
    displayName: maskBadWords(f.displayName),
  }));
}

export const sendFriendRequest = (id: string) => friendScript("SendFriendRequest", id);
export const acceptFriendRequest = (id: string) => friendScript("AcceptFriendRequest", id);
export const removeFriend = (id: string) => friendScript("RemoveFriend", id);
