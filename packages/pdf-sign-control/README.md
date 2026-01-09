# @shz/pdf-sign-control

The core engine for the `@shz/pdf-sign` ecosystem. It provides a framework-agnostic class `PdfSignControl` to render PDFs and manage interactive signature fields.

## Installation

```bash
npm install @shz/pdf-sign-control pdfjs-dist
```

## Usage

```typescript
import { PdfSignControl } from '@shz/pdf-sign-control';

// 1. Initialize the control
const container = document.getElementById('pdf-wrapper');
const pdfControl = new PdfSignControl(container, {
  allowEdit specific: true,
  primaryColor: '#007bff'
});

// 2. Load a PDF
await pdfControl.init('https://example.com/sample.pdf');

// 3. Add a signature field
pdfControl.addField({
  page: 1,
  x: 100,
  y: 100,
  width: 150,
  height: 50,
  id: 'sign_1'
});

// 4. Listen to events
container.addEventListener('field:change', (e) => {
  console.log('Field updated:', e.detail);
});
```

## API

### `init(url: string): Promise<void>`
Loads and renders the PDF from the given URL.

### `addField(field: SignatureField): void`
Adds a new signature field to the document.

### `setMode(mode: 'single-page' | 'scroll'): void`
Switches between single page view and continuous scroll view.

### `zoomIn() / zoomOut() / setScale(scale: number)`
Controls the zoom level of the document.

## License

MIT
