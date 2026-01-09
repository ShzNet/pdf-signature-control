import { PDFPageProxy } from 'pdfjs-dist';
import { CanvasLayer } from '../layers/CanvasLayer.js';
import { SignatureLayer } from '../layers/SignatureLayer.js';
import { EventBus } from '../utils/EventBus.js';
import { SignatureField } from '../types.js';

export interface PdfPageViewOptions {
    container: HTMLElement;
    pageIndex: number;
    scale: number;
    eventBus: EventBus;
    pageDimensions?: { width: number, height: number };  // Page dimensions from PDF metadata
}

export class PdfPageView {
    private container: HTMLElement;
    private canvasLayer: CanvasLayer;
    private signatureLayer: SignatureLayer;
    private pdfPage: PDFPageProxy | null = null;
    public readonly pageIndex: number; // 0-based
    private scale: number;
    private eventBus: EventBus;

    public element: HTMLElement;

    constructor(options: PdfPageViewOptions) {
        this.container = options.container;
        this.pageIndex = options.pageIndex;
        this.scale = options.scale;
        this.eventBus = options.eventBus;

        this.element = document.createElement('div');
        this.element.className = 'page-view';
        this.element.dataset.pageIndex = this.pageIndex.toString();
        this.element.style.position = 'relative';
        this.element.style.flexShrink = '0';
        this.element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

        this.canvasLayer = new CanvasLayer();
        this.element.appendChild(this.canvasLayer.getElement());

        this.signatureLayer = new SignatureLayer(this.eventBus);
        this.element.appendChild(this.signatureLayer.getElement());

        // SET SIGNATURE LAYER DIMENSIONS IMMEDIATELY if provided
        // This ensures fields can be added right away, before canvas renders
        if (options.pageDimensions) {
            this.signatureLayer.setPageDimensions(
                options.pageDimensions.width,
                options.pageDimensions.height,
                this.scale
            );
        }

        this.container.appendChild(this.element);
    }

    setPdfPage(pdfPage: PDFPageProxy) {
        this.pdfPage = pdfPage;
        this.canvasLayer.setPage(pdfPage);

        // IMMEDIATELY set SignatureLayer dimensions so fields can be added right away
        // This is synchronous and doesn't wait for canvas to render
        const unscaledViewport = pdfPage.getViewport({ scale: 1.0 });
        this.signatureLayer.setPageDimensions(unscaledViewport.width, unscaledViewport.height, this.scale);

        // Trigger async canvas render (SignatureLayer is already ready)
        this.render();
    }

    setFields(fields: SignatureField[]) {
        this.signatureLayer.setFields(fields);
    }

    async render() {
        if (!this.pdfPage) return;

        const viewport = this.pdfPage.getViewport({ scale: this.scale });
        this.element.style.width = `${viewport.width}px`;
        this.element.style.height = `${viewport.height}px`;

        // Pass unscaled page height (viewport.height / scale) to signature layer for coordinate conversion
        const unscaledViewport = this.pdfPage.getViewport({ scale: 1.0 });
        this.signatureLayer.setPageDimensions(unscaledViewport.width, unscaledViewport.height, this.scale);

        await this.canvasLayer.render(this.scale);
    }

    /**
     * Quick preview render (lower quality, faster)
     */
    async renderPreview() {
        if (!this.pdfPage) return;

        const viewport = this.pdfPage.getViewport({ scale: this.scale });
        this.element.style.width = `${viewport.width}px`;
        this.element.style.height = `${viewport.height}px`;

        const unscaledViewport = this.pdfPage.getViewport({ scale: 1.0 });
        this.signatureLayer.setPageDimensions(unscaledViewport.width, unscaledViewport.height, this.scale);

        await this.canvasLayer.render(this.scale, true);
    }

    /**
     * Full quality render
     */
    async renderFull() {
        if (!this.pdfPage) return;

        const viewport = this.pdfPage.getViewport({ scale: this.scale });
        this.element.style.width = `${viewport.width}px`;
        this.element.style.height = `${viewport.height}px`;

        const unscaledViewport = this.pdfPage.getViewport({ scale: 1.0 });
        this.signatureLayer.setPageDimensions(unscaledViewport.width, unscaledViewport.height, this.scale);

        await this.canvasLayer.render(this.scale, false);
    }

    updateScale(scale: number) {
        this.scale = scale;
        this.render();
    }

    /**
     * Update scale with preview mode (for progressive zoom)
     */
    updateScalePreview(scale: number) {
        this.scale = scale;
        this.renderPreview();
    }

    /**
     * Update scale with full quality render
     */
    updateScaleFull(scale: number) {
        this.scale = scale;
        this.renderFull();
    }

    destroy() {
        this.canvasLayer.destroy();
        this.signatureLayer.destroy();
        this.element.remove();
    }
}
