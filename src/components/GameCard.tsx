"use client";

import Image from "next/image";
import Link from "next/link";
import { usePlayer } from "@/lib/account";
import type { Game } from "@/lib/catalog";
import { Rating } from "@/components/ui";

export default function GameCard({ game }: { game: Game }) {
  const { data } = usePlayer();
  return (
    <Link href={`/games/${game.id}`} className="card">
      <Image
        src={game.thumbnail}
        alt=""
        width={156}
        height={156}
        className="h-[156px] w-[156px] border border-[#999999] bg-[#dddddd] object-cover"
      />
      <div className="card-title">{game.title}</div>
      <div className="text-xs text-[#666666]">
        <Rating liked={data.likedGames.includes(game.id)} disliked={data.dislikedGames.includes(game.id)} /> Rating &nbsp;{" "}
        {data.visits.toLocaleString()} Visits
      </div>
    </Link>
  );
}
