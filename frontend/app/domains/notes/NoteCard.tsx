'use client';

import { type Note } from './api';
import { IconTag, IconClock, IconDownload } from '../../shared/icons/Icons';

const catClass: Record<string, string> = {
  general: 'cat-general', lecture: 'cat-lecture', assignment: 'cat-assignment',
  exam: 'cat-exam', project: 'cat-project', personal: 'cat-personal',
};

interface NoteCardProps { note: Note; index: number; showAuthor?: boolean; isOwner?: boolean; onDownload?: (fileKey: string) => void; }

export default function NoteCard({ note, index, onDownload }: NoteCardProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 transition-all hover:shadow-[var(--shadow-md)] animate-fade-up"
      style={{ borderRadius: 'var(--radius)', animationDelay: `${index * 0.04}s` }}>
      <h3 className="text-base font-semibold mb-1 line-clamp-1">{note.title}</h3>
      <p className="text-sm text-[var(--ink-secondary)] line-clamp-2 mb-3 leading-relaxed">{note.content}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${catClass[note.category] || catClass.general}`}>{note.category}</span>
          <span className="text-[11px] text-[var(--ink-muted)] flex items-center gap-1"><IconClock size={11} />{new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        </div>
        {note.fileKey && onDownload && (
          <button onClick={() => onDownload(note.fileKey!)} className="text-xs text-[var(--blue)] hover:underline flex items-center gap-1"><IconDownload size={12} />Download</button>
        )}
      </div>
    </div>
  );
}
