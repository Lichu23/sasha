"use client";

import { Drawer } from "@base-ui/react/drawer";

// Styled frames for Base UI's Drawer. Callers own the Root (open state, swipe direction)
// and use Drawer.Title / Drawer.Close directly, so each drawer composes its own content:
//
//   <Drawer.Root open={open} onOpenChange={setOpen}>
//     <BottomSheet>…</BottomSheet>
//   </Drawer.Root>
export { Drawer };

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

// Fades with the swipe, and speeds up its exit when the drawer is flung away.
const backdrop = `fixed inset-0 z-50 min-h-dvh bg-ink opacity-[calc(0.4*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ${EASE} data-swiping:duration-0 data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]`;

// Both panels run 3rem past the screen edge (the "bleed") so a fast swipe or an iOS
// overscroll never reveals a gap behind them.
const panel = `bg-cream text-ink shadow-2xl outline-none transition-transform duration-[450ms] ${EASE} data-swiping:select-none data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]`;

/** A sheet that rises from the bottom; swipe down to dismiss. Pair with swipeDirection="down" (the default). */
export function BottomSheet({ children }: { children: React.ReactNode }) {
  return (
    <Drawer.Portal>
      {/* forceRender: a sheet opened over another drawer still dims everything behind it. */}
      <Drawer.Backdrop forceRender className={backdrop} />
      <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
        <Drawer.Popup
          className={`${panel} relative -mb-12 flex max-h-[calc(92dvh+3rem)] w-full max-w-md flex-col overflow-y-auto overscroll-contain rounded-t-3xl pb-[calc(3rem+env(safe-area-inset-bottom))] [transform:translateY(var(--drawer-swipe-movement-y))] data-starting-style:[transform:translateY(calc(100%-3rem+2px))] data-ending-style:[transform:translateY(calc(100%-3rem+2px))]`}
        >
          <span aria-hidden="true" className="absolute top-2 left-1/2 z-10 h-1.5 w-12 -translate-x-1/2 rounded-full bg-paper/90 shadow" />
          {children}
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );
}

/** A full-height panel on the right; swipe right to dismiss. Pair with swipeDirection="right". */
export function SidePanel({ children }: { children: React.ReactNode }) {
  return (
    <Drawer.Portal>
      <Drawer.Backdrop className={backdrop} />
      <Drawer.Viewport className="fixed inset-0 z-50 flex justify-end">
        <Drawer.Popup
          className={`${panel} -mr-12 flex h-full w-[calc(100%+3rem)] max-w-[calc(28rem+3rem)] flex-col pr-12 sm:rounded-l-3xl [transform:translateX(var(--drawer-swipe-movement-x))] data-starting-style:[transform:translateX(calc(100%-3rem+2px))] data-ending-style:[transform:translateX(calc(100%-3rem+2px))]`}
        >
          {children}
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );
}
