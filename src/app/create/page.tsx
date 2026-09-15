"use client";

import { useState } from "react";
import { usePlayer } from "@/lib/account";
import { launchUrl } from "@/lib/launch";
import { Modal, launchActions, type Dialog } from "@/components/ui";

export default function CreatePage() {
  const { session } = usePlayer();
  const [dialog, setDialog] = useState<Dialog | null>(null);

  function openStudio() {
    const url = launchUrl(session, "studio");
    window.location.assign(url);
    setDialog({
      title: "Opening Plyria Studio...",
      message: "Plyria Studio should open in a moment. If nothing happens, install Plyria and run it once, then try again.",
      actions: launchActions(url, () => setDialog(null)),
    });
  }

  return (
    <>
      <h1 className="h1">Create</h1>
      <p className="muted">
        Build your own games in Plyria Studio. Save while you work, then publish them. Studio lists the games you&apos;ve made
        on this computer.
      </p>
      <button className="btn btn-primary mt-3" onClick={openStudio}>
        Open Plyria Studio
      </button>
      <Modal dialog={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
