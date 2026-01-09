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

    async getPageDimensions(pageNumber: number): Promise<{ width: number; height: number } | null> {
        return this.viewer.getPageDimensions(pageNumber - 1);
    }

    // Event handling
    on(event: string, handler: (data: any) => void) {
        this.viewer.on(event, handler);
    }

    off(event: string, handler: (data: any) => void) {
        this.viewer.off(event, handler);
    }

    // Field Management
    setFields(fields: any[]): void {
        this.viewer.setFields(fields);
    }

    getFields(): any[] {
        return this.viewer.getFields();
    }

    async addField(field: any): Promise<void> {
        return this.viewer.addField(field);
    }

    removeField(fieldId: string): void {
        this.viewer.removeField(fieldId);
    }

    updateField(fieldId: string, updates: any): void {
        this.viewer.updateField(fieldId, updates);
    }

    async print(options?: { withSignatures?: boolean }): Promise<void> {
        return this.viewer.print(options);
    }


    destroy() {
        this.viewer.destroy();
    }
}
