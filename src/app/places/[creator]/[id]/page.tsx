"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal, launchActions, type Dialog } from "@/components/ui";
import { usePlayer } from "@/lib/account";
import { launchUrl } from "@/lib/launch";
import { getPlaces, type Place } from "@/lib/places";
import { getAccountInfo, toPlayFabId, toUserId } from "@/lib/playfab";

// A game made in Plyria Studio. The place itself lives on the computer that built it, so Play only
// works for the creator; everyone else sees why it can't start yet.
export default function PlacePage() {
  const { creator, id } = useParams<{ creator: string; id: string }>();
  const { session } = usePlayer();
  const router = useRouter();
  const [place, setPlace] = useState<Place | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const creatorPlayFabId = /^\d+$/.test(creator) ? toPlayFabId(creator) : "";
  const mine = creatorPlayFabId === session.playFabId;

  useEffect(() => {
    if (!creatorPlayFabId) return;
    Promise.all([getPlaces(creatorPlayFabId), getAccountInfo({ PlayFabId: creatorPlayFabId }).catch(() => null)])
      .then(([places, info]) => {
        const found = places.find((p) => p.id === id && p.published);
        if (!found) return setError("That game isn't published.");
        setPlace(found);
        setCreatorName(info?.TitleInfo?.DisplayName || info?.Username || "Player");
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [creatorPlayFabId, id]);

  function open(action: "play" | "studio") {
    const url = launchUrl(session, action, { place: id });
    window.location.assign(url);
    setDialog({
      title: action === "play" ? "Starting Plyria..." : "Opening Plyria Studio...",
      message: "Plyria should open in a moment. If nothing happens, install Plyria and run it once, then try again.",
      actions: launchActions(url, () => setDialog(null), () => router.push("/download")),
    });
  }

  if (!creatorPlayFabId) return <p className="text-sm text-[#c42b1c]">That isn&apos;t a game link.</p>;
  if (error) return <p className="text-sm text-[#c42b1c]">{error}</p>;
  if (!place) return <p className="muted">Loading game...</p>;

  return (
    <>
      <h1 className="h1">{place.name}</h1>
      <p className="-mt-1.5 mb-2 text-sm text-[#777777]">
        By{" "}
        <Link href={`/users/${toUserId(creatorPlayFabId)}`} className="font-bold text-link hover:underline">
          {creatorName}
        </Link>{" "}
        &nbsp;|&nbsp; {place.genre}
      </p>

      <div className="flex flex-wrap gap-1.5">
        <button className="btn btn-play h-11 px-6 text-xl" onClick={() => open("play")} disabled={!mine}>
          Play
        </button>
        {mine && (
          <button className="btn" onClick={() => open("studio")}>
            Edit in Studio
          </button>
        )}
      </div>
      {!mine && (
        <p className="muted mt-2">
          Only {creatorName} can start this game for now. Games are saved on the computer that built them, so playing
          someone else&apos;s game needs cloud saving, which isn&apos;t built yet.
        </p>
      )}

      <h2 className="h2">Description</h2>
      <p className="muted whitespace-pre-line">{place.description.trim() || "No description."}</p>

      <Modal dialog={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
