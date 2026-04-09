'use client';

import { useState, useEffect } from 'react';
import { getUserEmail } from '../auth/auth';
import { IconSun, IconMoon, IconUser, IconBell, IconFile } from '../../shared/icons/Icons';

export default function Settings() {
  const [dark, setDark] = useState(false);
  const email = getUserEmail() || '';

  useEffect(() => { setDark(document.documentElement.getAttribute('data-theme') === 'dark'); }, []);

  function toggleTheme() {
    const next = !dark; setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 animate-fade-up">Settings</h1>
      <p className="text-sm text-[var(--ink-muted)] mb-6 animate-fade-up">Manage your account and preferences</p>

      <div className="space-y-3 max-w-2xl">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 animate-fade-up" style={{ borderRadius: 'var(--radius)', animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2.5 mb-3"><IconUser size={18} className="text-[var(--ink-muted)]" /><h2 className="text-base font-semibold">Account</h2></div>
          <div className="space-y-2 text-sm">
            <div><span className="text-[var(--ink-muted)]">Email:</span> <span>{email}</span></div>
            <div><span className="text-[var(--ink-muted)]">Auth:</span> <span>Amazon Cognito</span></div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 animate-fade-up" style={{ borderRadius: 'var(--radius)', animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2.5 mb-3">{dark ? <IconMoon size={18} className="text-[var(--ink-muted)]" /> : <IconSun size={18} className="text-[var(--ink-muted)]" />}<h2 className="text-base font-semibold">Appearance</h2></div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Dark Mode</p><p className="text-xs text-[var(--ink-muted)]">Switch between light and dark</p></div>
            <button onClick={toggleTheme} className="w-11 h-6 rounded-full relative transition-colors" style={{ background: dark ? 'var(--accent)' : 'var(--border)' }}>
              <div className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm" style={{ left: dark ? '24px' : '4px' }} />
            </button>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 animate-fade-up" style={{ borderRadius: 'var(--radius)', animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2.5 mb-3"><IconBell size={18} className="text-[var(--ink-muted)]" /><h2 className="text-base font-semibold">Notifications</h2></div>
          <p className="text-sm text-[var(--ink-muted)]">In-app notifications are enabled. Polls every 30 seconds.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 animate-fade-up" style={{ borderRadius: 'var(--radius)', animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2.5 mb-3"><IconFile size={18} className="text-[var(--ink-muted)]" /><h2 className="text-base font-semibold">Storage</h2></div>
          <div className="space-y-1 text-sm text-[var(--ink-muted)]">
            <p>File Storage: Amazon S3</p><p>Allowed: PDF, PNG, JPG, JPEG</p><p>Auto-delete: 30 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
