"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as pf from "@/lib/playfab";
import { BUNDLES, COLORS, FACES, HATS, itemId, normalizePlayerData, type PlayerData } from "@/lib/catalog";

// Items bought with Plyrium. Their ownership comes from the PlayFab inventory, never from saved data.
const PAID = new Set([
  ...COLORS.filter((c) => c.price > 0).map((c) => itemId("color", c.id)),
  ...FACES.filter((f) => f.price > 0).map((f) => itemId("face", f.id)),
  ...HATS.filter((h) => h.price > 0).map((h) => itemId("hat", h.id)),
  ...BUNDLES.filter((b) => b.price > 0).map((b) => itemId("bundle", b.id)),
]);

type Account = {
  ready: boolean;
  error: string;
  session: pf.Session | null;
  info: pf.AccountInfo | null;
  data: PlayerData | null;
  blurb: string;
  displayName: string;
  userId: string;
  blocked: string[];
  isBlocked: (playFabId: string) => boolean;
  setBlocked: (playFabId: string, block: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  save: (next: PlayerData) => Promise<void>;
  setBlurb: (text: string) => void;
  setDisplayName: (name: string) => void;
  logOut: () => void;
};

const AccountContext = createContext<Account | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<pf.Session | null>(null);
  const [info, setInfo] = useState<pf.AccountInfo | null>(null);
  const [data, setData] = useState<PlayerData | null>(null);
  const [blurb, setBlurb] = useState("");
  const [blocked, setBlockedList] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const current = pf.getSession();
    setSession(current);
    setError("");
    if (!current) {
      setInfo(null);
      setData(null);
      setReady(true);
      return;
    }
    try {
      const [account, userData, inventory] = await Promise.all([
        pf.getAccountInfo(),
        pf.getUserData(["PlayerData", "Blurb", "Blocked"]),
        pf.getInventory(),
      ]);
      let saved: unknown = null;
      try {
        saved = userData.PlayerData ? JSON.parse(userData.PlayerData) : null;
      } catch {
        saved = null;
      }
      const player = normalizePlayerData(saved);
      player.username = account.TitleInfo?.DisplayName || account.Username || "Player";
      player.plyrium = inventory.plyrium;
      player.owned = [...new Set([...player.owned.filter((id) => !PAID.has(id)), ...inventory.items])];
      setInfo(account);
      setData(player);
      setBlurb(pf.unpackText(userData.Blurb));
      setBlockedList(pf.readBlocked(userData.Blocked));
      if (!saved) await pf.updateUserData({ PlayerData: JSON.stringify(player) });
    } catch (e) {
      if (e instanceof pf.PlayFabError && e.code === "NotAuthenticated") setSession(null);
      else setError(e instanceof Error ? e.message : "Couldn't load your account.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    // Session lives in localStorage, which only exists in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const save = useCallback(async (next: PlayerData) => {
    setData(next);
    await pf.updateUserData({ PlayerData: JSON.stringify(next) });
  }, []);

  // Blocks or unblocks a player. The page updates straight away, then the list is saved.
  const setBlocked = useCallback(async (playFabId: string, block: boolean) => {
    let next: string[] = [];
    setBlockedList((current) => {
      next = block ? [...new Set([...current, playFabId])] : current.filter((id) => id !== playFabId);
      return next;
    });
    await pf.saveBlocked(next);
  }, []);

  const logOut = useCallback(() => {
    pf.clearSession();
    setSession(null);
    setInfo(null);
    setData(null);
    setBlockedList([]);
  }, []);

  const value: Account = {
    ready,
    error,
    session,
    info,
    data,
    blurb,
    displayName: info?.TitleInfo?.DisplayName || info?.Username || "",
    userId: session ? pf.toUserId(session.playFabId) : "",
    blocked,
    isBlocked: (playFabId) => blocked.includes(playFabId),
    setBlocked,
    refresh,
    save,
    setBlurb,
    setDisplayName: (name) => setInfo((i) => (i ? { ...i, TitleInfo: { ...i.TitleInfo, DisplayName: name } } : i)),
    logOut,
  };
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("useAccount needs AccountProvider");
  return account;
}

// For pages inside the site shell, which only renders them once the player is loaded.
export function usePlayer() {
  const account = useAccount();
  if (!account.session || !account.data) throw new Error("usePlayer used before the account loaded");
  return { ...account, session: account.session, data: account.data };
}
