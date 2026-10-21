import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
export function Sheet({ titleId, busy = false, onClose, children, className = '' }: {
    titleId: string;
    busy?: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const element = dialog.current!;
        const previous = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const viewport = window.visualViewport;
        const fitViewport = () => {
            if (viewport && window.innerWidth < 640) {
                element.style.maxHeight = `${Math.max(120, viewport.height - 16)}px`;
                element.style.bottom = `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`;
            }
            else {
                element.style.removeProperty('max-height');
                element.style.removeProperty('bottom');
            }
        };
        fitViewport();
        viewport?.addEventListener('resize', fitViewport);
        viewport?.addEventListener('scroll', fitViewport);
        element.showModal();
        return () => { viewport?.removeEventListener('resize', fitViewport); viewport?.removeEventListener('scroll', fitViewport); element.close(); document.body.style.overflow = overflow; if (previous?.isConnected)
            previous.focus();
        else
            document.getElementById('bring-button')?.focus(); };
    }, []);
    return <dialog ref={dialog} className={`sheet ${className}`} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); if (!busy)
        onClose(); }} onClick={e => { if (e.target === e.currentTarget && !busy) {
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
            onClose();
    } }}>
    <button type="button" className="close-button" aria-label="Close sheet" disabled={busy} onClick={onClose}><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="m4 4 12 12M16 4 4 16" stroke="currentColor" strokeWidth="1.3"/></svg></button>
    {children}
  </dialog>;
}
