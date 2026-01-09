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
| `viewMode` | `'single' \| 'scroll'` | Initial view mode. |
| `zoomable` | `boolean` | Enable/disable gesture zooming (default: true). |
| `fields` | `SignatureField[]` | Initial fields to render. |
| `onLoad` | `() => void` | Callback when PDF is loaded. |
| `onPageChange` | `(page: number, total: number) => void` | Callback when page changes. |
| `onScaleChange` | `(scale: number) => void` | Callback when zoom level changes. |
| `onFieldsChange` | `(fields: SignatureField[]) => void` | Callback when fields are added/removed/updated. |
