import { PDFDocumentProxy } from 'pdfjs-dist';
import { EventBus } from '../utils/EventBus.js';
import { PdfPageView } from '../engine/PdfPageView.js';
import { IViewModeStrategy } from './IViewModeStrategy.js';

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

    async init(container: HTMLElement, pdfDocument: PDFDocumentProxy, eventBus: EventBus): Promise<void> {
        this.container = container;
        this.pdfDocument = pdfDocument;
        this.eventBus = eventBus;
        this.totalPages = pdfDocument.numPages;

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

        const pdfPage = await this.pdfDocument.getPage(this.currentPage);

        this.pageView = new PdfPageView({
            container: this.pageContainer,
            pageIndex: this.currentPage - 1,
            scale: this.scale,
            eventBus: this.eventBus
        });

        this.pageView.setPdfPage(pdfPage);

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
        if (this.pageView) {
            this.pageView.updateScale(scale);
        }
        this.eventBus.emit('scale:change', { scale });
    }

    getScale(): number {
        return this.scale;
    }

    destroy(): void {
        if (this.pageView) {
            this.pageView.destroy();
            this.pageView = null;
        }
        this.container.innerHTML = '';
    }
}
