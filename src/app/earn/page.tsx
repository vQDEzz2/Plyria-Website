"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePlayer } from "@/lib/account";
import { claimQuest, getQuests, type Quest } from "@/lib/playfab";

function Bar({ quest }: { quest: Quest }) {
  const percent = Math.min(100, Math.round((quest.progress / quest.goal) * 100));
  return (
    <div className="h-2.5 w-full border border-[#bbbbbb] bg-white">
      <div className="h-full bg-money transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function EarnPage() {
  const account = usePlayer();
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    getQuests()
      .then(setQuests)
      .catch((e) => {
        setQuests([]);
        setStatus(e instanceof Error ? e.message : String(e));
      });
  }, []);

  async function claim(quest: Quest) {
    setBusy(quest.id);
    setStatus("");
    try {
      const result = await claimQuest(quest.id);
      setQuests(result.quests);
      setStatus(result.message);
      // The balance in the header comes from the inventory, so read it again.
      await account.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  const daily = (quests ?? []).filter((q) => q.period === "daily");
  const weekly = (quests ?? []).filter((q) => q.period === "weekly");

  const list = (items: Quest[]) => (
    <div className="flex flex-col gap-2">
      {items.map((quest) => {
        const done = quest.progress >= quest.goal;
        return (
          <div key={quest.id} className="flex flex-wrap items-center gap-3 border border-[#dddddd] bg-[#fafafa] p-2.5">
            <div className="min-w-[200px] flex-1">
              <div className="text-[15px] font-bold">{quest.name}</div>
              <div className="mb-1 text-xs text-[#777777]">
                {Math.min(quest.progress, quest.goal)} / {quest.goal}
              </div>
              <Bar quest={quest} />
            </div>
            <div className="flex items-center gap-1 text-[15px] font-bold text-money">
              <Image src="/images/plyrium.png" alt="Plyrium" width={20} height={20} />
              {quest.reward}
            </div>
            <button
              className={`btn ${done && !quest.claimed ? "btn-primary" : ""}`}
              disabled={quest.claimed || !done || busy === quest.id}
              onClick={() => claim(quest)}
            >
              {quest.claimed ? "Claimed" : done ? "Claim" : "Keep Playing"}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="h1">Earn Plyrium</h1>
        <Link href="/plyrium" className="btn">
          Buy Plyrium
        </Link>
      </div>
      <p className="muted">
        Quests are the free way to earn Plyrium. Daily quests reset every day, the weekly one every Monday. Play Plyria to
        fill them in, then claim them here.
      </p>
      {status && <p className="mt-2 text-[13px] font-bold text-money">{status}</p>}

      {quests === null ? (
        <p className="muted mt-3">Loading quests...</p>
      ) : quests.length === 0 ? (
        <p className="muted mt-3">Quests aren&apos;t set up yet. Upload PlayFab/CloudScript.js in Game Manager.</p>
      ) : (
        <>
          <h2 className="h2">Daily Quests</h2>
          {list(daily)}
          <h2 className="h2">Weekly Quest</h2>
          {list(weekly)}
        </>
      )}
    </>
  );
}
