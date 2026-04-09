'use client';

import { useState, useEffect } from 'react';
import { IconHome, IconNotes, IconUser, IconSettings, IconBell, IconLogout, IconChevronRight, IconChevronLeft, IconPlus, IconMenu } from './icons/Icons';
import { getUserEmail, logout as authLogout } from '../domains/auth/auth';

type Page = 'feed' | 'my-notes' | 'profile' | 'settings';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  onNewNote: () => void;
  unreadNotifs: number;
  onToggleNotifs: () => void;
}

export default function Sidebar({ currentPage, onNavigate, onLogout, onNewNote, unreadNotifs, onToggleNotifs }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [mobile, setMobile] = useState(false);
  const email = getUserEmail() || 'student';
  const initial = email.charAt(0).toUpperCase();

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sidebarWidth = expanded ? 'w-[220px]' : 'w-[64px]';

  const navItems: { id: Page; icon: typeof IconHome; label: string }[] = [
    { id: 'feed', icon: IconHome, label: 'Community' },
    { id: 'my-notes', icon: IconNotes, label: 'My Notes' },
    { id: 'profile', icon: IconUser, label: 'Profile' },
    { id: 'settings', icon: IconSettings, label: 'Settings' },
  ];

  function handleNav(page: Page) {
    onNavigate(page);
    if (mobile) setExpanded(false);
  }

  return (
    <>
      {mobile && expanded && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 animate-fade-in" onClick={() => setExpanded(false)} />
      )}

      {mobile && !expanded && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-[var(--bg-card)] border-b border-[var(--border)] z-30 flex items-center justify-between px-4" style={{ boxShadow: 'var(--shadow-xs)' }}>
          <button onClick={() => setExpanded(true)} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
            <IconMenu size={20} />
          </button>
          <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-brand)', color: 'var(--ink)' }}>NoteStack</span>
          <button onClick={onToggleNotifs} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors relative">
            <IconBell size={18} />
            {unreadNotifs > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--danger)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadNotifs > 9 ? '9+' : unreadNotifs}
              </span>
            )}
          </button>
        </div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-[var(--bg-card)] border-r border-[var(--border)] z-50 flex flex-col transition-all duration-200 ${sidebarWidth} ${mobile && !expanded ? '-translate-x-full' : 'translate-x-0'}`}
        style={{ boxShadow: expanded ? 'var(--shadow-lg)' : 'var(--shadow-xs)' }}
      >
        <div className="flex items-center justify-between px-3 h-14 border-b border-[var(--border)]">
          {expanded ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                  <img src="/image1.png" alt="" className="w-full h-full object-contain" />
                </div>
                <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-brand)' }}>NoteStack</span>
              </div>
              <button onClick={() => setExpanded(false)} className="p-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors">
                <IconChevronLeft size={16} className="text-[var(--ink-muted)]" />
              </button>
            </>
          ) : (
            <button onClick={() => setExpanded(true)} className="w-full flex justify-center p-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors">
              <IconChevronRight size={16} className="text-[var(--ink-muted)]" />
            </button>
          )}
        </div>

        <div className="px-2 pt-3 pb-2">
          <button
            onClick={onNewNote}
            className={`w-full flex items-center gap-2.5 bg-[var(--accent)] text-white rounded-lg transition-all hover:bg-[var(--accent-hover)] ${expanded ? 'px-3 py-2 justify-start' : 'p-2 justify-center'}`}
          >
            <IconPlus size={18} />
            {expanded && <span className="text-sm font-medium">New Note</span>}
          </button>
        </div>

        <nav className="flex-1 px-2 py-1 space-y-0.5">
          {navItems.map(item => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-2.5 py-2 rounded-lg transition-all ${expanded ? 'px-3 justify-start' : 'px-0 justify-center'} ${
                  active ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'text-[var(--ink-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
                {...(!expanded ? { 'data-tooltip': item.label } : {})}
              >
                <item.icon size={20} className={active ? 'text-[var(--accent)]' : ''} />
                {expanded && <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>}
              </button>
            );
          })}

          <button
            onClick={onToggleNotifs}
            className={`w-full flex items-center gap-2.5 py-2 rounded-lg transition-all text-[var(--ink-secondary)] hover:bg-[var(--bg-hover)] ${expanded ? 'px-3 justify-start' : 'px-0 justify-center'} relative`}
            {...(!expanded ? { 'data-tooltip': 'Notifications' } : {})}
          >
            <div className="relative">
              <IconBell size={20} />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--danger)] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </div>
            {expanded && <span className="text-sm font-medium">Notifications</span>}
          </button>
        </nav>

        <div className="px-2 pb-3 space-y-0.5 border-t border-[var(--border)] pt-2">
          <button
            onClick={() => handleNav('profile')}
            className={`w-full flex items-center gap-2.5 py-2 rounded-lg transition-all hover:bg-[var(--bg-hover)] ${expanded ? 'px-3 justify-start' : 'px-0 justify-center'}`}
          >
            <div className="w-7 h-7 bg-[var(--accent-light)] text-[var(--accent)] rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {initial}
            </div>
            {expanded && (
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-[var(--ink)] truncate">{email.split('@')[0]}</p>
                <p className="text-[11px] text-[var(--ink-muted)] truncate">{email}</p>
              </div>
            )}
          </button>

          <button
            onClick={() => { authLogout(); onLogout(); }}
            className={`w-full flex items-center gap-2.5 py-2 rounded-lg transition-all text-[var(--danger)] hover:bg-[var(--danger-light)] ${expanded ? 'px-3 justify-start' : 'px-0 justify-center'}`}
            {...(!expanded ? { 'data-tooltip': 'Logout' } : {})}
          >
            <IconLogout size={18} />
            {expanded && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
