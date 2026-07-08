import { PDFDocumentProxy } from 'pdfjs-dist';
import { EventBus } from '../utils/EventBus.js';
import { PdfPageView } from '../engine/PdfPageView.js';
import { IViewModeStrategy } from './IViewModeStrategy.js';
import { SignatureField } from '../types.js';
import { pdfSignLazyDebug } from '../utils/lazyDebug.js';

/** Vertical margin around the scroll viewport for prefetch / delayed unload (CSS px). */
const LAZY_ROOT_MARGIN_PX = 480;
/** After leaving the expanded viewport, unload bitmaps after this delay to avoid thrash. */
const UNLOAD_DEBOUNCE_MS = 400;
/** Hard cap on PDF.js pages kept attached at once (prefetch can otherwise load many on tall screens). */
const MAX_ATTACHED_PDF_PAGES = 6;

/**
 * Scroll viewing strategy - displays all pages in a scrollable container.
 */
export class ScrollStrategy implements IViewModeStrategy {
    private container!: HTMLElement;
    private pdfDocument!: PDFDocumentProxy;
    private eventBus!: EventBus;

    private currentPage = 1;
    private totalPages = 0;
    private scale = 1.0;

    private pageViews: PdfPageView[] = [];
    private fields: SignatureField[] = [];
    /** Which page is most visible (toolbar / indicators). */
    private pageIndicatorObserver: IntersectionObserver | null = null;
    /** Near-viewport pages get PDF bytes; far pages unload to save memory. */
    private lazyVisibilityObserver: IntersectionObserver | null = null;
    private pageLoadPromises = new Map<number, Promise<void>>();
    private unloadTimers = new Map<number, ReturnType<typeof setTimeout>>();
    private zoomTimeout: ReturnType<typeof setTimeout> | null = null;
    private isDestroyed = false;
    private pageInfo: Map<number, { width: number, height: number }> = new Map();

    async init(container: HTMLElement, pdfDocument: PDFDocumentProxy, eventBus: EventBus, initialScale?: number, pageInfo?: Map<number, { width: number, height: number }>): Promise<void> {
        this.isDestroyed = false;
        this.container = container;
        this.pdfDocument = pdfDocument;
        this.eventBus = eventBus;
        this.totalPages = pdfDocument.numPages;
        this.scale = initialScale ?? 1.0;
        this.pageInfo = pageInfo ?? new Map();

        this.initContainer();
        await this.renderAllPages();
        if (!this.isDestroyed) {
            this.setupPageIndicatorObserver();
            this.setupLazyVisibilityObserver();
            pdfSignLazyDebug('scroll:init', {
                totalPages: this.totalPages,
                rootMarginPx: LAZY_ROOT_MARGIN_PX,
                unloadDebounceMs: UNLOAD_DEBOUNCE_MS,
                maxAttachedPages: MAX_ATTACHED_PDF_PAGES
            });
        }
    }

    private initContainer(): void {
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '20px';
        this.container.style.alignItems = '';
        this.container.style.padding = '20px';
        this.container.scrollTop = 0;
    }

    private async renderAllPages(): Promise<void> {
        this.pageViews.forEach(pv => pv.destroy());
        this.pageViews = [];

        // 1. Create page views with dimensions immediately available
        for (let i = 1; i <= this.totalPages; i++) {
            const pageDims = this.pageInfo.get(i - 1);
            const pageView = new PdfPageView({
                container: this.container,
                pageIndex: i - 1,
                scale: this.scale,
                eventBus: this.eventBus,
                pageDimensions: pageDims  // Pass dimensions immediately
            });

            const pageFields = this.fields.filter(f => f.pageNumber === i);
            pageView.setFields(pageFields);

            this.pageViews.push(pageView);
        }

        // 2. PDF page loading is deferred — IntersectionObserver + goToPage load only
        //    near-viewport pages. Shell size comes from pageInfo so scroll / goToPage work immediately.

        // 3. Emit initial event immediately (structure is ready)
        if (this.isDestroyed) return;

        this.eventBus.emit('page:change', {
            page: this.currentPage,
            total: this.totalPages
        });
    }

