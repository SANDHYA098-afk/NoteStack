'use client';

import { useState } from 'react';
import { signUp, confirmSignUp, login as authLogin } from './auth';
import { showToast } from '../../shared/Toast';
import PasswordInput from '../../shared/PasswordInput';
import { IconNotes } from '../../shared/icons/Icons';

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
      setStep('verify');
    } catch (err: unknown) { showToast((err as Error).message, 'error'); }
    finally { setLoading(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmSignUp(email, code);
      showToast('Verified! Logging you in...', 'success');
      await authLogin(email, password);
      onLogin();
    } catch (err: unknown) { showToast((err as Error).message, 'error'); }
    finally { setLoading(false); }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authLogin(email, password);
      onLogin();
    } catch (err: unknown) { showToast((err as Error).message, 'error'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row animate-fade-in relative overflow-hidden">
      {/* Floating doodles — visible on ALL screen sizes */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <svg className="absolute top-6 right-6 w-10 h-10 sm:w-12 sm:h-12 animate-float" style={{ opacity: 0.2 }} viewBox="0 0 50 50" fill="none" stroke="#7bc043" strokeWidth="2.5">
          <path d="M25 5 L28 18 L42 18 L31 27 L35 40 L25 32 L15 40 L19 27 L8 18 L22 18Z" />
        </svg>
        <svg className="absolute top-20 left-4 sm:left-8 w-8 h-8 animate-float" style={{ opacity: 0.25, animationDelay: '1s' }} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="#4ecdc4" />
        </svg>
        <svg className="absolute bottom-32 right-8 w-14 h-14 sm:w-16 sm:h-16 animate-float" style={{ opacity: 0.12, animationDelay: '1.5s' }} viewBox="0 0 60 60" fill="none" stroke="#4ecdc4" strokeWidth="2.5" strokeDasharray="6 6">
          <circle cx="30" cy="30" r="24" />
        </svg>
        <svg className="absolute bottom-20 left-6 w-8 h-8 animate-float" style={{ opacity: 0.2, animationDelay: '2s' }} viewBox="0 0 40 40">
          <rect x="8" y="8" width="24" height="24" rx="3" fill="#ffe156" fillOpacity="0.5" stroke="#e6c800" strokeWidth="2" transform="rotate(15 20 20)" />
        </svg>
        <svg className="absolute top-1/2 right-4 w-5 h-5 animate-float" style={{ opacity: 0.3, animationDelay: '0.5s' }} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7" fill="#5a9e2f" />
        </svg>
        <svg className="absolute top-[35%] left-[15%] w-6 h-6 animate-float" style={{ opacity: 0.15, animationDelay: '2.5s' }} viewBox="0 0 24 24" fill="none" stroke="#ff8a5c" strokeWidth="3" strokeLinecap="round">
          <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
        </svg>
        {/* Wavy line */}
        <svg className="absolute top-[15%] left-0 w-full h-6" style={{ opacity: 0.06 }} viewBox="0 0 800 20" fill="none" stroke="#7bc043" strokeWidth="2">
          <path d="M0 10 Q50 0 100 10 Q150 20 200 10 Q250 0 300 10 Q350 20 400 10 Q450 0 500 10 Q550 20 600 10 Q650 0 700 10 Q750 20 800 10" />
        </svg>
        <svg className="absolute bottom-[12%] left-0 w-full h-6" style={{ opacity: 0.05 }} viewBox="0 0 800 20" fill="none" stroke="#4ecdc4" strokeWidth="2">
          <path d="M0 10 Q50 20 100 10 Q150 0 200 10 Q250 20 300 10 Q350 0 400 10 Q450 20 500 10 Q550 0 600 10 Q650 20 700 10 Q750 0 800 10" />
        </svg>
      </div>

      {/* Top section on mobile / Left side on desktop — Branding + Illustration */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-10 lg:py-0 lg:w-[45%] xl:w-[50%]" style={{ background: 'var(--bg)' }}>
        {/* Illustration */}
        <div className="w-40 h-40 sm:w-56 sm:h-56 lg:w-72 lg:h-72 xl:w-96 xl:h-96 animate-fade-up">
          <img src="/book2.png" alt="NoteStack" className="w-full h-full object-contain drop-shadow-xl dark-hidden" />
          <img src="/bookimg.png" alt="NoteStack" className="w-full h-full object-contain drop-shadow-xl hidden dark-visible" />
        </div>

        {/* Branding */}
        <div className="text-center mt-4 lg:mt-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700 }}>
            <span style={{ color: 'var(--accent)' }}>Note</span><span style={{ color: 'var(--ink)' }}>Stack</span>
          </h1>
          <p className="text-base sm:text-lg max-w-sm mx-auto" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-light)' }}>
            Share notes, discover knowledge, learn together.
          </p>
        </div>
      </div>

      {/* Bottom section on mobile / Right side on desktop — Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8 lg:py-12" style={{ background: 'var(--bg-card)' }}>
        <div className="w-full max-w-[420px] animate-fade-up" style={{ animationDelay: '0.2s' }}>
          {/* Context heading */}
          <div className="mb-6">
            <h2 className="text-3xl sm:text-4xl mb-1" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, color: 'var(--ink)' }}>
              {step === 'verify' ? 'Almost there!' : step === 'signup' ? 'Join NoteStack' : 'Welcome back'}
            </h2>
            <p className="text-sm sm:text-base" style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-body)' }}>
              {step === 'verify' ? `Enter the code we sent to ${email}` : step === 'signup' ? 'Create your account to start sharing' : 'Sign in to continue'}
            </p>
          </div>

          {step === 'verify' ? (
            <form onSubmit={handleVerify} className="animate-fade-up space-y-5">
              <div>
                <label className="block mb-2" style={{ fontFamily: 'var(--font-hand)', fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>Verification Code</label>
                <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Enter 6-digit code" required className="doodle-input text-center text-xl tracking-[0.3em]" maxLength={6} />
              </div>
              <button disabled={loading} className="btn-doodle btn-primary w-full text-lg">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button type="button" onClick={() => setStep('signup')} className="w-full text-center text-sm underline" style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-body)' }}>
                Go back
              </button>
            </form>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                {(['login', 'signup'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setStep(t)}
                    className={`flex-1 py-3 text-lg border-[2.5px] border-[var(--border)] transition-all active:translate-y-[1px] active:shadow-none ${
                      step === t
                        ? 'bg-[var(--accent-light)] shadow-[var(--shadow-sm)] border-[var(--accent)] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-[var(--bg)] hover:bg-[var(--accent-light)]'
                    }`}
                    style={{
                      fontFamily: 'var(--font-hand)', fontWeight: 600, color: 'var(--ink)',
                      borderRadius: t === 'login' ? '8px 2px 4px 10px' : '2px 10px 8px 4px',
                    }}
                  >
                    {t === 'login' ? 'Login' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {step === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5 animate-fade-up">
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-hand)', fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required className="doodle-input" />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-hand)', fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>Password</label>
                    <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="your secret password" required />
                  </div>
                  <button disabled={loading} className="btn-doodle btn-primary w-full text-lg">
                    {loading ? 'Signing in...' : 'Login'}
                  </button>
                </form>
              )}

              {step === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-5 animate-fade-up">
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-hand)', fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required className="doodle-input" />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-hand)', fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>Password</label>
                    <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ chars, uppercase, number, symbol" required minLength={8} />
                  </div>
                  <button disabled={loading} className="btn-doodle btn-primary w-full text-lg">
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </form>
              )}

              <p className="text-center text-xs mt-6" style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-body)' }}>
                For students, By students
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
