import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { PdfLoaderOptions } from '../types.js';

export type PDFDocumentProxy = pdfjsLib.PDFDocumentProxy;

export class PdfLoader {
    private document: PDFDocumentProxy | null = null;

    constructor(options: PdfLoaderOptions = {}) {
        if (options.workerSrc) {
            GlobalWorkerOptions.workerSrc = options.workerSrc;
        } else {
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
