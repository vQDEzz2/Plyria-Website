"use client";

import Image from "next/image";
import { useState } from "react";
import { ShellFrame } from "@/components/SiteShell";
import { Modal, PriceTag, Stat, type Dialog } from "@/components/ui";

// Development only (hidden in production by SiteShell): previews the site's look without logging in.
export default function DevShellPage() {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  return (
    <ShellFrame displayName="PreviewPlayer" userId="1234567890" plyrium={1000}>
      <h1 className="h1">Hello, PreviewPlayer!</h1>
      <h2 className="h2">Recommended For You</h2>
      <div className="stagger flex flex-wrap gap-3">
        {["Plyria Playground", "Obby Tower", "Crate Wars", "Hangout"].map((title) => (
          <button key={title} className="card" onClick={() => setDialog({ title, message: "This is a preview card." })}>
            <Image
              src="/images/playground.png"
              alt=""
              width={156}
              height={156}
              className="h-[156px] w-[156px] border border-[#999999] object-cover"
            />
            <div className="card-title">{title}</div>
            <div className="text-xs text-[#666666]">-- Rating &nbsp; 12 Visits</div>
          </button>
        ))}
      </div>
      <h2 className="h2">Buttons</h2>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn">Normal</button>
        <button className="btn btn-primary">Primary</button>
        <button className="btn btn-on">On</button>
        <button className="btn" disabled>
          Disabled
        </button>
        <button className="btn btn-play h-[60px] w-[240px]" onClick={() => setDialog({ title: "Starting Plyria...", message: "Preview popup." })}>
          Play
        </button>
        <PriceTag amount={75} />
      </div>
      <h2 className="h2">Fields and Stats</h2>
      <input className="field max-w-[260px]" placeholder="Username or user ID" />
      <div className="mt-2.5 flex flex-wrap">
        <Stat label="Visits" value="1,234" />
        <Stat label="Rating" value="100%" />
        <Stat label="Genre" value="All Genres" />
      </div>
      <Modal dialog={dialog} onClose={() => setDialog(null)} />
    </ShellFrame>
  );
}
