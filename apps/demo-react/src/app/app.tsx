import { PdfSignReact, PdfSignReactRef } from '@shz/pdf-sign-react';
import { useRef, useState } from 'react';
import '../styles.css';

export function App() {
  const pdfRef = useRef<PdfSignReactRef>(null);
  const [pageInfo, setPageInfo] = useState('1 / ?');
  const [scale, setScale] = useState(100);

  return (
    <>
      <header className="app-header">
        <span>PDF Sign Demo</span>
      </header>

      <aside className="left-panel">
        <div className="panel-title">Toolbox</div>
        <div className="action-buttons-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn-primary">Add Signature Field</button>
          <button className="btn-secondary" disabled style={{ opacity: 0.5, background: '#e9ecef', border: '1px solid #ced4da' }}>Add Date Field</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="toolbar">
          <div className="control-group">
            <button onClick={() => pdfRef.current?.previousPage()} title="Previous Page">◀</button>
            <span id="page-info" style={{ minWidth: '80px', textAlign: 'center' }}>{pageInfo}</span>
            <button onClick={() => pdfRef.current?.nextPage()} title="Next Page">▶</button>
          </div>

          <div className="divider"></div>

          <div className="control-group">
            <button onClick={() => pdfRef.current?.setScale((pdfRef.current?.getScale() ?? 1) - 0.25)} title="Zoom Out">−</button>
            <span id="zoom-info" style={{ minWidth: '50px', textAlign: 'center' }}>{scale}%</span>
            <button onClick={() => pdfRef.current?.setScale((pdfRef.current?.getScale() ?? 1) + 0.25)} title="Zoom In">+</button>
          </div>

          <div className="divider"></div>

          <div className="control-group">
            <select
              onChange={(e) => pdfRef.current?.setViewMode(e.target.value as 'scroll' | 'single')}
              defaultValue="scroll"
            >
              <option value="scroll">Scroll Mode</option>
              <option value="single">Single Page</option>
            </select>
          </div>
        </div>

        <div id="pdf-container">
          <PdfSignReact
            ref={pdfRef}
            src="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
            viewMode="scroll"
            pdfLoaderOptions={{
              workerSrc: 'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs',
              cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.530/cmaps/',
              cMapPacked: true,
            }}
            onPageChange={(page, total) => setPageInfo(`${page} / ${total}`)}
            onScaleChange={(s) => setScale(Math.round(s * 100))}
            onError={(err) => console.error('PDF Error:', err)}
          />
        </div>
      </main>

      <aside className="right-panel">
        <div className="panel-section" style={{ padding: '20px', borderBottom: '1px solid #e9ecef' }}>
          <div className="panel-title">Signature Fields</div>
          <div className="field-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="field-item" style={{ padding: '10px', background: '#e9ecef', borderRadius: '4px', fontSize: '13px' }}>
              Signature 1 (Page 1)
            </div>
            <div className="field-item" style={{ padding: '10px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '13px' }}>
              Signature 2 (Page 3)
            </div>
          </div>
        </div>
        <div className="properties-panel">
          <div className="panel-title">Properties</div>
          <div className="form-group">
            <label>Field Name</label>
            <input type="text" defaultValue="Signature 1" />
          </div>
          <div className="form-group">
            <label>Signer</label>
            <input type="text" defaultValue="John Doe" />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="text" value={new Date().toLocaleDateString()} readOnly />
          </div>
        </div>
      </aside>
    </>
  );
}

export default App;
