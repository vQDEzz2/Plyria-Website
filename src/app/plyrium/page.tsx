import Image from "next/image";
import Link from "next/link";

const PACKAGES = [400, 800, 1700, 4500, 10000];

export default function PlyriumPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="h1">Get Plyrium</h1>
        <Link href="/earn" className="btn btn-primary">
          Earn Plyrium
        </Link>
      </div>
      {/* ponytail: Plyrium can't be sold yet. Add real payments (a store with receipts PlayFab can validate) first. */}
      <p className="muted">Plyrium is the currency of Plyria. Buying Plyrium isn&apos;t available yet. New accounts start with 1,000. Until then, earn
        Plyrium free with <Link href="/earn" className="font-bold text-link hover:underline">daily and weekly quests</Link>.</p>
      <div className="mt-2.5 flex flex-wrap gap-3">
        {PACKAGES.map((amount) => (
          <div key={amount} className="flex w-[190px] flex-col items-center border border-[#cccccc] bg-[#f5f5f5] px-2.5 py-4">
            <Image src="/images/plyrium.png" alt="" width={64} height={64} className="mb-2" />
            <div className="mb-2.5 text-[22px] font-bold text-money">{amount.toLocaleString()}</div>
            <button className="btn" disabled>
              Coming Soon
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
