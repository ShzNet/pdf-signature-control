
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';

// Define PDFJS types since we might not have full types support for all internals
export type PDFDocumentProxy = pdfjsLib.PDFDocumentProxy;

export interface PdfLoaderOptions {
    workerSrc?: string;
    cMapUrl?: string;
    cMapPacked?: boolean;
}

export class PdfLoader {
    private document: PDFDocumentProxy | null = null;

    constructor(options: PdfLoaderOptions = {}) {
        if (options.workerSrc) {
            GlobalWorkerOptions.workerSrc = options.workerSrc;
        } else {
            // Default to CDN if not provided (though local is preferred)
            GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        }
    }

    async loadDocument(source: string | Uint8Array | ArrayBuffer): Promise<PDFDocumentProxy> {
        try {
            const loadingTask = pdfjsLib.getDocument(source);
            this.document = await loadingTask.promise;
            return this.document;
        } catch (error) {
            console.error('Error loading PDF document:', error);
            throw error;
        }
    }

    getDocument(): PDFDocumentProxy | null {
        return this.document;
    }

    destroy(): void {
        if (this.document) {
            this.document.destroy();
            this.document = null;
        }
    }
}
