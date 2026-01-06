
import { PdfSignControl, ViewMode } from '@shz/pdf-sign-control';
import './styles.css';

const app = document.getElementById('root');

if (app) {
  // 1. Header
  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = `<span>PDF Sign Demo</span>`;
  app.appendChild(header);

  // 2. Left Panel (Toolbox)
  const leftPanel = document.createElement('aside');
  leftPanel.className = 'left-panel';
  leftPanel.innerHTML = `
    <div class="panel-title">Toolbox</div>
    <div class="action-buttons-container" style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-primary" id="add-field-btn">Add Signature Field</button>
        <button class="btn-secondary" disabled style="opacity: 0.5; background: #e9ecef; border: 1px solid #ced4da;">Add Date Field</button>
    </div>
  `;
  app.appendChild(leftPanel);

  // 3. Main Content (Toolbar + Viewer)
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

  // 4. Right Panel (Fields List & Properties)
  const rightPanel = document.createElement('aside');
  rightPanel.className = 'right-panel';
  rightPanel.innerHTML = `
    <div class="panel-section" style="padding: 20px; border-bottom: 1px solid #e9ecef;">
        <div class="panel-title">Signature Fields</div>
        <div class="field-list" style="display: flex; flex-direction: column; gap: 8px;">
            <div class="field-item" style="padding: 10px; background: #e9ecef; border-radius: 4px; font-size: 13px;">
                Signature 1 (Page 1)
            </div>
            <div class="field-item" style="padding: 10px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 13px;">
                Signature 2 (Page 3)
            </div>
        </div>
    </div>
    <div class="properties-panel">
        <div class="panel-title">Properties</div>
        <div class="form-group">
            <label>Field Name</label>
            <input type="text" value="Signature 1">
        </div>
        <div class="form-group">
            <label>Signer</label>
            <input type="text" value="John Doe">
        </div>
        <div class="form-group">
            <label>Date</label>
            <input type="text" value="${new Date().toLocaleDateString()}" readonly>
        </div>
    </div>
  `;
  app.appendChild(rightPanel);

  // --- Logic Initialization ---

  const control = new PdfSignControl({
    container: pdfContainer,
    pdfLoaderOptions: {
      workerSrc: `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`,
      cMapUrl: `https://unpkg.com/pdfjs-dist@5.4.530/cmaps/`,
      cMapPacked: true,
    }
  });

  // Get Elements
  const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
  const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
  const pageInfo = document.getElementById('page-info') as HTMLSpanElement;
  const viewModeSelect = document.getElementById('view-mode') as HTMLSelectElement;
  const zoomIn = document.getElementById('zoom-in') as HTMLButtonElement;
  const zoomOut = document.getElementById('zoom-out') as HTMLButtonElement;
  const zoomInfo = document.getElementById('zoom-info') as HTMLSpanElement;

  // Handlers
  prevBtn.onclick = () => control.previousPage();
  nextBtn.onclick = () => control.nextPage();

  viewModeSelect.onchange = async () => {
    await control.setViewMode(viewModeSelect.value as ViewMode);
  };

  let currentScale = 1.0;
  zoomIn.onclick = () => {
    currentScale = Math.min(currentScale + 0.25, 3.0);
    control.setScale(currentScale);
    zoomInfo.textContent = `${Math.round(currentScale * 100)}%`;
  };
  zoomOut.onclick = () => {
    currentScale = Math.max(currentScale - 0.25, 0.5);
    control.setScale(currentScale);
    zoomInfo.textContent = `${Math.round(currentScale * 100)}%`;
  };

  // Listeners
  control.on('page:change', (data: any) => {
    pageInfo.textContent = `${data.page} / ${data.total}`;
  });

  control.on('scale:change', (data: any) => {
    currentScale = data.scale;
    zoomInfo.textContent = `${Math.round(data.scale * 100)}%`;
  });

  // Load PDF
  const pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
  control.load(pdfUrl).catch(console.error);

  (window as any).pdfControl = control;
}
