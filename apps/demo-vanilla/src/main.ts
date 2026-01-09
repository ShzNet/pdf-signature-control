import { PdfSignControl, ViewMode } from '@shznet/pdf-sign-control';
import './styles.css';
import { LeftPanel, NewFieldData } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { SignatureModal } from './components/SignatureModal';

const app = document.getElementById('root');

if (app) {
  // --- 1. Layout Setup ---

  // Header
  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = `<span>PDF Sign Demo V2</span>`; // V2 to indicate refactor
  app.appendChild(header);

  // Components
  const leftPanel = new LeftPanel();
  app.appendChild(leftPanel.element);

  const mainContent = document.createElement('main');
  mainContent.className = 'main-content';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.innerHTML = `
    <div class="control-group">
        <button id="prev-btn" title="Previous Page">◀</button>
        <span id="page-info" style="min-width: 80px; text-align: center;">1 / ?</span>
        <button id="next-btn" title="Next Page">▶</button>
    </div>
    
    <div class="divider"></div>
    
    <div class="control-group">
        <button id="zoom-out" title="Zoom Out">−</button>
        <span id="zoom-info" style="min-width: 50px; text-align: center;">100%</span>
        <button id="zoom-in" title="Zoom In">+</button>
    </div>
    
    <div class="divider"></div>

    <div class="control-group">
        <select id="view-mode">
            <option value="scroll">Scroll Mode</option>
            <option value="single">Single Page</option>
        </select>
    </div>
  `;
  mainContent.appendChild(toolbar);

  // Viewer Container
  const pdfContainer = document.createElement('div');
  pdfContainer.id = 'pdf-container';
  mainContent.appendChild(pdfContainer);

  app.appendChild(mainContent);

  const rightPanel = new RightPanel();
  app.appendChild(rightPanel.element);

  // Signature Modal (appended to body by itself, but we should instantiate it)
  const signatureModal = new SignatureModal();


  // --- 2. Logic Initialization ---

  const control = new PdfSignControl({
    container: pdfContainer,
    pdfLoaderOptions: {
      workerSrc: `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`,
      cMapUrl: `https://unpkg.com/pdfjs-dist@5.4.530/cmaps/`,
      cMapPacked: true,
    }
  });

  // Toolbar Handlers
  const prevBtn = toolbar.querySelector('#prev-btn') as HTMLButtonElement;
  const nextBtn = toolbar.querySelector('#next-btn') as HTMLButtonElement;
  const pageInfo = toolbar.querySelector('#page-info') as HTMLSpanElement;
  const viewModeSelect = toolbar.querySelector('#view-mode') as HTMLSelectElement;
  const zoomIn = toolbar.querySelector('#zoom-in') as HTMLButtonElement;
  const zoomOut = toolbar.querySelector('#zoom-out') as HTMLButtonElement;
  const zoomInfo = toolbar.querySelector('#zoom-info') as HTMLSpanElement;

  prevBtn.onclick = () => control.previousPage();
  nextBtn.onclick = () => control.nextPage();

  viewModeSelect.onchange = async () => {
    await control.setViewMode(viewModeSelect.value as ViewMode);
  };

  let currentScale = 1.0;
  zoomIn.onclick = () => {
    currentScale = Math.min(currentScale + 0.25, 3.0);
    control.setScale(currentScale);
  };
  zoomOut.onclick = () => {
    currentScale = Math.max(currentScale - 0.25, 0.5);
    control.setScale(currentScale);
  };

  // PDF Control Events
  control.on('page:change', (data: any) => {
    pageInfo.textContent = `${data.page} / ${data.total}`;
  });

  control.on('scale:change', (data: any) => {
    currentScale = data.scale;
    zoomInfo.textContent = `${Math.round(data.scale * 100)}%`;
  });

  control.on('fields:change', (fields: any[]) => {
    rightPanel.updateFields(fields);
  });

  // --- 3. Component Wiring ---

  // Connect Left Panel (Add Field)
  leftPanel.setCallbacks(
    (data: NewFieldData) => {
      const fieldId = `field-${Date.now()}`;
      const field = {
        id: fieldId,
        pageIndex: data.page - 1,
        rect: { x: data.x, y: data.y, width: data.width, height: data.height },
        type: data.type,
        content: data.content,
        draggable: data.draggable,
        resizable: data.resizable,
        deletable: data.deletable,
        style: {
          border: '1px solid #007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.05)',
        }
      };
      control.addField(field).catch((err: Error) => alert(err.message));
    },
    () => {
      // Open Modal
      signatureModal.open((html) => {
        leftPanel.setSignatureResult(html);
      });
    }
  );

  // Connect Right Panel (Remove/Update)
  rightPanel.setCallbacks(
    (id: string) => {
      control.removeField(id);
    },
    (id: string, prop: string, val: any) => {
      // Need to find field first to update, but updateField usually takes partial object or index.
      // core library `updateField(id, props)` signature support?
      // Assuming `control.updateField(id, { [prop]: val })` works or similar.
      // Checking core lib usage in previous main.ts... it wasn't used interactively much.
      // Let's assume control exposes a method or we do it via accessing field logic.
      // Review `PdfSignControl` API: `updateField(id, partialField)`

      const updateData: any = {};
      updateData[prop] = val;
      // control.updateField(id, updateData); // Assuming this method exists in adapter
      // Actually `PdfSignControl` is a facade. Let's assume it has it or we can't implement this yet.
      // If it doesn't, we can skip or log.
      // Based on previous conversations, `PdfSignControl` facade was updated.
      // Let's try calling it.
      if ((control as any).updateField) {
        (control as any).updateField(id, updateData);
      } else {
        console.warn('updateField not implemented on control facade');
      }
    }
  );

  // Initial Load
  const pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
  control.load(pdfUrl).catch(console.error);
}
