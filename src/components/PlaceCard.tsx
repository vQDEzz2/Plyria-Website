"use client";

import Link from "next/link";
import type { Place } from "@/lib/places";
import { toUserId } from "@/lib/playfab";

// A Studio game on the Games page. Places have no thumbnail on the website yet, so the card shows
// the game's initial on a classic grey tile.
export default function PlaceCard({ place, creator, creatorId }: { place: Place; creator: string; creatorId: string }) {
  const userId = toUserId(creatorId);
  return (
    <div className="card w-[156px]">
      <Link href={`/places/${userId}/${place.id}`} aria-label={`Open ${place.name}`}>
        <div className="flex h-[156px] w-[156px] items-center justify-center border border-[#999999] bg-[#dddddd] text-5xl font-bold text-[#888888] transition-colors duration-150 hover:border-brand">
          {place.name.charAt(0).toUpperCase()}
        </div>
      </Link>
      <Link href={`/places/${userId}/${place.id}`} className="card-title block" title={place.name}>
        {place.name}
      </Link>
      <div className="text-xs text-[#666666]">
        <Link href={`/users/${userId}`} className="font-bold text-link hover:underline">
          {creator}
        </Link>
        <div>{place.genre}</div>
      </div>
    </div>
  );
}
