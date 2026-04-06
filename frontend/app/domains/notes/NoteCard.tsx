'use client';

import { type Note } from './api';

const catClass: Record<string, string> = {
  general: 'cat-general', lecture: 'cat-lecture', assignment: 'cat-assignment',
  exam: 'cat-exam', project: 'cat-project', personal: 'cat-personal',
};

const catEmoji: Record<string, string> = {
  general: '📝', lecture: '🎓', assignment: '📋', exam: '🧪', project: '🚀', personal: '💭',
};

interface NoteCardProps {
  note: Note;
  index: number;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onShare: (noteId: string) => void;
  onDownload: (fileKey: string) => void;
}

export default function NoteCard({ note, index, onEdit, onDelete, onShare, onDownload }: NoteCardProps) {
  return (
    <div
      className="group bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-5 transition-all duration-200 hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[var(--shadow-hover)] animate-fade-up relative"
      style={{
        borderRadius: `${6 + (index % 3) * 4}px ${12 - (index % 2) * 6}px ${4 + (index % 4) * 3}px ${14 - (index % 3) * 4}px`,
        boxShadow: 'var(--shadow)',
        animationDelay: `${index * 0.06}s`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold leading-snug pr-2 line-clamp-2" style={{ fontFamily: 'var(--font-hand)', fontSize: '22px', fontWeight: 600 }}>
          {note.title}
        </h3>
        <span
          className={`shrink-0 text-xs font-bold px-2.5 py-1 border-[1.5px] border-[var(--border)] capitalize ${catClass[note.category] || catClass.general}`}
          style={{ borderRadius: '2px 6px 2px 6px', fontFamily: 'var(--font-body)' }}
        >
          {catEmoji[note.category]} {note.category}
        </span>
      </div>

      <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: 'var(--ink-light)' }}>
        {note.content}
      </p>

      <div className="flex items-center justify-between text-xs mb-3" style={{ color: 'var(--ink-light)' }}>
        <span>📅 {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <div className="flex items-center gap-2">
          {note.fileKey && (
            <button onClick={() => onDownload(note.fileKey!)} className="text-[var(--blue)] hover:underline text-sm font-medium">📎 Download</button>
          )}
          {note.isShared && (
            <span className="bg-[var(--purple-light)] text-[var(--purple)] px-2 py-0.5 border border-[var(--purple)]/30 text-[11px] font-bold" style={{ borderRadius: '2px 4px 2px 4px' }}>
              Shared
            </span>
          )}
        </div>
      </div>

      {!note.isShared && (
        <div className="flex flex-wrap gap-2 pt-3 border-t-[1.5px] border-dashed border-[var(--border-light)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(note)} className="btn-doodle btn-outline text-sm py-1.5 px-3 !w-auto flex-1 sm:flex-none">✏️ Edit</button>
          <button onClick={() => onDelete(note.noteId)} className="btn-doodle btn-danger text-sm py-1.5 px-3 !w-auto flex-1 sm:flex-none">🗑️ Delete</button>
          <button onClick={() => onShare(note.noteId)} className="btn-doodle btn-outline text-sm py-1.5 px-3 !w-auto flex-1 sm:flex-none">📤 Share</button>
        </div>
      )}
    </div>
  );
}
