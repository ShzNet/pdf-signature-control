/**
 * Public types for @shz/pdf-sign-control
 */

/**
 * View mode for PDF display
 */
export type ViewMode = 'single' | 'scroll';

/**
 * Event data for page change events
 */
export interface PageChangeEvent {
    page: number;
    total: number;
}

/**
 * Event data for scale change events
 */
export interface ScaleChangeEvent {
    scale: number;
}

/**
 * Options for PdfLoader
 */
export interface PdfLoaderOptions {
    workerSrc?: string;
    cMapUrl?: string;
    cMapPacked?: boolean;
}

/**
 * Options for PdfSignControl
 */
export interface PdfSignControlOptions {
    container: HTMLElement;
    pdfLoaderOptions?: PdfLoaderOptions;
    viewMode?: ViewMode;
}

/**
 * Signature Field Data Model
 */
export type SignatureFieldType = 'text' | 'html' | 'image';

export interface SignatureField {
    id: string;
    pageIndex: number;
    /** Standard PDF Rect (points): x, y, width, height */
    rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };

    type: SignatureFieldType;
    content: string | null;

    /** Custom CSS styles for the content container */
    style?: Record<string, string>;

    /** Behavior flags (default true) */
    resizable?: boolean;
    draggable?: boolean;
    deletable?: boolean;

    metadata?: any;
}
