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
      <div className="welcome-strip">
        <h1 className="h1">Home</h1>
        <p className="text-lg font-bold">Hello, {displayName}!</p>
      </div>
      <div className="home-columns">
      <div className="min-w-0">

      <div className="section-heading !mt-0">
        <h2>Friends {friends ? `(${friends.length})` : ""}</h2>
        <Link href="/friends" className="text-sm font-bold text-link hover:underline">
          {friends?.length === 0 ? "Add friends" : "See all"}
        </Link>
      </div>
      {friends === null ? (
        <p className="muted">Loading friends...</p>
      ) : (
        <FriendList friends={friends} empty="You haven't added any friends yet. Add some on the Friends page." max={8} />
      )}

      <div className="section-heading"><h2>Explore Games</h2><Link href="/games" className="link text-sm">See all</Link></div>
      <div className="flex flex-wrap gap-3">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      </div>
      <aside className="home-avatar" aria-label="Your avatar">
      <h2>Your Avatar</h2>
      <Link
        href="/avatar"
        className="mx-auto mb-4 flex h-[200px] w-[150px] items-center justify-center border border-[#dedbe3] bg-white hover:border-brand"
        aria-label="Edit your avatar"
      >
        <Avatar3D data={data} width={148} height={198} />
      </Link>
      <Link href="/avatar" className="btn btn-primary w-full">Customize Avatar</Link>
      </aside>
      </div>
    </>
  );
}
