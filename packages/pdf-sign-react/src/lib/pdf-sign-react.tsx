import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { PdfSignControl, PdfSignControlOptions, ViewMode, SignatureField } from '@shznet/pdf-sign-control';

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

  /** Initial fields */
  fields?: SignatureField[];

  /** Callback when a field is added */
  onFieldAdd?: (field: SignatureField) => void;
  /** Callback when a field is removed */
  onFieldRemove?: (data: { fieldId: string }) => void;
  /** Callback when a field is updated */
  onFieldUpdate?: (data: { fieldId: string, updates: Partial<SignatureField> }) => void;
  /** Callback when any field changes (add/remove/update) */
  onFieldsChange?: (fields: SignatureField[]) => void;
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

  // Keep track of latest props for event handlers to avoid stale closures
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    if (!containerRef.current || controlRef.current) return;

    controlRef.current = new PdfSignControl({
      container: containerRef.current,
      viewMode: props.viewMode,
      pdfLoaderOptions: props.pdfLoaderOptions,
      fields: props.fields,
    });

    // Setup event listeners with ref access
    controlRef.current.on('page:change', (data: { page: number; total: number }) => {
      propsRef.current.onPageChange?.(data.page, data.total);
    });

    controlRef.current.on('scale:change', (data: { scale: number }) => {
      propsRef.current.onScaleChange?.(data.scale);
    });

    // Field Events
    controlRef.current.on('field:add', (field: SignatureField) => propsRef.current.onFieldAdd?.(field));
    controlRef.current.on('field:remove', (data: { fieldId: string }) => propsRef.current.onFieldRemove?.(data));
    controlRef.current.on('field:update', (data: { fieldId: string, updates: Partial<SignatureField> }) => propsRef.current.onFieldUpdate?.(data));
    controlRef.current.on('fields:change', (fields: SignatureField[]) => propsRef.current.onFieldsChange?.(fields));

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

  // Handle fields changes
  useEffect(() => {
    if (controlRef.current && props.fields) {
      const currentFields = controlRef.current.getFields();
      if (JSON.stringify(currentFields) === JSON.stringify(props.fields)) {
        return;
      }
      controlRef.current.setFields(props.fields);
    }
  }, [props.fields]);

  return <div ref={containerRef} className={props.className} style={{ width: '100%', height: '100%', ...props.style }} />;
});

// Re-export types
export type { ViewMode } from '@shznet/pdf-sign-control';
