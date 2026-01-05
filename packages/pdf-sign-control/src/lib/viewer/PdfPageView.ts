
import { PDFPageProxy } from 'pdfjs-dist';
import { CanvasLayer } from '../layers/CanvasLayer.js';
import { EventBus } from '../core/EventBus.js';

export interface PdfPageViewOptions {
    container: HTMLElement;
    pageIndex: number;
    scale: number;
    eventBus: EventBus;
}

export class PdfPageView {
    private container: HTMLElement;
    private canvasLayer: CanvasLayer;
    private pdfPage: PDFPageProxy | null = null;
    public readonly pageIndex: number; // 0-based
    private scale: number;

    public element: HTMLElement;

    constructor(options: PdfPageViewOptions) {
        this.container = options.container;
        this.pageIndex = options.pageIndex;
        this.scale = options.scale;

        this.element = document.createElement('div');
        this.element.className = 'page-view';
        this.element.style.position = 'relative';

        // Create Layout
        this.canvasLayer = new CanvasLayer();
        this.element.appendChild(this.canvasLayer.getElement());

        this.container.appendChild(this.element);
    }

    setPdfPage(pdfPage: PDFPageProxy) {
        this.pdfPage = pdfPage;
        this.canvasLayer.setPage(pdfPage);
        this.render();
    }

    async render() {
        if (!this.pdfPage) return;

        // Set container size based on viewport
        const viewport = this.pdfPage.getViewport({ scale: this.scale });
        this.element.style.width = `${viewport.width}px`;
        this.element.style.height = `${viewport.height}px`;

        await this.canvasLayer.render(this.scale);
    }

    updateScale(scale: number) {
        this.scale = scale;
        this.render();
    }

    destroy() {
        this.canvasLayer.destroy();
        this.element.remove();
    }
}
