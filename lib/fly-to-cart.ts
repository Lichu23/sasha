// A copy of a product photo flies from where it is (its card, or the photo of the product's sheet) into the header's
// cart button, so an add shows where the product went. WAAPI on transform and opacity only: no React state, no layout.

const DURATION = 450;
// Strong ease-in-out: the copy moves across the screen rather than entering or leaving.
const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";

/** Resolves when the copy reaches the cart, right away when there is nothing to animate. */
export function flyToCart(source: Element | null | undefined): Promise<void> {
  const target = document.querySelector("[data-cart-target]");
  if (!source || !target || matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  // A square cut of the photo, from its middle, so a wide photo (the product's sheet) doesn't fly as a thin strip.
  const size = Math.min(from.width, from.height);
  const left = from.left + (from.width - size) / 2;
  const top = from.top + (from.height - size) / 2;
  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${left}px`,
    top: `${top}px`,
    width: `${size}px`,
    height: `${size}px`,
    margin: "0",
    overflow: "hidden",
    borderRadius: "1.5rem",
    zIndex: "60",
    pointerEvents: "none",
    willChange: "transform, opacity",
  });
  document.body.append(ghost);

  const dx = to.left + to.width / 2 - (left + size / 2);
  const dy = to.top + to.height / 2 - (top + size / 2);
  // Lands a little smaller than the button, as if dropped into the bag.
  const scale = (to.width * 0.7) / size;

  const flight = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.4 },
    ],
    { duration: DURATION, easing: EASE_IN_OUT },
  );

  return flight.finished.then(
    () => ghost.remove(),
    () => ghost.remove(),
  );
}
