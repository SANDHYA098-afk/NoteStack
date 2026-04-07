'use client';

import { useState, useEffect } from 'react';
import { getUserEmail } from '../auth/auth';
import { IconSun, IconMoon, IconUser, IconBell, IconFile } from '../../shared/icons/Icons';

export default function Settings() {
  const [dark, setDark] = useState(false);
  const email = getUserEmail() || '';

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <div>
      <h1 className="text-4xl mb-2 animate-fade-up" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700 }}>Settings</h1>
      <p className="text-base mb-8 animate-fade-up" style={{ color: 'var(--ink-light)', animationDelay: '0.05s' }}>Manage your account and preferences</p>

      <div className="space-y-4 max-w-2xl">
        {/* Account */}
        <div
          className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-6 animate-fade-up"
          style={{ borderRadius: '8px 14px 6px 16px', boxShadow: 'var(--shadow)', animationDelay: '0.1s' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <IconUser size={20} />
            <h2 className="text-xl" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>Account</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-body)' }}>Email</label>
              <p className="text-base" style={{ fontFamily: 'var(--font-body)' }}>{email}</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-body)' }}>Auth Provider</label>
              <p className="text-base" style={{ fontFamily: 'var(--font-body)' }}>Amazon Cognito</p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div
          className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-6 animate-fade-up"
          style={{ borderRadius: '6px 16px 8px 14px', boxShadow: 'var(--shadow)', animationDelay: '0.15s' }}
        >
          <div className="flex items-center gap-3 mb-4">
            {dark ? <IconMoon size={20} /> : <IconSun size={20} />}
            <h2 className="text-xl" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>Appearance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-medium" style={{ fontFamily: 'var(--font-body)' }}>Dark Mode</p>
              <p className="text-sm" style={{ color: 'var(--ink-light)' }}>Switch between light and dark theme</p>
            </div>
            <button
              onClick={toggleTheme}
              className="w-14 h-8 border-[2.5px] border-[var(--border)] relative cursor-pointer transition-colors"
              style={{ borderRadius: '4px 8px 2px 6px', background: dark ? 'var(--blue)' : 'var(--border-light)' }}
            >
              <div
                className="absolute top-[3px] w-5 h-5 bg-[var(--bg-card)] border-[2px] border-[var(--border)] transition-all duration-200"
                style={{ borderRadius: '2px 4px 2px 4px', left: dark ? '26px' : '3px' }}
              />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div
          className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-6 animate-fade-up"
          style={{ borderRadius: '8px 12px 6px 18px', boxShadow: 'var(--shadow)', animationDelay: '0.2s' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <IconBell size={20} />
            <h2 className="text-xl" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>Notifications</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--ink-light)' }}>
            In-app notifications are enabled. You receive alerts when someone creates a note or shares one with you. Notifications poll every 30 seconds.
          </p>
        </div>

        {/* Storage */}
        <div
          className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-6 animate-fade-up"
          style={{ borderRadius: '6px 14px 8px 12px', boxShadow: 'var(--shadow)', animationDelay: '0.25s' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <IconFile size={20} />
            <h2 className="text-xl" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>Storage</h2>
          </div>
          <div className="space-y-2 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
            <p><span style={{ color: 'var(--ink-light)' }}>File Storage:</span> Amazon S3</p>
            <p><span style={{ color: 'var(--ink-light)' }}>Allowed types:</span> PDF, PNG, JPG, JPEG</p>
            <p><span style={{ color: 'var(--ink-light)' }}>Auto-delete:</span> Notes older than 30 days are cleaned up daily</p>
          </div>
        </div>
      </div>
    </div>
  );
}
