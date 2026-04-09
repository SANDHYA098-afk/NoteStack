'use client';

import { useState } from 'react';
import Modal from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { shareNote } from './api';

export default function ShareModal({ noteId, onClose }: { noteId: string | null; onClose: () => void }) {
  const [email, setEmail] = useState('');

  async function handleShare(e: React.FormEvent) {
    e.preventDefault(); if (!noteId) return;
    try { await shareNote(noteId, email); showToast(`Shared with ${email}`, 'success'); setEmail(''); onClose(); }
    catch (err: unknown) { showToast((err as Error).message, 'error'); }
  }

  return (
    <Modal open={!!noteId} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-2">Share Note</h3>
      <p className="text-sm text-[var(--ink-muted)] mb-4">Enter the email of the person to share with</p>
      <form onSubmit={handleShare}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" required className="doodle-input mb-4" />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-doodle btn-outline">Cancel</button>
          <button type="submit" className="btn-doodle btn-primary">Share</button>
        </div>
      </form>
    </Modal>
  );
}
