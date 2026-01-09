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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
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

  const onPageChange = useCallback((page: number, total: number) => {
    setCurrentPage(page);
    setTotalPages(total);
    // Sync new field page with current page
    setNewField(prev => ({ ...prev, page }));
  }, []);
  const onScaleChange = useCallback((s: number) => setScale(s), []);
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

    // If changing the target page for new field, also navigate to that page
    if (key === 'page') {
      const pageNum = Number(value);
      if (!isNaN(pageNum) && pageNum >= 1 && pdfRef.current) {
        // We don't have easy access to totalPages here unless we use state or ref check
        // But setCurrentPage will trigger the useEffect in PdfSignReact which calls goToPage
        setCurrentPage(pageNum);
      }
    }
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
            <button onClick={() => pdfRef.current?.previousPage()} title="Previous Page">◀</button>
            <div className="page-input-group">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                style={{ width: '50px', textAlign: 'center' }}
              />
              <span> / {totalPages}</span>
            </div>
            <button onClick={() => pdfRef.current?.nextPage()} title="Next Page">▶</button>
          </div>

          <div className="divider"></div>

          <div className="control-group">
            <button onClick={() => setScale(s => Math.max(0.25, Number((s - 0.25).toFixed(2))))} title="Zoom Out">−</button>
            <span id="zoom-info" style={{ minWidth: '50px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(5.0, Number((s + 0.25).toFixed(2))))} title="Zoom In">+</button>
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
            <div className="control-group">
              <button onClick={() => pdfRef.current?.print({ withSignatures: false })} title="Print">Print</button>
            </div>
          </div>
        </div>

        <div id="pdf-container">
          <PdfSignReact
            ref={pdfRef}
            src="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
            viewMode="scroll"
            page={currentPage}
            scale={scale}
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
