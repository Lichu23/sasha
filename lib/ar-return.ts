/**
 * Leaving AR can reload the page (or close the sheet) on some phones. Before AR opens we note which
 * product, size and quantity were open, so the catalog can put the person back exactly there.
 */
const KEY = "ar-return";
const MAX_AGE_MS = 5 * 60_000;

export type ArReturn = { productId: number; sizeId: string; quantity: number; scrollY: number };

export function saveArReturn(state: ArReturn) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...state, at: Date.now() }));
  } catch {}
}

export function peekArReturn(): ArReturn | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    return raw && Date.now() - raw.at < MAX_AGE_MS ? raw : null;
  } catch {
    return null;
  }
}

export function clearArReturn() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
