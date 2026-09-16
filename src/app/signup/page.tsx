"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthBox, { Field } from "@/components/AuthBox";
import { useAccount } from "@/lib/account";
import { hasBadWords } from "@/lib/filter";
import { signUp } from "@/lib/playfab";

function problem(username: string, password: string, confirm: string) {
  if (username.length < 3 || username.length > 20) return "Usernames must be 3 to 20 characters.";
  if (!/^[A-Za-z0-9]+$/.test(username)) return "Usernames can only use letters and numbers.";
  if (hasBadWords(username)) return "That username isn't allowed. Please pick another one.";
  if (password.length < 6) return "Passwords must be at least 6 characters.";
  if (password.length > 100) return "Passwords can be at most 100 characters.";
  if (password !== confirm) return "The passwords don't match.";
  return "";
}

export default function SignUpPage() {
  const { refresh } = useAccount();
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "", confirm: "", email: "" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const username = form.username.trim();
    const invalid = problem(username, form.password, form.confirm);
    if (invalid) return setStatus(invalid);
    setBusy(true);
    setStatus("Creating your account...");
    try {
      await signUp(username, form.password, form.email);
      await refresh(); // saves a fresh avatar for the new account
      router.replace("/");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Couldn't create your account.");
      setBusy(false);
    }
  }

  return (
    <AuthBox tab="signup">
      <form onSubmit={submit}>
        <Field label="Username" autoComplete="username" value={form.username} onChange={set("username")} />
        <Field label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
        <Field label="Confirm Password" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />
        <Field label="Email (optional, for password resets)" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
        <p className="mt-2 text-xs text-[#777777]">
          Usernames are 3 to 20 letters and numbers and can&apos;t be changed later. Your display name can.
        </p>
        {status && <p className="mt-2.5 text-[13px] text-[#c42b1c]">{status}</p>}
        <button type="submit" disabled={busy} className="btn btn-play mt-3 h-11 w-full text-xl">
          Sign Up
        </button>
      </form>
    </AuthBox>
  );
}
