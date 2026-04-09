/**
 * Opt-in debug logs for scroll lazy-load / unload.
 * Enable in the browser console:
 *   localStorage.setItem('pdf-sign-debug', '1'); location.reload();
 * Or before creating the viewer:
 *   (globalThis as any).__PDF_SIGN_DEBUG__ = true;
 */
export function isPdfSignLazyDebugEnabled(): boolean {
    try {
        if (
            typeof globalThis !== 'undefined' &&
            (globalThis as unknown as { __PDF_SIGN_DEBUG__?: boolean }).__PDF_SIGN_DEBUG__ === true
        ) {
            return true;
        }
        if (typeof localStorage !== 'undefined' && localStorage.getItem('pdf-sign-debug') === '1') {
            return true;
        }
    } catch {
        /* private mode / SSR */
    }
    return false;
}

export function pdfSignLazyDebug(tag: string, detail: Record<string, unknown>): void {
    if (!isPdfSignLazyDebugEnabled()) return;
    console.debug(`[pdf-sign:lazy] ${tag}`, detail);
}
