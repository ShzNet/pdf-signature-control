
import { PdfSignControl, ViewMode } from '@shz/pdf-sign-control';
import './styles.css';

const app = document.getElementById('root');

// Create controls container
const controls = document.createElement('div');
controls.className = 'controls';
controls.innerHTML = `
  <div class="control-group">
    <button id="prev-btn">◀ Prev</button>
    <span id="page-info">Page: 1 / ?</span>
    <button id="next-btn">Next ▶</button>
  </div>
  <div class="control-group">
    <label>Mode:</label>
    <select id="view-mode">
      <option value="scroll">Scroll</option>
      <option value="single">Single Page</option>
    </select>
  </div>
  <div class="control-group">
    <button id="zoom-out">−</button>
    <span id="zoom-info">100%</span>
    <button id="zoom-in">+</button>
  </div>
`;
app?.appendChild(controls);

// Create PDF container
const container = document.createElement('div');
container.id = 'pdf-container';
app?.appendChild(container);

const control = new PdfSignControl({
  container: container,
  pdfLoaderOptions: {
    workerSrc: `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`,
    cMapUrl: `https://unpkg.com/pdfjs-dist@5.4.530/cmaps/`,
    cMapPacked: true,
  }
});

// Get DOM elements
const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
const pageInfo = document.getElementById('page-info') as HTMLSpanElement;
const viewModeSelect = document.getElementById('view-mode') as HTMLSelectElement;
const zoomIn = document.getElementById('zoom-in') as HTMLButtonElement;
const zoomOut = document.getElementById('zoom-out') as HTMLButtonElement;
const zoomInfo = document.getElementById('zoom-info') as HTMLSpanElement;

// Navigation handlers
prevBtn.onclick = () => control.previousPage();
nextBtn.onclick = () => control.nextPage();

// Mode switch handler  
viewModeSelect.onchange = async () => {
  const mode = viewModeSelect.value as ViewMode;
  await control.setViewMode(mode);
};

// Zoom handlers
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

// Listen to events
control.on('page:change', (data: { page: number; total: number }) => {
  pageInfo.textContent = `Page: ${data.page} / ${data.total}`;
});

control.on('scale:change', (data: { scale: number }) => {
  currentScale = data.scale;
  zoomInfo.textContent = `${Math.round(data.scale * 100)}%`;
});

// Load a sample PDF - Tracemonkey paper has page numbers at bottom
const pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

control.load(pdfUrl).catch(console.error);

(window as any).pdfControl = control;
