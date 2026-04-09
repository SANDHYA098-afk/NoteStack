'use client';

import { useState, useEffect, useRef } from 'react';
import { getFeedNotes, toggleStar as apiToggleStar, getStarredIds, type Note } from '../notes/api';
import { getDownloadUrl } from '../files/api';
import { CATEGORIES } from '../../shared/config';
import { showToast } from '../../shared/Toast';
import { IconSearch, IconTag, IconGrid, IconDownload, IconStar, IconClock, IconFile } from '../../shared/icons/Icons';

const catClass: Record<string, string> = {
  general: 'cat-general', lecture: 'cat-lecture', assignment: 'cat-assignment',
  exam: 'cat-exam', project: 'cat-project', personal: 'cat-personal',
};

export default function Feed() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [starred, setStarred] = useState<Set<string>>(new Set());

  useEffect(() => { getStarredIds().then(d => setStarred(new Set(d.starredIds))).catch(() => {}); }, []);
  useEffect(() => { loadFeed(); }, [selectedCat]);

  async function handleToggleStar(noteId: string) {
    const was = starred.has(noteId);
    setStarred(prev => { const n = new Set(prev); was ? n.delete(noteId) : n.add(noteId); return n; });
    try { await apiToggleStar(noteId); } catch {
      setStarred(prev => { const n = new Set(prev); was ? n.add(noteId) : n.delete(noteId); return n; });
      showToast('Failed to update star', 'error');
    }
  }

  async function loadFeed() {
    setLoading(true);
    try { const d = await getFeedNotes(selectedCat || undefined); setNotes(d.notes); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
    finally { setLoading(false); }
  }

  function handleSearch(value: string) {
    setSearchQuery(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      if (!value.trim()) { loadFeed(); return; }
      setLoading(true);
      try { const d = await getFeedNotes(selectedCat || undefined, value); setNotes(d.notes); }
      catch (err: unknown) { showToast('Search failed: ' + (err as Error).message, 'error'); }
      finally { setLoading(false); }
    }, 300);
  }

  async function handleDownload(fileKey: string) {
    try { const d = await getDownloadUrl(fileKey); window.open(d.downloadUrl, '_blank'); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  return (
    <div className="relative z-10">
      {/* Hero */}
      <div className="relative mb-8 p-6 sm:p-8 md:p-10 overflow-hidden animate-fade-up bg-[var(--bg-card)] border-[2.5px] border-[var(--border)]"
        style={{ borderRadius: '12px 24px 8px 28px', boxShadow: 'var(--shadow)' }}>
        {/* Tape */}
        <div className="absolute -top-3 left-6 sm:left-12 w-16 sm:w-24 h-5 sm:h-6 bg-[var(--accent-light)] border-[1.5px] border-[var(--border)]" style={{ borderRadius: '2px', transform: 'rotate(-2deg)', opacity: 0.8 }} />
        <div className="absolute -top-3 right-8 sm:right-16 w-14 sm:w-20 h-4 sm:h-5 bg-[var(--pink)] border-[1.5px] border-[var(--border)]" style={{ borderRadius: '2px', transform: 'rotate(3deg)', opacity: 0.6 }} />

        <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-6 md:gap-8">
          {/* Illustration */}
          <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 shrink-0 relative animate-float order-first md:order-last">
            <img src="/book2.png" alt="" className="w-full h-full object-contain drop-shadow-lg dark-hidden" />
            <img src="/bookimg.png" alt="" className="w-full h-full object-contain drop-shadow-lg hidden dark-visible" />
          </div>

          {/* Text */}
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] mb-3" style={{ fontFamily: 'var(--font-brand)', fontWeight: 700 }}>
              <span style={{ color: 'var(--accent)' }}>Note</span><span style={{ color: 'var(--ink)' }}>Stack</span>
              <svg className="w-[50%] h-2 sm:h-3 mt-1 mx-auto md:mx-0" viewBox="0 0 200 12" fill="none" stroke="var(--accent)" strokeWidth="3" preserveAspectRatio="none">
                <path d="M0 6 Q25 0 50 6 Q75 12 100 6 Q125 0 150 6 Q175 12 200 6" />
              </svg>
            </h1>
            <p className="text-base sm:text-lg mb-5 max-w-lg mx-auto md:mx-0" style={{ color: 'var(--ink-light)' }}>
              Share, discover, and learn from notes uploaded by students across the platform.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="flex items-center gap-2 px-3 py-1.5 border-[2px] border-[var(--border)] bg-[var(--accent-light)]" style={{ borderRadius: '4px 8px 2px 10px' }}>
                <IconGrid size={14} /><span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{notes.length} notes</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 border-[2px] border-[var(--border)] bg-[var(--lime-light)]" style={{ borderRadius: '2px 6px 4px 8px' }}>
                <IconTag size={14} /><span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{CATEGORIES.length} categories</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="relative">
          <IconSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-muted)' }} />
          <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Search by keyword, title, content..." className="doodle-input text-base" style={{ paddingLeft: '44px' }} />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <button onClick={() => setSelectedCat('')}
          className={`flex items-center gap-2 px-4 py-2 border-[2px] border-[var(--border)] text-sm font-medium transition-all ${!selectedCat ? 'bg-[var(--accent-light)] shadow-[var(--shadow-sm)]' : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]'}`}
          style={{ borderRadius: '4px 8px 2px 6px' }}><IconGrid size={14} /> All</button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCat(cat)}
            className={`flex items-center gap-2 px-4 py-2 border-[2px] border-[var(--border)] text-sm font-medium capitalize transition-all ${selectedCat === cat ? 'bg-[var(--accent-light)] shadow-[var(--shadow-sm)]' : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]'}`}
            style={{ borderRadius: '2px 6px 4px 8px' }}><IconTag size={14} /> {cat}</button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">{[1,2,3].map(i => (
          <div key={i} className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-6 animate-pulse" style={{ borderRadius: '8px 14px 6px 16px', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 bg-[var(--border-light)] rounded-full" /><div className="h-4 w-28 bg-[var(--border-light)] rounded" /></div>
            <div className="h-6 w-2/3 bg-[var(--accent-light)] rounded mb-2" /><div className="h-4 w-full bg-[var(--border-light)] rounded" />
          </div>
        ))}</div>
      )}

      {/* Empty */}
      {!loading && notes.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <IconSearch size={48} className="mx-auto mb-3" style={{ opacity: 0.2, color: 'var(--ink)' }} />
          <h3 className="text-2xl font-semibold mb-1" style={{ color: 'var(--ink)' }}>No notes found</h3>
          <p className="text-base" style={{ color: 'var(--ink-light)' }}>{searchQuery ? `No results for "${searchQuery}"` : 'Be the first to share a note!'}</p>
        </div>
      )}

      {/* Feed Cards */}
      {!loading && notes.length > 0 && (
        <div className="space-y-4">
          {notes.map((note, i) => {
            const authorEmail = note.authorEmail || note.userId || 'anonymous';
            const authorName = authorEmail.includes('@') ? authorEmail.split('@')[0] : authorEmail;
            const authorInitial = authorName.charAt(0).toUpperCase();
            const colors = ['#7bc043', '#4ecdc4', '#ff8a5c', '#b57bee', '#ff6b9d', '#a8e06c'];
            const colorIdx = authorName.charCodeAt(0) % colors.length;

            return (
              <article key={note.noteId}
                className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] overflow-hidden transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow-hover)] animate-fade-up"
                style={{ borderRadius: `${8 + (i % 3) * 2}px ${14 - (i % 2) * 4}px ${6 + (i % 4)}px ${16 - (i % 3) * 3}px`, boxShadow: 'var(--shadow)', animationDelay: `${i * 0.05}s` }}>
                {/* Author + Star */}
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border-[2px] border-[var(--border)] flex items-center justify-center text-sm font-bold shrink-0 text-white" style={{ borderRadius: '4px 2px 6px 2px', background: colors[colorIdx] }}>
                      {authorInitial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{authorName}</p>
                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--ink-muted)' }}><IconClock size={11} />{new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggleStar(note.noteId)} className="p-2 hover:scale-125 transition-transform" style={{ color: starred.has(note.noteId) ? '#e6c800' : 'var(--ink-muted)' }}>
                    <IconStar size={22} filled={starred.has(note.noteId)} />
                  </button>
                </div>
                {/* Content */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-1.5" style={{ color: 'var(--ink)' }}>{note.title}</h2>
                  <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: 'var(--ink-light)' }}>{note.content}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold px-3 py-1.5 border-[1.5px] border-[var(--border)] capitalize flex items-center gap-1 ${catClass[note.category] || catClass.general}`} style={{ borderRadius: '4px 8px 2px 6px' }}>
                      <IconTag size={12} /> {note.category}
                    </span>
                    {note.fileKey && (
                      <button onClick={() => handleDownload(note.fileKey!)} className="btn-doodle btn-outline !w-auto text-xs !py-1.5 !px-3 flex items-center gap-1.5">
                        <IconDownload size={14} /> Download
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
