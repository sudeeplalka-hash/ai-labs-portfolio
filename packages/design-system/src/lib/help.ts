/** Check ownership at dismissal time, after focus has had time to enter portaled help. */
export function createHelpDismissal(keepOpen: () => boolean, close: () => void, delay = 160) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
  return {
    cancel,
    schedule() {
      cancel();
      timer = setTimeout(() => { timer = undefined; if (!keepOpen()) close(); }, delay);
    },
  };
}
