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
