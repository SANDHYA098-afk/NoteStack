'use client';

import { useState, useEffect } from 'react';
import { IconHome, IconNotes, IconUser, IconSettings, IconBell, IconLogout, IconChevronRight, IconChevronLeft, IconSearch, IconPlus } from './icons/Icons';
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

  // On mobile, sidebar is hidden by default and overlays
  const sidebarWidth = expanded ? 'w-[220px]' : 'w-[60px]';

  const avatarColors = ['#ff6b9d', '#4ecdc4', '#a8e06c', '#ff8a5c', '#b57bee', '#ffe156'];
  const colorIndex = email.charCodeAt(0) % avatarColors.length;

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
      {/* Mobile overlay */}
      {mobile && expanded && (
        <div className="fixed inset-0 bg-black/30 z-40 animate-fade-in" onClick={() => setExpanded(false)} />
      )}

      {/* Mobile top bar */}
      {mobile && !expanded && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-[var(--bg)]/95 backdrop-blur-sm border-b-[2.5px] border-[var(--border)] z-30 flex items-center justify-between px-4">
          <button onClick={() => setExpanded(true)} className="p-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
            </svg>
          </button>
          <span className="text-xl" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, color: 'var(--ink)' }}>NoteStack</span>
          <div className="flex items-center gap-2">
            <button onClick={onToggleNotifs} className="p-2 relative">
              <IconBell size={18} />
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--pink)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[var(--border)]">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[var(--bg-card)] border-r-[2.5px] border-[var(--border)] z-50 flex flex-col transition-all duration-300 ${sidebarWidth} ${mobile && !expanded ? '-translate-x-full' : 'translate-x-0'}`}
        style={{ boxShadow: expanded ? '4px 0 20px rgba(0,0,0,0.1)' : 'none' }}
      >
        {/* Logo + Toggle */}
        <div className="flex items-center justify-between px-3 h-16 border-b-[2px] border-[var(--border)]">
          {expanded ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[var(--accent)] border-[2px] border-[var(--border)] flex items-center justify-center rounded" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <span className="text-white text-sm font-bold" style={{ fontFamily: 'var(--font-hand)' }}>N</span>
                </div>
                <span className="text-lg" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700 }}>NoteStack</span>
              </div>
              <button onClick={() => setExpanded(false)} className="p-1 hover:bg-[var(--accent-light)]/20 rounded transition-colors">
                <IconChevronLeft size={18} />
              </button>
            </>
          ) : (
            <button onClick={() => setExpanded(true)} className="w-full flex justify-center p-1 hover:bg-[var(--accent-light)]/20 rounded transition-colors">
              <IconChevronRight size={18} />
            </button>
          )}
        </div>

        {/* New Note Button */}
        <div className="px-2 pt-4 pb-2">
          <button
            onClick={onNewNote}
            className={`w-full flex items-center gap-3 bg-[var(--accent)] border-[2px] border-[var(--border)] transition-all hover:translate-y-[-1px] ${expanded ? 'px-4 py-2.5 justify-start' : 'px-0 py-2.5 justify-center'}`}
            style={{ borderRadius: '4px 8px 2px 10px', boxShadow: '2px 2px 0 var(--border)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600 }}
          >
            <IconPlus size={18} />
            {expanded && <span>New Note</span>}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-2 space-y-1">
          {navItems.map(item => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 py-2.5 rounded-md transition-all ${expanded ? 'px-4 justify-start' : 'px-0 justify-center'} ${
                  active
                    ? 'bg-[var(--accent-light)]/25 border-[1.5px] border-[var(--border)]'
                    : 'border-[1.5px] border-transparent hover:bg-[var(--accent-light)]/10'
                }`}
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px' }}
                {...(!expanded ? { 'data-tooltip': item.label } : {})}
              >
                <item.icon size={20} className={active ? 'text-[var(--ink)]' : 'text-[var(--ink-light)]'} />
                {expanded && <span className={active ? 'font-semibold' : ''}>{item.label}</span>}
              </button>
            );
          })}

          {/* Notifications */}
          <button
            onClick={onToggleNotifs}
            className={`w-full flex items-center gap-3 py-2.5 rounded-md transition-all border-[1.5px] border-transparent hover:bg-[var(--accent-light)]/10 ${expanded ? 'px-4 justify-start' : 'px-0 justify-center'} relative`}
            style={{ fontFamily: 'var(--font-body)', fontSize: '15px' }}
            {...(!expanded ? { 'data-tooltip': 'Notifications' } : {})}
          >
            <div className="relative">
              <IconBell size={20} className="text-[var(--ink-light)]" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--pink)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[var(--border)]">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </div>
            {expanded && <span>Notifications</span>}
          </button>
        </nav>

        {/* Bottom: User */}
        <div className="px-2 pb-4 space-y-1 border-t-[2px] border-[var(--border)] pt-3">
          <button
            onClick={() => handleNav('profile')}
            className={`w-full flex items-center gap-3 py-2 rounded-md transition-all hover:bg-[var(--accent-light)]/10 ${expanded ? 'px-3 justify-start' : 'px-0 justify-center'}`}
          >
            <div
              className="w-8 h-8 border-[2px] border-[var(--border)] flex items-center justify-center text-sm font-bold shrink-0"
              style={{ borderRadius: '4px 2px 6px 2px', background: avatarColors[colorIndex], fontFamily: 'var(--font-hand)' }}
            >
              {initial}
            </div>
            {expanded && (
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold truncate" style={{ fontFamily: 'var(--font-hand)' }}>{email.split('@')[0]}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--ink-light)' }}>{email}</p>
              </div>
            )}
          </button>

          <button
            onClick={() => { authLogout(); onLogout(); }}
            className={`w-full flex items-center gap-3 py-2 rounded-md transition-all hover:bg-[var(--pink)]/15 text-[var(--pink)] ${expanded ? 'px-4 justify-start' : 'px-0 justify-center'}`}
            style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}
            {...(!expanded ? { 'data-tooltip': 'Logout' } : {})}
          >
            <IconLogout size={18} />
            {expanded && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
