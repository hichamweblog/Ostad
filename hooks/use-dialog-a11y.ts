'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Adds the two behaviours every hand-written modal in the app was missing:
 * keyboard focus stays inside the panel, and Escape closes it.
 *
 * Usage:
 *   const dialogRef = useDialogA11y(isOpen, () => setOpen(false));
 *   <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="...">
 *
 * The hook is deliberately markup-agnostic so legacy panels keep their exact
 * styling; it only moves focus, traps Tab/Shift+Tab, restores the previous
 * focus target on close, and locks background scrolling.
 */
export function useDialogA11y(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        element => element.offsetParent !== null && element.getAttribute('aria-hidden') !== 'true',
      );

    const firstField = panel.querySelector<HTMLElement>(
      'input:not([type="hidden"]), select, textarea',
    );
    (firstField || focusables()[0] || panel).focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      const index = activeElement ? items.indexOf(activeElement) : -1;

      if (event.shiftKey) {
        if (index <= 0) {
          event.preventDefault();
          items[items.length - 1].focus();
        }
        return;
      }

      if (index === -1 || index === items.length - 1) {
        event.preventDefault();
        items[0].focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = overflow;
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, [open]);

  return panelRef;
}
