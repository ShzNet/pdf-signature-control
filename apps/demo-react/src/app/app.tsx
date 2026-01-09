import { PdfSignReact, PdfSignReactRef } from '@shznet/pdf-sign-react';
import { useRef, useState, useMemo, useCallback } from 'react';
import { SignatureField } from '@shznet/pdf-sign-control';
import '../styles.css';
import { NewFieldState } from './types';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { SignatureModal } from './components/SignatureModal';

export function App() {
  const pdfRef = useRef<PdfSignReactRef>(null);

  // App State
  const [pageInfo, setPageInfo] = useState('1 / ?');
  const [scale, setScale] = useState(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fields, setFields] = useState<SignatureField[]>([]);

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

  const handleConfirmSignature = (htmlContent: string) => {
    setNewField(prev => ({ ...prev, content: htmlContent }));
    setIsModalOpen(false);
  };

  const handleAddGenericField = () => {
    if (!pdfRef.current) return;
    const control = pdfRef.current.getControl();
    if (!control) return;

    if (newField.type === 'signature' && !newField.content) {
      alert('Please setup the signature first.');
      return;
    }
    if (newField.type === 'image' && !newField.content) {
      alert('Please upload an image first.');
      return;
    }

    const fieldId = `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

  const handleUpdateField = (id: string, key: 'draggable' | 'resizable', value: boolean) => {
    // Use control API for updates (uncontrolled pattern)
    const control = pdfRef.current?.getControl();
    if (control) {
      control.updateField(id, { [key]: value });
    }
  };

  const handleRemoveField = (id: string) => {
    // Use control API for removes (uncontrolled pattern)
    const control = pdfRef.current?.getControl();
    if (control) {
      control.removeField(id);
    }
  };

  return (
    <>
      <header className="app-header">
        <span>PDF Sign Demo (React)</span>
      </header>

      <LeftPanel
        newField={newField}
        onChange={handleInputChange}
        onAdd={handleAddGenericField}
        onOpenSigModal={() => setIsModalOpen(true)}
        onClearSigContent={() => handleInputChange('content', '')}
      />

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
            onPageChange={onPageChange}
            onScaleChange={onScaleChange}
            onError={onError}
            onFieldsChange={onFieldsChange}
          />
        </div>
      </main>

      <RightPanel
        fields={fields}
        onRemoveField={handleRemoveField}
        onUpdateField={handleUpdateField}
      />

      <SignatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSignature}
      />
    </>
  );
}

export default App;
