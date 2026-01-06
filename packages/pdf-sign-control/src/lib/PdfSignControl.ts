import { PdfViewer } from './engine/PdfViewer.js';
import { PdfSignControlOptions, ViewMode } from './types.js';

export class PdfSignControl {
    private viewer: PdfViewer;

    constructor(options: PdfSignControlOptions) {
        this.viewer = new PdfViewer(options);
    }

    async load(source: string | Uint8Array | ArrayBuffer): Promise<void> {
        return this.viewer.load(source);
    }

    // View Mode
    async setViewMode(mode: ViewMode): Promise<void> {
        return this.viewer.setViewMode(mode);
    }

    getViewMode(): ViewMode {
        return this.viewer.getViewMode();
    }

    // Navigation
    goToPage(page: number): void {
        this.viewer.goToPage(page);
    }

    nextPage(): void {
        this.viewer.nextPage();
    }

    previousPage(): void {
        this.viewer.previousPage();
    }

    getCurrentPage(): number {
        return this.viewer.getCurrentPage();
    }

    getTotalPages(): number {
        return this.viewer.getTotalPages();
    }

    // Zoom
    setScale(scale: number): void {
        this.viewer.setScale(scale);
    }

    getScale(): number {
        return this.viewer.getScale();
    }

    // Event handling
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
