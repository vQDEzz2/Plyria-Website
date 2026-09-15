import Image from "next/image";
import Link from "next/link";

// White login box on the blue background, with Log In / Sign Up tabs.
export default function AuthBox({ tab, children }: { tab?: "login" | "signup"; children: React.ReactNode }) {
  const tabClass = (on: boolean) =>
    `flex-1 py-2 text-center text-[15px] font-bold transition-colors duration-150 ${on ? "border-b-[3px] border-brand text-brand" : "text-[#777777] hover:text-brand"}`;
  return (
    <div className="w-full max-w-[420px] animate-drop-in rounded border border-brand-dark bg-white px-6 py-5 shadow-[0_24px_60px_-20px_rgb(27_6_54/0.8)]">
      {/* title.png is 1983x793, so 200x80 keeps its shape */}
      <Image src="/images/title.png" alt="Plyria" width={200} height={80} priority className="mx-auto mb-2.5" />
      {tab && (
        <div className="mb-3 flex border-b border-[#cccccc]">
          <Link href="/login" className={tabClass(tab === "login")}>
            Log In
          </Link>
          <Link href="/signup" className={tabClass(tab === "signup")}>
            Sign Up
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mt-2 block text-[13px] font-bold text-[#444444]">
      {label}
      <input className="field mt-0.5 font-normal" {...props} />
    </label>
  );
}
