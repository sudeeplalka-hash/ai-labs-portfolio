// A dialog may open another dialog. Only the last owner releases the original
// inline overflow value; native <dialog> owns focus containment and inertness.
const scrollLocks = new WeakMap<Document, { count: number; overflow: string }>();

export function lockDialogScroll(doc: Document): () => void {
  const lock = scrollLocks.get(doc) ?? { count: 0, overflow: doc.body.style.overflow };
  lock.count += 1;
  scrollLocks.set(doc, lock);
  doc.body.style.overflow = "hidden";
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lock.count -= 1;
    if (lock.count === 0) {
      doc.body.style.overflow = lock.overflow;
      scrollLocks.delete(doc);
    }
  };
}

export function restoreVisibleFocus(target: HTMLElement | null, doc: Document): void {
  if (target?.isConnected && target.getClientRects().length && !target.closest("[inert]")) {
    target.focus({ preventScroll: true });
    return;
  }
  const fallback = doc.querySelector<HTMLElement>("main h1, main, h1");
  if (!fallback) return;
  const previous = fallback.getAttribute("tabindex");
  fallback.setAttribute("tabindex", "-1");
  fallback.focus({ preventScroll: true });
  if (previous === null) fallback.removeAttribute("tabindex");
  else fallback.setAttribute("tabindex", previous);
}
