
import { PDFDocumentProxy } from 'pdfjs-dist';
import { EventBus } from '../utils/EventBus.js';
import { SignatureField } from '../types.js';

/**
 * Common interface for PDF viewing mode strategies.
 */
export interface IViewModeStrategy {
    init(container: HTMLElement, pdfDocument: PDFDocumentProxy, eventBus: EventBus, initialScale?: number): Promise<void>;
    destroy(): void;

    // Scale
    setScale(scale: number): void;
    getScale(): number;

    // Navigation
    goToPage(pageIndex: number): void;
    nextPage(): void;
    previousPage(): void;
    getCurrentPage(): number;
    getTotalPages(): number;

    // Field Management
    setFields(fields: SignatureField[]): void;

    // Optional: targeted updates for performance
    addField?(field: SignatureField): void;
    removeField?(fieldId: string): void;
    updateField?(fieldId: string, updates: Partial<SignatureField>): void;
}
