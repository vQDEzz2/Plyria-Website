"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal, launchActions, type Dialog } from "@/components/ui";
import { usePlayer } from "@/lib/account";
import { launchUrl } from "@/lib/launch";
import { GENRES, getPlaces, savePlaces, type Place } from "@/lib/places";

export default function CreatePage() {
  const { session } = usePlayer();
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getPlaces()
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, []);

  function openStudio(placeId?: string) {
    const url = launchUrl(session, "studio", placeId ? { place: placeId } : {});
    window.location.assign(url);
    setDialog({
      title: placeId ? "Opening this game in Studio..." : "Opening Plyria Studio...",
      message: "Plyria Studio should open in a moment. If nothing happens, install Plyria and run it once, then try again.",
      actions: launchActions(url, () => setDialog(null), () => router.push("/download")),
    });
  }

  // Studio reads this list when it opens, so changes here reach the game.
  async function update(id: string, change: Partial<Place>) {
    if (!places) return;
    const next = places.map((p) => (p.id === id ? { ...p, ...change } : p));
    setPlaces(next);
    setStatus("Saving...");
    try {
      await savePlaces(next);
      setStatus("Saved. Open Studio to see the change in the game.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
      setPlaces(places);
    }
  }

  return (
    <>
      <h1 className="h1">Create</h1>
      <p className="muted">
        Build your own games in Plyria Studio. Games are saved on the computer that made them; publishing puts their
        details here, so you can change the genre or hide a game without opening Studio.
      </p>
      <button className="btn btn-primary mt-3" onClick={() => openStudio()}>
        Open Plyria Studio
      </button>

      <h2 className="h2">My Games</h2>
      {status && <p className="mb-2 text-[13px] text-[#666666]">{status}</p>}
      {places === null ? (
        <p className="muted">Loading your games...</p>
      ) : places.length === 0 ? (
        <p className="muted">
          No published games yet. Make one in Studio, press Publish, and it shows up here and on the Games page.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {places.map((place) => (
            <div key={place.id} className="flex flex-wrap items-center gap-2 border border-[#dddddd] bg-[#fafafa] p-2">
              <div className="min-w-[160px] flex-1">
                <div className="text-[15px] font-bold">{place.name}</div>
                <div className="truncate text-xs text-[#777777]">{place.description || "No description."}</div>
              </div>

              <label className="text-xs font-bold text-[#444444]">
                Genre{" "}
                <select className="field" value={place.genre} onChange={(e) => update(place.id, { genre: e.target.value })}>
                  {GENRES.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>

              <button
                className="btn"
                onClick={() => update(place.id, { published: !place.published })}
                title={place.published ? "Take it off the Games page" : "Put it back on the Games page"}
              >
                {place.published ? "Public" : "Private"}
              </button>

              <button className="btn btn-primary" onClick={() => openStudio(place.id)}>
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal dialog={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
