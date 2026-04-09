'use client';

import { useState, useEffect, useRef } from 'react';
import { getNotes, getFeedNotes, createNote, updateNote, deleteNote, searchNotes, toggleStar as apiToggleStar, getStarredIds, type Note } from './api';
import { getUploadUrl, getDownloadUrl } from '../files/api';
import { CATEGORIES } from '../../shared/config';
import { showToast } from '../../shared/Toast';
import Modal from '../../shared/Modal';
import ShareModal from '../sharing/ShareModal';
import { IconPlus, IconX, IconSearch, IconTag, IconEdit, IconTrash, IconShare, IconDownload, IconClock, IconStar, IconFile } from '../../shared/icons/Icons';

const catClass: Record<string, string> = {
  general: 'cat-general', lecture: 'cat-lecture', assignment: 'cat-assignment',
  exam: 'cat-exam', project: 'cat-project', personal: 'cat-personal',
};

interface DashboardProps { onLogout: () => void; forceNewNote?: boolean; onNewNoteShown?: () => void; }

export default function Dashboard({ onLogout, forceNewNote, onNewNoteShown }: DashboardProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState(''); const [content, setContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('general');
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false); const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState(''); const [editContent, setEditContent] = useState(''); const [editCategory, setEditCategory] = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [starredLoaded, setStarredLoaded] = useState(false);

  useEffect(() => { loadStarred(); }, []);

  async function loadStarred() {
    try { const d = await getStarredIds(); setStarred(new Set(d.starredIds)); } catch {}
    setStarredLoaded(true);
  }

  useEffect(() => { if (starredLoaded) loadNotes(); }, [category, showStarredOnly, starredLoaded]);
  useEffect(() => { if (forceNewNote) { setFormOpen(true); onNewNoteShown?.(); } }, [forceNewNote, onNewNoteShown]);

  async function handleToggleStar(noteId: string) {
    const was = starred.has(noteId);
    setStarred(prev => { const n = new Set(prev); was ? n.delete(noteId) : n.add(noteId); return n; });
    if (showStarredOnly && was) setNotes(notes.filter(n => n.noteId !== noteId));
    try { await apiToggleStar(noteId); } catch {
      setStarred(prev => { const n = new Set(prev); was ? n.add(noteId) : n.delete(noteId); return n; });
      showToast('Failed to update star', 'error');
    }
  }

  async function loadNotes() {
    setLoading(true);
    try {
      if (showStarredOnly) {
        const d = await getFeedNotes(category || undefined);
        setNotes((d.notes || []).filter((n: Note) => starred.has(n.noteId)));
      } else {
        const d = await getNotes(category || undefined, true);
        setNotes(d.notes);
      }
    } catch (err: unknown) { showToast('Failed to load: ' + (err as Error).message, 'error'); }
    finally { setLoading(false); }
  }

  function handleSearch(value: string) {
    setSearchQuery(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      if (!value.trim()) { loadNotes(); return; }
      try { const d = await searchNotes(value); setNotes(d.notes); } catch {}
    }, 300);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setCreating(true);
    try {
      let fileKey = null;
      if (file) { const u = await getUploadUrl(file.name); await fetch(u.uploadUrl, { method: 'PUT', body: file }); fileKey = u.fileKey; }
      await createNote(title, content, noteCategory, fileKey);
      showToast('Note created', 'success');
      setTitle(''); setContent(''); setNoteCategory('general'); setFile(null); setFormOpen(false); loadNotes();
    } catch (err: unknown) { showToast((err as Error).message, 'error'); } finally { setCreating(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await deleteNote(deleteId); showToast('Note deleted', 'success'); setDeleteId(null); loadNotes(); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault(); if (!editNote) return;
    try { await updateNote(editNote.noteId, editTitle, editContent, editCategory); showToast('Updated', 'success'); setEditNote(null); loadNotes(); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  async function handleDownload(fileKey: string) {
    try { const d = await getDownloadUrl(fileKey); window.open(d.downloadUrl, '_blank'); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  function openEdit(note: Note) { setEditNote(note); setEditTitle(note.title); setEditContent(note.content); setEditCategory(note.category); }

  const displayNotes = notes;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold">My Notes</h1>
          <p className="text-sm text-[var(--ink-muted)]">
            {showStarredOnly ? `${displayNotes.length} starred` : `${notes.length} note${notes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`btn btn-secondary !w-auto text-sm ${showStarredOnly ? '!bg-[var(--warning-light)] !border-[var(--warning)] !text-[var(--warning)]' : ''}`}>
            <IconStar size={16} filled={showStarredOnly} /> Starred
          </button>
          <button onClick={() => setFormOpen(!formOpen)} className="btn-doodle btn-primary !w-auto text-sm">
            {formOpen ? <><IconX size={16} /> Close</> : <><IconPlus size={16} /> New Note</>}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {formOpen && (
        <div className="mb-6 animate-fade-up">
          <div className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-6 relative" style={{ borderRadius: '8px 16px 6px 20px', boxShadow: 'var(--shadow)' }}>
            <div className="absolute -top-3 left-8 w-20 h-5 bg-[var(--blue)] border-[1.5px] border-[var(--border)] opacity-70" style={{ borderRadius: '2px', transform: 'rotate(-3deg)' }} />
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--ink)' }}>Create Note</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title" required className="doodle-input flex-1" />
                <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)} className="doodle-input sm:w-auto capitalize" style={{ minWidth: '140px' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your note..." rows={4} required className="doodle-input resize-y" />
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm text-[var(--ink-muted)]" />
                <button disabled={creating} className="btn-doodle btn-primary sm:!w-auto">{creating ? 'Creating...' : 'Create Note'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex-1 relative">
          <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Search notes..." className="doodle-input" style={{ paddingLeft: '40px' }} />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="doodle-input sm:w-auto capitalize" style={{ minWidth: '140px' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">{[1,2,3].map(i => (
          <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] p-5 animate-pulse" style={{ borderRadius: 'var(--radius)' }}>
            <div className="h-5 w-2/5 bg-[var(--border)] rounded mb-2" /><div className="h-4 w-full bg-[var(--border)] rounded mb-1.5" /><div className="h-4 w-3/4 bg-[var(--border)] rounded" />
          </div>
        ))}</div>
      )}

      {/* Empty */}
      {!loading && displayNotes.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          {showStarredOnly ? <IconStar size={40} className="mx-auto mb-3" style={{ color: 'var(--ink-muted)', opacity: 0.3 }} /> : <IconPlus size={40} className="mx-auto mb-3" style={{ color: 'var(--ink-muted)', opacity: 0.3 }} />}
          <h3 className="text-lg font-semibold mb-1">{showStarredOnly ? 'No starred notes' : 'No notes yet'}</h3>
          <p className="text-sm text-[var(--ink-muted)]">{showStarredOnly ? 'Star a note to save it here' : 'Create your first note'}</p>
        </div>
      )}

      {/* Notes */}
      {!loading && displayNotes.length > 0 && (
        <div className="space-y-3">
          {displayNotes.map((note, i) => (
            <div key={note.noteId} className="group bg-[var(--bg-card)] border border-[var(--border)] p-5 sm:p-6 transition-all hover:shadow-[var(--shadow-md)] animate-fade-up"
              style={{ borderRadius: 'var(--radius)', animationDelay: `${i * 0.04}s` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button onClick={() => handleToggleStar(note.noteId)} className="mt-0.5 shrink-0" style={{ color: starred.has(note.noteId) ? 'var(--warning)' : 'var(--ink-muted)' }}>
                    <IconStar size={20} filled={starred.has(note.noteId)} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold mb-1 line-clamp-1">{note.title}</h3>
                    <p className="text-sm text-[var(--ink-secondary)] line-clamp-2 leading-relaxed">{note.content}</p>
                  </div>
                </div>
                {note.isShared && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-[var(--purple-light)] text-[var(--purple)] rounded-full shrink-0 ml-2">Shared</span>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 ml-8">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${catClass[note.category] || catClass.general}`}>{note.category}</span>
                  <span className="text-xs text-[var(--ink-muted)] flex items-center gap-1"><IconClock size={12} /> {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  {note.fileKey && <span className="text-xs text-[var(--ink-muted)] flex items-center gap-1"><IconFile size={12} /></span>}
                </div>
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {note.fileKey && <button onClick={() => handleDownload(note.fileKey!)} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--blue)]"><IconDownload size={16} /></button>}
                  {!note.isShared && <>
                    <button onClick={() => openEdit(note)} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--ink-secondary)]"><IconEdit size={16} /></button>
                    <button onClick={() => setDeleteId(note.noteId)} className="p-1.5 rounded-md hover:bg-[var(--danger-light)] text-[var(--danger)]"><IconTrash size={16} /></button>
                    <button onClick={() => setShareId(note.noteId)} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--ink-secondary)]"><IconShare size={16} /></button>
                  </>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}>
        <h3 className="text-lg font-semibold mb-2">Delete note?</h3>
        <p className="text-sm text-[var(--ink-muted)] mb-5">This can't be undone.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-doodle btn-outline">Cancel</button>
          <button onClick={handleDelete} className="btn-doodle btn-danger">Delete</button>
        </div>
      </Modal>

      <ShareModal noteId={shareId} onClose={() => setShareId(null)} />

      <Modal open={!!editNote} onClose={() => setEditNote(null)}>
        <h3 className="text-lg font-semibold mb-4">Edit Note</h3>
        <form onSubmit={handleEdit} className="space-y-3">
          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="doodle-input" />
          <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="doodle-input capitalize">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} required className="doodle-input resize-y" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditNote(null)} className="btn-doodle btn-outline">Cancel</button>
            <button type="submit" className="btn-doodle btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
