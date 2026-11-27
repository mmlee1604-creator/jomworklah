"use client";

import { useState } from "react";
import { getSupabaseClient } from "../lib/supabase";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const supabase = getSupabaseClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!supabase || busy) return;

    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    try {
      if (isSignup) {
        const name = String(form.get("name") || "").trim();
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/candidate`,
          },
        });
        if (authError) throw authError;
        if (data.session) {
          window.location.assign("/candidate");
          return;
        }
        setMessage("Check your email to confirm your account, then sign in to continue.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        window.location.assign("/candidate");
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Could not authenticate. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-page content-width">
      <a className="button button-plain" href="/candidate">← Back to JomWorkLah</a>
      <section className="panel account-card" aria-labelledby="account-title">
        <p className="eyebrow"><span className="orange-dot" />Candidate account</p>
        <h1 id="account-title">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="lede">
          {isSignup
            ? "Save your career profile, skills and roadmap in your own workspace."
            : "Sign in to continue to your saved candidate workspace."}
        </p>
        {!supabase ? (
          <p className="error" role="alert">
            Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY in the frontend deployment.
          </p>
        ) : (
          <form className="account-form" onSubmit={submit}>
            {isSignup && (
              <label className="field">
                <span>Full name</span>
                <input name="name" autoComplete="name" maxLength={70} required />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={8}
                required
              />
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            {message && <p className="account-message" role="status">{message}</p>}
            <button className="button button-primary" type="submit" disabled={busy}>
              {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>
        )}
        <p className="account-switch">
          {isSignup ? "Already have an account?" : "New to JomWorkLah?"}{" "}
          <a href={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Sign in" : "Create an account"}
          </a>
        </p>
      </section>
    </main>
  );
}
