"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { lockDialogScroll, restoreVisibleFocus } from "../lib/modal";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  initialFocusRef?: RefObject<HTMLElement>;
}

/** Native modal dialogs provide top-layer stacking and inert background.
 * Explicit Tab boundaries keep focus out of browser chrome as well. */
export function Modal({ open, onClose, title, children, className, panelClassName, initialFocusRef }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlock = lockDialogScroll(document);
    dialog.showModal();
    initialFocusRef?.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      unlock();
      restoreVisibleFocus(previous, document);
    };
  }, [open, mounted, initialFocusRef]);

  if (!mounted || !open) return null;
  return createPortal(
    <dialog ref={ref} aria-label={title} aria-modal="true" tabIndex={-1}
      className={cn("fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-y-auto border-0 bg-ink/35 p-4 text-ink backdrop:bg-transparent", className)}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab" || (event.target as Element).closest("dialog") !== event.currentTarget) return;
        event.stopPropagation();
        const dialog = event.currentTarget;
        const targets = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]'))
          .filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && !element.closest("[inert]") && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden")
          .sort((a, b) => (a.tabIndex > 0 ? a.tabIndex : Infinity) - (b.tabIndex > 0 ? b.tabIndex : Infinity));
        const first = targets[0];
        const last = targets[targets.length - 1];
        const active = document.activeElement;
        if (!first) { event.preventDefault(); dialog.focus(); }
        else if (event.shiftKey && (active === first || active === dialog || !targets.includes(active as HTMLElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (active === last || !targets.includes(active as HTMLElement))) { event.preventDefault(); first.focus(); }
      }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={panelClassName}>{children}</div>
    </dialog>, document.body,
  );
}
