"use client";

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { m } from "motion/react";

type ArViewer = HTMLElement & { canActivateAR?: boolean; activateAR?: () => Promise<void> };

type ArRenderer = { presentedScene: unknown; onUpdateScene: () => void; guarded?: boolean };

// model-viewer 4.4.0 runs `arRenderer.onUpdateScene` on every `scale` change, also outside AR, and it crashes there
// (`presentedScene` is null). Skipping it while no AR session is open loses nothing: it only edits the AR scene.
function guardArRenderer(el: HTMLElement) {
  for (let proto = el as object | null; proto; proto = Object.getPrototypeOf(proto)) {
    for (const sym of Object.getOwnPropertySymbols(proto)) {
      let value: { arRenderer?: ArRenderer } | undefined;
      try {
        value = (el as unknown as Record<symbol, { arRenderer?: ArRenderer }>)[sym];
      } catch {
        continue;
      }
      const ar = value?.arRenderer;
      if (!ar || typeof ar.onUpdateScene !== "function" || ar.guarded) continue;
      const original = ar.onUpdateScene;
      ar.onUpdateScene = () => {
        if (ar.presentedScene) original();
      };
      ar.guarded = true;
      return;
    }
  }
}

export type ModelSize = { id: string; label: string };

/**
 * The model behind "Ver en mi mesa" (Google <model-viewer>). It loads out of sight, so the drawer keeps the product's
 * photo; the button opens the AR camera and only shows on phones that can do AR.
 */
export function ProductModel({
  src,
  name,
  scale = 1,
  sizes,
  sizeId,
  onSizeChange,
  onArChange,
}: {
  src: string;
  name: string;
  scale?: number;
  sizes: ModelSize[];
  sizeId: string;
  onSizeChange: (id: string) => void;
  /** Called with true when the AR camera opens and false when it closes. */
  onArChange?: (active: boolean) => void;
}) {
  const [ready, setReady] = useState(false);
  const [canAr, setCanAr] = useState(false);
  const [inAr, setInAr] = useState(false);
  const viewer = useRef<ArViewer | null>(null);

  useEffect(() => {
    // The library is large and touches `window`, so load it only when a detail sheet with a model opens.
    let live = true;
    import("@google/model-viewer").then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const el = viewer.current;
    if (!ready || !el) return;
    guardArRenderer(el);
    const onLoad = () => {
      setCanAr(Boolean(el.canActivateAR));
    };
    if ((el as { loaded?: boolean }).loaded) onLoad();
    const onStatus = (e: Event) => {
      const status = (e as CustomEvent<{ status: string }>).detail.status;
      const active = status !== "not-presenting" && status !== "failed";
      setInAr(active);
      onArChange?.(active);
    };
    el.addEventListener("load", onLoad);
    el.addEventListener("ar-status", onStatus);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("ar-status", onStatus);
    };
  }, [ready, onArChange]);

  // Closes the AR camera through the viewer's own exit button.
  const confirm = useCallback(
    () => viewer.current?.shadowRoot?.querySelector<HTMLElement>(".slot.exit-webxr-ar-button")?.click(),
    [],
  );

  if (!ready) return null;

  return (
    // The drawer keeps showing the photo: the model is loaded out of sight and only appears in the AR camera.
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 opacity-0" aria-hidden="true">
        {createElement("model-viewer", {
          ref: viewer,
          src,
          alt: `Modelo 3D: ${name}`,
          "camera-controls": true,
          "auto-rotate": true,
          "auto-rotate-delay": "0",
          "rotation-per-second": "40deg",
          // A fixed distance (not auto-fit), so a smaller size looks smaller. `scale` also sizes the AR model.
          "camera-orbit": "30deg 68deg 0.5m",
          "min-camera-orbit": "auto auto 0.3m",
          "max-camera-orbit": "auto auto 1.2m",
          scale: `${scale} ${scale} ${scale}`,
          "shadow-intensity": "1.2",
          // WebXR first: Scene Viewer (the Google app) crashes on some Android phones.
          "ar-modes": "webxr scene-viewer quick-look",
          "ar-scale": "fixed",
          ar: true,
          // Dragging the model turns it; it must not swipe the sheet away.
          "data-base-ui-swipe-ignore": "",
          style: { width: "100%", height: "100%", background: "transparent" },
        },
        // An empty ar-button slot replaces the library's own round AR icon; ours is the button below.
        createElement("span", { slot: "ar-button", hidden: true }),
        // Shown only inside the AR camera: pick a size (the model resizes at once), then confirm.
        inAr
          ? createElement(
              "div",
              { className: "absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-4" },
              createElement(
                "div",
                { className: "flex gap-2 rounded-full bg-paper/95 p-1.5 shadow" },
                ...sizes.map((s) =>
                  createElement(
                    "button",
                    {
                      key: s.id,
                      type: "button",
                      onClick: () => onSizeChange(s.id),
                      className: `rounded-full px-4 py-2 text-sm font-semibold ${s.id === sizeId ? "bg-brand text-white" : "text-ink"}`,
                    },
                    s.label,
                  ),
                ),
              ),
              createElement(
                "button",
                // eslint-disable-next-line react-hooks/refs -- the handler reads the ref only when tapped
                { type: "button", onClick: confirm, className: "rounded-full bg-brand px-8 py-3 font-semibold text-white shadow" },
                "Confirmar tamaño",
              ),
            )
          : null,
        )}
      </div>
      {canAr ? (
        <m.button
          type="button"
          onClick={() => viewer.current?.activateAR?.()}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pointer-events-auto absolute bottom-3 left-3 rounded-full bg-paper/95 px-3.5 py-1.5 text-sm font-semibold shadow"
        >
          Ver en mi mesa
        </m.button>
      ) : null}
    </div>
  );
}
