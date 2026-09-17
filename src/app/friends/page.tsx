"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AvatarHeadshot from "@/components/AvatarHeadshot";
import { Modal, whenText, type Dialog } from "@/components/ui";
import { usePlayer } from "@/lib/account";
import {
  acceptFriendRequest,
  findPlayer,
  getFriends,
  removeFriend,
  sendFriendRequest,
  toUserId,
  type Friend,
} from "@/lib/playfab";

export default function FriendsPage() {
  const { session } = usePlayer();
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState({ text: "", error: false });
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const load = useCallback(
    () =>
      getFriends()
        .then((list) => {
          setFriends(list);
          setLoadError("");
        })
        .catch((e) => setLoadError(e instanceof Error ? e.message : String(e))),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const failed = (e: unknown) => setDialog({ title: "Friends", message: e instanceof Error ? e.message : String(e) });
  const act = (action: (id: string) => Promise<string>, id: string) => action(id).then(load).catch(failed);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus({ text: "Looking...", error: false });
    try {
      const id = await findPlayer(query);
      if (id === session.playFabId) throw new Error("That's you!");
      setStatus({ text: await sendFriendRequest(id), error: false });
      setQuery("");
      await load();
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : String(err), error: true });
    } finally {
      setBusy(false);
    }
  }

  const section = (title: string, list: Friend[], empty?: string) =>
    (list.length > 0 || empty) && (
      <>
        <h2 className="h2">
          {title} ({list.length})
        </h2>
        {list.length === 0 && <p className="muted">{empty}</p>}
        {list.map((friend) => (
          <div key={friend.playFabId} className="mb-2 flex flex-wrap items-center gap-2 border border-[#cccccc] bg-[#fafafa] p-2">
            <AvatarHeadshot playFabId={friend.playFabId} name={friend.displayName} size={48} />
            <div className="min-w-[160px] flex-1">
              <div className="text-[15px] font-bold text-link">{friend.displayName}</div>
              <div className="text-xs text-[#777777]">@{friend.username}</div>
              {friend.lastLogin && <div className="text-xs text-[#777777]">Last online {whenText(friend.lastLogin)}</div>}
            </div>
            <Link href={`/users/${toUserId(friend.playFabId)}`} className="btn">
              Profile
            </Link>
            {friend.status === "incoming" && (
              <>
                <button className="btn btn-primary" onClick={() => act(acceptFriendRequest, friend.playFabId)}>
                  Accept
                </button>
                <button className="btn" onClick={() => act(removeFriend, friend.playFabId)}>
                  Decline
                </button>
              </>
            )}
            {friend.status === "sent" && (
              <button className="btn" onClick={() => act(removeFriend, friend.playFabId)}>
                Cancel
              </button>
            )}
            {friend.status === "friends" && (
              <button
                className="btn"
                onClick={() =>
                  setDialog({
                    title: "Unfriend",
                    message: `Remove ${friend.displayName} from your friends?`,
                    actions: [
                      { label: "Cancel", onClick: () => setDialog(null) },
                      {
                        label: "Unfriend",
                        primary: true,
                        onClick: () => {
                          setDialog(null);
                          act(removeFriend, friend.playFabId);
                        },
                      },
                    ],
                  })
                }
              >
                Unfriend
              </button>
            )}
          </div>
        ))}
      </>
    );

  return (
    <>
      <h1 className="h1">Friends</h1>
      <p className="muted">Add a friend by their username or user ID.</p>
      <form onSubmit={send} className="mt-2 flex flex-wrap items-center gap-2">
        <input className="field max-w-[260px]" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Username or user ID" />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          Send Request
        </button>
        {status.text && <span className={`text-[13px] ${status.error ? "text-[#c42b1c]" : "text-money"}`}>{status.text}</span>}
      </form>

      {loadError && <p className="mt-3 text-sm text-[#c42b1c]">Couldn&apos;t load your friends: {loadError}</p>}
      {!friends && !loadError && <p className="muted mt-3">Loading friends...</p>}
      {friends && (
        <>
          {section("Friend Requests", friends.filter((f) => f.status === "incoming"))}
          {section("Your Friends", friends.filter((f) => f.status === "friends"), "You don't have any friends yet. Send a request above.")}
          {section("Sent Requests", friends.filter((f) => f.status === "sent"))}
        </>
      )}
      <Modal dialog={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
