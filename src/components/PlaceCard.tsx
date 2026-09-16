"use client";

import Link from "next/link";
import type { Place } from "@/lib/places";
import { toUserId } from "@/lib/playfab";

// A Studio game on the Games page. Places have no thumbnail on the website yet, so the card shows
// the game's initial on a classic grey tile.
export default function PlaceCard({ place, creator, creatorId }: { place: Place; creator: string; creatorId: string }) {
  return (
    <div className="card w-[156px]">
      <div className="flex h-[156px] w-[156px] items-center justify-center border border-[#999999] bg-[#dddddd] text-5xl font-bold text-[#888888]">
        {place.name.charAt(0).toUpperCase()}
      </div>
      <div className="card-title" title={place.name}>
        {place.name}
      </div>
      <div className="text-xs text-[#666666]">
        <Link href={`/users/${toUserId(creatorId)}`} className="font-bold text-link hover:underline">
          {creator}
        </Link>
        <div>{place.genre}</div>
      </div>
    </div>
  );
}
