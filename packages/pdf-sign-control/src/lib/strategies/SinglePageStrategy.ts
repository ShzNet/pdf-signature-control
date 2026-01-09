import { PDFDocumentProxy } from 'pdfjs-dist';
import { EventBus } from '../utils/EventBus.js';
import { PdfPageView } from '../engine/PdfPageView.js';
import { IViewModeStrategy } from './IViewModeStrategy.js';
import { SignatureField } from '../types.js';

/**
 * Single page viewing strategy - displays one page at a time.
 */
export class SinglePageStrategy implements IViewModeStrategy {
    private container!: HTMLElement;
    private pdfDocument!: PDFDocumentProxy;
    private eventBus!: EventBus;

    private currentPage = 1;
    private totalPages = 0;
    private scale = 1.0;

    private pageView: PdfPageView | null = null;
    private pageContainer!: HTMLElement;
    private zoomTimeout: ReturnType<typeof setTimeout> | null = null;
    private fields: SignatureField[] = [];
    private pageInfo: Map<number, { width: number, height: number }> = new Map();

    async init(container: HTMLElement, pdfDocument: PDFDocumentProxy, eventBus: EventBus, initialScale?: number, pageInfo?: Map<number, { width: number, height: number }>): Promise<void> {
        this.container = container;
        this.pdfDocument = pdfDocument;
        this.eventBus = eventBus;
        this.totalPages = pdfDocument.numPages;
        this.scale = initialScale ?? 1.0;
        this.pageInfo = pageInfo ?? new Map();

        this.initContainer();
        await this.renderCurrentPage();
    }

    private initContainer(): void {
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.padding = '20px';

        this.pageContainer = document.createElement('div');
        this.pageContainer.className = 'single-page-container';
        this.container.appendChild(this.pageContainer);
    }

    private async renderCurrentPage(): Promise<void> {
        if (this.pageView) {
            this.pageView.destroy();
            this.pageView = null;
        }

        this.pageContainer.innerHTML = '';

        // 1. Create structure immediately
        // We assume pageInfo is populated by PdfViewer logic upfront.
        const pageIndex = this.currentPage - 1;
        const pageDims = this.pageInfo.get(pageIndex);

        this.pageView = new PdfPageView({
            container: this.pageContainer,
            pageIndex: pageIndex,
            scale: this.scale,
            eventBus: this.eventBus,
            pageDimensions: pageDims
        });

        const pageFields = this.fields.filter(f => f.pageNumber === (pageIndex + 1));
        this.pageView.setFields(pageFields);

        // 2. Load page content in background
        this.pdfDocument.getPage(this.currentPage).then(pdfPage => {
            // Ensure we are still on the same page view
            if (this.pageView && this.pageView.pageIndex === (pdfPage.pageNumber - 1)) {
                this.pageView.setPdfPage(pdfPage);
            }
        }).catch(err => {
            console.error(`Error loading page ${this.currentPage}:`, err);
        });

        // 3. Emit event immediately
        this.eventBus.emit('page:change', {
            page: this.currentPage,
            total: this.totalPages
        });
    }

    goToPage(pageNumber: number): void {
        if (pageNumber < 1 || pageNumber > this.totalPages) return;
        this.currentPage = pageNumber;
        this.renderCurrentPage();
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
        if (this.pageView) {
            this.pageView.updateScalePreview(scale);
        }
        this.eventBus.emit('scale:change', { scale });

        // Debounced: full quality render after user stops zooming
        if (this.zoomTimeout) {
            clearTimeout(this.zoomTimeout);
        }
        this.zoomTimeout = setTimeout(() => {
            if (this.pageView) {
                this.pageView.updateScaleFull(scale);
            }
            this.zoomTimeout = null;
        }, 150);
    }

    getScale(): number {
        return this.scale;
    }

    setFields(fields: SignatureField[]): void {
        this.fields = fields;
        if (this.pageView) {
            const pageFields = this.fields.filter(f => f.pageNumber === this.currentPage);
            this.pageView.setFields(pageFields);
        }
    }

    destroy(): void {
        if (this.zoomTimeout) {
            clearTimeout(this.zoomTimeout);
            this.zoomTimeout = null;
        }
        if (this.pageView) {
            this.pageView.destroy();
            this.pageView = null;
        }
        this.container.innerHTML = '';
    }
}
