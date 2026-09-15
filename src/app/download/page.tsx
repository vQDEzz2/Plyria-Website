import Image from "next/image";
import Link from "next/link";

// The installer is PlyriaSetup.exe attached to the newest GitHub release of this repo; "latest/download"
// always points at it, so a new release needs no website change. NEXT_PUBLIC_DOWNLOAD_URL can override it.
const DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_DOWNLOAD_URL || "https://github.com/vQDEzz2/Plyria-Website/releases/latest/download/PlyriaSetup.exe";

const STEPS = [
  { title: "Download", text: "Click the button above to get PlyriaSetup.exe." },
  {
    title: "Install",
    text: "Run PlyriaSetup.exe. If Windows SmartScreen warns you, choose More info, then Run anyway. The installer asks for administrator rights once, to set up Easy Anti-Cheat.",
  },
  { title: "Play", text: "Come back to the website, open a game and press Play. Plyria starts by itself." },
];

export default function DownloadPage() {
  return (
    <div className="w-full max-w-[760px]">
      <div className="content-box">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <Image src="/images/logo.png" alt="" width={120} height={120} priority className="animate-drop-in" />
          <div className="flex-1">
            <h1 className="h1">Download Plyria</h1>
            <p className="muted">Play every Plyria game and build your own in Plyria Studio. Free for Windows 10 and 11 (64-bit).</p>
            {DOWNLOAD_URL ? (
              <a href={DOWNLOAD_URL} className="btn btn-play mt-3 h-[60px] w-full max-w-[320px] text-2xl">
                Download for Windows
              </a>
            ) : (
              <button className="btn mt-3 h-[60px] w-full max-w-[320px] text-xl" disabled>
                Download coming soon
              </button>
            )}
          </div>
        </div>

        <h2 className="h2">How to install</h2>
        <ol className="stagger grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-[3px] border border-[#d3c9e0] bg-[#faf7fd] p-3">
              <div className="mb-1 flex items-center gap-2 font-bold text-[#2a1845]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-sm text-white">{i + 1}</span>
                {step.title}
              </div>
              <p className="muted">{step.text}</p>
            </li>
          ))}
        </ol>

        <h2 className="h2">Requirements</h2>
        <ul className="muted list-inside list-disc space-y-0.5">
          <li>Windows 10 or 11, 64-bit</li>
          <li>A graphics card with DirectX 12 or 11</li>
          <li>About 1 GB of free space and an internet connection</li>
        </ul>

        <p className="muted mt-4">
          <Link href="/" className="link">
            Back to Plyria
          </Link>
        </p>
      </div>
    </div>
  );
}
