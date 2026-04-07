'use client';

import { useState, useEffect, useRef } from 'react';
import { getFeedNotes, toggleStar as apiToggleStar, getStarredIds, type Note } from '../notes/api';
import { getDownloadUrl } from '../files/api';
import { CATEGORIES } from '../../shared/config';
import { showToast } from '../../shared/Toast';
import { IconSearch, IconTag, IconGrid, IconDownload, IconStar, IconNotes, IconClock, IconFile } from '../../shared/icons/Icons';

export default function Feed() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [starred, setStarred] = useState<Set<string>>(new Set());

  useEffect(() => {
    getStarredIds().then(data => setStarred(new Set(data.starredIds))).catch(() => {});
  }, []);

  useEffect(() => { loadFeed(); }, [selectedCat]);

  async function handleToggleStar(noteId: string) {
    const wasStarred = starred.has(noteId);
    setStarred(prev => {
      const next = new Set(prev);
      if (wasStarred) next.delete(noteId); else next.add(noteId);
      return next;
    });
    try {
      await apiToggleStar(noteId);
    } catch {
      setStarred(prev => {
        const next = new Set(prev);
        if (wasStarred) next.add(noteId); else next.delete(noteId);
        return next;
      });
      showToast('Failed to update star', 'error');
    }
  }

  async function loadFeed() {
    setLoading(true);
    try {
      const data = await getFeedNotes(selectedCat || undefined);
      setNotes(data.notes);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(value: string) {
    setSearchQuery(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      if (!value.trim()) { loadFeed(); return; }
      setLoading(true);
      try {
        const data = await getFeedNotes(selectedCat || undefined, value);
        setNotes(data.notes);
      } catch (err: unknown) {
        showToast('Search failed: ' + (err as Error).message, 'error');
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  async function handleDownload(fileKey: string) {
    try {
      const data = await getDownloadUrl(fileKey);
      window.open(data.downloadUrl, '_blank');
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  }

  const catColors: Record<string, string> = {
    general: 'bg-[var(--accent-light)]', lecture: 'bg-[var(--blue)] text-white', assignment: 'bg-[var(--orange)] text-white',
    exam: 'bg-[var(--pink)] text-white', project: 'bg-[var(--purple)] text-white', personal: 'bg-[var(--lime)]',
  };

  return (
    <div className="relative z-10">
      {/* Hero Section */}
      <div
        className="relative mb-8 sm:mb-10 p-6 sm:p-8 md:p-10 overflow-hidden animate-fade-up bg-[var(--bg-card)] border-[2.5px] border-[var(--border)]"
        style={{ borderRadius: '12px 24px 8px 28px', boxShadow: 'var(--shadow)' }}
      >
        {/* Tape decorations */}
        <div className="absolute -top-3 left-6 sm:left-12 w-16 sm:w-24 h-5 sm:h-6 bg-[var(--yellow)] border-[1.5px] border-[var(--border)]" style={{ borderRadius: '2px', transform: 'rotate(-2deg)', opacity: 0.8 }} />
        <div className="absolute -top-3 right-8 sm:right-16 w-14 sm:w-20 h-4 sm:h-5 bg-[var(--pink)] border-[1.5px] border-[var(--border)]" style={{ borderRadius: '2px', transform: 'rotate(3deg)', opacity: 0.6 }} />

        {/* Mini doodles inside hero */}
        <svg className="absolute top-4 right-4 w-6 h-6 sm:w-8 sm:h-8 animate-float" style={{ opacity: 0.2, animationDelay: '0.5s' }} viewBox="0 0 24 24" fill="none" stroke="#b57bee" strokeWidth="2.5">
          <path d="M12 2 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8Z" />
        </svg>
        <svg className="absolute bottom-4 left-4 w-5 h-5 animate-float" style={{ opacity: 0.15, animationDelay: '1.8s' }} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="#4ecdc4" />
        </svg>

        <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-6 md:gap-8">
          {/* Illustration */}
          <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 shrink-0 relative animate-float order-first md:order-last">
            <img src="/book2.png" alt="Book illustration" className="w-full h-full object-contain drop-shadow-lg dark-hidden" />
            <img src="/bookimg.png" alt="Laptop illustration" className="w-full h-full object-contain drop-shadow-lg hidden dark-visible" />
          </div>

          {/* Text — NoteStack branding */}
          <div className="flex-1">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] mb-3 text-center md:text-left" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700 }}>
              <span style={{ color: 'var(--accent)' }}>Note</span><span style={{ color: 'var(--ink)' }}>Stack</span>
              <svg className="w-[60%] sm:w-[50%] h-2 sm:h-3 mt-1 mx-auto md:mx-0" viewBox="0 0 200 12" fill="none" stroke="var(--accent)" strokeWidth="3" preserveAspectRatio="none">
                <path d="M0 6 Q25 0 50 6 Q75 12 100 6 Q125 0 150 6 Q175 12 200 6" />
              </svg>
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-5 sm:mb-6 max-w-lg mx-auto md:mx-0" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-light)' }}>
              Share, discover, and learn from notes uploaded by students across the platform.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border-[2px] border-[var(--border)] bg-[var(--accent-light)]" style={{ borderRadius: '4px 8px 2px 10px', fontFamily: 'var(--font-body)' }}>
                <IconGrid size={16} />
                <span className="text-sm sm:text-base font-semibold" style={{ color: 'var(--ink)' }}>{notes.length} notes</span>
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border-[2px] border-[var(--border)] bg-[var(--lime-light)]" style={{ borderRadius: '2px 6px 4px 8px', fontFamily: 'var(--font-body)' }}>
                <IconTag size={16} />
                <span className="text-sm sm:text-base font-semibold" style={{ color: 'var(--ink)' }}>{CATEGORIES.length} categories</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 sm:mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex-1 relative">
          <IconSearch size={20} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-light)' }} />
          <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Search by keyword, title, content..." className="doodle-input text-base sm:text-lg" style={{ paddingLeft: '48px', paddingTop: '14px', paddingBottom: '14px' }} />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <button
          onClick={() => setSelectedCat('')}
          className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 border-[2px] border-[var(--border)] text-sm sm:text-base transition-all ${
            !selectedCat ? 'bg-[var(--accent-light)] shadow-[var(--shadow-sm)] border-[var(--accent)]' : 'bg-[var(--bg-card)] hover:bg-[var(--accent-light)]'
          }`}
          style={{ borderRadius: '4px 8px 2px 6px', fontFamily: 'var(--font-body)' }}
        >
          <IconGrid size={16} /> All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 border-[2px] border-[var(--border)] text-sm sm:text-base capitalize transition-all ${
              selectedCat === cat ? 'bg-[var(--accent-light)] shadow-[var(--shadow-sm)] border-[var(--accent)]' : 'bg-[var(--bg-card)] hover:bg-[var(--accent-light)]'
            }`}
            style={{ borderRadius: '2px 6px 4px 8px', fontFamily: 'var(--font-body)' }}
          >
            <IconTag size={16} /> {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-5">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-6 sm:p-8 animate-pulse" style={{ borderRadius: '8px 14px 6px 16px' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[var(--border-light)] rounded" />
                <div><div className="h-5 w-32 bg-[var(--border-light)] rounded mb-1" /><div className="h-3 w-24 bg-[var(--border-light)] rounded" /></div>
              </div>
              <div className="h-8 w-3/5 bg-[var(--yellow)]/30 rounded mb-3" />
              <div className="h-5 w-full bg-[var(--border-light)] rounded mb-2" />
              <div className="h-5 w-4/5 bg-[var(--border-light)] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && notes.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <IconSearch size={64} className="mx-auto mb-4" style={{ opacity: 0.2, color: 'var(--ink)' }} />
          <h3 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: 'var(--ink)' }}>No notes found</h3>
          <p className="text-lg" style={{ color: 'var(--ink-light)' }}>
            {searchQuery ? `No results for "${searchQuery}"` : 'Be the first to share a note!'}
          </p>
        </div>
      )}

      {/* Feed Cards — full width, bigger fonts */}
      {!loading && notes.length > 0 && (
        <div className="space-y-5 sm:space-y-6">
          {notes.map((note, i) => {
            const authorEmail = note.authorEmail || note.userId || 'anonymous';
            const authorName = authorEmail.includes('@') ? authorEmail.split('@')[0] : authorEmail;
            const authorInitial = authorName.charAt(0).toUpperCase();
            const avatarColors = ['#ff6b9d', '#4ecdc4', '#a8e06c', '#ff8a5c', '#b57bee', '#ffe156'];
            const colorIdx = authorName.charCodeAt(0) % avatarColors.length;

            return (
              <article
                key={note.noteId}
                className="bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] overflow-hidden transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow-hover)] animate-fade-up"
                style={{
                  borderRadius: `${8 + (i % 3) * 2}px ${14 - (i % 2) * 4}px ${6 + (i % 4)}px ${16 - (i % 3) * 3}px`,
                  boxShadow: 'var(--shadow)',
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                {/* Author row + Star */}
                <div className="px-5 sm:px-8 pt-5 sm:pt-6 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 border-[2px] border-[var(--border)] flex items-center justify-center text-sm sm:text-base font-bold shrink-0"
                      style={{ borderRadius: '4px 2px 6px 2px', background: avatarColors[colorIdx], fontFamily: 'var(--font-hand)', color: '#2d2d2d' }}
                    >
                      {authorInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base sm:text-lg font-semibold leading-tight truncate" style={{ fontFamily: 'var(--font-hand)', color: 'var(--ink)' }}>
                        {authorName}
                      </p>
                      <p className="text-xs sm:text-sm leading-tight flex items-center gap-1" style={{ color: 'var(--ink-light)' }}>
                        <IconClock size={12} /> {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleToggleStar(note.noteId)} className="p-2 hover:scale-125 transition-transform" style={{ color: starred.has(note.noteId) ? '#e6c800' : 'var(--ink-light)' }}>
                    <IconStar size={24} filled={starred.has(note.noteId)} />
                  </button>
                </div>

                {/* Content + Right side (tags + download) */}
                <div className="px-5 sm:px-8 pb-5 sm:pb-6">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl leading-tight mb-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, color: 'var(--ink)' }}>
                    {note.title}
                  </h2>
                  <p className="text-base sm:text-lg leading-relaxed mb-4 line-clamp-3" style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-body)' }}>
                    {note.content}
                  </p>

                  {/* Bottom row: tags left, download right */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 border-[2px] border-[var(--border)] capitalize flex items-center gap-1.5 ${catColors[note.category] || catColors.general}`}
                      style={{ borderRadius: '4px 8px 2px 6px', fontFamily: 'var(--font-body)' }}
                    >
                      <IconTag size={16} /> {note.category}
                    </span>

                    <div className="flex items-center gap-3">
                      {note.fileKey && (
                        <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--ink-light)' }}>
                          <IconFile size={16} /> File
                        </span>
                      )}
                      {note.fileKey && (
                        <button
                          onClick={() => handleDownload(note.fileKey!)}
                          className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border-[2px] border-[var(--border)] text-sm sm:text-base font-semibold transition-all hover:translate-y-[-1px] hover:shadow-[var(--shadow-sm)]"
                          style={{ borderRadius: '2px 6px 4px 8px', color: 'var(--blue)', background: 'var(--bg-card)', fontFamily: 'var(--font-body)' }}
                        >
                          <IconDownload size={18} /> Download
                        </button>
                      )}
                    </div>
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
