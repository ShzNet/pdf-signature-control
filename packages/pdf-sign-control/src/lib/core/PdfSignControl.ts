
import { PdfViewer, PdfViewerOptions } from './PdfViewer.js';

export interface PdfSignControlOptions extends PdfViewerOptions {
    // Future config
}

export class PdfSignControl {
    private viewer: PdfViewer;

    constructor(options: PdfSignControlOptions) {
        this.viewer = new PdfViewer(options);
    }

    async load(source: string | Uint8Array | ArrayBuffer): Promise<void> {
        return this.viewer.load(source);
    }

    // Public API Facade
    on(event: string, handler: (data: any) => void) {
        this.viewer.on(event, handler);
    }

    off(event: string, handler: (data: any) => void) {
        this.viewer.off(event, handler);
    }

    destroy() {
        this.viewer.destroy();
    }
}
