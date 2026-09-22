import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Slate at a third, pulsing out from the card's edge and back. */
const HIGHLIGHT: Keyframe[] = [
  { boxShadow: "0 0 0 0 rgba(39, 74, 99, 0)" },
  { boxShadow: "0 0 0 4px rgba(39, 74, 99, 0.3)" },
  { boxShadow: "0 0 0 0 rgba(39, 74, 99, 0)" },
];

/**
 * Bring a section into view. Targets carry their own `scroll-mt-*`.
 *
 * `highlight` pulses the target's outline once, so a jump reads even when the
 * card was already on screen — on the one-page desktop layout the supply card
 * usually is. A highlighted target needs the card's rounded corners.
 */
export function scrollToSection(id: string, { highlight = true } = {}) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  if (highlight) target.animate(HIGHLIGHT, { duration: 1400, delay: 250, easing: "ease-in-out" });
}

/**
 * Scroll to whatever the URL's hash names, once `ready` — how "/tracker#supply"
 * opens on the supply card, and how the desktop redirects from /tracker and
 * /tips land on their part of the one page. Arriving from elsewhere is a
 * visible jump already, so nothing pulses.
 */
export function useScrollToHash(ready = true) {
  const { hash, key } = useLocation();
  useEffect(() => {
    if (ready && hash) scrollToSection(decodeURIComponent(hash.slice(1)), { highlight: false });
  }, [ready, hash, key]);
}
