'use client';

import { useState, useEffect, useRef } from 'react';
import { getNotes, getFeedNotes, createNote, updateNote, deleteNote, searchNotes, toggleStar as apiToggleStar, getStarredIds, type Note } from './api';
import { getUploadUrl, getDownloadUrl } from '../files/api';
import { CATEGORIES } from '../../shared/config';
import { showToast } from '../../shared/Toast';
import Modal from '../../shared/Modal';
import ShareModal from '../sharing/ShareModal';
import { IconPlus, IconX, IconSearch, IconTag, IconEdit, IconTrash, IconShare, IconDownload, IconFile, IconClock, IconStar, IconBookmark } from '../../shared/icons/Icons';

interface DashboardProps {
  onLogout: () => void;
  forceNewNote?: boolean;
  onNewNoteShown?: () => void;
}

export default function Dashboard({ onLogout, forceNewNote, onNewNoteShown }: DashboardProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [starred, setStarred] = useState<Set<string>>(new Set());

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
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [starredLoaded, setStarredLoaded] = useState(false);

  useEffect(() => {
    loadStarred();
  }, []);

  async function loadStarred() {
    try {
      const data = await getStarredIds();
      setStarred(new Set(data.starredIds));
    } catch { /* silent */ }
    setStarredLoaded(true);
  }

  useEffect(() => {
    if (starredLoaded) loadNotes();
  }, [category, showStarredOnly, starredLoaded]);

  useEffect(() => {
    if (forceNewNote) { setFormOpen(true); onNewNoteShown?.(); }
  }, [forceNewNote, onNewNoteShown]);

  async function handleToggleStar(noteId: string) {
    // Optimistic update
    const wasStarred = starred.has(noteId);
    setStarred(prev => {
      const next = new Set(prev);
      if (wasStarred) next.delete(noteId); else next.add(noteId);
      return next;
    });
    if (showStarredOnly && wasStarred) {
      setNotes(notes.filter(n => n.noteId !== noteId));
    }

    try {
      await apiToggleStar(noteId);
    } catch {
      // Revert on failure
      setStarred(prev => {
        const next = new Set(prev);
        if (wasStarred) next.add(noteId); else next.delete(noteId);
        return next;
      });
      showToast('Failed to update star', 'error');
    }
  }

  async function loadNotes() {
    setLoading(true);
    try {
      if (showStarredOnly) {
        // Fetch from community feed to get ALL starred notes (not just yours)
        const data = await getFeedNotes(category || undefined);
        const starredNotes = (data.notes || []).filter((n: Note) => starred.has(n.noteId));
        setNotes(starredNotes);
      } else {
        const data = await getNotes(category || undefined, true);
        setNotes(data.notes);
      }
    } catch (err: unknown) {
      showToast('Failed to load notes: ' + (err as Error).message, 'error');
    } finally { setLoading(false); }
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
      showToast('Note created!', 'success');
      setTitle(''); setContent(''); setNoteCategory('general'); setFile(null); setFormOpen(false);
      loadNotes();
    } catch (err: unknown) { showToast((err as Error).message, 'error'); }
    finally { setCreating(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await deleteNote(deleteId); showToast('Note deleted', 'success'); setDeleteId(null); loadNotes(); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editNote) return;
    try { await updateNote(editNote.noteId, editTitle, editContent, editCategory); showToast('Updated!', 'success'); setEditNote(null); loadNotes(); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  async function handleDownload(fileKey: string) {
    try { const data = await getDownloadUrl(fileKey); window.open(data.downloadUrl, '_blank'); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  function openEdit(note: Note) {
    setEditNote(note); setEditTitle(note.title); setEditContent(note.content); setEditCategory(note.category);
  }

  const catColors: Record<string, string> = {
    general: 'bg-[var(--accent-light)]', lecture: 'bg-[var(--blue)] text-white', assignment: 'bg-[var(--orange)] text-white',
    exam: 'bg-[var(--pink)] text-white', project: 'bg-[var(--purple)] text-white', personal: 'bg-[var(--lime)]',
  };

  const displayNotes = notes;

  return (
    <div className="relative z-10">
      {/* Title */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6 animate-fade-up">
        <div>
          <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, color: 'var(--ink)' }}>
            My Notes
          </h1>
          <p className="text-base mt-1" style={{ color: 'var(--ink-light)' }}>
            {showStarredOnly
              ? `${displayNotes.length} starred note${displayNotes.length !== 1 ? 's' : ''}`
              : `${notes.length} note${notes.length !== 1 ? 's' : ''} in your collection`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`btn-doodle btn-outline text-sm !w-auto flex items-center gap-1.5 ${showStarredOnly ? '!bg-[var(--accent-light)]/30' : ''}`}
          >
            <IconStar size={16} filled={showStarredOnly} /> Starred
          </button>
          <button onClick={() => setFormOpen(!formOpen)} className="btn-doodle btn-primary text-base !w-auto flex items-center gap-2">
            {formOpen ? <><IconX size={16} /> Close</> : <><IconPlus size={16} /> New Note</>}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {formOpen && (
        <div className="mb-8 animate-fade-up">
          <div className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-6 relative"
            style={{ borderRadius: '8px 16px 6px 20px', boxShadow: 'var(--shadow)' }}>
            <div className="absolute -top-3 left-8 w-20 h-5 bg-[var(--blue)] border-[1.5px] border-[var(--border)] opacity-70" style={{ borderRadius: '2px', transform: 'rotate(-3deg)' }} />
            <h3 className="text-xl sm:text-2xl mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: 'var(--ink)' }}>
              <IconPlus size={20} /> Write a note
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..." required className="doodle-input flex-1" />
                <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)} className="doodle-input sm:w-auto capitalize" style={{ minWidth: '140px' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your thoughts here..." rows={4} required className="doodle-input resize-y" />
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)}
                  className="text-sm file:mr-3 file:py-2 file:px-4 file:border-[2px] file:border-[var(--border)] file:bg-[var(--lime)] file:cursor-pointer file:font-medium"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--ink)' }} />
                <button disabled={creating} className="btn-doodle btn-primary text-base sm:!w-auto flex items-center gap-2">
                  <IconPlus size={16} /> {creating ? 'Creating...' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex-1 relative">
          <IconSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-light)' }} />
          <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Search notes..." className="doodle-input" style={{ paddingLeft: '44px' }} />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="doodle-input sm:w-auto capitalize" style={{ minWidth: '140px' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-6 animate-pulse" style={{ borderRadius: '8px 14px 6px 16px' }}>
              <div className="h-7 w-2/5 bg-[var(--accent-light)]/30 rounded mb-3" />
              <div className="h-4 w-full bg-[var(--border-light)] rounded mb-2" />
              <div className="h-4 w-3/4 bg-[var(--border-light)] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && displayNotes.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          {showStarredOnly ? (
            <>
              <IconStar size={56} className="mx-auto mb-4 opacity-20" />
              <h3 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: 'var(--ink)' }}>No starred notes</h3>
              <p className="text-base" style={{ color: 'var(--ink-light)' }}>Click the star icon on a note to save it here</p>
            </>
          ) : (
            <>
              <IconPlus size={56} className="mx-auto mb-4 opacity-20" />
              <h3 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: 'var(--ink)' }}>No notes yet!</h3>
              <p className="text-base" style={{ color: 'var(--ink-light)' }}>Click &quot;+ New Note&quot; to create your first one</p>
            </>
          )}
        </div>
      )}

      {/* Notes — Full Width Cards */}
      {!loading && displayNotes.length > 0 && (
        <div className="space-y-5 sm:space-y-6">
          {displayNotes.map((note, i) => (
            <div
              key={note.noteId}
              className="group bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] overflow-hidden transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow-hover)] animate-fade-up relative"
              style={{
                borderRadius: `${8 + (i % 3) * 2}px ${14 - (i % 2) * 4}px ${6 + (i % 4)}px ${16 - (i % 3) * 3}px`,
                boxShadow: 'var(--shadow)',
                animationDelay: `${i * 0.06}s`,
              }}
            >
              {/* Star + Shared badge top row */}
              <div className="px-5 sm:px-8 pt-5 sm:pt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {note.isShared && (
                    <span className="text-xs sm:text-sm font-bold px-3 py-1 border-[1.5px] border-[var(--purple)] bg-[var(--purple-light)] flex items-center gap-1" style={{ borderRadius: '2px 6px 2px 6px', fontFamily: 'var(--font-body)', color: 'var(--purple)' }}>
                      <IconShare size={14} /> Shared with you
                    </span>
                  )}
                </div>
                <button onClick={() => handleToggleStar(note.noteId)} className="p-2 hover:scale-125 transition-transform" style={{ color: starred.has(note.noteId) ? '#e6c800' : 'var(--ink-light)' }}>
                  <IconStar size={24} filled={starred.has(note.noteId)} />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 sm:px-8 pb-5 sm:pb-6">
                <h3 className="text-2xl sm:text-3xl md:text-4xl leading-tight mb-2 line-clamp-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, color: 'var(--ink)' }}>
                  {note.title}
                </h3>
                <p className="text-base sm:text-lg leading-relaxed mb-4 line-clamp-3" style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-body)' }}>
                  {note.content}
                </p>

                {/* Bottom row: tags + meta left, download + actions right */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 border-[2px] border-[var(--border)] capitalize flex items-center gap-1.5 ${catColors[note.category] || catColors.general}`}
                      style={{ borderRadius: '4px 8px 2px 6px', fontFamily: 'var(--font-body)' }}
                    >
                      <IconTag size={16} /> {note.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm" style={{ color: 'var(--ink-light)' }}>
                      <IconClock size={14} /> {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {note.fileKey && (
                      <button
                        onClick={() => handleDownload(note.fileKey!)}
                        className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border-[2px] border-[var(--border)] text-sm sm:text-base font-semibold transition-all hover:translate-y-[-1px] hover:shadow-[var(--shadow-sm)]"
                        style={{ borderRadius: '2px 6px 4px 8px', color: 'var(--blue)', background: 'var(--bg-card)', fontFamily: 'var(--font-body)' }}
                      >
                        <IconDownload size={18} /> Download
                      </button>
                    )}
                    {!note.isShared && (
                      <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(note)} className="p-2 border-[2px] border-[var(--border)] hover:bg-[var(--accent-light)]/20 transition-colors" style={{ borderRadius: '4px 2px 6px 2px' }} title="Edit">
                          <IconEdit size={16} />
                        </button>
                        <button onClick={() => setDeleteId(note.noteId)} className="p-2 border-[2px] border-[var(--border)] hover:bg-[var(--pink)]/20 transition-colors" style={{ borderRadius: '2px 6px 2px 4px', color: 'var(--pink)' }} title="Delete">
                          <IconTrash size={16} />
                        </button>
                        <button onClick={() => setShareId(note.noteId)} className="p-2 border-[2px] border-[var(--border)] hover:bg-[var(--blue)]/20 transition-colors" style={{ borderRadius: '4px 2px 4px 6px' }} title="Share">
                          <IconShare size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}>
        <div className="text-center mb-4"><IconTrash size={48} className="mx-auto opacity-60" style={{ color: 'var(--pink)' }} /></div>
        <h3 className="text-2xl text-center mb-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: 'var(--ink)' }}>Delete this note?</h3>
        <p className="text-sm text-center mb-6" style={{ color: 'var(--ink-light)' }}>This action cannot be undone!</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setDeleteId(null)} className="btn-doodle btn-outline">Cancel</button>
          <button onClick={handleDelete} className="btn-doodle btn-danger">Delete</button>
        </div>
      </Modal>

      <ShareModal noteId={shareId} onClose={() => setShareId(null)} />

      {/* Edit Modal */}
      <Modal open={!!editNote} onClose={() => setEditNote(null)}>
        <h3 className="text-2xl mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: 'var(--ink)' }}>
          <IconEdit size={20} /> Edit Note
        </h3>
        <form onSubmit={handleEdit} className="space-y-4">
          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="doodle-input" />
          <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="doodle-input capitalize">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} required className="doodle-input resize-y" />
          <div className="flex gap-3 justify-center">
            <button type="button" onClick={() => setEditNote(null)} className="btn-doodle btn-outline">Cancel</button>
            <button type="submit" className="btn-doodle btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
