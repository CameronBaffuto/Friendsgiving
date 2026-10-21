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
    const startedOnBackdrop = useRef(false);

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
            } else {
                element.style.removeProperty('max-height');
                element.style.removeProperty('bottom');
            }
        };
        fitViewport();
        viewport?.addEventListener('resize', fitViewport);
        viewport?.addEventListener('scroll', fitViewport);
        element.showModal();
        // Focus the title, rather than opening the mobile keyboard immediately.
        element.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });

        return () => {
            viewport?.removeEventListener('resize', fitViewport);
            viewport?.removeEventListener('scroll', fitViewport);
            element.close();
            document.body.style.overflow = overflow;
            const target = previous?.isConnected ? previous : document.getElementById('bring-button');
            target?.focus({ preventScroll: true });
        };
    }, []);

    function outside(element: HTMLDialogElement, x: number, y: number) {
        const rect = element.getBoundingClientRect();
        return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
    }

    return <dialog ref={dialog} className={`sheet ${className}`} aria-labelledby={titleId}
        onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
        onPointerDown={event => {
            startedOnBackdrop.current = event.target === event.currentTarget && outside(event.currentTarget, event.clientX, event.clientY);
        }}
        onPointerCancel={() => { startedOnBackdrop.current = false; }}
        onClick={event => {
            const dismiss = startedOnBackdrop.current && event.target === event.currentTarget && outside(event.currentTarget, event.clientX, event.clientY);
            startedOnBackdrop.current = false;
            // A swipe that starts inside the form must not accidentally dismiss it.
            if (dismiss && !busy) onClose();
        }}>
        <button type="button" className="close-button" aria-label="Close sheet" disabled={busy} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="m4 4 12 12M16 4 4 16" stroke="currentColor" strokeWidth="1.3" /></svg>
        </button>
        {children}
    </dialog>;
}
