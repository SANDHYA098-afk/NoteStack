'use client';

interface ModalProps { open: boolean; onClose: () => void; children: React.ReactNode; }

export default function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="relative bg-[var(--bg-card)] border-[2.5px] border-[var(--border)] p-8 w-full max-w-[420px] animate-scale-in"
        style={{ borderRadius: '6px 14px 4px 16px', boxShadow: '6px 6px 0px var(--border)' }}>
        {children}
      </div>
    </div>
  );
}
