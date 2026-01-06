import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { PdfSignControl, PdfSignControlOptions, ViewMode } from '@shz/pdf-sign-control';

export interface PdfSignReactRef {
  /** Get the underlying PdfSignControl instance */
  getControl(): PdfSignControl | null;
  /** Load a PDF from URL or ArrayBuffer */
  load(source: string | Uint8Array | ArrayBuffer): Promise<void>;
  /** Navigate to specific page */
  goToPage(page: number): void;
  /** Go to next page */
  nextPage(): void;
  /** Go to previous page */
  previousPage(): void;
  /** Get current page number */
  getCurrentPage(): number;
  /** Get total pages */
  getTotalPages(): number;
  /** Set zoom scale */
  setScale(scale: number): void;
  /** Get current zoom scale */
  getScale(): number;
  /** Set view mode */
  setViewMode(mode: ViewMode): Promise<void>;
  /** Get current view mode */
  getViewMode(): ViewMode;
}

export interface PdfSignReactProps {
  /** PDF source URL or ArrayBuffer - auto-loads when provided */
  src?: string | Uint8Array | ArrayBuffer;
  /** Initial view mode: 'scroll' or 'single' */
  viewMode?: ViewMode;
  /** Enable gesture zoom (Ctrl+scroll, pinch) - default: true */
  zoomable?: boolean;
  /** PDF.js loader options */
  pdfLoaderOptions?: PdfSignControlOptions['pdfLoaderOptions'];
  /** CSS class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Callback when control is ready */
  onReady?: (control: PdfSignControl) => void;
  /** Callback when PDF is loaded */
  onLoad?: () => void;
  /** Callback when page changes */
  onPageChange?: (page: number, total: number) => void;
  /** Callback when scale changes */
  onScaleChange?: (scale: number) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export const PdfSignReact = forwardRef<PdfSignReactRef, PdfSignReactProps>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<PdfSignControl | null>(null);

  useImperativeHandle(ref, () => ({
    getControl: () => controlRef.current,
    load: async (source) => {
      if (controlRef.current) {
        await controlRef.current.load(source);
      }
    },
    goToPage: (page) => controlRef.current?.goToPage(page),
    nextPage: () => controlRef.current?.nextPage(),
    previousPage: () => controlRef.current?.previousPage(),
    getCurrentPage: () => controlRef.current?.getCurrentPage() ?? 1,
    getTotalPages: () => controlRef.current?.getTotalPages() ?? 0,
    setScale: (scale) => controlRef.current?.setScale(scale),
    getScale: () => controlRef.current?.getScale() ?? 1.0,
    setViewMode: async (mode) => {
      if (controlRef.current) {
        await controlRef.current.setViewMode(mode);
      }
    },
    getViewMode: () => controlRef.current?.getViewMode() ?? 'scroll',
  }));

  useEffect(() => {
    if (!containerRef.current || controlRef.current) return;

    controlRef.current = new PdfSignControl({
      container: containerRef.current,
      viewMode: props.viewMode,
      pdfLoaderOptions: props.pdfLoaderOptions,
    });

    // Setup event listeners
    if (props.onPageChange) {
      controlRef.current.on('page:change', (data: { page: number; total: number }) => {
        props.onPageChange?.(data.page, data.total);
      });
    }

    if (props.onScaleChange) {
      controlRef.current.on('scale:change', (data: { scale: number }) => {
        props.onScaleChange?.(data.scale);
      });
    }

    if (props.onReady) {
      props.onReady(controlRef.current);
    }



    return () => {
      controlRef.current?.destroy();
      controlRef.current = null;
    };
  }, []);

  // Handle src changes
  useEffect(() => {
    if (controlRef.current && props.src) {
      controlRef.current.load(props.src)
        .then(() => props.onLoad?.())
        .catch((error) => props.onError?.(error));
    }
  }, [props.src]);

  // Handle viewMode changes
  useEffect(() => {
    if (controlRef.current && props.viewMode) {
      controlRef.current.setViewMode(props.viewMode);
    }
  }, [props.viewMode]);

  return <div ref={containerRef} className={props.className} style={{ width: '100%', height: '100%', ...props.style }} />;
});

// Re-export types
export type { ViewMode } from '@shz/pdf-sign-control';
