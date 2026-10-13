import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { api as db } from '@/lib/api';
import { Button } from '@/components/ui/button';
import boutique from '@/assets/boutique.jpg';
import dcLogo from '@/assets/dc-logo.jpg';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [
    { title: 'Reset Password | Deluxe Culture' },
    { name: 'description', content: 'Set a new password for your Deluxe Culture administrator account.' },
    { property: 'og:title', content: 'Deluxe Culture | Password Recovery' },
    { property: 'og:description', content: 'Secure password recovery for Deluxe Culture administrators.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'referrer', content: 'no-referrer' },
  ] }),
  component: Reset,
});

function Reset() {
  const [recovery, setRecovery] = useState<{email: string; token: string} | null>(null);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email')?.trim();
    const token = params.get('token');
    if (email && token && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && /^[a-f0-9]{64}$/i.test(token)) setRecovery({email, token});
    setReady(true);
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!recovery || busy) return;
    setError('');
    if (password.length < 10) { setError('Use at least 10 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const result = await db.auth.resetPassword({...recovery, newPassword: password});
      if (result.error) throw new Error(result.error.message);
      setSuccess(true);
      setPassword(''); setConfirm(''); setRecovery(null);
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not reset your password. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-scene">
    <img className="auth-photo" src={boutique} width={1536} height={1024} alt="Deluxe Culture menswear boutique" />
    <div className="auth-shade" />
    <div className="auth-content">
      <div className="text-center mb-9">
        <img src={dcLogo} width={1024} height={1024} alt="DC — Deluxe Culture logo" className="mx-auto mb-3 h-16 w-16 object-contain" />
        <div className="brand-type text-primary text-4xl font-semibold">DELUXE CULTURE</div>
      </div>
      <section className="auth-panel">
        <div className="flex items-center gap-2 text-primary text-xs mb-5"><LockKeyhole size={14} /> ACCOUNT RECOVERY</div>
        <h1 className="text-2xl font-semibold">{success ? 'Password updated' : 'Set a new password'}</h1>
        {!ready ? <p role="status" className="text-muted-foreground text-sm mt-5">Checking your link…</p> : success ? <div className="mt-6">
          <CheckCircle2 className="text-primary mb-4" size={32} />
          <p role="status" className="text-sm text-muted-foreground">Your password has been changed. Sign in with your new password.</p>
        </div> : recovery ? <form onSubmit={submit} className="space-y-5 mt-6" aria-busy={busy}>
          <p className="text-muted-foreground text-sm">Use at least 10 characters. Reset links expire after 15 minutes.</p>
          <label className="field-label">New password<div className="relative">
            <input className="field pr-12" type={show ? 'text' : 'password'} minLength={10} required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</Button>
          </div></label>
          <label className="field-label">Confirm new password<input className="field" type={show ? 'text' : 'password'} minLength={10} required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={busy} /></label>
          {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
          <Button disabled={busy} className="w-full h-11">{busy ? 'Updating…' : 'Update password'}<ArrowRight /></Button>
        </form> : <p role="alert" className="text-muted-foreground text-sm mt-6">This reset link is incomplete or invalid. Request a new link from the sign-in page.</p>}
        <Button variant={success ? 'default' : 'link'} className="w-full mt-6" asChild><Link to="/">{success ? 'Sign in' : 'Back to sign in'}</Link></Button>
      </section>
    </div>
  </main>;
}
