import { PDFDocumentProxy } from 'pdfjs-dist';
import { EventBus } from '../utils/EventBus.js';

/**
 * Common interface for PDF viewing mode strategies.
 */
export interface IViewModeStrategy {
    init(container: HTMLElement, pdfDocument: PDFDocumentProxy, eventBus: EventBus): Promise<void>;
    destroy(): void;

    goToPage(pageNumber: number): void;
    nextPage(): void;
    previousPage(): void;

    getCurrentPage(): number;
    getTotalPages(): number;

    setScale(scale: number): void;
    getScale(): number;
}
