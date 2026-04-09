'use client';

import { useState, useEffect, useRef } from 'react';
import { getNotifications, markNotificationRead, type Notification } from './api';
import { IconBell, IconX } from '../../shared/icons/Icons';

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell({ autoOpen, onClose }: { autoOpen?: boolean; onClose?: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() { try { const d = await getNotifications(); setNotifications(d.notifications); setUnread(d.unreadCount); } catch {} }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!autoOpen) return;
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose?.(); }
    document.addEventListener('click', handleClick); return () => document.removeEventListener('click', handleClick);
  }, [autoOpen, onClose]);

  async function markRead(id: string) { await markNotificationRead(id); load(); }
  async function markAllRead() { await markNotificationRead(undefined, true); load(); }

  if (!autoOpen) return null;

  return (
    <div ref={ref} className="w-[calc(100vw-32px)] sm:w-[380px] max-w-[380px] bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden animate-scale-in"
      style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h4 className="text-sm font-semibold">Notifications</h4>
        <div className="flex items-center gap-2">
          {unread > 0 && <button onClick={markAllRead} className="text-xs text-[var(--accent)] hover:underline font-medium">Mark all read</button>}
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--bg-hover)]"><IconX size={14} /></button>
        </div>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-10"><IconBell size={28} className="mx-auto mb-2 text-[var(--ink-muted)]" style={{ opacity: 0.3 }} /><p className="text-sm text-[var(--ink-muted)]">No notifications</p></div>
        ) : notifications.map(n => (
          <div key={n.notificationId} onClick={() => !n.read && markRead(n.notificationId)}
            className={`px-4 py-3 border-b border-[var(--border)] cursor-pointer transition-colors ${n.read ? 'opacity-50' : 'bg-[var(--accent-subtle)] hover:bg-[var(--accent-light)]'}`}>
            <p className="text-sm leading-snug">{n.message}</p>
            <p className="text-xs text-[var(--ink-muted)] mt-1">{timeAgo(n.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
