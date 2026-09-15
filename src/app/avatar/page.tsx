"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import { Modal, type Dialog } from "@/components/ui";
import { usePlayer } from "@/lib/account";
import {
  BODY_PARTS,
  BUNDLES,
  COLORS,
  FACES,
  HATS,
  findBundle,
  findFace,
  findHat,
  hexToRgba,
  ownsBundle,
  ownsColor,
  ownsFace,
  ownsHat,
  type PlayerData,
} from "@/lib/catalog";

const TABS = ["Body Colors", "Body Parts", "Faces", "Hats"] as const;
const ALL_PARTS = BODY_PARTS.map((_, i) => i);

export default function AvatarPage() {
  const { data, save } = usePlayer();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Body Colors");
  const [selected, setSelected] = useState<number[]>(ALL_PARTS);
  const [dialog, setDialog] = useState<Dialog | null>(null);

  function update(change: (next: PlayerData) => void) {
    const next = structuredClone(data);
    change(next);
    save(next).catch((e) => setDialog({ title: "Couldn't Save", message: e instanceof Error ? e.message : String(e) }));
  }

  const bundleIds = new Set(data.bodyPartBundles);
  const hat = findHat(data.hat);
  const ownedBundles = BUNDLES.filter((b) => ownsBundle(data, b));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="h1">Avatar Editor</h1>
        <div className="flex-1" />
        <Link href="/marketplace" className="btn">
          Get More in the Marketplace
        </Link>
      </div>

      <div className="mt-1.5 flex flex-col gap-5 md:flex-row">
        <div className="md:w-[300px]">
          <div className="flex justify-center border border-[#999999] bg-white py-3">
            <Avatar data={data} width={220} />
          </div>
          <div className="mt-2.5 border border-[#cccccc] bg-[#fafafa] text-[13px]">
            <div className="border-b border-[#cccccc] bg-[#eeeeee] px-2 py-1.5 text-sm font-bold">Currently Wearing</div>
            {[
              ["Body", bundleIds.size === 1 ? findBundle(data.bodyPartBundles[0]).name : "Mixed"],
              ["Face", findFace(data.face).name],
              ["Hat", hat ? hat.name : "None"],
            ].map(([label, value]) => (
              <div key={label} className="flex border-b border-[#eeeeee] px-2 py-1.5">
                <span className="w-[60px] text-[#777777]">{label}</span>
                <span className="font-bold text-link">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap gap-0.5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-t border border-b-0 border-[#cccccc] px-4 py-[7px] text-sm font-bold ${
                  tab === t ? "bg-white text-brand" : "bg-[#e6e6e6] text-[#444444] hover:bg-[#f2f8fe]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="min-h-[420px] border border-[#cccccc] bg-white p-3.5">
            {tab === "Body Colors" && (
              <>
                <p className="muted">Click a body part, then click a color.</p>
                <div className="mt-2 flex flex-col gap-5 sm:flex-row">
                  <div className="w-[220px]">
                    <Avatar data={data} width={200} selected={selected} onPartClick={(part) => setSelected([part])} />
                    <p className="muted mt-1">
                      Selected: {selected.length === ALL_PARTS.length ? "All" : selected.map((p) => BODY_PARTS[p]).join(", ")}
                    </p>
                    <button className="btn mt-1.5" onClick={() => setSelected(ALL_PARTS)}>
                      Select All
                    </button>
                  </div>
                  <div className="flex flex-1 flex-wrap content-start gap-1.5">
                    {COLORS.filter((c) => ownsColor(data, c)).map((c) => (
                      <button
                        key={c.id}
                        title={c.name}
                        aria-label={c.name}
                        onClick={() => update((next) => selected.forEach((p) => (next.bodyColors[p] = hexToRgba(c.hex))))}
                        className="h-8 w-8 border border-[#777777] hover:scale-110"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === "Body Parts" && (
              <>
                <p className="muted">Wear a whole bundle, or mix body parts from bundles you own. Shapes show in the game.</p>
                <div className="mt-2 overflow-x-auto border border-[#dddddd]">
                  <table className="text-sm">
                    <thead>
                      <tr className="bg-[#f5f5f5]">
                        <th className="w-[120px] px-2 py-1.5 text-left">Body Part</th>
                        {ownedBundles.map((b) => (
                          <th key={b.id} className="px-2 py-1.5 text-[13px] text-[#555555]">
                            {b.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[#eeeeee]">
                        <td className="px-2 py-1.5 font-bold">All Parts</td>
                        {ownedBundles.map((b) => (
                          <td key={b.id} className="px-2 py-1.5">
                            <button
                              className={`btn w-[120px] ${data.bodyPartBundles.every((id) => id === b.id) ? "btn-on" : ""}`}
                              onClick={() => update((next) => (next.bodyPartBundles = BODY_PARTS.map(() => b.id)))}
                            >
                              Wear All
                            </button>
                          </td>
                        ))}
                      </tr>
                      {BODY_PARTS.map((part, i) => (
                        <tr key={part} className="border-t border-[#eeeeee]">
                          <td className="px-2 py-1.5 font-bold">{part}</td>
                          {ownedBundles.map((b) => (
                            <td key={b.id} className="px-2 py-1.5">
                              <button
                                className={`btn w-[120px] ${data.bodyPartBundles[i] === b.id ? "btn-on" : ""}`}
                                onClick={() => update((next) => (next.bodyPartBundles[i] = b.id))}
                              >
                                {b.name}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === "Faces" && (
              <>
                <p className="muted">Click a face to wear it.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FACES.filter((f) => ownsFace(data, f)).map((f) => (
                    <Tile key={f.id} name={f.name} on={data.face === f.id} onClick={() => update((next) => (next.face = f.id))}>
                      <Image src={f.image} alt="" width={84} height={84} className="h-[84px] w-[84px] object-contain" />
                    </Tile>
                  ))}
                </div>
              </>
            )}

            {tab === "Hats" && (
              <>
                <p className="muted">Click a hat to wear it.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Tile name="None" on={!data.hat} onClick={() => update((next) => (next.hat = ""))}>
                    <span className="text-2xl text-[#999999]">&#8709;</span>
                  </Tile>
                  {HATS.filter((h) => ownsHat(data, h)).map((h) => (
                    <Tile key={h.id} name={h.name} on={data.hat === h.id} onClick={() => update((next) => (next.hat = h.id))}>
                      <Image src={h.image} alt="" width={84} height={84} className="h-[84px] w-[84px] object-contain" />
                    </Tile>
                  ))}
                </div>
                {!HATS.some((h) => ownsHat(data, h)) && (
                  <Link href="/marketplace" className="link mt-3 inline-block">
                    You don&apos;t own any hats yet. Find some in the Marketplace.
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Modal dialog={dialog} onClose={() => setDialog(null)} />
    </>
  );
}

function Tile({ name, on, onClick, children }: { name: string; on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-[110px] flex-col items-center border p-1.5 ${on ? "border-2 border-brand bg-[#f2f8fe]" : "border-[#cccccc] hover:border-brand"}`}
    >
      <div className="flex h-[84px] w-[84px] items-center justify-center">{children}</div>
      <span className="mt-1 text-xs font-bold">{name}</span>
    </button>
  );
}