    private setupPageIndicatorObserver(): void {
        if (this.pageIndicatorObserver) {
            this.pageIndicatorObserver.disconnect();
        }

        const options: IntersectionObserverInit = {
            root: this.container,
            threshold: 0.5
        };

        this.pageIndicatorObserver = new IntersectionObserver((entries) => {
            let maxRatio = 0;
            let visiblePageIndex = this.currentPage - 1;

            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    const pageView = this.pageViews.find(pv => pv.element === entry.target);
                    if (pageView) {
                        visiblePageIndex = pageView.pageIndex;
                    }
                }
            });

            const newPage = visiblePageIndex + 1;
            if (newPage !== this.currentPage) {
                this.currentPage = newPage;
                this.eventBus.emit('page:change', {
                    page: this.currentPage,
                    total: this.totalPages
                });
            }
        }, options);

        this.pageViews.forEach(pv => {
            this.pageIndicatorObserver?.observe(pv.element);
        });
    }

    private setupLazyVisibilityObserver(): void {
        if (this.lazyVisibilityObserver) {
            this.lazyVisibilityObserver.disconnect();
        }

        const margin = `${LAZY_ROOT_MARGIN_PX}px 0px`;
        this.lazyVisibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const pageView = this.pageViews.find(pv => pv.element === entry.target);
                if (!pageView) return;
                const idx = pageView.pageIndex;

                if (entry.isIntersecting) {
                    pdfSignLazyDebug('io:near-viewport', {
                        page: idx + 1,
                        intersectionRatio: Math.round(entry.intersectionRatio * 1000) / 1000
                    });
                    this.cancelScheduledUnload(idx);
                    this.schedulePageLoad(idx);
                } else {
                    pdfSignLazyDebug('io:outside-band', { page: idx + 1 });
                    this.scheduleUnloadIfFar(idx);
                }
            });
        }, {
            root: this.container,
            rootMargin: margin,
            threshold: 0
        });

        this.pageViews.forEach(pv => {
            this.lazyVisibilityObserver?.observe(pv.element);
        });
    }

    private cancelScheduledUnload(pageIndex: number): void {
        const t = this.unloadTimers.get(pageIndex);
        if (t !== undefined) {
            clearTimeout(t);
            this.unloadTimers.delete(pageIndex);
            pdfSignLazyDebug('unload:timer-cancelled', { page: pageIndex + 1 });
        }
    }

    private scheduleUnloadIfFar(pageIndex: number): void {
        this.cancelScheduledUnload(pageIndex);
        pdfSignLazyDebug('unload:scheduled', {
            page: pageIndex + 1,
            delayMs: UNLOAD_DEBOUNCE_MS
        });
        const timer = setTimeout(() => {
            this.unloadTimers.delete(pageIndex);
            if (this.isDestroyed) return;
            if (this.isPageNearViewport(pageIndex)) {
                pdfSignLazyDebug('unload:aborted-still-near', { page: pageIndex + 1 });
                return;
            }
            const pv = this.pageViews[pageIndex];
            if (pv?.isPdfPageAttached()) {
                pdfSignLazyDebug('unload:releasing', {
                    page: pageIndex + 1,
                    reason: 'outside-expanded-viewport-after-debounce'
                });
                pv.unloadPdfPage();
            }
        }, UNLOAD_DEBOUNCE_MS);
        this.unloadTimers.set(pageIndex, timer);
    }

    private isPageNearViewport(pageIndex: number): boolean {
        const pv = this.pageViews[pageIndex];
        if (!pv) return false;
        const rootRect = this.container.getBoundingClientRect();
        const elRect = pv.element.getBoundingClientRect();
        const m = LAZY_ROOT_MARGIN_PX;
        const top = rootRect.top - m;
        const bottom = rootRect.bottom + m;
        return elRect.bottom >= top && elRect.top <= bottom;
    }

    /**
     * If prefetch loaded more than MAX_ATTACHED_PDF_PAGES, unload the farthest pages from the
     * scroll center (never the page we just attached; prefer pages outside the strict viewport).
     */
    private enforceAttachedPageLimit(protectPageIndex: number): void {
        const max = MAX_ATTACHED_PDF_PAGES;
        while (true) {
            const attachedIndices = this.pageViews
                .map((pv, idx) => ({ idx, pv }))
                .filter(({ pv }) => pv.isPdfPageAttached())
                .map(x => x.idx);
            if (attachedIndices.length <= max) break;

            const st = this.container.scrollTop;
            const ch = this.container.clientHeight;
            const centerY = st + ch / 2;

            let victim: number | null = null;
            let victimDist = -1;

            const score = (idx: number, allowInViewport: boolean) => {
                if (idx === protectPageIndex) return;
                const pv = this.pageViews[idx];
                const top = pv.element.offsetTop;
                const h = pv.element.offsetHeight;
                const inStrict = top + h > st && top < st + ch;
                if (!allowInViewport && inStrict) return;
                const dist = Math.abs(top + h / 2 - centerY);
                if (dist > victimDist) {
                    victimDist = dist;
                    victim = idx;
                }
            };

            for (const idx of attachedIndices) {
                score(idx, false);
            }
            if (victim === null) {
                for (const idx of attachedIndices) {
                    score(idx, true);
                }
            }
            if (victim === null) break;
            pdfSignLazyDebug('memory:evict-farthest', {
                page: victim + 1,
                attachedCount: attachedIndices.length,
                maxAttachedPages: max,
                protectPage: protectPageIndex + 1
            });
            this.pageViews[victim].unloadPdfPage();
        }
    }

    private schedulePageLoad(pageIndex: number): void {
        if (this.isDestroyed || pageIndex < 0 || pageIndex >= this.pageViews.length) {
            pdfSignLazyDebug('load:skip', {
                page: pageIndex >= 0 ? pageIndex + 1 : pageIndex,
                reason: this.isDestroyed ? 'destroyed' : 'invalid-index'
            });
            return;
        }
        const pv = this.pageViews[pageIndex];
        if (!pv || pv.isPdfPageAttached()) {
            pdfSignLazyDebug('load:skip', {
                page: pageIndex + 1,
                reason: !pv ? 'no-page-view' : 'already-attached'
            });
            return;
        }
        if (this.pageLoadPromises.has(pageIndex)) {
            pdfSignLazyDebug('load:skip', { page: pageIndex + 1, reason: 'already-in-flight' });
            return;
        }

        pdfSignLazyDebug('load:fetch-start', { page: pageIndex + 1 });
        const promise = (async () => {
            try {
                const pdfPage = await this.pdfDocument.getPage(pageIndex + 1);
                if (this.isDestroyed) {
                    pdfSignLazyDebug('load:aborted', { page: pageIndex + 1, reason: 'destroyed-after-getPage' });
                    return;
                }
                if (!this.isPageNearViewport(pageIndex)) {
                    pdfSignLazyDebug('load:discard-proxy', {
                        page: pageIndex + 1,
                        reason: 'no-longer-near-viewport'
                    });
                    try {
                        (pdfPage as { cleanup?: () => void }).cleanup?.();
                    } catch {
                        /* ignore */
                    }
                    return;
                }
                if (!pv.isPdfPageAttached()) {
                    pv.setPdfPage(pdfPage);
                    this.enforceAttachedPageLimit(pageIndex);
                    pdfSignLazyDebug('load:done', {
                        page: pageIndex + 1,
                        attachedNow: this.pageViews.filter(p => p.isPdfPageAttached()).length
                    });
                }
            } catch (error) {
                console.error(`Error loading page ${pageIndex + 1}:`, error);
            } finally {
                this.pageLoadPromises.delete(pageIndex);
            }
        })();

        this.pageLoadPromises.set(pageIndex, promise);
    }

    goToPage(pageNumber: number): void {
        if (pageNumber < 1 || pageNumber > this.totalPages) return;

        const pageView = this.pageViews[pageNumber - 1];
        if (pageView) {
            pdfSignLazyDebug('goto:request-load', { page: pageNumber });
            this.schedulePageLoad(pageNumber - 1);

            const containerTop = this.container.getBoundingClientRect().top;
            const pageTop = pageView.element.getBoundingClientRect().top;
            const scrollOffset = pageTop - containerTop + this.container.scrollTop;

            this.container.scrollTo({
                top: scrollOffset,
                behavior: 'smooth'
            });
        }
    }

    nextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

    previousPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    getCurrentPage(): number {
        return this.currentPage;
    }

    getTotalPages(): number {
        return this.totalPages;
    }

    setScale(scale: number): void {
        const oldScale = this.scale;

        // 1. Find the point in the center of the viewport
        const container = this.container;
        const clientHeight = container.clientHeight;
        const scrollTop = container.scrollTop;
        const viewportCenterY = scrollTop + clientHeight / 2;

        // 2. Determine which page is at the center
        let centerPageIndex = -1;
        let offsetOnPage = 0;

        // Iterate to find the page under the center
        // Note: This relies on the current DOM state before we change the scale
        for (let i = 0; i < this.pageViews.length; i++) {
            const pageView = this.pageViews[i];
            const pageTop = pageView.element.offsetTop;
            const pageHeight = pageView.element.offsetHeight;
            const pageBottom = pageTop + pageHeight;

            // Check if viewport center falls within this page (or the gap before it)
            if (viewportCenterY < pageBottom) {
                centerPageIndex = i;
                // Calculate how far into the page the center is (0 to 1.0)
                // If it's in the gap above, this might be negative, which is fine (relative to top of page)
                offsetOnPage = (viewportCenterY - pageTop) / pageHeight;
                break;
            }
        }

        // If we're past the last page, anchor to the bottom of the last page
        if (centerPageIndex === -1 && this.pageViews.length > 0) {
            centerPageIndex = this.pageViews.length - 1;
            const lastPage = this.pageViews[centerPageIndex];
            offsetOnPage = (viewportCenterY - lastPage.element.offsetTop) / lastPage.element.offsetHeight;
        }

        this.scale = scale;

        // Immediate: low-quality preview for responsiveness
        this.pageViews.forEach(pv => pv.updateScalePreview(scale));
        this.eventBus.emit('scale:change', { scale });

        // 3. Restore scroll position based on the anchored page
        if (centerPageIndex !== -1) {
            const pageView = this.pageViews[centerPageIndex];
            const newPageTop = pageView.element.offsetTop;
            const newPageHeight = pageView.element.offsetHeight;

            // Re-calculate absolute center Y
            const newViewportCenterY = newPageTop + (offsetOnPage * newPageHeight);

            // Set scroll top
            container.scrollTop = newViewportCenterY - clientHeight / 2;

            // Perform similar logic for horizontal scroll (much simpler, just ratio)
            const clientWidth = container.clientWidth;
            const scrollLeft = container.scrollLeft;
            const centerX = scrollLeft + clientWidth / 2;
            const ratio = scale / oldScale;
            container.scrollLeft = centerX * ratio - clientWidth / 2;
        }

        // Debounced: full quality render after user stops zooming
        if (this.zoomTimeout) {
            clearTimeout(this.zoomTimeout);
        }
        this.zoomTimeout = setTimeout(() => {
            this.pageViews.forEach(pv => pv.updateScaleFull(scale));
            this.zoomTimeout = null;
        }, 150);
    }

    getScale(): number {
        return this.scale;
    }

    setFields(fields: SignatureField[]): void {
        this.fields = fields;
        // Update all existing page views
        this.pageViews.forEach(pv => {
            const pageFields = this.fields.filter(f => f.pageNumber === pv.pageIndex + 1);
            pv.setFields(pageFields);
        });
    }

    selectField(fieldId: string | null): void {
        this.pageViews.forEach(pv => pv.selectField(fieldId));
    }



    destroy(): void {
        this.isDestroyed = true;
        if (this.zoomTimeout) {
            clearTimeout(this.zoomTimeout);
            this.zoomTimeout = null;
        }
        this.unloadTimers.forEach(t => clearTimeout(t));
        this.unloadTimers.clear();
        this.pageLoadPromises.clear();
        if (this.pageIndicatorObserver) {
            this.pageIndicatorObserver.disconnect();
            this.pageIndicatorObserver = null;
        }
        if (this.lazyVisibilityObserver) {
            this.lazyVisibilityObserver.disconnect();
            this.lazyVisibilityObserver = null;
        }
        this.pageViews.forEach(pv => pv.destroy());
        this.pageViews = [];
        this.container.innerHTML = '';
    }
}
