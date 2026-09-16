"use client";

import { useEffect, useMemo, useState } from "react";
import GameCard from "@/components/GameCard";
import PlaceCard from "@/components/PlaceCard";
import { usePlayer } from "@/lib/account";
import { GAMES } from "@/lib/catalog";
import { GENRES, getPlaces, type Place } from "@/lib/places";
import { getFriends } from "@/lib/playfab";

type Listed = { place: Place; creator: string; creatorId: string };

export default function GamesPage() {
  const { session, displayName } = usePlayer();
  const [places, setPlaces] = useState<Listed[] | null>(null);
  const [genre, setGenre] = useState("All");

  // Your own published games plus your friends'. PlayFab has no cross-player search, so discovery
  // stops there until a server-side index exists (see PlayFab/CloudScript.js).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mine = await getPlaces().catch(() => []);
      const friends = await getFriends().catch(() => []);
      const theirs = await Promise.all(
        friends
          .filter((f) => f.status === "friends")
          .map(async (f) => ({ friend: f, places: await getPlaces(f.playFabId).catch(() => []) })),
      );
      if (cancelled) return;
      setPlaces([
        ...mine.filter((p) => p.published).map((p) => ({ place: p, creator: displayName, creatorId: session.playFabId })),
        ...theirs.flatMap(({ friend, places: list }) =>
          list.filter((p) => p.published).map((p) => ({ place: p, creator: friend.displayName, creatorId: friend.playFabId })),
        ),
      ]);
    })();
    return () => {
      cancelled = true;
    };
  }, [displayName, session.playFabId]);

  const shown = useMemo(
    () => (genre === "All" ? (places ?? []) : (places ?? []).filter((l) => l.place.genre === genre)),
    [places, genre],
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="h1">Games</h1>
        <label className="text-sm font-bold text-[#444444]">
          Genre{" "}
          <select className="field" value={genre} onChange={(e) => setGenre(e.target.value)}>
            {GENRES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>

      <h2 className="h2">Featured</h2>
      <div className="flex flex-wrap gap-3">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <h2 className="h2">Made in Plyria Studio</h2>
      {places === null ? (
        <p className="muted">Loading games...</p>
      ) : shown.length === 0 ? (
        <p className="muted">
          No published games here yet. Build one in Plyria Studio and press Publish, and it shows up for you and your friends.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {shown.map(({ place, creator, creatorId }) => (
            <PlaceCard key={`${creatorId}.${place.id}`} place={place} creator={creator} creatorId={creatorId} />
          ))}
        </div>
      )}
    </>
  );
}
