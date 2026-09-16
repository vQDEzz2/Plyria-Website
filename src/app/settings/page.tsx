"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal, formatDate, type Dialog } from "@/components/ui";
import { usePlayer } from "@/lib/account";
import { hasBadWords } from "@/lib/filter";
import { packText, sendPasswordReset, setDisplayName, updateUserData } from "@/lib/playfab";

type Status = { text: string; error: boolean };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="w-[150px] text-sm font-bold text-[#444444]">{label}</span>
      {children}
    </div>
  );
}

function StatusText({ status }: { status: Status }) {
  return status.text ? <span className={`text-[13px] ${status.error ? "text-[#c42b1c]" : "text-money"}`}>{status.text}</span> : null;
}

export default function SettingsPage() {
  const account = usePlayer();
  const router = useRouter();
  const [name, setName] = useState(account.displayName);
  const [nameStatus, setNameStatus] = useState<Status>({ text: "", error: false });
  const [resetStatus, setResetStatus] = useState<Status>({ text: "", error: false });
  const [blurb, setBlurb] = useState(account.blurb);
  const [blurbStatus, setBlurbStatus] = useState<Status>({ text: "", error: false });
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const email = account.info?.PrivateInfo?.Email;

  const run = async (setStatus: (s: Status) => void, work: () => Promise<string>) => {
    setStatus({ text: "Saving...", error: false });
    try {
      setStatus({ text: await work(), error: false });
    } catch (e) {
      setStatus({ text: e instanceof Error ? e.message : String(e), error: true });
    }
  };

  const saveName = () =>
    run(setNameStatus, async () => {
      const trimmed = name.trim();
      if (trimmed.length < 3 || trimmed.length > 25) throw new Error("Display names must be 3 to 25 characters.");
      if (hasBadWords(trimmed)) throw new Error("That display name isn't allowed. Please pick another one.");
      const saved = await setDisplayName(trimmed);
      account.setDisplayName(saved);
      await account.save({ ...account.data, username: saved });
      return "Saved.";
    });

  const saveBlurb = () =>
    run(setBlurbStatus, async () => {
      const text = blurb.trim().slice(0, 1000);
      if (hasBadWords(text)) throw new Error("Take the blocked words out of your About first.");
      await (text ? updateUserData({ Blurb: packText(text) }) : updateUserData({}, ["Blurb"]));
      account.setBlurb(text);
      return "Saved.";
    });

  return (
    <>
      <h1 className="h1">Settings</h1>

      <h2 className="h2">Account Info</h2>
      <Row label="Username">
        <span className="text-sm">{account.info?.Username}</span>
      </Row>
      <Row label="User ID">
        <input className="field max-w-[260px]" readOnly value={account.userId} title="Friends can add you with this number." />
      </Row>
      <Row label="Joined">
        <span className="text-sm">{formatDate(account.info?.Created)}</span>
      </Row>
      <Row label="Display Name">
        <input className="field max-w-[260px]" maxLength={25} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" onClick={saveName}>
          Save
        </button>
        <StatusText status={nameStatus} />
      </Row>
      <Row label="Email">
        <span className="text-sm">{email || "None"}</span>
        {email && (
          <button
            className="btn"
            onClick={() =>
              run(setResetStatus, async () => {
                await sendPasswordReset(email);
                return "Password reset email sent.";
              })
            }
          >
            Send Password Reset Email
          </button>
        )}
        <StatusText status={resetStatus} />
      </Row>

      <h2 className="h2">About Me</h2>
      <p className="muted">Shown on your profile. Up to 1000 characters.</p>
      <textarea className="field mt-1 min-h-[90px]" maxLength={1000} value={blurb} onChange={(e) => setBlurb(e.target.value)} />
      <div className="mt-2 flex items-center gap-2">
        <button className="btn btn-primary" onClick={saveBlurb}>
          Save About Me
        </button>
        <StatusText status={blurbStatus} />
      </div>

      <h2 className="h2">Game Settings</h2>
      <p className="muted">Graphics quality and volume are in the game&apos;s menu (Esc, then Settings).</p>

      <h2 className="h2">Log Out</h2>
      <button
        className="btn"
        onClick={() =>
          setDialog({
            title: "Log Out",
            message: `Log out of ${account.info?.Username} on this browser?`,
            actions: [
              { label: "Cancel", onClick: () => setDialog(null) },
              {
                label: "Log Out",
                primary: true,
                onClick: () => {
                  account.logOut();
                  router.replace("/login");
                },
              },
            ],
          })
        }
      >
        Log Out
      </button>
      <Modal dialog={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
