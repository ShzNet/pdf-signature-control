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
        this.container.style.alignItems = '';
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
        const oldScale = this.scale;
        const newScale = scale;

        // 1. Calculate center point relative to the content (scroll + viewport center)
        // We use the pageView or pageContainer to get the reliable content dimensions/offsets if needed,
        // but for SinglePage with flex centering `margin: auto`, simple ratio on scroll position + viewport center works well.
        const container = this.container;
        const clientWidth = container.clientWidth;
        const clientHeight = container.clientHeight;

        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        const centerX = scrollLeft + clientWidth / 2;
        const centerY = scrollTop + clientHeight / 2;

        // Ratio of new scale to old scale
        const ratio = newScale / oldScale;

        this.scale = scale;

        // Immediate: low-quality preview for responsiveness
        if (this.pageView) {
            this.pageView.updateScalePreview(scale);
        }
        this.eventBus.emit('scale:change', { scale });

        // 2. Adjust scroll position to keep the center point stable
        // New Center = Old Center * Ratio
        // New Scroll = New Center - Viewport Center

        // We need to wait for layout update roughly? 
        // Since we update styles synchronously in updateScalePreview, scrollWidth/Height should update reasonably fast.
        // However, standard DOM updates might be async. 
        // In this case, setting scroll immediately usually works if dimensions are updated synchronously via style.

        const newScrollLeft = centerX * ratio - clientWidth / 2;
        const newScrollTop = centerY * ratio - clientHeight / 2;

        container.scrollLeft = newScrollLeft;
        container.scrollTop = newScrollTop;

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

    selectField(fieldId: string | null): void {
        this.pageView?.selectField(fieldId);
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
