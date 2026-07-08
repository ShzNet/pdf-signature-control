import { PdfSignControl } from '@shznet/pdf-sign-control';

export * from '@shznet/pdf-sign-control';

// Attach to window for global usage in non-module environments
if (typeof window !== 'undefined') {
  (window as any).PdfSignControl = PdfSignControl;
}

