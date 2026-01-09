# @shznet/pdf-sign-angular

Angular component wrapper for `@shznet/pdf-sign-control`.

## Installation

```bash
npm install @shznet/pdf-sign-angular
```

## Usage

Import the component (Standalone) or Module:

```typescript
import { PdfSignAngularComponent } from '@shznet/pdf-sign-angular';

@Component({
  ...
  imports: [PdfSignAngularComponent],
  ...
})
export class AppComponent {}
```

Use the component in your template:

```html
<lib-pdf-sign-angular
  [src]="'https://example.com/doc.pdf'"
  [viewMode]="'scroll'"
  (loaded)="onPdfLoaded()"
>
</lib-pdf-sign-angular>
```

```typescript
// Component Code
@ViewChild(PdfSignAngularComponent) pdfSign!: PdfSignAngularComponent;

print() {
  this.pdfSign.print();
}
```

## Inputs & Outputs

### Inputs

-   **[src]**: `string | Uint8Array | ArrayBuffer` - Source of the PDF file.
-   **[page]**: `number` - Current page number (1-based). Supports two-way binding with `[(page)]`.
-   **[viewMode]**: `'single' | 'scroll'` - View mode configuration.
-   **[fields]**: `SignatureField[]` - Signature fields to display.
-   **[pdfLoaderOptions]**: `PdfLoaderOptions` - PDF.js configuration.

### Outputs

-   **(ready)**: `EventEmitter<PdfSignControl>` - Emitted when control is initialized.
-   **(loaded)**: `EventEmitter<void>` - Emitted when PDF renders successfully.
-   **(pageChange)**: `EventEmitter<number>` - Emits current page number (for two-way binding with `[(page)]`).
-   **(pageInfo)**: `EventEmitter<{ page: number, total: number }>` - Emits detailed page info.
-   **(scaleChange)**: `EventEmitter<{ scale: number }>` - Emitted on zoom changes.
-   **(fieldsChange)**: `EventEmitter<SignatureField[]>` - Emitted when fields are modified.
-   **(error)**: `EventEmitter<Error>` - Emitted on errors.

## Two-Way Binding Example

Angular's two-way binding syntax allows automatic synchronization:

```html
<lib-pdf-sign-angular
  [src]="pdfUrl"
  [(page)]="currentPage"
  [viewMode]="viewMode"
  (pageInfo)="onPageInfo($event)"
  (scaleChange)="onScaleChange($event)"
  (fieldsChange)="onFieldsChange($event)"
  style="width: 100%; height: 600px; display: block;"
></lib-pdf-sign-angular>

<div>
  <button (click)="currentPage = currentPage - 1">Previous</button>
  <span>Page {{ currentPage }} / {{ totalPages }}</span>
  <button (click)="currentPage = currentPage + 1">Next</button>
</div>
```

```typescript
export class AppComponent {
  pdfUrl = 'https://example.com/doc.pdf';
  currentPage = 1;  // Automatically synced with PDF viewer
  totalPages = 0;
  viewMode: ViewMode = 'scroll';

  onPageInfo(data: { page: number; total: number }) {
    this.totalPages = data.total;
    // currentPage is automatically updated via two-way binding
  }

  onScaleChange(data: { scale: number }) {
    console.log('Zoom:', data.scale);
  }
}
```

## Component Methods

Access methods via `@ViewChild`:

```typescript
@ViewChild(PdfSignAngularComponent) pdfComponent!: PdfSignAngularComponent;

// Navigation
this.pdfComponent.goToPage(5);
this.pdfComponent.nextPage();
this.pdfComponent.previousPage();
const currentPage = this.pdfComponent.getCurrentPage();
const totalPages = this.pdfComponent.getTotalPages();

// Zoom
this.pdfComponent.setScale(1.5);
const scale = this.pdfComponent.getScale();

// View Mode
await this.pdfComponent.setViewMode('single');
const mode = this.pdfComponent.getViewMode();

// Page Dimensions
const dims = await this.pdfComponent.getPageDimensions(1); // Page 1 (1-based)
console.log(`Page size: ${dims?.width} x ${dims?.height} points`);

// Field Management
this.pdfComponent.addField({
  id: 'sig1',
  pageNumber: 1,
  rect: { x: 100, y: 100, width: 200, height: 80 },
  type: 'signature',
  content: '<svg>...</svg>',
  draggable: true,
  resizable: true
});

this.pdfComponent.removeField('sig1');
this.pdfComponent.updateField('sig1', { 
  rect: { x: 150, y: 150, width: 200, height: 80 } 
});
this.pdfComponent.setFields([...newFields]);

// Printing
await this.pdfComponent.print({ withSignatures: false });

// Direct Control Access
const control = this.pdfComponent.getControl();
```
