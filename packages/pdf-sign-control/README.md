# @shznet/pdf-sign-control

The core engine for the `@shznet/pdf-sign` ecosystem. It provides a framework-agnostic class `PdfSignControl` to render PDFs and manage interactive signature fields.

## Installation

```bash
npm install @shznet/pdf-sign-control pdfjs-dist
```

## Usage

```typescript
import { PdfSignControl } from '@shznet/pdf-sign-control';

// 1. Initialize the control
const container = document.getElementById('pdf-wrapper');
const pdfControl = new PdfSignControl({
  container: container,
  viewMode: 'scroll', // 'single' or 'scroll'
  // pdfLoaderOptions: { ... }
});

// 2. Load a PDF
await pdfControl.load('https://example.com/sample.pdf');

// 3. Add a signature field
await pdfControl.addField({
  pageIndex: 0, // 0-based index
  rect: { x: 100, y: 100, width: 150, height: 50 },
  id: 'sign_1',
  type: 'signature', // or 'text', 'image', 'html'
  draggable: true,
  resizable: true
});

// 4. Listen to events
pdfControl.on('fields:change', (fields) => {
  console.log('Fields updated:', fields);
});
```

## API

### `load(source: string | Uint8Array | ArrayBuffer): Promise<void>`
Loads and renders the PDF from the given URL or buffer.

### `addField(field: SignatureField): Promise<void>`
Adds a new signature field to the document.

### `setViewMode(mode: 'single' | 'scroll'): Promise<void>`
Switches between single page view and continuous scroll view.

### `setScale(scale: number)`
Controls the zoom level of the document.

### `getFields(): SignatureField[]`
Returns the current list of fields.

### `print(options?: { withSignatures?: boolean }): Promise<void>`
Prints the current document. Default is printing without signatures.

## License

MIT
