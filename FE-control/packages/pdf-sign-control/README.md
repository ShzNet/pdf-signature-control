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
  pageNumber: 1, // 1-based page number
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

### JPEG 2000 images and self-hosted PDF.js assets

PDFs containing JPEG 2000 (`JPXDecode`) images require the OpenJPEG decoder.
Without `wasmUrl`, PDF.js may display text but skip these images with
`JpxError: OpenJPEG failed to initialize`.

Copy the worker, `cmaps/`, and the entire `wasm/` directory (including its license
files) from **pdfjs-dist 5.4.530**, matching this package's PDF.js version, into
your application's public assets:

```text
public/pdfjs/
  pdf.worker.min.mjs       # from pdfjs-dist/build/
  cmaps/
  wasm/
    openjpeg.wasm
    openjpeg_nowasm_fallback.js
    qcms_bg.wasm
    LICENSE_*
```

Pass these locations through `pdfLoaderOptions` (also supported by the React and
Angular wrappers):

```typescript
pdfLoaderOptions: {
  workerSrc: '/pdfjs/pdf.worker.min.mjs',
  cMapUrl: '/pdfjs/cmaps/',
  cMapPacked: true,
  wasmUrl: '/pdfjs/wasm/',
}
```

Directory URLs must end with `/`. Adjust the paths for applications hosted under
a subpath. Ensure the server returns the actual files, not an HTML fallback, and
permits loading WASM under its Content Security Policy. The demos use
version-matched CDN assets; self-host these assets for production or offline use.
Setting `useWasm: false` is not a substitute for providing the decoder assets.

## API

### Document Loading

#### `load(source: string | Uint8Array | ArrayBuffer): Promise<void>`
Loads and renders the PDF from the given URL or buffer.

### View Mode

#### `setViewMode(mode: 'single' | 'scroll'): Promise<void>`
Switches between single page view and continuous scroll view.

#### `getViewMode(): ViewMode`
Returns the current view mode.

### Page Navigation

#### `goToPage(page: number): void`
Navigate to a specific page (1-based index).

#### `getCurrentPage(): number`
Get the current page number (1-based).

#### `getTotalPages(): number`
Get total number of pages in the document.

#### `nextPage(): void`
Navigate to the next page.

#### `previousPage(): void`
Navigate to the previous page.

#### `getPageDimensions(pageNumber: number): Promise<{ width: number; height: number } | null>`
Get dimensions of a specific page in PDF points (unscaled).

**Parameters:**
- `pageNumber`: 1-based page number

**Returns:** Page dimensions `{ width, height }` in PDF points, or `null` if the page doesn't exist.

**Example:**
```typescript
const dims = await pdfControl.getPageDimensions(1); // First page
console.log(`Page dimensions: ${dims.width} x ${dims.height} points`);
```

### Zoom

#### `setScale(scale: number): void`
Controls the zoom level of the document.

#### `getScale(): number`
Get the current zoom scale.

### Field Management

#### `addField(field: SignatureField): Promise<void>`
Adds a new signature field to the document.

#### `removeField(fieldId: string): void`
Removes a field by its ID.

#### `updateField(fieldId: string, updates: Partial<SignatureField>): void`
Updates a field's properties.

#### `getFields(): SignatureField[]`
Returns the current list of fields.

#### `clearFields(): void`
Remove all fields from the document.

#### `setFields(fields: SignatureField[]): void`
Replace all fields with a new set.

### Events

#### `on(event: string, handler: Function): void`
Subscribe to events:
- `page:change`: Fired when page changes - `(data: { page: number, total: number }) => void`
- `scale:change`: Fired when zoom changes - `(data: { scale: number }) => void`
- `field:add`: Fired when a field is added - `(field: SignatureField) => void`
- `field:remove`: Fired when a field is removed - `(data: { fieldId: string }) => void`
- `field:update`: Fired when a field is updated - `(data: { fieldId: string, updates: Partial<SignatureField> }) => void`
- `fields:change`: Fired when any field changes - `(fields: SignatureField[]) => void`
- `field:selection-change`: Fired when selection changes - `(data: { field: SignatureField | null }) => void`

### Printing

#### `print(options?: { withSignatures?: boolean }): Promise<void>`
Prints the current document. Default is printing without signatures.

## License

MIT
