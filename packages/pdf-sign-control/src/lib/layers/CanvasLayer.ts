
import { PDFPageProxy, RenderTask } from 'pdfjs-dist';

export class CanvasLayer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null;
    private pdfPage: PDFPageProxy | null = null;
    private renderTask: RenderTask | null = null;

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

    /**
     * Cancel any ongoing render operation
     */
    cancelRender(): void {
        if (this.renderTask) {
            this.renderTask.cancel();
            this.renderTask = null;
        }
    }

    private activeRenderPromise: Promise<void> | null = null;

    /**
     * Render PDF page at given scale
     * @param scale - Render scale
     * @param isPreview - If true, renders at lower quality for quick preview
     */
    async render(scale: number, isPreview = false): Promise<void> {
        if (!this.pdfPage || !this.ctx) return;

        // 1. Cancel ongoing render
        if (this.renderTask) {
            this.renderTask.cancel();
        }

        // 2. Wait for previous render loop to fully finish/cleanup
        if (this.activeRenderPromise) {
            try {
                await this.activeRenderPromise;
            } catch (e) {
                // Ignore errors from previous cancelled renders
            }
        }

        // 3. Start new render loop, wrapped in a promise we track
        this.activeRenderPromise = (async () => {
            // Check if we were cancelled while waiting? 
            // Actually, since we await above, we are now the "current" one.
            // But multiple calls could have queued up?
            // Since we await activeRenderPromise, we essentially serialize.
            // But if render() is called 5 times rapidly:
            // 1 runs. 2 cancels 1, waits. 3 cancels 1, waits...
            // We might want to ensure we are still the "latest" requested render?
            // For now, simple serialization is safer than crashing.

            // For preview mode, use lower resolution
            const renderScale = isPreview ? scale * 0.5 : scale;
            const viewport = this.pdfPage!.getViewport({ scale: renderScale });

            // Support high DPI displays (skip for preview to be faster)
            const outputScale = isPreview ? 1 : (window.devicePixelRatio || 1);

            // Set canvas dimensions
            this.canvas.width = Math.floor(viewport.width * outputScale);
            this.canvas.height = Math.floor(viewport.height * outputScale);

            // Display size should always match the requested scale
            const displayViewport = this.pdfPage!.getViewport({ scale });
            this.canvas.style.width = `${displayViewport.width}px`;
            this.canvas.style.height = `${displayViewport.height}px`;

            // Reset transform and clear canvas before rendering
            this.ctx!.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx!.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Apply scale for high DPI
            if (outputScale !== 1) {
                this.ctx!.scale(outputScale, outputScale);
            }

            const renderContext: any = {
                canvasContext: this.ctx,
                viewport: viewport,
            };

            try {
                this.renderTask = this.pdfPage!.render(renderContext);
                await this.renderTask.promise;
                this.renderTask = null;
            } catch (error: any) {
                this.renderTask = null;
                if (error.name === 'RenderingCancelledException') {
                    // Silently ignore cancelled renders
                    return;
                }
                // Only log real errors
                if (error.message !== 'Cancelled') {
                    console.error('Render error:', error);
                }
                throw error;
            }
        })();

        return this.activeRenderPromise;
    }

    destroy() {
        this.cancelRender();
        this.canvas.remove();
        this.pdfPage = null;
    }
}
