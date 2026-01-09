# @shz/pdf-sign-angular

Angular component wrapper for `@shz/pdf-sign-control`.

## Installation

```bash
npm install @shz/pdf-sign-angular @shz/pdf-sign-control pdfjs-dist
```

## Usage

Import the module in your `app.module.ts`:

```typescript
import { PdfSignAngularModule } from '@shz/pdf-sign-angular';

@NgModule({
  imports: [PdfSignAngularModule],
  // ...
})
export class AppModule {}
```

Use the component in your template:

```html
<lib-pdf-sign-angular
  [url]="'https://example.com/doc.pdf'"
  [scale]="1.0"
  (pdfLoaded)="onPdfLoaded()"
>
</lib-pdf-sign-angular>
```

## Inputs & Outputs

-   **[url]**: `string` - Path to the PDF file.
-   **[scale]**: `number` - Zoom level.
-   **(pdfLoaded)**: `EventEmitter<void>` - Emitted when PDF renders successfully.
