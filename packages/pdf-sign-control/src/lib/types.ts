/**
 * Public types for @shznet/pdf-sign-control
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
 * Page dimensions in PDF points
 */
export interface PageDimensions {
    width: number;
    height: number;
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
    /** Initial fields to load */
    fields?: SignatureField[];
}

/**
 * Signature Field Data Model
 */
export type SignatureFieldType = 'text' | 'html' | 'image' | 'signature';

export interface SignatureField {
    id: string;
    /** 1-based Page Number (1..N) */
    pageNumber: number;
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
