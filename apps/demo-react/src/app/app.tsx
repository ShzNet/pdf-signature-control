import { PdfSignReact, PdfSignReactRef } from '@shz/pdf-sign-react';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { SignatureField, SignatureFieldType } from '@shz/pdf-sign-control';
import '../styles.css';
import SignaturePad from 'signature_pad';
import { SignatureGenerator, SignatureConfig } from './signature-generator';

interface NewFieldState {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: SignatureFieldType;
  content: string;
  draggable: boolean;
  resizable: boolean;
  deletable: boolean;
}

export function App() {
  const pdfRef = useRef<PdfSignReactRef>(null);

  // App State
  const [pageInfo, setPageInfo] = useState('1 / ?');
  const [scale, setScale] = useState(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fields, setFields] = useState<SignatureField[]>([]);

  // Generator
  const sigGen = useMemo(() => new SignatureGenerator(), []);

  // Generic Field Form State
  const [newField, setNewField] = useState<NewFieldState>({
    page: 1,
    x: 100,
    y: 100,
    width: 120,
    height: 80,
    type: 'text',
    content: 'Text Field',
    draggable: true,
    resizable: true,
    deletable: true
  });
  const [activeTab, setActiveTab] = useState<'drawing' | 'certName' | 'image'>('drawing');

  // Signature Config
  const [sigLayout, setSigLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [sigFontSize, setSigFontSize] = useState(5);
  const [infoLines, setInfoLines] = useState<string[]>(['Signed by: Alice', 'Date:']);
  const [certName, setCertName] = useState('');
  const [drawingColor, setDrawingColor] = useState('#2563eb');
  const [penWidth, setPenWidth] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');

  // Drawing
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);

  // Generic Field Form State


  // Optimize Props to prevent re-renders
  const pdfLoaderOptions = useMemo(() => ({
    workerSrc: 'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs',
    cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.530/cmaps/',
    cMapPacked: true,
  }), []);

  const onPageChange = useCallback((page: number, total: number) => setPageInfo(`${page} / ${total}`), []);
  const onScaleChange = useCallback((s: number) => setScale(Math.round(s * 100)), []);
  const onError = useCallback((err: Error) => console.error('PDF Error:', err), []);
  const onFieldsChange = useCallback((newFields: SignatureField[]) => setFields([...newFields]), []);

  // Initialize Signature Pad
  useEffect(() => {
    if (isModalOpen && activeTab === 'drawing' && sigCanvasRef.current) {
      setTimeout(() => {
        if (!sigCanvasRef.current) return;

        if (!sigPadRef.current) {
          sigPadRef.current = new SignaturePad(sigCanvasRef.current, {
            backgroundColor: 'rgba(255, 255, 255, 0)',
            penColor: drawingColor,
            minWidth: penWidth,
            maxWidth: penWidth * 2.5
          });

          sigPadRef.current.addEventListener('endStroke', () => updatePreview());
        }

        const canvas = sigCanvasRef.current;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d')?.scale(ratio, ratio);

        sigPadRef.current.clear();
        updatePreview();
      }, 50);
    }
  }, [isModalOpen, activeTab]);

  useEffect(() => {
    if (sigPadRef.current) {
      sigPadRef.current.penColor = drawingColor;
      sigPadRef.current.minWidth = penWidth;
      sigPadRef.current.maxWidth = penWidth * 2.5;
    }
  }, [drawingColor, penWidth]);

  useEffect(() => {
    if (isModalOpen) {
      updatePreview();
    }
  }, [isModalOpen, activeTab, sigLayout, sigFontSize, infoLines, certName, selectedImage]);

  const updatePreview = () => {
    const config: SignatureConfig = {
      layout: sigLayout,
      fontSize: sigFontSize,
      infoLines: [...infoLines],
      visualType: activeTab === 'image' ? 'image' : (activeTab === 'certName' ? 'text' : 'drawing'),
      visualContent: getVisualContent()
    };
    const html = sigGen.generate(config);
    setPreviewHtml(html);
  };

  const getVisualContent = (): string => {
    if (activeTab === 'certName') return certName || 'Your Name';
    if (activeTab === 'image') return selectedImage || '';
    if (activeTab === 'drawing') return sigPadRef.current?.toDataURL() || '';
    return '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveSignature = () => {
    const config: SignatureConfig = {
      layout: sigLayout,
      fontSize: sigFontSize,
      infoLines: [...infoLines],
      visualType: activeTab === 'image' ? 'image' : (activeTab === 'certName' ? 'text' : 'drawing'),
      visualContent: getVisualContent()
    };
    const html = sigGen.generate(config);
    setNewField(prev => ({ ...prev, content: html }));
    setIsModalOpen(false);
  };

  const handleAddGenericField = () => {
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
      draggable: newField.draggable,
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
            <input type="number" value={newField.page} min={1} style={{ width: '100%' }}
              onChange={e => handleInputChange('page', parseInt(e.target.value) || 1)} />
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '5px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>X (pt)</label>
              <input type="number" value={newField.x} style={{ width: '100%' }}
                onChange={e => handleInputChange('x', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Y (pt)</label>
              <input type="number" value={newField.y} style={{ width: '100%' }}
                onChange={e => handleInputChange('y', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '5px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Width</label>
              <input type="number" value={newField.width} style={{ width: '100%' }}
                onChange={e => handleInputChange('width', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Height</label>
              <input type="number" value={newField.height} style={{ width: '100%' }}
                onChange={e => handleInputChange('height', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select style={{ width: '100%' }} value={newField.type} onChange={e => {
              const newType = e.target.value as SignatureFieldType;
              setNewField(prev => ({
                ...prev,
                type: newType,
                content: newType === 'signature' ? '' : (newType === 'text' ? 'Text Field' : '')
              }));
            }}>
              <option value="text">Text</option>
              <option value="signature">Signature Widget</option>
              <option value="image">Image (Upload)</option>
            </select>
          </div>

          {/* Dynamic Content Inputs */}
          {newField.type === 'text' && (
            <div className="form-group">
              <label>Content</label>
              <textarea rows={3} value={newField.content} style={{ width: '100%' }} onChange={e => handleInputChange('content', e.target.value)} />
            </div>
          )}

          {newField.type === 'image' && (
            <div className="form-group">
              <label>Upload Image</label>
              <input type="file" accept="image/*" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const reader = new FileReader();
                  reader.onload = (ev) => handleInputChange('content', ev.target?.result as string);
                  reader.readAsDataURL(e.target.files[0]);
                }
              }} />
              {newField.content && newField.content !== 'Signature Placeholder' && (
                <div style={{ marginTop: '5px', maxHeight: '50px', overflow: 'hidden', border: '1px solid #ddd' }}>
                  <img src={newField.content} style={{ maxHeight: '50px' }} />
                </div>
              )}
            </div>
          )}

          {newField.type === 'signature' && (
            <div className="form-group">
              <label>Signature Configuration</label>
              {!newField.content || newField.content === 'Signature Placeholder' ? (
                <button className="btn-secondary" style={{ width: '100%', marginBottom: '5px' }} onClick={() => setIsModalOpen(true)}>
                  Setup Signature
                </button>
              ) : (
                <div style={{ border: '1px solid #dee2e6', padding: '5px', borderRadius: '4px', background: 'white' }}>
                  <div style={{ fontSize: '11px', marginBottom: '5px', overflow: 'hidden', width: '100%', aspectRatio: '3 / 2', border: '1px dotted #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <iframe srcDoc={newField.content} title="Field Preview" style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}></iframe>
                  </div>
                  <button className="btn-secondary" style={{ width: '100%', fontSize: '11px', padding: '4px' }} onClick={() => handleInputChange('content', '')}>
                    Reset / Clear
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flags-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <label><input type="checkbox" checked={newField.draggable} onChange={e => handleInputChange('draggable', e.target.checked)} /> Moveable</label>
            <label><input type="checkbox" checked={newField.resizable} onChange={e => handleInputChange('resizable', e.target.checked)} /> Resizable</label>
            <label><input type="checkbox" checked={newField.deletable} onChange={e => handleInputChange('deletable', e.target.checked)} /> Deletable</label>
          </div>

          <button className="btn-primary" onClick={handleAddGenericField} style={{ width: '100%' }}>Add Field</button>
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
            pdfLoaderOptions={pdfLoaderOptions}
            fields={fields}
            onPageChange={onPageChange}
            onScaleChange={onScaleChange}
            onError={onError}
            onFieldsChange={onFieldsChange}
          />
        </div>
      </main>

      <aside className="right-panel">
        <div className="panel-section" style={{ padding: '20px', borderBottom: '1px solid #e9ecef' }}>
          <div className="panel-title">Fields</div>
          <div className="field-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fields.length === 0 ? (
              <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic', padding: '10px' }}>No fields yet</div>
            ) : (
              fields.map((field, index) => (
                <div key={field.id} className="field-item" style={{ padding: '10px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '12px', marginBottom: '5px', background: 'white' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{index + 1}. {field.type.toUpperCase()} (P{field.pageIndex + 1})</span>
                    <button style={{ padding: '2px 5px', fontSize: '10px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '3px' }}
                      onClick={() => setFields(prev => prev.filter(f => f.id !== field.id))}>X</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
                    <label>
                      <input type="checkbox" checked={field.draggable !== false}
                        onChange={(e) => setFields(prev => prev.map(f => f.id === field.id ? { ...f, draggable: e.target.checked } : f))}
                      /> Drag
                    </label>
                    <label>
                      <input type="checkbox" checked={field.resizable !== false}
                        onChange={(e) => setFields(prev => prev.map(f => f.id === field.id ? { ...f, resizable: e.target.checked } : f))}
                      /> Resize
                    </label>
                  </div>

                  {/* Field Details */}
                  <div style={{ marginTop: '5px', color: '#666', fontSize: '10px' }}>
                    <div>x: {Math.round(field.rect.x)}, y: {Math.round(field.rect.y)}</div>
                    <div>w: {Math.round(field.rect.width)}, h: {Math.round(field.rect.height)}</div>
                  </div>

                  {/* Live Preview */}
                  {(field.type === 'signature' || field.type === 'html') && field.content && (
                    <div style={{ marginTop: '5px', border: '1px solid #eee', width: '100%', aspectRatio: '3 / 2', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <iframe srcDoc={field.content} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none', transform: 'scale(0.8)', transformOrigin: 'center' }} title="Preview"></iframe>
                    </div>
                  )}
                  {field.type === 'image' && field.content && (
                    <div style={{ marginTop: '5px', maxHeight: '60px', overflow: 'hidden', border: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
                      <img src={field.content} style={{ maxHeight: '100%', maxWidth: '100%' }} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Signature Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content sig-modal">
            <div className="sig-modal-header">
              <h3>Signature Configuration</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="sig-modal-body">
              <div className="sig-modal-content">
                <div className="sig-left-panel">
                  <div className="sig-tabs">
                    <div className={`sig-tab ${activeTab === 'drawing' ? 'active' : ''}`} onClick={() => setActiveTab('drawing')}>Draw</div>
                    <div className={`sig-tab ${activeTab === 'certName' ? 'active' : ''}`} onClick={() => setActiveTab('certName')}>Name</div>
                    <div className={`sig-tab ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>Image</div>
                  </div>

                  {/* Drawing */}
                  <div className={`tab-content ${activeTab !== 'drawing' ? 'hidden' : ''}`}>
                    <div className="signature-pad-container">
                      <canvas ref={sigCanvasRef} className="signature-pad"></canvas>
                    </div>
                    <div className="sig-controls">
                      <div className="control-row">
                        <button className={`color-btn ${drawingColor === '#2563eb' ? 'active' : ''}`} style={{ background: '#2563eb' }} onClick={() => setDrawingColor('#2563eb')}></button>
                        <button className={`color-btn ${drawingColor === '#1f2937' ? 'active' : ''}`} style={{ background: '#1f2937' }} onClick={() => setDrawingColor('#1f2937')}></button>
                        <button className={`color-btn ${drawingColor === '#dc2626' ? 'active' : ''}`} style={{ background: '#dc2626' }} onClick={() => setDrawingColor('#dc2626')}></button>
                      </div>
                      <div className="control-row">
                        <span className="control-label" style={{ marginRight: '10px', fontSize: '13px', color: '#6b7280' }}>Stroke</span>
                        <button className={`pen-btn ${penWidth === 1 ? 'active' : ''}`} onClick={() => setPenWidth(1)} style={{ width: '8px', height: '8px' }}></button>
                        <button className={`pen-btn ${penWidth === 2.5 ? 'active' : ''}`} onClick={() => setPenWidth(2.5)} style={{ width: '12px', height: '12px', marginLeft: '10px' }}></button>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div className={`tab-content ${activeTab !== 'certName' ? 'hidden' : ''}`}>
                    <div className="certname-input-container">
                      <input type="text" className="certname-input" placeholder="Enter your name" value={certName} onChange={e => setCertName(e.target.value)} />
                    </div>
                  </div>

                  {/* Image */}
                  <div className={`tab-content ${activeTab !== 'image' ? 'hidden' : ''}`}>
                    <div className="image-upload-container" onClick={() => document.getElementById('react-sig-upload')?.click()}>
                      <input type="file" id="react-sig-upload" hidden accept="image/*" onChange={handleImageUpload} />
                      {selectedImage ? (
                        <div className="image-preview"><img src={selectedImage} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></div>
                      ) : (
                        <div className="upload-placeholder">
                          <div className="upload-icon">☁️</div>
                          <div>Click to upload</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="option-group" style={{ marginTop: '20px' }}>
                    <div className="option-label">Layout</div>
                    <div className="toggle-group">
                      <button className={`toggle-btn ${sigLayout === 'horizontal' ? 'active' : ''}`} onClick={() => setSigLayout('horizontal')}>Horizontal</button>
                      <button className={`toggle-btn ${sigLayout === 'vertical' ? 'active' : ''}`} onClick={() => setSigLayout('vertical')}>Vertical</button>
                    </div>
                  </div>
                </div>

                <div className="sig-right-panel">
                  <div className="option-group">
                    <div className="option-label">Display Content</div>
                    <div className="info-lines-list">
                      {infoLines.map((line, i) => (
                        <div key={i} className="info-line-item">
                          <input type="text" className="info-line-input" value={line} onChange={e => {
                            const newLines = [...infoLines];
                            newLines[i] = e.target.value;
                            setInfoLines(newLines);
                          }} />
                          <button className="remove-line-btn" onClick={() => setInfoLines(infoLines.filter((_, idx) => idx !== i))}>×</button>
                        </div>
                      ))}
                      <button className="add-line-btn" onClick={() => setInfoLines([...infoLines, ''])}>+ Add Line</button>
                    </div>
                  </div>

                  <div className="option-group">
                    <div className="option-label">Font Size</div>
                    <input type="range" min="3" max="9" className="slider" value={sigFontSize} onChange={e => setSigFontSize(parseInt(e.target.value))} />
                  </div>

                  <div className="option-group">
                    <div className="option-label">Preview</div>
                    <div className="sig-preview">
                      <iframe srcDoc={previewHtml} title="Signature Preview" style={{ width: '100%', height: '100%', border: 'none' }}></iframe>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="sig-confirm-btn" onClick={handleSaveSignature}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
