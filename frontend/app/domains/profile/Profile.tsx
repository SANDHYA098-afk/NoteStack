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
  const colors = ['#4a9e3f', '#3d8eb9', '#cc6d3d', '#d94848', '#7b5ea7', '#d4a030'];
  const colorIdx = name.charCodeAt(0) % colors.length;

  useEffect(() => {
    loadNotes();
    const s = localStorage.getItem('notestack-username');
    if (s) setUsername(s);
  }, []);

  async function loadNotes() { setLoading(true); try { const d = await getNotes(); setNotes(d.notes); } catch {} finally { setLoading(false); } }
  async function handleDownload(fileKey: string) { try { const d = await getDownloadUrl(fileKey); window.open(d.downloadUrl, '_blank'); } catch (e: unknown) { showToast((e as Error).message, 'error'); } }
  function saveUsername(v: string) { setUsername(v); localStorage.setItem('notestack-username', v); setEditingName(false); showToast('Username updated', 'success'); }

  const categories = [...new Set(notes.map(n => n.category))];
  const filesCount = notes.filter(n => n.fileKey).length;

  return (
    <div>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 sm:p-8 mb-6 animate-fade-up" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shrink-0" style={{ background: colors[colorIdx] }}>{initial}</div>
          <div className="text-center sm:text-left flex-1">
            {editingName ? (
              <input type="text" defaultValue={name} autoFocus className="doodle-input text-xl font-bold !py-1 mb-1" style={{ maxWidth: '250px' }}
                onKeyDown={e => { if (e.key === 'Enter') saveUsername((e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingName(false); }}
                onBlur={e => saveUsername(e.target.value)} />
            ) : (
              <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                <h1 className="text-2xl font-bold">{name}</h1>
                <button onClick={() => setEditingName(true)} className="text-[var(--ink-muted)] hover:text-[var(--ink)]"><IconEdit size={14} /></button>
              </div>
            )}
            <p className="text-sm text-[var(--ink-muted)] mb-3">{email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-light)] text-[var(--accent)] rounded-full text-xs font-medium"><IconNotes size={12} />{notes.length} notes</span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--blue-light)] text-[var(--blue)] rounded-full text-xs font-medium"><IconFile size={12} />{filesCount} files</span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--purple-light)] text-[var(--purple)] rounded-full text-xs font-medium"><IconTag size={12} />{categories.length} categories</span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--warning-light)] text-[var(--warning)] rounded-full text-xs font-medium"><IconClock size={12} />Joined Apr 2026</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3 animate-fade-up" style={{ animationDelay: '0.05s' }}>Published Notes</h2>

      {loading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] p-4 animate-pulse" style={{ borderRadius: 'var(--radius)' }}><div className="h-4 w-3/5 bg-[var(--border)] rounded mb-2" /><div className="h-3 w-full bg-[var(--border)] rounded" /></div>)}</div>}

      {!loading && notes.length === 0 && <div className="text-center py-12"><IconNotes size={36} className="mx-auto mb-2" style={{ color: 'var(--ink-muted)', opacity: 0.3 }} /><p className="text-sm text-[var(--ink-muted)]">No notes published yet</p></div>}

      {!loading && notes.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{notes.map((note, i) => <NoteCard key={note.noteId} note={note} index={i} showAuthor={false} isOwner={false} onDownload={handleDownload} />)}</div>}
    </div>
  );
}
