# @shznet/pdf-sign-angular

Angular component wrapper for `@shznet/pdf-sign-control`.

## Installation

```bash
npm install @shznet/pdf-sign-angular @shznet/pdf-sign-control pdfjs-dist
```

## Usage

Import the module in your `app.module.ts`:

```typescript
import { PdfSignAngularModule } from '@shznet/pdf-sign-angular';

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
