// True when the user asked the OS to reduce motion (browser only)
export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
