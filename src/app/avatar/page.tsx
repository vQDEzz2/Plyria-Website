"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import Avatar3D from "@/components/Avatar3DLazy";
import { Modal, type Dialog } from "@/components/ui";
import { usePlayer } from "@/lib/account";
import {
  BODY_PARTS,
  COLORS,
  FACES,
  HATS,
  PANTS,
  SHIRTS,
  findBundle,
  findFace,
  findHat,
  findPants,
  findShirt,
  bundleHasPart,
  bundlesForPart,
  hexToRgba,
  ownsBundle,
  ownsColor,
  ownsFace,
  ownsHat,
  ownsPants,
  ownsShirt,
  type BundleItem,
  type ClothingItem,
  type PlayerData,
} from "@/lib/catalog";

const TABS = ["Body Colors", "Body Parts", "Faces", "Hats", "Shirts", "Pants"] as const;
const ALL_PARTS = BODY_PARTS.map((_, i) => i);

export default function AvatarPage() {
  const { data, save } = usePlayer();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Body Colors");
  const [selected, setSelected] = useState<number[]>(ALL_PARTS);
  const [bodyPart, setBodyPart] = useState<number | "all">("all");
  const [dialog, setDialog] = useState<Dialog | null>(null);

  function update(change: (next: PlayerData) => void) {
    const next = structuredClone(data);
    change(next);
    save(next).catch((e) => setDialog({ title: "Couldn't Save", message: e instanceof Error ? e.message : String(e) }));
  }

  const bundleIds = new Set(data.bodyPartBundles);
  const hat = findHat(data.hat);

  // Which bundles can go on the part being edited, and whether one is already on.
  const partsShown = bodyPart === "all" ? ALL_PARTS : [bodyPart];
  const choices = (bodyPart === "all" ? BODY_PARTS.map((_, i) => i) : [bodyPart])
    .map((i) => bundlesForPart(i))
    .reduce<BundleItem[]>((all, list) => all.concat(list.filter((b) => !all.includes(b))), [])
    .filter((b) => ownsBundle(data, b));

  const wearing = (bundle: BundleItem) =>
    partsShown.every((i) => !bundleHasPart(bundle, i) || data.bodyPartBundles[i] === bundle.id) &&
    partsShown.some((i) => data.bodyPartBundles[i] === bundle.id);

  // Wearing a bundle only changes the parts it actually has, so a head keeps the body it is on.
  const wear = (bundle: BundleItem) =>
    update((next) => partsShown.forEach((i) => {
      if (bundleHasPart(bundle, i)) next.bodyPartBundles[i] = bundle.id;
    }));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="h1">Avatar Editor</h1>
        <div className="flex-1" />
        <Link href="/marketplace" className="btn">
          Get More in the Marketplace
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-6 xl:flex-row">
        <div className="w-full max-w-[300px] shrink-0 xl:sticky xl:top-[88px] xl:self-start">
          <div className="relative flex justify-center border border-[#999999] bg-white">
            <Avatar3D data={data} width={298} height={360} />
            <span className="pointer-events-none absolute bottom-1.5 text-xs text-[#777777]">Drag to turn</span>
          </div>
          <div className="mt-2.5 border border-[#cccccc] bg-[#fafafa] text-[13px]">
            <div className="border-b border-[#cccccc] bg-[#eeeeee] px-2 py-1.5 text-sm font-bold">Currently Wearing</div>
            {[
              ["Body", bundleIds.size === 1 ? findBundle(data.bodyPartBundles[0]).name : "Mixed"],
              ["Face", findFace(data.face).name],
              ["Hat", hat ? hat.name : "None"],
              ["Shirt", findShirt(data.shirt)?.name ?? "None"],
              ["Pants", findPants(data.pants)?.name ?? "None"],
            ].map(([label, value]) => (
              <div key={label} className="flex border-b border-[#eeeeee] px-2 py-1.5">
                <span className="w-[60px] text-[#777777]">{label}</span>
                <span className="font-bold text-link">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-0.5">
            {TABS.map((t) => (
              <button
                key={t}
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-t border border-b-0 border-[#cccccc] px-4 py-[7px] text-sm font-bold ${
                  tab === t ? "bg-white text-brand" : "bg-[#ebe5f2] text-[#444444] transition-colors hover:bg-brand-50"
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
                <p className="muted">Pick a body part, then pick the shape to wear on it. Shapes show in the game.</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(["all", ...ALL_PARTS] as const).map((part) => (
                    <button
                      key={part}
                      aria-pressed={bodyPart === part}
                      onClick={() => setBodyPart(part)}
                      className={`rounded-[3px] border px-3 py-1.5 text-[13px] font-bold ${
                        bodyPart === part
                          ? "border-brand bg-brand text-white"
                          : "border-[#cccccc] bg-white text-[#444444] transition-colors hover:border-brand hover:text-brand"
                      }`}
                    >
                      {part === "all" ? "Whole Body" : BODY_PARTS[part]}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {choices.map((b) => (
                    <Tile key={b.id} name={b.name} on={wearing(b)} onClick={() => wear(b)}>
                      {b.image ? (
                        <Image src={b.image} alt="" width={84} height={84} className="h-[84px] w-[84px] object-contain" />
                      ) : (
                        <span className="text-2xl text-[#999999]">&#8709;</span>
                      )}
                    </Tile>
                  ))}
                </div>

                <p className="muted mt-3">
                  {bodyPart === "all"
                    ? `Wearing: ${bundleIds.size === 1 ? findBundle(data.bodyPartBundles[0]).name : BODY_PARTS.map((name, i) => `${name} ${findBundle(data.bodyPartBundles[i]).name}`).join(", ")}`
                    : `${BODY_PARTS[bodyPart]}: ${findBundle(data.bodyPartBundles[bodyPart]).name}`}
                </p>
                {choices.length < 2 && (
                  <Link href="/marketplace" className="link mt-1 inline-block">
                    Find more body shapes in the Marketplace.
                  </Link>
                )}
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

            {tab === "Shirts" && (
              <ClothingTab
                kind="shirt"
                items={SHIRTS.filter((s) => ownsShirt(data, s))}
                worn={data.shirt}
                onWear={(id) => update((next) => (next.shirt = id))}
              />
            )}

            {tab === "Pants" && (
              <ClothingTab
                kind="pants"
                items={PANTS.filter((p) => ownsPants(data, p))}
                worn={data.pants}
                onWear={(id) => update((next) => (next.pants = id))}
              />
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

function ClothingTab({
  kind,
  items,
  worn,
  onWear,
}: {
  kind: "shirt" | "pants";
  items: ClothingItem[];
  worn: string;
  onWear: (id: string) => void;
}) {
  return (
    <>
      <p className="muted">Click {kind === "shirt" ? "a shirt" : "pants"} to wear {kind === "shirt" ? "it" : "them"}.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Tile name="None" on={!worn} onClick={() => onWear("")}>
          <span className="text-2xl text-[#999999]">&#8709;</span>
        </Tile>
        {items.map((item) => (
          <Tile key={item.id} name={item.name} on={worn === item.id} onClick={() => onWear(item.id)}>
            <Image src={item.image} alt="" width={84} height={84} className="h-[84px] w-[84px] object-contain" />
          </Tile>
        ))}
      </div>
    </>
  );
}

function Tile({ name, on, onClick, children }: { name: string; on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-[110px] flex-col items-center rounded-[3px] border p-1.5 transition-[transform,border-color] duration-150 hover:-translate-y-0.5 ${on ? "border-2 border-brand bg-brand-50" : "border-[#d3c9e0] hover:border-brand"}`}
    >
      <div className="flex h-[84px] w-[84px] items-center justify-center">{children}</div>
      <span className="mt-1 text-xs font-bold">{name}</span>
    </button>
  );
}
