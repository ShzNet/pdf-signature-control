import { PDFDocumentProxy } from 'pdfjs-dist';
import { EventBus } from '../utils/EventBus.js';
import { PdfPageView } from '../engine/PdfPageView.js';
import { IViewModeStrategy } from './IViewModeStrategy.js';
import { SignatureField } from '../types.js';

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
    private observer: IntersectionObserver | null = null;
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
            this.setupIntersectionObserver();
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

        // 2. Load pages in parallel (progressive/background rendering)
        // We do NOT await this. This allows the viewer to be "ready" for interaction (adding fields)
        // immediately after structure is created. Content will appear as it loads.
        this.pageViews.forEach(async (pageView, index) => {
            if (this.isDestroyed) return;
            try {
                const pdfPage = await this.pdfDocument.getPage(index + 1);
                if (!this.isDestroyed) {
                    pageView.setPdfPage(pdfPage);
                }
            } catch (error) {
                console.error(`Error loading page ${index + 1}:`, error);
            }
        });

        // 3. Emit initial event immediately (structure is ready)
        if (this.isDestroyed) return;

        this.eventBus.emit('page:change', {
            page: this.currentPage,
            total: this.totalPages
        });
    }

    private setupIntersectionObserver(): void {
        if (this.observer) {
            this.observer.disconnect();
        }

        const options: IntersectionObserverInit = {
            root: this.container,
            threshold: 0.5
        };

        this.observer = new IntersectionObserver((entries) => {
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
            this.observer?.observe(pv.element);
        });
    }

    goToPage(pageNumber: number): void {
        if (pageNumber < 1 || pageNumber > this.totalPages) return;

        const pageView = this.pageViews[pageNumber - 1];
        if (pageView) {
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
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.pageViews.forEach(pv => pv.destroy());
        this.pageViews = [];
        this.container.innerHTML = '';
    }
}
