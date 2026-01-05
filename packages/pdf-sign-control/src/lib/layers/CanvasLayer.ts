
import { PDFPageProxy } from 'pdfjs-dist';

export class CanvasLayer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null;
    private pdfPage: PDFPageProxy | null = null;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.style.zIndex = '1';
        this.ctx = this.canvas.getContext('2d');
    }

    getElement(): HTMLCanvasElement {
        return this.canvas;
    }

    setPage(page: PDFPageProxy) {
        this.pdfPage = page;
    }

    async render(scale: number): Promise<void> {
        if (!this.pdfPage || !this.ctx) return;

        const viewport = this.pdfPage.getViewport({ scale });

        this.canvas.width = viewport.width;
        this.canvas.height = viewport.height;

        // Support high DPI displays
        const outputScale = window.devicePixelRatio || 1;
        if (outputScale !== 1) {
            this.canvas.width = Math.floor(viewport.width * outputScale);
            this.canvas.height = Math.floor(viewport.height * outputScale);
            this.canvas.style.width = `${viewport.width}px`;
            this.canvas.style.height = `${viewport.height}px`;
            this.ctx.scale(outputScale, outputScale);
        } else {
            this.canvas.style.width = `${viewport.width}px`;
            this.canvas.style.height = `${viewport.height}px`;
        }

        const renderContext: any = {
            canvasContext: this.ctx,
            viewport: viewport,
        };

        try {
            await this.pdfPage.render(renderContext).promise;
        } catch (error: any) {
            if (error.name === 'RenderingCancelledException') {
                console.log('Rendering cancelled');
            } else {
                console.error('Render error:', error);
                throw error;
            }
        }
    }

    destroy() {
        this.canvas.remove();
        this.pdfPage = null;
    }
}
