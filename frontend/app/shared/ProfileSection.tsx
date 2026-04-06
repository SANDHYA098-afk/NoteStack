'use client';

import { useState, useEffect, useRef } from 'react';
import { getUserEmail } from '../domains/auth/auth';

interface ProfileSectionProps {
  onLogout: () => void;
}

export default function ProfileSection({ onLogout }: ProfileSectionProps) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const email = getUserEmail() || 'student';
  const initial = email.charAt(0).toUpperCase();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  // Random bright color for avatar
  const avatarColors = ['var(--pink)', 'var(--blue)', 'var(--lime)', 'var(--orange)', 'var(--purple)', 'var(--yellow)'];
  const colorIndex = email.charCodeAt(0) % avatarColors.length;
  const avatarColor = avatarColors[colorIndex];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 border-[2.5px] border-[var(--border)] flex items-center justify-center text-lg font-bold transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow)]"
        style={{
          borderRadius: '6px 2px 8px 4px',
          boxShadow: 'var(--shadow-sm)',
          background: avatarColor,
          fontFamily: 'var(--font-hand)',
          color: 'var(--ink)',
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-3 w-[260px] sm:w-[280px] bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-0 overflow-hidden animate-scale-in z-50"
          style={{ borderRadius: '6px 14px 8px 16px', boxShadow: '6px 6px 0px var(--border)' }}
        >
          {/* Header */}
          <div className="p-5 border-b-[2px] border-[var(--border)] bg-[var(--yellow)]/20">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 border-[2px] border-[var(--border)] flex items-center justify-center text-xl font-bold"
                style={{ borderRadius: '4px 8px 2px 10px', background: avatarColor, fontFamily: 'var(--font-hand)' }}
              >
                {initial}
              </div>
              <div>
                <p className="text-lg font-semibold leading-tight" style={{ fontFamily: 'var(--font-hand)' }}>
                  {email.split('@')[0]}
                </p>
                <p className="text-xs" style={{ color: 'var(--ink-light)' }}>{email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-[var(--yellow)]/15 transition-colors"
            >
              <span className="flex items-center gap-3" style={{ fontFamily: 'var(--font-body)', fontSize: '16px' }}>
                <span className="text-xl">{dark ? '🌙' : '☀️'}</span>
                {dark ? 'Dark Mode' : 'Light Mode'}
              </span>
              {/* Toggle Switch */}
              <div
                className="w-12 h-7 border-[2px] border-[var(--border)] relative cursor-pointer transition-colors"
                style={{
                  borderRadius: '4px 8px 2px 6px',
                  background: dark ? 'var(--blue)' : 'var(--border-light)',
                }}
              >
                <div
                  className="absolute top-[2px] w-5 h-5 bg-[var(--bg-card)] border-[2px] border-[var(--border)] transition-all duration-200"
                  style={{
                    borderRadius: '2px 4px 2px 4px',
                    left: dark ? '22px' : '2px',
                  }}
                />
              </div>
            </button>

            {/* Divider */}
            <div className="my-2 border-b-[1.5px] border-dashed border-[var(--border-light)]" />

            {/* Stats */}
            <div className="px-4 py-2">
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ink-light)' }}>Quick Stats</p>
              <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>🗒️ Notes: managed via AWS</p>
              <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>☁️ Storage: S3 Bucket</p>
            </div>

            <div className="my-2 border-b-[1.5px] border-dashed border-[var(--border-light)]" />

            {/* Logout */}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--pink)]/15 transition-colors text-[var(--pink)]"
              style={{ fontFamily: 'var(--font-body)', fontSize: '16px' }}
            >
              <span className="text-xl">👋</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
