"use client";

import Link from "next/link";
import Avatar3D from "@/components/Avatar3DLazy";
import GameCard from "@/components/GameCard";
import { usePlayer } from "@/lib/account";
import { GAMES } from "@/lib/catalog";

export default function HomePage() {
  const { data, displayName } = usePlayer();
  return (
    <>
      <h1 className="h1">Hello, {displayName}!</h1>

      <h2 className="h2">Recommended For You</h2>
      <div className="flex flex-wrap gap-3">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <h2 className="h2">Your Avatar</h2>
      <Link
        href="/avatar"
        className="flex h-[200px] w-[150px] items-center justify-center border border-[#999999] bg-white hover:border-brand"
        aria-label="Edit your avatar"
      >
        <Avatar3D data={data} width={148} height={198} />
      </Link>
    </>
  );
}
