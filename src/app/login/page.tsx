"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthBox, { Field } from "@/components/AuthBox";
import { useAccount } from "@/lib/account";
import { logIn } from "@/lib/playfab";

export default function LoginPage() {
  const { refresh } = useAccount();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return setStatus("Enter your username and password.");
    setBusy(true);
    setStatus("Logging in...");
    try {
      await logIn(username.trim(), password);
      await refresh();
      router.replace("/");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Couldn't log in.");
      setBusy(false);
    }
  }

  return (
    <AuthBox tab="login">
      <form onSubmit={submit}>
        <Field label="Username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {status && <p className="mt-2.5 text-[13px] text-[#c42b1c]">{status}</p>}
        <button type="submit" disabled={busy} className="btn btn-play mt-3 h-11 w-full text-xl">
          Log In
        </button>
      </form>
      <div className="mt-2 text-center">
        <Link href="/forgot" className="text-[13px] text-link hover:underline">
          Forgot password?
        </Link>
      </div>
      <div className="mt-3 border-t border-[#eee6f7] pt-3 text-center">
        <Link href="/download" className="text-[13px] font-bold text-link hover:underline">
          Download Plyria for Windows
        </Link>
      </div>
    </AuthBox>
  );
}
