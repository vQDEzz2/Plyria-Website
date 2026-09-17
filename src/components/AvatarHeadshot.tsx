"use client";

import { useEffect, useState } from "react";
import { normalizePlayerData, type PlayerData } from "@/lib/catalog";
import { getUserData } from "@/lib/playfab";

// A player's avatar head, seen from the front, for friend lists. Shows their initial until the picture is ready,
// or if they never saved an avatar. The picture is drawn once per look (see renderHeadshot in Avatar3D).

const avatars = new Map<string, Promise<PlayerData | null>>();

function avatarOf(playFabId: string) {
  if (!avatars.has(playFabId)) {
    avatars.set(
      playFabId,
      getUserData(["PlayerData"], playFabId)
        .then((d) => (d.PlayerData ? normalizePlayerData(JSON.parse(d.PlayerData)) : null))
        .catch(() => null),
    );
  }
  return avatars.get(playFabId)!;
}

export default function AvatarHeadshot({ playFabId, name, size }: { playFabId: string; name: string; size: number }) {
  const [src, setSrc] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await avatarOf(playFabId);
      if (!data || cancelled) return;
      const { renderHeadshot } = await import("./Avatar3D"); // three.js loads only when a headshot is needed
      const url = await renderHeadshot(data, size);
      if (!cancelled) setSrc({ id: playFabId, url });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [playFabId, size]);

  const url = src?.id === playFabId ? src.url : null;
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden bg-[#e9e4f0] font-bold text-[#8a7fa0]"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- a generated data URL, nothing for next/image to optimize
        <img src={url} alt={`${name}'s avatar`} width={size} height={size} className="animate-fade-in h-full w-full" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}
