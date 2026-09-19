"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Modal, PriceTag, type Dialog } from "@/components/ui";
import { usePlayer } from "@/lib/account";
import {
  BUNDLES,
  FACES,
  HATS,
  PANTS,
  SHIRTS,
  itemId,
  ownsBundle,
  ownsFace,
  ownsHat,
  ownsPants,
  ownsShirt,
  type ItemType,
  type PlayerData,
} from "@/lib/catalog";
import { purchase } from "@/lib/playfab";

// One row of the catalog: everything the grid and the buy dialog need, whatever kind of item it is.
type CatalogEntry = {
  type: ItemType;
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  owned: boolean;
  fit: "cover" | "contain";
};

const CATEGORIES = ["All", "Bundles", "Shirts", "Pants", "Hats", "Faces"] as const;
type Category = (typeof CATEGORIES)[number];

const SORTS = ["Price: Low to High", "Price: High to Low", "Name"] as const;
type Sort = (typeof SORTS)[number];

// Everything on sale, in one list. Starter items are left out: every avatar already has them.
function buildCatalog(data: PlayerData): CatalogEntry[] {
  return [
    ...BUNDLES.filter((b) => !b.starter).map((b) => ({
      type: "bundle" as const,
      id: b.id,
      name: b.name,
      price: b.price,
      image: b.image,
      category: "Bundles",
      owned: ownsBundle(data, b),
      fit: "cover" as const,
    })),
    ...SHIRTS.filter((s) => !s.starter).map((s) => ({
      type: "shirt" as const,
      id: s.id,
      name: s.name,
      price: s.price,
      image: s.image,
      category: "Shirts",
      owned: ownsShirt(data, s),
      fit: "contain" as const,
    })),
    ...PANTS.filter((p) => !p.starter).map((p) => ({
      type: "pants" as const,
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      category: "Pants",
      owned: ownsPants(data, p),
      fit: "contain" as const,
    })),
    ...HATS.map((h) => ({
      type: "hat" as const,
      id: h.id,
      name: h.name,
      price: h.price,
      image: h.image,
      category: "Hats",
      owned: ownsHat(data, h),
      fit: "contain" as const,
    })),
    ...FACES.filter((f) => !f.starter).map((f) => ({
      type: "face" as const,
      id: f.id,
      name: f.name,
      price: f.price,
      image: f.image,
      category: "Faces",
      owned: ownsFace(data, f),
      fit: "contain" as const,
    })),
  ];
}

