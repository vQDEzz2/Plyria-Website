"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar3D from "@/components/Avatar3DLazy";
import FriendList from "@/components/FriendList";
import GameCard from "@/components/GameCard";
import { usePlayer } from "@/lib/account";
import { GAMES } from "@/lib/catalog";
import { getFriends, type Friend } from "@/lib/playfab";

export default function HomePage() {
  const { data, displayName } = usePlayer();
  const [friends, setFriends] = useState<Friend[] | null>(null);

  useEffect(() => {
    getFriends()
      .then((list) => setFriends(list.filter((f) => f.status === "friends")))
      .catch(() => setFriends([]));
  }, []);

  return (
    <>
      <h1 className="h1">Hello, {displayName}!</h1>

      <div className="flex items-end justify-between">
        <h2 className="h2">Friends {friends ? `(${friends.length})` : ""}</h2>
        <Link href="/friends" className="text-sm font-bold text-link hover:underline">
          See all
        </Link>
      </div>
      {friends === null ? (
        <p className="muted">Loading friends...</p>
      ) : (
        <FriendList friends={friends} empty="You haven't added any friends yet. Add some on the Friends page." max={8} />
      )}

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
