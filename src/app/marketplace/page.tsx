"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePlayer } from "@/lib/account";
import {
  BUNDLES,
  COLORS,
  FACES,
  HATS,
  PANTS,
  SHIRTS,
  itemId,
  ownsBundle,
  ownsColor,
  ownsFace,
  ownsHat,
  ownsPants,
  ownsShirt,
  type ItemType,
} from "@/lib/catalog";
import { purchase } from "@/lib/playfab";
import { Modal, PriceTag, type Dialog } from "@/components/ui";

function ItemCard({
  title,
  owned,
  price,
  onClick,
  children,
}: {
  title: string;
  owned: boolean;
  price: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className="card" onClick={onClick}>
      <div className="flex h-[156px] w-[156px] items-center justify-center overflow-hidden border border-[#999999] bg-[#dddddd]">
        {children}
      </div>
      <div className="card-title">{title}</div>
      {owned ? <span className="text-sm font-bold text-money">Owned</span> : <PriceTag amount={price} />}
    </button>
  );
}

export default function MarketplacePage() {
  const { data, save, refresh } = usePlayer();
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);
  const toAvatar = { label: "Go to Avatar", primary: true, onClick: () => router.push("/avatar") };

  async function confirm(key: string, name: string, price: number) {
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

  function buy(type: ItemType, id: string, name: string, price: number, owned: boolean) {
    const key = itemId(type, id);
    if (owned) {
      return setDialog({ title: name, message: "You already own this.", actions: [{ label: "Close", onClick: close }, toAvatar] });
    }
    if (data.plyrium < price) {
      return setDialog({
        title: "Insufficient Plyrium",
        message: `You need ${(price - data.plyrium).toLocaleString()} more Plyrium to buy ${name}.`,
        actions: [
          { label: "Cancel", onClick: close },
          { label: "Get Plyrium", primary: true, onClick: () => router.push("/plyrium") },
        ],
      });
    }
    const free = price === 0;
    setDialog({
      title: free ? "Get Item" : "Buy Item",
      message: free ? `Would you like to get ${name} for free?` : `Would you like to buy ${name} for ${price.toLocaleString()} Plyrium?`,
      actions: [
        { label: "Cancel", onClick: close },
        { label: free ? "Get Now" : "Buy Now", primary: true, onClick: () => confirm(key, name, price) },
      ],
    });
  }

  return (
    <>
      <h1 className="h1">Marketplace</h1>
      <p className="muted">Bundles, clothing, hats, faces and body colors for your avatar. Get them here, then wear them in the Avatar editor.</p>

      <h2 className="h2">Bundles</h2>
      <div className="flex flex-wrap gap-3">
        {BUNDLES.filter((b) => !b.starter).map((b) => {
          const owned = ownsBundle(data, b);
          return (
            <ItemCard key={b.id} title={`${b.name} Bundle`} owned={owned} price={b.price} onClick={() => buy("bundle", b.id, `${b.name} Bundle`, b.price, owned)}>
              {b.image && <Image src={b.image} alt="" width={156} height={156} className="h-full w-full object-cover" />}
            </ItemCard>
          );
        })}
      </div>

      <h2 className="h2">Shirts</h2>
      <div className="flex flex-wrap gap-3">
        {SHIRTS.filter((s) => !s.starter).map((s) => {
          const owned = ownsShirt(data, s);
          return (
            <ItemCard key={s.id} title={s.name} owned={owned} price={s.price} onClick={() => buy("shirt", s.id, s.name, s.price, owned)}>
              <Image src={s.image} alt="" width={140} height={140} className="h-[140px] w-[140px] object-contain" />
            </ItemCard>
          );
        })}
      </div>

      <h2 className="h2">Pants</h2>
      <div className="flex flex-wrap gap-3">
        {PANTS.filter((p) => !p.starter).map((p) => {
          const owned = ownsPants(data, p);
          return (
            <ItemCard key={p.id} title={p.name} owned={owned} price={p.price} onClick={() => buy("pants", p.id, p.name, p.price, owned)}>
              <Image src={p.image} alt="" width={140} height={140} className="h-[140px] w-[140px] object-contain" />
            </ItemCard>
          );
        })}
      </div>

      <h2 className="h2">Hats</h2>
      <div className="flex flex-wrap gap-3">
        {HATS.map((h) => {
          const owned = ownsHat(data, h);
          return (
            <ItemCard key={h.id} title={h.name} owned={owned} price={h.price} onClick={() => buy("hat", h.id, h.name, h.price, owned)}>
              <Image src={h.image} alt="" width={140} height={140} className="h-[140px] w-[140px] object-contain" />
            </ItemCard>
          );
        })}
      </div>

      <h2 className="h2">Faces</h2>
      <div className="flex flex-wrap gap-3">
        {FACES.filter((f) => !f.starter).map((f) => {
          const owned = ownsFace(data, f);
          return (
            <ItemCard key={f.id} title={f.name} owned={owned} price={f.price} onClick={() => buy("face", f.id, f.name, f.price, owned)}>
              <Image src={f.image} alt="" width={140} height={140} className="h-[140px] w-[140px] object-contain" />
            </ItemCard>
          );
        })}
      </div>

      <h2 className="h2">Body Colors</h2>
      <div className="flex flex-wrap gap-3">
        {COLORS.filter((c) => c.price > 0).map((c) => {
          const owned = ownsColor(data, c);
          return (
            <ItemCard key={c.id} title={c.name} owned={owned} price={c.price} onClick={() => buy("color", c.id, c.name, c.price, owned)}>
              <div className="h-full w-full" style={{ backgroundColor: c.hex }} />
            </ItemCard>
          );
        })}
      </div>
      <Modal dialog={dialog} onClose={close} />
    </>
  );
}
