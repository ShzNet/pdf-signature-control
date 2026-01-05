import { PdfSignReact } from '@shz/pdf-sign-react';
import { PdfSignControl } from '@shz/pdf-sign-control';
import { useRef, useEffect } from 'react';

export function App() {
  const controlRef = useRef<PdfSignControl | null>(null);

  const handleLoad = (control: PdfSignControl) => {
    controlRef.current = control;
    control.load('/multipage.pdf').catch(console.error);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', background: '#eee' }}>
        <h2>React PDF Sign Demo</h2>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <PdfSignReact
          onLoad={handleLoad}
          pdfLoaderOptions={{
            workerSrc: 'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs',
            cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.530/cmaps/',
            cMapPacked: true,
          }}
        />
      </div>
    </div>
  );
}

export default App;
