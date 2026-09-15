"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Avatar3D from "@/components/Avatar3D";
import { Modal, Stat, formatDate, whenText, type Dialog } from "@/components/ui";
import { usePlayer } from "@/lib/account";
import { findFace, findHat, normalizePlayerData, type PlayerData } from "@/lib/catalog";
import {
  acceptFriendRequest,
  getAccountInfo,
  getFriends,
  getLastLogin,
  getUserData,
  removeFriend,
  sendFriendRequest,
  toPlayFabId,
  type FriendStatus,
} from "@/lib/playfab";

type Profile = {
  userId: string;
  playFabId: string;
  username: string;
  displayName: string;
  created?: string;
  lastLogin?: string;
  blurb: string;
  avatar: PlayerData | null;
  friendStatus: FriendStatus | null;
};

async function loadProfile(userId: string, myPlayFabId: string): Promise<Profile> {
  if (!/^\d+$/.test(userId)) throw new Error("That isn't a user ID.");
  const playFabId = toPlayFabId(userId);
  const [info, userData, lastLogin, friends] = await Promise.all([
    getAccountInfo({ PlayFabId: playFabId }),
    getUserData(["PlayerData", "Blurb"], playFabId).catch(() => ({}) as Record<string, string>),
    getLastLogin(playFabId),
    playFabId === myPlayFabId ? Promise.resolve([]) : getFriends().catch(() => []),
  ]);
  let avatar: PlayerData | null = null;
  try {
    avatar = userData.PlayerData ? normalizePlayerData(JSON.parse(userData.PlayerData)) : null;
  } catch {
    avatar = null;
  }
  return {
    userId,
    playFabId,
    username: info.Username ?? "",
    displayName: info.TitleInfo?.DisplayName || info.Username || "Player",
    created: info.Created,
    lastLogin,
    blurb: userData.Blurb ?? "",
    avatar,
    friendStatus: friends.find((f) => f.playFabId === playFabId)?.status ?? null,
  };
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { session, data } = usePlayer();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const load = useCallback(
    () =>
      loadProfile(id, session.playFabId)
        .then((p) => {
          setProfile(p);
          setError("");
        })
        .catch((e) => setError(e instanceof Error ? e.message : String(e))),
    [id, session.playFabId],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="text-sm text-[#c42b1c]">Couldn&apos;t load this profile: {error}</p>;
  if (!profile || profile.userId !== id) return <p className="muted">Loading profile...</p>;

  const mine = profile.playFabId === session.playFabId;
  const avatar = mine ? data : profile.avatar;

  function friendAction(action: (id: string) => Promise<string>) {
    setBusy(true);
    action(profile!.playFabId)
      .then(load)
      .catch((e) => setDialog({ title: "Friends", message: e instanceof Error ? e.message : String(e) }))
      .finally(() => setBusy(false));
  }

  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex h-[320px] w-[240px] shrink-0 items-center justify-center border border-[#999999] bg-white">
          {avatar ? <Avatar3D data={avatar} width={238} height={318} /> : <span className="muted">No avatar yet</span>}
        </div>
        <div className="flex-1">
          <h1 className="h1">{profile.displayName}</h1>
          <p className="-mt-1.5 mb-2 text-sm text-[#777777]">@{profile.username}</p>
          <div className="flex flex-wrap">
            <Stat label="User ID" value={profile.userId} />
            <Stat label="Joined" value={formatDate(profile.created)} />
            <Stat label="Last Online" value={whenText(profile.lastLogin)} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {mine ? (
              <>
                <Link href="/settings" className="btn">
                  Edit Profile
                </Link>
                <Link href="/avatar" className="btn">
                  Edit Avatar
                </Link>
              </>
            ) : profile.friendStatus === "incoming" ? (
              <>
                <button className="btn btn-primary" disabled={busy} onClick={() => friendAction(acceptFriendRequest)}>
                  Accept Request
                </button>
                <button className="btn" disabled={busy} onClick={() => friendAction(removeFriend)}>
                  Decline
                </button>
              </>
            ) : profile.friendStatus === "sent" ? (
              <button className="btn" disabled={busy} onClick={() => friendAction(removeFriend)}>
                Cancel Request
              </button>
            ) : profile.friendStatus === "friends" ? (
              <button className="btn" disabled={busy} onClick={() => friendAction(removeFriend)}>
                Unfriend
              </button>
            ) : (
              <button className="btn btn-primary" disabled={busy} onClick={() => friendAction(sendFriendRequest)}>
                Add Friend
              </button>
            )}
          </div>
        </div>
      </div>

      <h2 className="h2">About</h2>
      <p className="muted whitespace-pre-line">{profile.blurb.trim() || "This player hasn't written anything yet."}</p>

      {avatar && (
        <>
          <h2 className="h2">Currently Wearing</h2>
          <div className="w-[300px] border border-[#cccccc] bg-[#fafafa] text-[13px]">
            <div className="flex border-b border-[#eeeeee] px-2 py-1.5">
              <span className="w-[60px] text-[#777777]">Face</span>
              <span className="font-bold text-link">{findFace(avatar.face).name}</span>
            </div>
            <div className="flex px-2 py-1.5">
              <span className="w-[60px] text-[#777777]">Hat</span>
              <span className="font-bold text-link">{findHat(avatar.hat)?.name ?? "None"}</span>
            </div>
          </div>
        </>
      )}
      <Modal dialog={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
