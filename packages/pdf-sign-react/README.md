# @shznet/pdf-sign-react

React component wrapper for `@shznet/pdf-sign-control`.

## Installation

```bash
npm install @shznet/pdf-sign-react
```

## Usage

```tsx
import { PdfSignReact, PdfSignReactRef } from '@shznet/pdf-sign-react';
import { useRef } from 'react';

export function App() {
  const controlRef = useRef<PdfSignReactRef>(null);

  const handlePdfLoaded = () => {
    console.log('PDF Loaded!');
  };

  return (
    <div style={{ height: '100vh' }}>
      <PdfSignReact 
        ref={controlRef}
        src="https://example.com/doc.pdf"
        viewMode="scroll"
        zoomable={true}
        onLoad={handlePdfLoaded}
      />
    </div>
  );
}
```

```tsx
<button onClick={() => controlRef.current?.print()}>
  Print PDF
</button>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string \| Uint8Array \| ArrayBuffer` | PDF source to load. |
| `page` | `number` | Current page number (1-based). Supports two-way binding via state. |
| `viewMode` | `'single' \| 'scroll'` | View mode - changes trigger re-render. |
| `scale` | `number` | Zoom scale - changes trigger re-render. |
| `zoomable` | `boolean` | Enable/disable gesture zooming (default: true). |
| `fields` | `SignatureField[]` | Controlled fields list. |
| `pdfLoaderOptions` | `PdfLoaderOptions` | PDF.js configuration (workerSrc, etc.). |
| `onReady` | `(control: PdfSignControl) => void` | Callback when control is initialized. |
| `onLoad` | `() => void` | Callback when PDF is loaded. |
| `onPageChange` | `(page: number, total: number) => void` | Callback when page changes (enables two-way binding). |
| `onScaleChange` | `(scale: number) => void` | Callback when zoom level changes. |
| `onFieldsChange` | `(fields: SignatureField[]) => void` | Callback when fields are modified. |
| `onError` | `(error: Error) => void` | Callback on errors. |

## Two-Way Binding Example

```tsx
import { PdfSignReact } from '@shznet/pdf-sign-react';
import { useState } from 'react';

export function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);

  return (
    <div>
      <div>
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
          Previous
        </button>
        <span>Page {currentPage} / {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
          Next
        </button>
        
        <button onClick={() => setScale(s => s + 0.25)}>Zoom In</button>
        <button onClick={() => setScale(s => Math.max(0.25, s - 0.25))}>Zoom Out</button>
      </div>

      <PdfSignReact
        src="https://example.com/doc.pdf"
        page={currentPage}
        scale={scale}
        onPageChange={(page, total) => {
          setCurrentPage(page);  // Two-way binding
          setTotalPages(total);
        }}
        onScaleChange={setScale}  // Two-way binding
        style={{ height: '600px' }}
      />
    </div>
  );
}
```

## Ref Methods

Access methods via `ref` for imperative control:

```tsx
const pdfRef = useRef<PdfSignReactRef>(null);

// Navigation
pdfRef.current?.goToPage(5);
pdfRef.current?.nextPage();
pdfRef.current?.previousPage();
const currentPage = pdfRef.current?.getCurrentPage();
const totalPages = pdfRef.current?.getTotalPages();

// Zoom
pdfRef.current?.setScale(1.5);
const scale = pdfRef.current?.getScale();

// View Mode
await pdfRef.current?.setViewMode('single');
const mode = pdfRef.current?.getViewMode();

// Page Dimensions
const dims = await pdfRef.current?.getPageDimensions(1); // Page 1 (1-based index)
console.log(`Page size: ${dims?.width} x ${dims?.height} points`);

// Field Management
await pdfRef.current?.addField({
  id: 'sig1',
  pageNumber: 1,
  rect: { x: 100, y: 100, width: 200, height: 80 },
  type: 'signature',
  content: '<svg>...</svg>',
  draggable: true,
  resizable: true
});

pdfRef.current?.removeField('sig1');
pdfRef.current?.updateField('sig1', { rect: { x: 150, y: 150, width: 200, height: 80 } });
const fields = pdfRef.current?.getFields();

// Printing
await pdfRef.current?.print({ withSignatures: false });

// Direct Control Access
const control = pdfRef.current?.getControl();
```
