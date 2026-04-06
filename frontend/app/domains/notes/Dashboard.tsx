'use client';

import { useState, useEffect, useRef } from 'react';
import { logout as authLogout } from '../auth/auth';
import { getNotes, createNote, updateNote, deleteNote, searchNotes, type Note } from './api';
import { getUploadUrl, getDownloadUrl } from '../files/api';
import { CATEGORIES } from '../../shared/config';
import { showToast } from '../../shared/Toast';
import Modal from '../../shared/Modal';
import ProfileSection from '../../shared/ProfileSection';
import NotificationBell from '../notifications/NotificationBell';
import ShareModal from '../sharing/ShareModal';
import NoteCard from './NoteCard';

const catEmoji: Record<string, string> = {
  general: '📝', lecture: '🎓', assignment: '📋', exam: '🧪', project: '🚀', personal: '💭',
};

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [showShared, setShowShared] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('general');
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

  useEffect(() => { loadNotes(); }, [category, showShared]);

  async function loadNotes() {
    setLoading(true);
    try {
      const data = await getNotes(category || undefined, showShared);
      setNotes(data.notes);
    } catch (err: unknown) { showToast((err as Error).message, 'error'); }
    finally { setLoading(false); }
  }

  function handleSearch(value: string) {
    setSearchQuery(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      if (!value.trim()) { loadNotes(); return; }
      try { const data = await searchNotes(value); setNotes(data.notes); } catch { /* silent */ }
    }, 300);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      let fileKey = null;
      if (file) {
        const upload = await getUploadUrl(file.name);
        await fetch(upload.uploadUrl, { method: 'PUT', body: file });
        fileKey = upload.fileKey;
      }
      await createNote(title, content, noteCategory, fileKey);
      showToast('Note created! ✨', 'success');
      setTitle(''); setContent(''); setNoteCategory('general'); setFile(null); setFormOpen(false);
      loadNotes();
    } catch (err: unknown) { showToast((err as Error).message, 'error'); }
    finally { setCreating(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await deleteNote(deleteId); showToast('Poof! Note deleted 💨', 'success'); setDeleteId(null); loadNotes(); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editNote) return;
    try { await updateNote(editNote.noteId, editTitle, editContent, editCategory); showToast('Updated! ✓', 'success'); setEditNote(null); loadNotes(); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  async function handleDownload(fileKey: string) {
    try { const data = await getDownloadUrl(fileKey); window.open(data.downloadUrl, '_blank'); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  function openEdit(note: Note) {
    setEditNote(note); setEditTitle(note.title); setEditContent(note.content); setEditCategory(note.category);
  }

  function handleLogout() { authLogout(); onLogout(); }

  return (
    <div className="min-h-screen relative">
      {/* Background doodles */}
      <svg className="hidden md:block fixed top-24 right-8 w-14 h-14 opacity-20 animate-float pointer-events-none" viewBox="0 0 50 50" fill="none" stroke="#ff6b9d" strokeWidth="2.5">
        <path d="M25 5 L28 18 L42 18 L31 27 L35 40 L25 32 L15 40 L19 27 L8 18 L22 18Z" />
      </svg>
      <svg className="hidden md:block fixed bottom-16 left-8 w-12 h-12 opacity-15 animate-float pointer-events-none" style={{ animationDelay: '1.5s' }} viewBox="0 0 40 40" fill="none" stroke="#4ecdc4" strokeWidth="2.5">
        <circle cx="20" cy="20" r="16" strokeDasharray="6 6" />
      </svg>
      <svg className="hidden md:block fixed top-1/2 left-6 w-8 h-8 opacity-20 animate-float pointer-events-none" style={{ animationDelay: '0.7s' }} viewBox="0 0 32 32" fill="#ffe156">
        <rect x="6" y="6" width="20" height="20" rx="2" transform="rotate(12 16 16)" />
      </svg>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg)]/95 backdrop-blur-sm border-b-[2.5px] border-[var(--border)] animate-slide-down">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--yellow)] border-[2px] border-[var(--border)] flex items-center justify-center"
              style={{ borderRadius: '4px 2px 6px 2px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="text-sm sm:text-base">📚</span>
            </div>
            <span className="text-xl sm:text-2xl tracking-tight" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700 }}>NoteStack</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ProfileSection onLogout={handleLogout} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Title */}
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 animate-fade-up">
          <div>
            <h2 className="text-3xl sm:text-4xl tracking-tight" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700 }}>
              Your Notes <span className="squiggly hidden sm:inline">collection</span>
            </h2>
            <p className="text-base mt-1" style={{ color: 'var(--ink-light)' }}>{notes.length} note{notes.length !== 1 ? 's' : ''} ★</p>
          </div>
          <button onClick={() => setFormOpen(!formOpen)} className="btn-doodle btn-primary text-base sm:text-lg !w-auto">
            {formOpen ? '✕ Close' : '+ New Note'}
          </button>
        </div>

        {/* Create Form */}
        {formOpen && (
          <div className="mb-8 animate-fade-up">
            <div className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-6 relative"
              style={{ borderRadius: '8px 16px 6px 20px', boxShadow: '6px 6px 0px var(--border)' }}>
              <div className="absolute -top-3 left-8 w-20 h-5 bg-[var(--blue)] border-[1.5px] border-[var(--border)] opacity-70" style={{ borderRadius: '2px', transform: 'rotate(-3deg)' }} />
              <h3 className="text-xl sm:text-2xl mb-4" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>✏️ Write a note</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..." required className="doodle-input flex-1" />
                  <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)} className="doodle-input sm:w-auto capitalize" style={{ minWidth: '140px' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{catEmoji[c]} {c}</option>)}
                  </select>
                </div>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your thoughts here..." rows={4} required className="doodle-input resize-y" />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)}
                    className="text-sm file:mr-3 file:py-2 file:px-4 file:border-[2px] file:border-[var(--border)] file:bg-[var(--lime)] file:text-[var(--ink)] file:cursor-pointer file:font-medium file:transition-all hover:file:shadow-[var(--shadow-sm)]"
                    style={{ fontFamily: 'var(--font-body)' }} />
                  <button disabled={creating} className="btn-doodle btn-primary text-base sm:!w-auto">{creating ? 'Creating...' : 'Create Note ★'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="var(--ink-light)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Search notes..." className="doodle-input" style={{ paddingLeft: '44px' }} />
          </div>
          <div className="flex gap-3">
            <select value={category} onChange={e => setCategory(e.target.value)} className="doodle-input flex-1 sm:flex-none sm:w-auto capitalize" style={{ minWidth: '140px' }}>
              <option value="">📂 All</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{catEmoji[c]} {c}</option>)}
            </select>
            <label className="flex items-center gap-2 px-3 sm:px-4 py-3 border-[2.5px] border-[var(--border)] cursor-pointer select-none hover:bg-[var(--yellow)]/15 transition-colors whitespace-nowrap"
              style={{ borderRadius: '4px 8px 2px 6px', boxShadow: 'var(--shadow-sm)', fontFamily: 'var(--font-body)', fontSize: '15px', background: 'var(--bg-card)' }}>
              <input type="checkbox" checked={showShared} onChange={e => setShowShared(e.target.checked)} className="accent-[var(--pink)] w-4 h-4" />
              📤 <span className="hidden sm:inline">Shared</span>
            </label>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1,2,3].map(i => (
              <div key={i} className="doodle-border bg-[var(--bg-card)] p-5" style={{ borderRadius: '6px 12px 4px 14px' }}>
                <div className="h-5 w-3/5 bg-[var(--yellow)]/30 rounded mb-4 animate-pulse" />
                <div className="h-4 w-full bg-[var(--border-light)] rounded mb-2 animate-pulse" />
                <div className="h-4 w-4/5 bg-[var(--border-light)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && notes.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-6xl mb-4 animate-float">📝</div>
            <h3 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>No notes yet!</h3>
            <p className="text-base" style={{ color: 'var(--ink-light)' }}>Click &quot;+ New Note&quot; to create your first one ~</p>
          </div>
        )}

        {/* Notes Grid */}
        {!loading && notes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {notes.map((note, i) => (
              <NoteCard key={note.noteId} note={note} index={i} onEdit={openEdit} onDelete={setDeleteId} onShare={setShareId} onDownload={handleDownload} />
            ))}
          </div>
        )}
      </main>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}>
        <div className="text-center mb-4"><span className="text-5xl">🗑️</span></div>
        <h3 className="text-2xl text-center mb-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>Delete this note?</h3>
        <p className="text-sm text-center mb-6" style={{ color: 'var(--ink-light)' }}>This action cannot be undone!</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setDeleteId(null)} className="btn-doodle btn-outline">Cancel</button>
          <button onClick={handleDelete} className="btn-doodle btn-danger">Delete it!</button>
        </div>
      </Modal>

      {/* Share Modal */}
      <ShareModal noteId={shareId} onClose={() => setShareId(null)} />

      {/* Edit Modal */}
      <Modal open={!!editNote} onClose={() => setEditNote(null)}>
        <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>✏️ Edit Note</h3>
        <form onSubmit={handleEdit} className="space-y-4">
          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="doodle-input" />
          <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="doodle-input capitalize">
            {CATEGORIES.map(c => <option key={c} value={c}>{catEmoji[c]} {c}</option>)}
          </select>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} required className="doodle-input resize-y" />
          <div className="flex gap-3 justify-center">
            <button type="button" onClick={() => setEditNote(null)} className="btn-doodle btn-outline">Cancel</button>
            <button type="submit" className="btn-doodle btn-primary">Save ✓</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
