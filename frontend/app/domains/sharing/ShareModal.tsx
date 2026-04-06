'use client';

import { useState } from 'react';
import Modal from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { shareNote } from './api';

interface ShareModalProps {
  noteId: string | null;
  onClose: () => void;
}

export default function ShareModal({ noteId, onClose }: ShareModalProps) {
  const [email, setEmail] = useState('');

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!noteId) return;
    try {
      await shareNote(noteId, email);
      showToast(`Shared with ${email} 📤`, 'success');
      setEmail('');
      onClose();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  }

  return (
    <Modal open={!!noteId} onClose={onClose}>
      <div className="text-center mb-4"><span className="text-5xl">📤</span></div>
      <h3 className="text-2xl text-center mb-2" style={{ fontFamily: 'var(--font-hand)', fontWeight: 600 }}>Share Note</h3>
      <p className="text-sm text-center mb-4" style={{ color: 'var(--ink-light)' }}>Enter their email address</p>
      <form onSubmit={handleShare}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="friend@university.edu" required className="doodle-input mb-4" />
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={onClose} className="btn-doodle btn-outline">Cancel</button>
          <button type="submit" className="btn-doodle btn-primary">Share! ✨</button>
        </div>
      </form>
    </Modal>
  );
}
