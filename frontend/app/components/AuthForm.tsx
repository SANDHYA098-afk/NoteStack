'use client';

import { useState } from 'react';
import { signUp, confirmSignUp, login as authLogin } from '../lib/auth';
import { showToast } from './Toast';
import PasswordInput from './PasswordInput';

type Step = 'login' | 'signup' | 'verify';

interface AuthFormProps {
  onLogin: () => void;
}

export default function AuthForm({ onLogin }: AuthFormProps) {
  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password);
      showToast('Check your email for the code!', 'success');
      setStep('verify'); // Move to inline verify step
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmSignUp(email, code);
      showToast('Verified! Logging you in...', 'success');
      // Auto-login after verification
      await authLogin(email, password);
      onLogin();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authLogin(email, password);
      showToast('Welcome back! ✨', 'success');
      onLogin();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 animate-fade-in relative overflow-hidden">
      {/* Floating doodle decorations — hidden on mobile */}
      <svg className="hidden sm:block absolute top-20 left-16 w-16 h-16 opacity-70 animate-float" viewBox="0 0 100 100" fill="none" stroke="#ff6b9d" strokeWidth="3">
        <circle cx="50" cy="50" r="40" strokeDasharray="8 8" />
        <path d="M35 50 L45 60 L65 40" />
      </svg>
      <svg className="hidden sm:block absolute top-32 right-20 w-12 h-12 opacity-70 animate-float" style={{ animationDelay: '1s' }} viewBox="0 0 50 50" fill="none" stroke="#4ecdc4" strokeWidth="3">
        <path d="M10 25 Q25 5 40 25 Q25 45 10 25Z" />
      </svg>
      <svg className="hidden sm:block absolute bottom-24 left-24 w-20 h-20 opacity-50 animate-float" style={{ animationDelay: '2s' }} viewBox="0 0 80 80" fill="none" stroke="#e6c800" strokeWidth="2.5">
        <path d="M40 10 L50 30 L70 30 L55 45 L60 65 L40 55 L20 65 L25 45 L10 30 L30 30Z" />
      </svg>
      <svg className="hidden sm:block absolute bottom-40 right-16 w-10 h-10 opacity-80 animate-float" style={{ animationDelay: '0.5s' }} viewBox="0 0 40 40" fill="#a8e06c">
        <path d="M20 5 L23 15 L33 15 L25 22 L28 32 L20 26 L12 32 L15 22 L7 15 L17 15Z" />
      </svg>
      <svg className="hidden sm:block absolute top-48 right-1/3 w-8 h-8 opacity-60 animate-float" style={{ animationDelay: '1.5s' }} viewBox="0 0 32 32" fill="#b57bee">
        <circle cx="16" cy="16" r="12" />
      </svg>
      <svg className="hidden sm:block absolute bottom-32 left-1/3 w-6 h-6 opacity-50 animate-float" style={{ animationDelay: '0.8s' }} viewBox="0 0 24 24" fill="#ff8a5c">
        <rect x="4" y="4" width="16" height="16" rx="2" transform="rotate(15 12 12)" />
      </svg>

      {/* Squiggly line decoration */}
      <svg className="hidden sm:block absolute top-1/4 left-0 w-full h-8 opacity-20" viewBox="0 0 800 30" fill="none" stroke="#ff6b9d" strokeWidth="2">
        <path d="M0 15 Q50 0 100 15 Q150 30 200 15 Q250 0 300 15 Q350 30 400 15 Q450 0 500 15 Q550 30 600 15 Q650 0 700 15 Q750 30 800 15" />
      </svg>
      <svg className="hidden sm:block absolute bottom-1/4 left-0 w-full h-8 opacity-15" viewBox="0 0 800 30" fill="none" stroke="#4ecdc4" strokeWidth="2">
        <path d="M0 15 Q50 30 100 15 Q150 0 200 15 Q250 30 300 15 Q350 0 400 15 Q450 30 500 15 Q550 0 600 15 Q650 30 700 15 Q750 0 800 15" />
      </svg>

      <div className="w-full max-w-[460px] animate-fade-up px-2 sm:px-0">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-3 relative">
            <div className="w-16 h-16 bg-[var(--yellow)] border-[2.5px] border-[var(--border)] flex items-center justify-center mx-auto" style={{ borderRadius: '8px 4px 12px 2px', boxShadow: 'var(--shadow)' }}>
              <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M8 4 L8 28" />
                <path d="M8 4 L24 4 Q26 4 26 6 L26 12 Q26 14 24 14 L8 14" />
                <path d="M8 14 L22 14 Q24 14 24 16 L24 26 Q24 28 22 28 L8 28" />
                <path d="M12 9 L22 9" />
                <path d="M12 19 L20 19" />
                <path d="M12 23 L18 23" />
              </svg>
            </div>
            {/* Sparkle */}
            <svg className="absolute -top-2 -right-4 w-6 h-6 text-[var(--pink)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14 9L21 12L14 15L12 22L10 15L3 12L10 9Z" />
            </svg>
          </div>
          <h1 className="text-5xl tracking-tight mb-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700 }}>
            NoteStack
          </h1>
          <p className="text-lg" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-light)' }}>
            notes for students, by students ~
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-8 relative"
          style={{ borderRadius: '8px 16px 6px 20px', boxShadow: '6px 6px 0px var(--border)' }}
        >
          {/* Tape decoration */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[var(--yellow)] border-[1.5px] border-[var(--border)] opacity-80" style={{ borderRadius: '2px', transform: 'translateX(-50%) rotate(-2deg)' }} />

          {step === 'verify' ? (
            /* Inline Verification — appears after signup */
            <form onSubmit={handleVerify} className="animate-fade-up">
              <div className="text-center mb-6">
                <span className="text-4xl">📬</span>
                <h2 className="text-2xl mt-2 mb-1" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>Check your inbox!</h2>
                <p className="text-sm" style={{ color: 'var(--ink-light)' }}>We sent a code to <strong>{email}</strong></p>
              </div>
              <div className="mb-4">
                <label className="block text-sm mb-2 font-medium" style={{ fontFamily: 'var(--font-hand)', fontSize: '18px' }}>Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  required
                  className="doodle-input text-center text-xl tracking-[0.3em]"
                  maxLength={6}
                />
              </div>
              <button disabled={loading} className="btn-doodle btn-primary w-full text-lg">
                {loading ? 'Verifying...' : 'Verify & Login ✨'}
              </button>
              <button type="button" onClick={() => setStep('signup')} className="w-full text-center text-sm mt-4 underline" style={{ color: 'var(--ink-light)' }}>
                Go back
              </button>
            </form>
          ) : (
            <>
              {/* Tabs — only login / signup */}
              <div className="flex gap-2 mb-8">
                {(['login', 'signup'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setStep(t)}
                    className={`flex-1 py-2.5 text-lg border-[2px] border-[var(--border)] transition-all ${
                      step === t
                        ? 'bg-[var(--yellow)] shadow-[var(--shadow-sm)]'
                        : 'bg-[var(--bg-card)] hover:bg-[var(--yellow)]/20'
                    }`}
                    style={{
                      fontFamily: 'var(--font-hand)',
                      fontWeight: 600,
                      borderRadius: t === 'login' ? '6px 2px 4px 8px' : '2px 8px 6px 4px',
                    }}
                  >
                    {t === 'login' ? '🔑 Login' : '✏️ Sign Up'}
                  </button>
                ))}
              </div>

              {/* Login Form */}
              {step === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5 animate-fade-up">
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-hand)', fontSize: '18px', fontWeight: 600 }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required className="doodle-input" />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-hand)', fontSize: '18px', fontWeight: 600 }}>Password</label>
                    <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="your secret password" required />
                  </div>
                  <button disabled={loading} className="btn-doodle btn-primary w-full text-lg">
                    {loading ? 'Signing in...' : 'Let me in! →'}
                  </button>
                </form>
              )}

              {/* Sign Up Form */}
              {step === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-5 animate-fade-up">
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-hand)', fontSize: '18px', fontWeight: 600 }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required className="doodle-input" />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-hand)', fontSize: '18px', fontWeight: 600 }}>Password</label>
                    <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ chars, uppercase, number, symbol" required minLength={8} />
                  </div>
                  <button disabled={loading} className="btn-doodle btn-primary w-full text-lg">
                    {loading ? 'Creating...' : 'Create Account ✨'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--ink-light)' }}>
          ⚡ powered by AWS Lambda, DynamoDB & Cognito
        </p>
      </div>
    </div>
  );
}
