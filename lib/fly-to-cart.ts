// A copy of a product photo flies from its card into the header's cart button, so a quick add
// shows where the product went. WAAPI on transform and opacity only: no React state, no layout.

const DURATION = 450;
// Strong ease-in-out: the copy moves across the screen rather than entering or leaving.
const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";

// The header's bag listens to these to show its states: waiting for the product, then received.
export const CART_INCOMING = "cart:incoming";
export const CART_LANDED = "cart:landed";

/** Resolves when the copy reaches the cart, right away when there is nothing to animate. */
export function flyToCart(source: Element | null | undefined): Promise<void> {
  const target = document.querySelector("[data-cart-target]");
  if (!source || !target || matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    zIndex: "60",
    pointerEvents: "none",
    willChange: "transform, opacity",
  });
  document.body.append(ghost);
  window.dispatchEvent(new Event(CART_INCOMING));

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  // Lands a little smaller than the button, as if dropped into the bag.
  const scale = (to.width * 0.7) / from.width;

  const flight = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.4 },
    ],
    { duration: DURATION, easing: EASE_IN_OUT },
  );

  const land = () => {
    ghost.remove();
    window.dispatchEvent(new Event(CART_LANDED));
  };
  return flight.finished.then(land, land);
}
