import { EventBus } from './EventBus.js';
import { PdfLoader, PdfLoaderOptions } from './PdfLoader.js';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfPageView } from '../viewer/PdfPageView.js';

export interface PdfViewerOptions {
    container: HTMLElement;
    pdfLoaderOptions?: PdfLoaderOptions;
}

export class PdfViewer {
    private container: HTMLElement;
    private eventBus: EventBus;
    private loader: PdfLoader;
    private pdfDocument: PDFDocumentProxy | null = null;
    private pageViews: PdfPageView[] = [];

    constructor(options: PdfViewerOptions) {
        this.container = options.container;
        this.eventBus = new EventBus();
        this.loader = new PdfLoader(options.pdfLoaderOptions);

        this.initContainer();
    }

    private initContainer() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '20px';
        this.container.style.alignItems = 'center';
        this.container.style.backgroundColor = '#f0f0f0';
        this.container.style.padding = '20px';
    }

    async load(source: string | Uint8Array | ArrayBuffer): Promise<void> {
        try {
            this.pdfDocument = await this.loader.loadDocument(source);
            this.eventBus.emit('document:loaded', this.pdfDocument);
            console.log('PDF Loaded, pages:', this.pdfDocument?.numPages);

            await this.renderPages();
        } catch (error) {
            this.eventBus.emit('error', error);
            throw error;
        }
    }

    private async renderPages() {
        if (!this.pdfDocument) return;

        // Clear existing pages
        this.pageViews.forEach(p => p.destroy());
        this.pageViews = [];
        this.container.innerHTML = '';

        // Render all pages (simple single-pass for now)
        for (let i = 1; i <= this.pdfDocument.numPages; i++) {
            const page = await this.pdfDocument.getPage(i);

            const pageView = new PdfPageView({
                container: this.container,
                pageIndex: i - 1,
                scale: 1.0, // Default scale
                eventBus: this.eventBus
            });

            pageView.setPdfPage(page);
            this.pageViews.push(pageView);
        }
    }

    on(event: string, handler: (data: any) => void) {
        this.eventBus.on(event, handler);
    }

    off(event: string, handler: (data: any) => void) {
        this.eventBus.off(event, handler);
    }

    destroy() {
        this.loader.destroy();
        this.eventBus.clear();
        this.container.innerHTML = '';
    }
}
