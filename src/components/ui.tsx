"use client";

import Image from "next/image";
import { useEffect } from "react";

export type DialogAction = { label: string; onClick: () => void; primary?: boolean };
export type Dialog = { title: string; message: React.ReactNode; actions?: DialogAction[] };

// Classic popup box. With no actions it shows a single Close button.
export function Modal({ dialog, onClose }: { dialog: Dialog | null; onClose: () => void }) {
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, onClose]);

  if (!dialog) return null;
  const actions = dialog.actions ?? [{ label: "Close", onClick: onClose }];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={dialog.title}
        className="w-full max-w-[420px] border border-brand-dark bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand px-3 py-2 text-[15px] font-bold text-white">{dialog.title}</div>
        <div className="muted p-4">{dialog.message}</div>
        <div className="flex justify-end gap-1.5 px-4 pb-4">
          {actions.map((a) => (
            <button key={a.label} className={`btn ${a.primary ? "btn-primary" : ""}`} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Buttons for the "Starting Plyria..." popup. While developing, the link can be copied into the Launcher's
// "Editor Launch Url" field to test in the Unity editor, which can't receive plyria:// links.
export function launchActions(url: string, close: () => void): DialogAction[] {
  const actions: DialogAction[] = [{ label: "Close", onClick: close }];
  if (process.env.NODE_ENV === "development")
    actions.unshift({ label: "Copy Link for Unity Editor", onClick: () => navigator.clipboard.writeText(url) });
  return actions;
}

export function PriceTag({ amount }: { amount: number }) {
  if (amount === 0) return <span className="text-sm font-bold text-money">Free</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-bold text-money">
      <Image src="/images/plyrium.png" alt="Plyrium" width={16} height={16} />
      {amount.toLocaleString()}
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-2 w-[170px]">
      <div className="text-xs text-[#777777]">{label}</div>
      <div className="text-base font-bold">{value}</div>
    </div>
  );
}

export function formatDate(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "--";
}

export function whenText(iso?: string) {
  if (!iso) return "--";
  const then = new Date(iso);
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(then).setHours(0, 0, 0, 0)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function Rating({ liked, disliked }: { liked: boolean; disliked: boolean }) {
  return <>{liked ? "100%" : disliked ? "0%" : "--"}</>;
}
