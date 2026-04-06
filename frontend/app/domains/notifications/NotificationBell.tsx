'use client';

import { useState, useEffect, useRef } from 'react';
import { getNotifications, markNotificationRead, type Notification } from './api';

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch { /* silent */ }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  async function markRead(id: string) { await markNotificationRead(id); load(); }
  async function markAllRead() { await markNotificationRead(undefined, true); load(); }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) load(); }}
        className="relative p-2 border-[2px] border-[var(--border)] bg-[var(--bg-card)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[var(--shadow-sm)]"
        style={{ borderRadius: '4px 2px 6px 2px' }}
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-2 -right-2 bg-[var(--pink)] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 border-[1.5px] border-[var(--border)]"
            style={{ borderRadius: '2px 4px 2px 4px', animation: 'bounce-in 0.3s ease' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-[calc(100vw-32px)] sm:w-[320px] max-w-[320px] bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] overflow-hidden animate-scale-in z-50"
          style={{ borderRadius: '6px 14px 8px 16px', boxShadow: '6px 6px 0px var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b-[2px] border-[var(--border)] bg-[var(--yellow)]/20">
            <h4 className="text-lg" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>🔔 Notifications</h4>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-bold text-[var(--pink)] hover:underline" style={{ fontFamily: 'var(--font-body)' }}>Mark all read</button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center py-8 text-base" style={{ color: 'var(--ink-light)' }}>No notifications yet ~</p>
            ) : (
              notifications.map(n => (
                <div key={n.notificationId} onClick={() => !n.read && markRead(n.notificationId)}
                  className={`px-4 py-3 border-b border-dashed border-[var(--border-light)] cursor-pointer transition-colors flex gap-3 items-start ${n.read ? 'opacity-50' : 'bg-[var(--yellow)]/10 hover:bg-[var(--yellow)]/20'}`}>
                  <span className="text-lg mt-0.5">{n.type === 'shared_note' ? '📤' : '🆕'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--ink-light)' }}>{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
