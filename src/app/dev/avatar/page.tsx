"use client";

import { useState } from "react";
import Avatar3D from "@/components/Avatar3D";
import { BODY_PARTS, BUNDLES, COLORS, FACES, HATS, PANTS, SHIRTS, hexToRgba, normalizePlayerData } from "@/lib/catalog";

// Development only (hidden in production by SiteShell): checks the exported 3D models without logging in.
export default function DevAvatarPage() {
  const [bundle, setBundle] = useState(BUNDLES[0].id);
  const [face, setFace] = useState(FACES[0].id);
  const [hat, setHat] = useState(HATS[0]?.id ?? "");
  const [shirt, setShirt] = useState(SHIRTS[0]?.id ?? "");
  const [pants, setPants] = useState(PANTS[0]?.id ?? "");
  const data = normalizePlayerData({
    face,
    hat,
    shirt,
    pants,
    bodyPartBundles: BODY_PARTS.map(() => bundle),
    bodyColors: [COLORS[7], COLORS[11], COLORS[7], COLORS[7], COLORS[9], COLORS[9]].map((c) => hexToRgba(c.hex)),
  });

  return (
    <div className="brand-backdrop flex min-h-screen items-center justify-center px-4 py-8">
    <div className="animate-drop-in rounded border border-brand-dark bg-white p-4">
      <h1 className="text-lg font-bold">3D avatar model check</h1>
      <div className="my-2 flex flex-wrap gap-2 text-sm">
        <select className="field w-auto" value={bundle} onChange={(e) => setBundle(e.target.value)}>
          {BUNDLES.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select className="field w-auto" value={face} onChange={(e) => setFace(e.target.value)}>
          {FACES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select className="field w-auto" value={hat} onChange={(e) => setHat(e.target.value)}>
          <option value="">No hat</option>
          {HATS.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <select className="field w-auto" value={shirt} onChange={(e) => setShirt(e.target.value)}>
          <option value="">No shirt</option>
          {SHIRTS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select className="field w-auto" value={pants} onChange={(e) => setPants(e.target.value)}>
          <option value="">No pants</option>
          {PANTS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="border border-[#999999]">
        <Avatar3D data={data} width={320} height={420} />
      </div>
    </div>
    </div>
  );
}
