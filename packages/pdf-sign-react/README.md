# @shznet/pdf-sign-react

React component wrapper for `@shznet/pdf-sign-control`.

## Installation

```bash
npm install @shznet/pdf-sign-react @shznet/pdf-sign-control pdfjs-dist
```

## Usage

```tsx
import { PdfSignReact } from '@shznet/pdf-sign-react';

export function App() {
  const handlePdfLoaded = () => {
    console.log('PDF Loaded!');
  };

  return (
    <div style={{ height: '100vh' }}>
      <PdfSignReact 
        fileUrl="https://example.com/doc.pdf"
        onLoad={handlePdfLoaded}
        primaryColor="#ff0000"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `fileUrl` | `string` | URL of the PDF to display. |
| `scale` | `number` | Initial zoom scale. |
| `viewMode` | `'single-page' \| 'scroll'` | View mode configuration. |
| `primaryColor` | `string` | Color theme for interactive elements. |
| `onLoad` | `() => void` | Callback when PDF is fully loaded. |
