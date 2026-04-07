'use client';

import { useState, useEffect, useRef } from 'react';
import { getNotifications, markNotificationRead, type Notification } from './api';
import { IconBell, IconX } from '../../shared/icons/Icons';

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface NotificationBellProps {
  autoOpen?: boolean;
  onClose?: () => void;
}

export default function NotificationBell({ autoOpen, onClose }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch { /* silent */ }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!autoOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose?.();
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [autoOpen, onClose]);

  async function markRead(id: string) { await markNotificationRead(id); load(); }
  async function markAllRead() { await markNotificationRead(undefined, true); load(); }

  if (!autoOpen) return null;

  return (
    <div ref={ref}
      className="w-[calc(100vw-32px)] sm:w-[360px] max-w-[360px] bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] overflow-hidden animate-scale-in"
      style={{ borderRadius: '6px 14px 8px 16px', boxShadow: '6px 6px 0px var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b-[2px] border-[var(--border)] bg-[var(--yellow)]/20">
        <h4 className="text-lg flex items-center gap-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>
          <IconBell size={18} /> Notifications
        </h4>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs font-bold text-[var(--pink)] hover:underline" style={{ fontFamily: 'var(--font-body)' }}>Mark all read</button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-[var(--yellow)]/30 rounded transition-colors"><IconX size={16} /></button>
        </div>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-10">
            <IconBell size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm" style={{ color: 'var(--ink-light)' }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.notificationId} onClick={() => !n.read && markRead(n.notificationId)}
              className={`px-4 py-3 border-b border-dashed border-[var(--border-light)] cursor-pointer transition-colors flex gap-3 items-start ${n.read ? 'opacity-50' : 'bg-[var(--yellow)]/10 hover:bg-[var(--yellow)]/20'}`}>
              <div className="w-8 h-8 bg-[var(--yellow)]/30 border-[1.5px] border-[var(--border)] flex items-center justify-center shrink-0" style={{ borderRadius: '4px 2px 6px 2px' }}>
                <IconBell size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{n.message}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--ink-light)' }}>{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