export default function MarketplacePage() {
  const { data, save, refresh } = usePlayer();
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("Price: Low to High");
  const [ownedOnly, setOwnedOnly] = useState(false);

  const close = () => setDialog(null);
  const toAvatar = { label: "Go to Avatar", primary: true, onClick: () => router.push("/avatar") };

  const catalog = useMemo(() => buildCatalog(data), [data]);

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = catalog.filter(
      (item) =>
        (category === "All" || item.category === category) &&
        (!ownedOnly || item.owned) &&
        (query === "" || item.name.toLowerCase().includes(query)),
    );
    const byName = (a: CatalogEntry, b: CatalogEntry) => a.name.localeCompare(b.name);
    const order =
      sort === "Name"
        ? byName
        : sort === "Price: High to Low"
          ? (a: CatalogEntry, b: CatalogEntry) => b.price - a.price || byName(a, b)
          : (a: CatalogEntry, b: CatalogEntry) => a.price - b.price || byName(a, b);
    return [...list].sort(order);
  }, [catalog, category, ownedOnly, search, sort]);

  const countIn = (name: Category) => (name === "All" ? catalog.length : catalog.filter((i) => i.category === name).length);

  async function complete(key: string, name: string, price: number) {
    setDialog({ title: "Buying...", message: `Buying ${name}...`, actions: [] });
    try {
      // Free items are just added to your saved items; paid ones go through PlayFab, which takes the Plyrium.
      if (price === 0) await save({ ...data, owned: [...data.owned, key] });
      else {
        await purchase(key, price);
        await refresh();
      }
      setDialog({
        title: "Purchase Completed",
        message: `You now own ${name}. Wear it in the Avatar editor.`,
        actions: [{ label: "Close", onClick: close }, toAvatar],
      });
    } catch (e) {
      setDialog({ title: "Purchase Failed", message: e instanceof Error ? e.message : String(e) });
      refresh();
    }
  }

  function buy(item: CatalogEntry) {
    const key = itemId(item.type, item.id);
    if (item.owned) {
      return setDialog({
        title: item.name,
        message: "You already own this.",
        actions: [{ label: "Close", onClick: close }, toAvatar],
      });
    }
    if (data.plyrium < item.price) {
      return setDialog({
        title: "Insufficient Plyrium",
        message: `You need ${(item.price - data.plyrium).toLocaleString()} more Plyrium to buy ${item.name}.`,
        actions: [
          { label: "Cancel", onClick: close },
          { label: "Get Plyrium", primary: true, onClick: () => router.push("/plyrium") },
        ],
      });
    }
    const free = item.price === 0;
    setDialog({
      title: free ? "Get Item" : "Buy Item",
      message: free
        ? `Would you like to get ${item.name} for free?`
        : `Would you like to buy ${item.name} for ${item.price.toLocaleString()} Plyrium?`,
      actions: [
        { label: "Cancel", onClick: close },
        { label: free ? "Get Now" : "Buy Now", primary: true, onClick: () => complete(key, item.name, item.price) },
      ],
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-2">
        <h1 className="h1">Marketplace</h1>
        <div className="flex-1" />
        <PriceTag amount={data.plyrium} />
      </div>
      <p className="muted">Find your next look. Wear what you own in the Avatar Editor.</p>

      <div className="mt-3 flex flex-col gap-4 md:flex-row">
        {/* Categories down the side, like the aisles of a shop. */}
        <nav aria-label="Categories" className="md:w-[170px] md:shrink-0">
          <div className="flex flex-wrap gap-1 md:flex-col">
            {CATEGORIES.map((name) => (
              <button
                key={name}
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
                className={`flex items-center justify-between gap-2 rounded-[3px] border px-3 py-1.5 text-[13px] font-bold md:w-full ${
                  category === name
                    ? "border-brand bg-brand text-white"
                    : "border-[#d3c9e0] bg-white text-[#444444] transition-colors hover:border-brand hover:text-brand"
                }`}
              >
                <span>{name}</span>
                <span className={category === name ? "text-white/70" : "text-[#999999]"}>{countIn(name)}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[#ddd2ea] pb-3">
            <input
              className="field max-w-[240px]"
              placeholder="Search the Marketplace"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search the Marketplace"
            />
            <select
              className="field max-w-[190px]"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort by"
            >
              {SORTS.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-[#555555]">
              <input type="checkbox" checked={ownedOnly} onChange={(e) => setOwnedOnly(e.target.checked)} />
              Only what I own
            </label>
            <div className="flex-1" />
            <span className="muted">{shown.length} items</span>
          </div>

          {shown.length === 0 ? (
            <p className="muted">Nothing here matches. Try another category or search.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {shown.map((item) => (
                <button key={`${item.type}_${item.id}`} className="card w-full" onClick={() => buy(item)}>
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[2px] border border-[#d3c9e0] bg-[#f3f0f8]">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        width={220}
                        height={220}
                        className={`card-thumb h-full w-full ${item.fit === "cover" ? "object-cover" : "object-contain p-2"}`}
                      />
                    ) : (
                      <span className="text-2xl text-[#bbbbbb]">&#8709;</span>
                    )}
                  </div>
                  <div className="card-title truncate">{item.name}</div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-[#888888]">{item.category.replace(/s$/, "")}</span>
                    {item.owned ? <span className="text-sm font-bold text-money">Owned</span> : <PriceTag amount={item.price} />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal dialog={dialog} onClose={close} />
    </>
  );
}
