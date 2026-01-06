import { PdfSignReact, PdfSignReactRef } from '@shz/pdf-sign-react';
import { useRef, useState } from 'react';
import { SignatureField, SignatureFieldType } from '@shz/pdf-sign-control';
import '../styles.css';

interface NewFieldState {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: SignatureFieldType;
  content: string;
  moveable: boolean;
  resizable: boolean;
  deletable: boolean;
}

export function App() {
  const pdfRef = useRef<PdfSignReactRef>(null);
  const [pageInfo, setPageInfo] = useState('1 / ?');
  const [scale, setScale] = useState(100);
  const [fields, setFields] = useState<SignatureField[]>([]);

  // Form State
  const [newField, setNewField] = useState<NewFieldState>({
    page: 1,
    x: 100,
    y: 100,
    width: 120,
    height: 80,
    type: 'text',
    content: 'Signature Placeholder',
    moveable: true,
    resizable: true,
    deletable: true
  });

  const handleAddField = () => {
    if (!pdfRef.current) return;

    const control = pdfRef.current.getControl();
    if (!control) return;

    const fieldId = `field-${Date.now()}`;
    const field: SignatureField = {
      id: fieldId,
      pageIndex: newField.page - 1,
      rect: {
        x: newField.x,
        y: newField.y,
        width: newField.width,
        height: newField.height
      },
      type: newField.type,
      content: newField.content,
      draggable: newField.moveable,
      resizable: newField.resizable,
      deletable: newField.deletable,
      style: {
        border: '1px solid #007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.05)',
      }
    };

    control.addField(field).catch((err: Error) => alert(err.message));
  };

  const handleInputChange = (key: keyof NewFieldState, value: any) => {
    setNewField(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <header className="app-header">
        <span>PDF Sign Demo (React)</span>
      </header>

      <aside className="left-panel">
        <div className="panel-title">Create Field</div>
        <div className="form-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
          <div className="form-group">
            <label>Page</label>
            <input
              type="number"
              value={newField.page}
              min={1}
              style={{ width: '100%' }}
              onChange={e => handleInputChange('page', parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '5px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>X (pt)</label>
              <input
                type="number"
                value={newField.x}
                style={{ width: '100%' }}
                onChange={e => handleInputChange('x', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Y (pt)</label>
              <input
                type="number"
                value={newField.y}
                style={{ width: '100%' }}
                onChange={e => handleInputChange('y', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '5px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Width</label>
              <input
                type="number"
                value={newField.width}
                style={{ width: '100%' }}
                onChange={e => handleInputChange('width', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Height</label>
              <input
                type="number"
                value={newField.height}
                style={{ width: '100%' }}
                onChange={e => handleInputChange('height', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select
              style={{ width: '100%' }}
              value={newField.type}
              onChange={e => handleInputChange('type', e.target.value)}
            >
              <option value="text">Text</option>
              <option value="html">HTML</option>
              <option value="image">Image</option>
            </select>
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea
              rows={3}
              style={{ width: '100%' }}
              value={newField.content}
              onChange={e => handleInputChange('content', e.target.value)}
            />
          </div>

          <div className="flags-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={newField.moveable}
                onChange={e => handleInputChange('moveable', e.target.checked)}
              /> Moveable
            </label>
            <label>
              <input
                type="checkbox"
                checked={newField.resizable}
                onChange={e => handleInputChange('resizable', e.target.checked)}
              /> Resizable
            </label>
            <label>
              <input
                type="checkbox"
                checked={newField.deletable}
                onChange={e => handleInputChange('deletable', e.target.checked)}
              /> Deletable
            </label>
          </div>

          <button className="btn-primary" onClick={handleAddField} style={{ marginTop: '10px' }}>Add Field</button>

          <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '5px' }}>Model Sync Test</div>
            <button
              className="btn-secondary"
              onClick={() => {
                const externalField: SignatureField = {
                  id: `ext-${Date.now()}`,
                  pageIndex: 0,
                  rect: { x: 50, y: 50, width: 100, height: 50 },
                  type: 'text',
                  content: 'External Field',
                  draggable: true,
                  resizable: true,
                  deletable: true,
                  style: { border: '2px dashed red', backgroundColor: 'rgba(255,0,0,0.1)' }
                };
                setFields(prev => [...prev, externalField]);
              }}
              style={{ width: '100%', fontSize: '11px', padding: '5px' }}
            >
              + Add via Props (External)
            </button>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
              Adds a field by modifying the <code>fields</code> prop directly.
            </div>
          </div>
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
            fields={fields}
            onPageChange={(page, total) => setPageInfo(`${page} / ${total}`)}
            onScaleChange={(s) => setScale(Math.round(s * 100))}
            onError={(err) => console.error('PDF Error:', err)}
            onFieldsChange={setFields}
          />
        </div>
      </main>

      <aside className="right-panel">
        <div className="panel-section" style={{ padding: '20px', borderBottom: '1px solid #e9ecef' }}>
          <div className="panel-title">Signature Fields</div>
          <div className="field-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fields.length === 0 ? (
              <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic', padding: '10px' }}>No fields yet</div>
            ) : (
              fields.map((field, index) => (
                <div
                  key={field.id}
                  className="field-item"
                  style={{
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginBottom: '5px',
                    background: 'white'
                  }}
                  onClick={() => console.log('Clicked field:', field.id)}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                    {index + 1}. {field.type.toUpperCase()} (Page {field.pageIndex + 1})
                  </div>
                  <div style={{ color: '#666', fontSize: '11px' }}>
                    x:{Math.round(field.rect.x)}, y:{Math.round(field.rect.y)}
                  </div>
                  <div style={{ color: '#666', fontSize: '11px' }}>
                    Size: {Math.round(field.rect.width)}x{Math.round(field.rect.height)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default App;
