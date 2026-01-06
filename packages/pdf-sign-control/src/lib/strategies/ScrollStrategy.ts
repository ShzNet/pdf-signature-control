import { PDFDocumentProxy } from 'pdfjs-dist';
import { EventBus } from '../utils/EventBus.js';
import { PdfPageView } from '../engine/PdfPageView.js';
import { IViewModeStrategy } from './IViewModeStrategy.js';

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
    private observer: IntersectionObserver | null = null;
    private zoomTimeout: ReturnType<typeof setTimeout> | null = null;

    async init(container: HTMLElement, pdfDocument: PDFDocumentProxy, eventBus: EventBus): Promise<void> {
        this.container = container;
        this.pdfDocument = pdfDocument;
        this.eventBus = eventBus;
        this.totalPages = pdfDocument.numPages;

        this.initContainer();
        await this.renderAllPages();
        this.setupIntersectionObserver();
    }

    private initContainer(): void {
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '20px';
        this.container.style.alignItems = 'center';
        this.container.style.padding = '20px';
    }

    private async renderAllPages(): Promise<void> {
        this.pageViews.forEach(pv => pv.destroy());
        this.pageViews = [];

        for (let i = 1; i <= this.totalPages; i++) {
            const pdfPage = await this.pdfDocument.getPage(i);

            const pageView = new PdfPageView({
                container: this.container,
                pageIndex: i - 1,
                scale: this.scale,
                eventBus: this.eventBus
            });

            pageView.setPdfPage(pdfPage);
            this.pageViews.push(pageView);
        }

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
        this.scale = scale;

        // Immediate: low-quality preview for responsiveness
        this.pageViews.forEach(pv => pv.updateScalePreview(scale));
        this.eventBus.emit('scale:change', { scale });

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

    destroy(): void {
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
