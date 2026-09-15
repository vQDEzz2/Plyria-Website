"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { usePlayer } from "@/lib/account";
import { findGame, type PlayerData } from "@/lib/catalog";
import { launchUrl } from "@/lib/launch";
import { Modal, Rating, Stat, launchActions, type Dialog } from "@/components/ui";

type Mode = "solo" | "host" | "join";

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const game = findGame(id);
  const { data, save, session } = usePlayer();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [address, setAddress] = useState("127.0.0.1");
  const close = () => setDialog(null);

  if (!game) {
    return (
      <>
        <h1 className="h1">Game not found</h1>
        <Link href="/games" className="link">
          Back to Games
        </Link>
      </>
    );
  }

  const failed = (e: unknown) => setDialog({ title: "Couldn't Save", message: e instanceof Error ? e.message : String(e) });

  function toggle(list: "favoritedGames" | "likedGames" | "dislikedGames", opposite?: "likedGames" | "dislikedGames") {
    const next: PlayerData = structuredClone(data);
    next[list] = next[list].includes(game!.id) ? next[list].filter((g) => g !== game!.id) : [...next[list], game!.id];
    if (opposite) next[opposite] = next[opposite].filter((g) => g !== game!.id);
    save(next).catch(failed);
  }

  function play(mode: Mode, joinAddress?: string) {
    save({ ...data, visits: data.visits + 1 }).catch(failed);
    const url = launchUrl(session, "play", { game: game!.id, mode, ...(joinAddress ? { address: joinAddress } : {}) });
    window.location.assign(url);
    setDialog({
      title: "Starting Plyria...",
      message: "Plyria should open in a moment. If nothing happens, install the Plyria game and run it once, then try again.",
      actions: launchActions(url, close),
    });
  }

  const favorited = data.favoritedGames.includes(game.id);
  const liked = data.likedGames.includes(game.id);
  const disliked = data.dislikedGames.includes(game.id);

  return (
    <>
      <div className="flex flex-col gap-5 lg:flex-row">
        <Image
          src={game.thumbnail}
          alt=""
          width={640}
          height={360}
          className="aspect-video w-full max-w-[640px] border border-[#999999] bg-[#dddddd] object-cover"
        />
        <div className="flex flex-1 flex-col border border-[#cccccc] bg-[#f5f5f5] p-3">
          <h1 className="h1">{game.title}</h1>
          <p className="muted">By {game.creator}</p>
          <div className="flex-1" />
          <button className="btn btn-play mt-2 mb-2.5 h-[60px]" onClick={() => play("solo")}>
            Play
          </button>
          {game.multiplayer && (
            <div className="mb-2 flex gap-1.5">
              <button className="btn" onClick={() => play("host")}>
                Host Server
              </button>
              <button
                className="btn"
                onClick={() =>
                  setDialog({
                    title: "Join Server",
                    message: (
                      <>
                        Enter the IP address of the computer hosting {game.title}. It must click Host Server first.
                        <input className="field mt-2" defaultValue={address} onChange={(e) => setAddress(e.target.value)} />
                      </>
                    ),
                    actions: [
                      { label: "Cancel", onClick: close },
                      { label: "Join", primary: true, onClick: () => play("join", address.trim()) },
                    ],
                  })
                }
              >
                Join Server
              </button>
            </div>
          )}
          <div className="flex gap-1.5">
            <button className={`btn ${favorited ? "btn-on" : ""}`} onClick={() => toggle("favoritedGames")}>
              {favorited ? "Favorited" : "Favorite"}
            </button>
            <button className={`btn ${liked ? "btn-on" : ""}`} onClick={() => toggle("likedGames", "dislikedGames")}>
              Like
            </button>
            <button className={`btn ${disliked ? "btn-on" : ""}`} onClick={() => toggle("dislikedGames", "likedGames")}>
              Dislike
            </button>
          </div>
        </div>
      </div>

      <h2 className="h2">About</h2>
      <p className="muted whitespace-pre-line">{game.description}</p>
      <div className="mt-2.5 flex flex-wrap">
        <Stat label="Favorites" value={favorited ? "1" : "0"} />
        <Stat label="Visits" value={data.visits.toLocaleString()} />
        <Stat label="Rating" value={<Rating liked={liked} disliked={disliked} />} />
        <Stat label="Genre" value={game.genre} />
      </div>
      <Modal dialog={dialog} onClose={close} />
    </>
  );
}
