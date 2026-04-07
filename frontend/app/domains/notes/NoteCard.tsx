'use client';

import { type Note } from './api';
import { IconEdit, IconTrash, IconShare, IconDownload, IconFile, IconTag, IconClock, IconBookmark } from '../../shared/icons/Icons';

const catClass: Record<string, string> = {
  general: 'cat-general', lecture: 'cat-lecture', assignment: 'cat-assignment',
  exam: 'cat-exam', project: 'cat-project', personal: 'cat-personal',
};

interface NoteCardProps {
  note: Note;
  index: number;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onShare?: (noteId: string) => void;
  onDownload?: (fileKey: string) => void;
  showAuthor?: boolean;
  isOwner?: boolean;
}

export default function NoteCard({ note, index, onEdit, onDelete, onShare, onDownload, showAuthor = false, isOwner = true }: NoteCardProps) {
  const authorEmail = note.authorEmail || note.userId || 'anonymous';
  const authorName = authorEmail.includes('@') ? authorEmail.split('@')[0] : authorEmail;
  const authorInitial = authorName.charAt(0).toUpperCase();

  const avatarColors = ['#ff6b9d', '#4ecdc4', '#a8e06c', '#ff8a5c', '#b57bee', '#ffe156'];
  const colorIndex = authorName.charCodeAt(0) % avatarColors.length;

  return (
    <div
      className="group bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-5 transition-all duration-200 hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[var(--shadow-hover)] animate-fade-up relative"
      style={{
        borderRadius: `${6 + (index % 3) * 4}px ${12 - (index % 2) * 6}px ${4 + (index % 4) * 3}px ${14 - (index % 3) * 4}px`,
        boxShadow: 'var(--shadow)',
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {/* Author identity */}
      {showAuthor && (
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b-[1.5px] border-dashed border-[var(--border-light)]">
          <div
            className="w-8 h-8 border-[2px] border-[var(--border)] flex items-center justify-center text-xs font-bold shrink-0"
            style={{ borderRadius: '4px 2px 6px 2px', background: avatarColors[colorIndex], fontFamily: 'var(--font-hand)' }}
          >
            {authorInitial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate" style={{ fontFamily: 'var(--font-hand)', fontSize: '16px' }}>
              {authorName}
            </p>
            <p className="text-[11px] leading-tight" style={{ color: 'var(--ink-light)' }}>{authorEmail}</p>
          </div>
        </div>
      )}

      {/* Title + Category */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold leading-snug pr-2 line-clamp-2" style={{ fontFamily: 'var(--font-hand)', fontSize: '22px', fontWeight: 600 }}>
          {note.title}
        </h3>
        <span
          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 border-[1.5px] border-[var(--border)] capitalize flex items-center gap-1 ${catClass[note.category] || catClass.general}`}
          style={{ borderRadius: '2px 6px 2px 6px', fontFamily: 'var(--font-body)' }}
        >
          <IconTag size={10} />
          {note.category}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-3 line-clamp-3" style={{ color: 'var(--ink-light)' }}>
        {note.content}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs mb-3" style={{ color: 'var(--ink-light)' }}>
        <span className="flex items-center gap-1">
          <IconClock size={12} />
          {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
        <div className="flex items-center gap-2">
          {note.fileKey && onDownload && (
            <button onClick={() => onDownload(note.fileKey!)} className="flex items-center gap-1 text-[var(--blue)] hover:underline text-xs font-medium">
              <IconDownload size={12} /> Download
            </button>
          )}
          {note.isShared && (
            <span className="bg-[var(--purple-light)] text-[var(--purple)] px-2 py-0.5 border border-[var(--purple)]/30 text-[10px] font-bold flex items-center gap-1" style={{ borderRadius: '2px 4px 2px 4px' }}>
              <IconShare size={10} /> Shared
            </span>
          )}
          {note.fileKey && (
            <span className="flex items-center gap-1 text-[var(--ink-light)]">
              <IconFile size={12} />
            </span>
          )}
        </div>
      </div>

      {/* Actions — only for owner */}
      {isOwner && !note.isShared && (onEdit || onDelete || onShare) && (
        <div className="flex flex-wrap gap-2 pt-3 border-t-[1.5px] border-dashed border-[var(--border-light)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={() => onEdit(note)} className="btn-doodle btn-outline text-xs py-1.5 px-3 !w-auto flex-1 sm:flex-none flex items-center gap-1">
              <IconEdit size={13} /> Edit
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(note.noteId)} className="btn-doodle btn-danger text-xs py-1.5 px-3 !w-auto flex-1 sm:flex-none flex items-center gap-1">
              <IconTrash size={13} /> Delete
            </button>
          )}
          {onShare && (
            <button onClick={() => onShare(note.noteId)} className="btn-doodle btn-outline text-xs py-1.5 px-3 !w-auto flex-1 sm:flex-none flex items-center gap-1">
              <IconShare size={13} /> Share
            </button>
          )}
        </div>
      )}
    </div>
  );
}
