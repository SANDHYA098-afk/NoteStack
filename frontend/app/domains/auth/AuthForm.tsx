'use client';

import { useState } from 'react';
import { signUp, confirmSignUp, login as authLogin } from './auth';
import { showToast } from '../../shared/Toast';
import PasswordInput from '../../shared/PasswordInput';

type Step = 'login' | 'signup' | 'verify';

export default function AuthForm({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await signUp(email, password); showToast('Check your email for the code!', 'success'); setStep('verify'); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); } finally { setLoading(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await confirmSignUp(email, code); showToast('Verified! Logging you in...', 'success'); await authLogin(email, password); onLogin(); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); } finally { setLoading(false); }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await authLogin(email, password); onLogin(); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row animate-fade-in relative overflow-hidden">
      {/* Left — Illustration + branding */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-10 lg:py-0 lg:w-[45%] xl:w-[50%]" style={{ background: 'var(--bg)' }}>
        <div className="w-40 h-40 sm:w-56 sm:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 animate-fade-up">
          <div className="animate-float">
            <img src="/book2.png" alt="NoteStack" className="w-full h-full object-contain drop-shadow-xl dark-hidden" />
            <img src="/bookimg.png" alt="NoteStack" className="w-full h-full object-contain drop-shadow-xl hidden dark-visible" />
          </div>
        </div>
        <div className="text-center mt-4 lg:mt-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-2" style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, color: 'var(--ink)' }}>
            <span style={{ color: 'var(--accent)' }}>Note</span><span>Stack</span>
          </h1>
          <p className="text-base" style={{ color: 'var(--ink-light)' }}>For students, by students</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8 lg:py-12" style={{ background: 'var(--bg-card)' }}>
        <div className="w-full max-w-[440px] animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--ink)' }}>
              {step === 'verify' ? 'Almost there!' : step === 'signup' ? 'Join NoteStack' : 'Welcome back'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--ink-light)' }}>
              {step === 'verify' ? `Enter the code we sent to ${email}` : step === 'signup' ? 'Create your account to start sharing' : 'Sign in to continue'}
            </p>
          </div>

          {step === 'verify' ? (
            <form onSubmit={handleVerify} className="animate-fade-up space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Verification Code</label>
                <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Enter 6-digit code" required className="doodle-input text-center text-xl tracking-[0.3em]" maxLength={6} />
              </div>
              <button disabled={loading} className="btn-doodle btn-primary w-full text-lg">{loading ? 'Verifying...' : 'Verify & Login'}</button>
              <button type="button" onClick={() => setStep('signup')} className="w-full text-center text-sm underline" style={{ color: 'var(--ink-light)' }}>Go back</button>
            </form>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                {(['login', 'signup'] as const).map(t => (
                  <button key={t} onClick={() => setStep(t)}
                    className={`flex-1 py-2.5 text-base border-[2.5px] border-[var(--border)] transition-all ${
                      step === t ? 'bg-[var(--accent-light)] shadow-[var(--shadow-sm)]' : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]'
                    }`}
                    style={{ fontWeight: 600, color: 'var(--ink)', borderRadius: t === 'login' ? '8px 2px 4px 10px' : '2px 10px 8px 4px' }}>
                    {t === 'login' ? 'Login' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {step === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5 animate-fade-up">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required className="doodle-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Password</label>
                    <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="your secret password" required />
                  </div>
                  <button disabled={loading} className="btn-doodle btn-primary w-full text-lg">{loading ? 'Signing in...' : 'Login'}</button>
                </form>
              )}

              {step === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-5 animate-fade-up">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required className="doodle-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Password</label>
                    <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ chars, uppercase, number, symbol" required minLength={8} />
                  </div>
                  <button disabled={loading} className="btn-doodle btn-primary w-full text-lg">{loading ? 'Creating...' : 'Create Account'}</button>
                </form>
              )}

              <p className="text-center text-xs mt-6" style={{ color: 'var(--ink-muted)' }}>For students, By students</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
