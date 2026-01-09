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

-   **[src]**: `string | Uint8Array | ArrayBuffer` - Source of the PDF file.
-   **[viewMode]**: `'single' | 'scroll'` - View mode configuration.
-   **[fields]**: `SignatureField[]` - Initial fields.
-   **(loaded)**: `EventEmitter<void>` - Emitted when PDF renders successfully.
-   **(pageChange)**: `EventEmitter<{ page: number, total: number }>` - Emitted on navigation.
-   **(scaleChange)**: `EventEmitter<{ scale: number }>` - Emitted on zoom.
-   **(fieldsChange)**: `EventEmitter<SignatureField[]>` - Emitted when fields change.
