"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";

export function SignInDialog() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      setOpen(false);
      navigate({ to: "/circles" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  const handleSignUpClick = () => {
    setOpen(false);
    navigate({ to: "/login" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Sign in</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} name="email" type="email" placeholder="you@example.com" required />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} name="password" type="password" placeholder="Password" required />
          <div className="text-sm">
            Don&apos;t have an account?{' '}
            <button type="button" className="text-primary underline" onClick={handleSignUpClick}>
              Sign up
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SignInDialog;
