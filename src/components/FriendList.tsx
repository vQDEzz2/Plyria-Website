"use client";

import Link from "next/link";
import AvatarHeadshot from "@/components/AvatarHeadshot";
import { toUserId } from "@/lib/playfab";

// A row of friends, like the classic profile Friends box: avatar headshot, name, link to the profile.
export default function FriendList({
  friends,
  empty,
  max = 12,
}: {
  friends: { playFabId: string; displayName: string }[];
  empty: string;
  max?: number;
}) {
  if (friends.length === 0) return <p className="muted">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {friends.slice(0, max).map((friend) => (
        <Link
          key={friend.playFabId}
          href={`/users/${toUserId(friend.playFabId)}`}
          className="w-[92px] border border-[#cccccc] bg-white p-1.5 text-center transition-transform duration-150 hover:-translate-y-0.5 hover:border-brand"
        >
          <div className="mx-auto w-fit">
            <AvatarHeadshot playFabId={friend.playFabId} name={friend.displayName} size={60} />
          </div>
          <div className="mt-1 truncate text-xs font-bold text-link">{friend.displayName}</div>
        </Link>
      ))}
    </div>
  );
}
