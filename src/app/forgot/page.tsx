"use client";

import Link from "next/link";
import { useState } from "react";
import AuthBox, { Field } from "@/components/AuthBox";
import { sendPasswordReset } from "@/lib/playfab";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ text: "", error: false });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setStatus({ text: "Enter the email address on the account.", error: true });
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setStatus({ text: "Check your email for the reset link.", error: false });
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : "Couldn't send the email.", error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthBox>
      <h1 className="text-lg font-bold">Forgot Password</h1>
      <p className="mt-1 text-xs text-[#777777]">Enter the email on your account and we&apos;ll send you a link to reset your password.</p>
      <form onSubmit={submit}>
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {status.text && <p className={`mt-2.5 text-[13px] ${status.error ? "text-[#c42b1c]" : "text-money"}`}>{status.text}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary mt-3 h-11 w-full text-lg">
          Send Reset Email
        </button>
      </form>
      <div className="mt-2 text-center">
        <Link href="/login" className="text-[13px] text-link hover:underline">
          Back to Log In
        </Link>
      </div>
    </AuthBox>
  );
}
