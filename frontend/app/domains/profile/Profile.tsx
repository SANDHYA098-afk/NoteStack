'use client';

import { useState, useEffect } from 'react';
import { getUserEmail } from '../auth/auth';
import { getNotes, type Note } from '../notes/api';
import NoteCard from '../notes/NoteCard';
import { getDownloadUrl } from '../files/api';
import { showToast } from '../../shared/Toast';
import { IconNotes, IconFile, IconTag, IconClock, IconEdit } from '../../shared/icons/Icons';

export default function Profile() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [editingName, setEditingName] = useState(false);
  const email = getUserEmail() || 'student';
  const name = username || email.split('@')[0];
  const initial = name.charAt(0).toUpperCase();

  const avatarColors = ['#ff6b9d', '#4ecdc4', '#a8e06c', '#ff8a5c', '#b57bee', '#ffe156'];
  const colorIndex = name.charCodeAt(0) % avatarColors.length;

  useEffect(() => {
    loadNotes();
    const savedName = localStorage.getItem('notestack-username');
    if (savedName) setUsername(savedName);
  }, []);

  async function loadNotes() {
    setLoading(true);
    try { const data = await getNotes(); setNotes(data.notes); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleDownload(fileKey: string) {
    try { const data = await getDownloadUrl(fileKey); window.open(data.downloadUrl, '_blank'); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  function saveUsername(newName: string) {
    setUsername(newName);
    localStorage.setItem('notestack-username', newName);
    setEditingName(false);
    showToast('Username updated!', 'success');
  }


  const categories = [...new Set(notes.map(n => n.category))];
  const filesCount = notes.filter(n => n.fileKey).length;

  return (
    <div className="relative z-10">
      {/* Profile Header */}
      <div
        className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-6 sm:p-8 mb-8 animate-fade-up"
        style={{ borderRadius: '8px 16px 6px 20px', boxShadow: 'var(--shadow)' }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with picture upload */}
          <div
            className="w-28 h-28 sm:w-32 sm:h-32 border-[3px] border-[var(--border)] flex items-center justify-center text-5xl font-bold shrink-0"
            style={{ borderRadius: '16px', background: avatarColors[colorIndex], boxShadow: 'var(--shadow)', fontFamily: 'var(--font-hand)', color: 'var(--ink)' }}
          >
            {initial}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            {editingName ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  defaultValue={name}
                  autoFocus
                  className="doodle-input text-2xl !py-1"
                  style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, maxWidth: '250px' }}
                  onKeyDown={e => { if (e.key === 'Enter') saveUsername((e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingName(false); }}
                  onBlur={e => saveUsername(e.target.value)}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                <h1 className="text-3xl" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, color: 'var(--ink)' }}>{name}</h1>
                <button onClick={() => setEditingName(true)} className="opacity-50 hover:opacity-100 transition-opacity" title="Edit username">
                  <IconEdit size={16} />
                </button>
              </div>
            )}
            <p className="text-sm mb-4" style={{ color: 'var(--ink-light)' }}>{email}</p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 border-[2px] border-[var(--border)] bg-[var(--yellow)]/20" style={{ borderRadius: '4px 8px 2px 6px' }}>
                <IconNotes size={15} style={{ color: 'var(--ink)' }} />
                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink)' }}>{notes.length} notes</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 border-[2px] border-[var(--border)] bg-[var(--blue)]/15" style={{ borderRadius: '2px 6px 4px 8px' }}>
                <IconFile size={15} style={{ color: 'var(--ink)' }} />
                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink)' }}>{filesCount} files</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 border-[2px] border-[var(--border)] bg-[var(--lime)]/20" style={{ borderRadius: '4px 2px 8px 4px' }}>
                <IconTag size={15} style={{ color: 'var(--ink)' }} />
                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink)' }}>{categories.length} categories</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 border-[2px] border-[var(--border)] bg-[var(--pink)]/15" style={{ borderRadius: '6px 4px 2px 8px' }}>
                <IconClock size={15} style={{ color: 'var(--ink)' }} />
                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink)' }}>Joined Apr 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Published Notes */}
      <h2 className="text-2xl mb-4 animate-fade-up" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: 'var(--ink)', animationDelay: '0.1s' }}>
        Published Notes
      </h2>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-5 animate-pulse" style={{ borderRadius: '6px 12px 4px 14px' }}>
              <div className="h-5 w-3/5 bg-[var(--border-light)] rounded mb-3" />
              <div className="h-3 w-full bg-[var(--border-light)] rounded mb-2" />
              <div className="h-3 w-4/5 bg-[var(--border-light)] rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div className="text-center py-12">
          <IconNotes size={48} className="mx-auto mb-3 opacity-20" />
          <p style={{ color: 'var(--ink-light)' }}>No notes published yet</p>
        </div>
      )}

      {!loading && notes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note, i) => (
            <NoteCard key={note.noteId} note={note} index={i} showAuthor={false} isOwner={false} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  );
}
