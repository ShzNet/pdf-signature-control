
import { PdfSignControl, ViewMode } from '@shz/pdf-sign-control';
// @ts-ignore
import SignaturePad from 'signature_pad';
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
    <div class="panel-title">Create Field</div>
    <div class="form-container" style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
        <div class="form-group">
            <label>Page</label>
            <input type="number" id="field-page" value="1" min="1" style="width: 100%;">
        </div>
        <div class="form-row" style="display: flex; gap: 5px;">
             <div class="form-group" style="flex:1">
                <label>X (pt)</label>
                <input type="number" id="field-x" value="100" style="width: 100%;">
             </div>
             <div class="form-group" style="flex:1">
                <label>Y (pt)</label>
                <input type="number" id="field-y" value="100" style="width: 100%;">
             </div>
        </div>
        <div class="form-row" style="display: flex; gap: 5px;">
             <div class="form-group" style="flex:1">
                <label>Width</label>
                <input type="number" id="field-w" value="120" style="width: 100%;">
             </div>
             <div class="form-group" style="flex:1">
                <label>Height</label>
                <input type="number" id="field-h" value="80" style="width: 100%;">
             </div>
        </div>
        <div class="form-group">
            <label>Type</label>
            <select id="field-type" style="width: 100%;">
                <option value="text">Text</option>
                <option value="html">HTML (Signature)</option>
                <option value="image">Image (Upload)</option>
            </select>
        </div>
        
        <!-- Dynamic Content Inputs -->
        <div id="input-text-container" class="form-group">
            <label>Content</label>
            <textarea id="field-content-text" rows="3" style="width: 100%;">Signature Placeholder</textarea>
        </div>
        
        <div id="input-image-container" class="form-group hidden">
             <label>Upload Image</label>
             <input type="file" id="field-content-file" accept="image/*">
             <div id="image-preview" style="margin-top:5px; max-height:50px; overflow:hidden;"></div>
        </div>
        
        <div id="input-html-container" class="form-group hidden">
            <label>Signature HTML</label>
            
            <!-- Context: Empty State -->
            <button id="open-sig-modal-btn" style="width:100%; margin-bottom: 5px;">Setup Signature</button>
            
            <!-- Context: Filled State -->
            <div id="sig-preview-container" class="hidden" style="border:1px solid #dee2e6; padding: 5px; border-radius: 4px; background: white;">
                <div id="html-preview" style="font-size:11px; margin-bottom: 5px; overflow: hidden; width: 100%; aspect-ratio: 3/2; border: 1px dotted #eee; display: flex; align-items: center; justify-content: center;"></div>
                <button id="reset-sig-btn" class="btn-secondary" style="width: 100%; font-size: 11px; padding: 4px;">Reset / Clear</button>
            </div>
            
            <input type="hidden" id="field-content-html">
        </div>

        <div class="flags-row" style="display: flex; flex-wrap: wrap; gap: 10px;">
            <label><input type="checkbox" id="flag-draggable" checked> Moveable</label>
            <label><input type="checkbox" id="flag-resizable" checked> Resizable</label>
            <label><input type="checkbox" id="flag-deletable" checked> Deletable</label>
        </div>
        
        <button class="btn-primary" id="add-field-btn" style="margin-top: 10px;">Add Field</button>
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

  // 3b. Signature Modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay hidden';
  modal.id = 'signature-modal';
  modal.innerHTML = `
      <div class="modal-content" style="width: 600px;">
          <h3>Setup Signature</h3>
          
          <div style="display: flex; gap: 20px;">
              <!-- Left Col: Canvas -->
              <div style="flex: 1;">
                 <label>Draw Signature</label>
                 <div class="signature-pad-container">
                      <canvas id="signature-canvas" class="signature-pad"></canvas>
                 </div>
                 <div style="text-align: right; margin-top: 5px;">
                    <button id="clear-sig-btn" style="font-size: 11px; padding: 2px 8px;">Clear Drawing</button>
                 </div>
              </div>
              
              <!-- Right Col: Metadata -->
              <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                  <div class="form-group" style="margin-bottom:0;">
                      <label>Signer Name</label>
                      <input type="text" id="sig-name" value="Nguyen Van A">
                  </div>
                  <div class="form-group" style="margin-bottom:0;">
                      <label>Organization / Unit</label>
                      <input type="text" id="sig-unit" value="IT Department">
                  </div>
                  <div class="form-group" style="margin-bottom:0;">
                      <label>Phone</label>
                      <input type="text" id="sig-phone" value="0987654321">
                  </div>
                  <div class="form-group" style="margin-bottom:0;">
                      <label>Signing Time</label>
                      <input type="text" id="sig-time" readonly style="background: #e9ecef;">
                  </div>
              </div>
          </div>

          <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
              <label style="margin-bottom: 8px;">Layout Style</label>
              <div style="display: flex; gap: 15px;">
                  <label style="font-weight: normal; display: flex; align-items: center; gap: 5px;">
                      <input type="radio" name="sig-layout" value="top" checked> 
                      Image Top (Center Text)
                  </label>
                  <label style="font-weight: normal; display: flex; align-items: center; gap: 5px;">
                      <input type="radio" name="sig-layout" value="left"> 
                      Image Left (Text Right)
                  </label>
              </div>
          </div>

          <div class="modal-actions">
              <button class="btn-secondary" id="close-modal-btn">Cancel</button>
              <button class="btn-primary" id="save-sig-btn">Save & Use</button>
          </div>
      </div>
  `;
  app.appendChild(modal);

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

  // --- Dynamic Input Logic ---
  const typeSelect = document.getElementById('field-type') as HTMLSelectElement;
  const contentTextDiv = document.getElementById('input-text-container') as HTMLDivElement;
  const contentImageDiv = document.getElementById('input-image-container') as HTMLDivElement;
  const contentHtmlDiv = document.getElementById('input-html-container') as HTMLDivElement;

  // Variables to hold content
  let selectedImageContent: string | null = null;

  typeSelect.onchange = () => {
    const type = typeSelect.value;
    contentTextDiv.classList.add('hidden');
    contentImageDiv.classList.add('hidden');
    contentHtmlDiv.classList.add('hidden');

    if (type === 'text') contentTextDiv.classList.remove('hidden');
    if (type === 'image') contentImageDiv.classList.remove('hidden');
    if (type === 'html') contentHtmlDiv.classList.remove('hidden');
  };

  // Image Upload Logic
  const fileInput = document.getElementById('field-content-file') as HTMLInputElement;
  const imagePreview = document.getElementById('image-preview') as HTMLDivElement;

  fileInput.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        selectedImageContent = evt.target?.result as string;
        imagePreview.innerHTML = `<img src="${selectedImageContent}" style="max-height:50px;">`;
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Signature Modal & Preview Logic ---
  const signatureModal = document.getElementById('signature-modal') as HTMLDivElement;
  const openModalBtn = document.getElementById('open-sig-modal-btn') as HTMLButtonElement;
  const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement;
  const clearSigBtn = document.getElementById('clear-sig-btn') as HTMLButtonElement;
  const saveSigBtn = document.getElementById('save-sig-btn') as HTMLButtonElement;
  const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;

  const sigNameInput = document.getElementById('sig-name') as HTMLInputElement;
  const sigUnitInput = document.getElementById('sig-unit') as HTMLInputElement;
  const sigPhoneInput = document.getElementById('sig-phone') as HTMLInputElement;
  const sigTimeInput = document.getElementById('sig-time') as HTMLInputElement;
  const layoutRadios = document.getElementsByName('sig-layout') as NodeListOf<HTMLInputElement>;

  // Containers in Left Panel
  const sigPreviewContainer = document.getElementById('sig-preview-container') as HTMLDivElement;
  const leftPanelPreview = document.getElementById('html-preview') as HTMLDivElement;
  const resetSigBtn = document.getElementById('reset-sig-btn') as HTMLButtonElement;
  const htmlResultInput = document.getElementById('field-content-html') as HTMLInputElement;

  // Signature Pad Instance
  let signaturePad: any = null;

  function initSignaturePad() {
    if (!signaturePad && canvas) {
      // Resize canvas
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }

      signaturePad = new SignaturePad(canvas, {
        minWidth: 1,
        maxWidth: 2.5,
        penColor: 'black'
      });

      signaturePad.addEventListener('endStroke', updateModalPreview);
    }
  }

  // --- Live Preview Logic ---
  const modalContent = signatureModal.querySelector('.modal-content');
  let modalPreviewDiv = document.getElementById('modal-sig-preview');
  if (!modalPreviewDiv && modalContent) {
    modalPreviewDiv = document.createElement('div');
    modalPreviewDiv.id = 'modal-sig-preview';
    modalPreviewDiv.style.border = '1px dashed #ccc';
    modalPreviewDiv.style.marginTop = '15px';
    modalPreviewDiv.style.padding = '10px';
    modalPreviewDiv.style.background = '#f9f9f9';
    modalPreviewDiv.style.minHeight = '60px';
    modalPreviewDiv.innerHTML = '<div style="color:#999; text-align:center;">Preview</div>';

    // Insert before Actions (Actions is last child)
    const actions = signatureModal.querySelector('.modal-actions');
    modalContent.insertBefore(modalPreviewDiv, actions);
  }

  function generateSignatureHTML(dataUrl: string | null): string {
    const name = sigNameInput.value || '';
    const unit = sigUnitInput.value || '';
    const phone = sigPhoneInput.value || '';
    const time = sigTimeInput.value || '';

    // Get Layout
    let layout = 'top';
    layoutRadios.forEach(r => { if (r.checked) layout = r.value; });

    // Image placeholder logic:
    // We always render the container for the image to preserve spacing.
    // Top layout: Image area is top 60% of height.
    // Left layout: Image area is left 40% of width.

    const imgContent = dataUrl
      ? `<img src="${dataUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`
      : ''; // Empty but container exists

    const metaHtml = `
        <div style="font-family: sans-serif; font-size: 7pt; color: #333; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">
            <div style="font-weight: bold; font-size: 8pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name ? 'Signed by: ' + name : ''}</div>
            ${unit ? `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Unit: ${unit}</div>` : ''}
            ${phone ? `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Phone: ${phone}</div>` : ''}
            <div style="color: #666; font-size: 5pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${time}</div>
        </div>
      `;

    // STRICT 3:2 CONTAINER
    // We use absolute positioning or flex ratios to ensure "no jumping".

    if (layout === 'left') {
      return `
            <div style="display: flex; align-items: center; width: 100%; height: 100%; box-sizing: border-box; overflow: hidden;">
                <!-- Fixed 40% width for Image -->
                <div style="flex: 0 0 40%; height: 100%; display:flex; justify-content:center; align-items:center; padding: 2px;">
                    ${imgContent}
                </div>
                <!-- Fixed 60% width for Text -->
                <div style="flex: 0 0 60%; height: 100%; display:flex; flex-direction:column; justify-content:center; padding: 2px; overflow: hidden;">
                    ${metaHtml}
                </div>
            </div>
          `;
    } else {
      // Top Layout
      return `
            <div style="display: flex; flex-direction: column; width: 100%; height: 100%; box-sizing: border-box; overflow: hidden;">
                <!-- Fixed 65% height for Image -->
                <div style="flex: 0 0 65%; width: 100%; display:flex; align-items:flex-end; justify-content:center; padding: 2px;">
                    ${imgContent}
                </div>
                <!-- Fixed 35% height for Text -->
                <div style="flex: 0 0 35%; width: 100%; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; padding: 2px; overflow: hidden;">
                    <div style="text-align:center; width:100%;">
                        ${metaHtml}
                    </div>
                </div>
            </div>
          `;
    }
  }

  function updateModalPreview() {
    if (!modalPreviewDiv) return;

    const dataUrl = (signaturePad && !signaturePad.isEmpty()) ? signaturePad.toDataURL() : null;
    modalPreviewDiv.innerHTML = generateSignatureHTML(dataUrl);
  }

  // Event Listeners for Live Preview
  [sigNameInput, sigUnitInput, sigPhoneInput].forEach(el => {
    el.addEventListener('keyup', updateModalPreview);
  });
  layoutRadios.forEach(el => {
    el.addEventListener('change', updateModalPreview);
  });

  openModalBtn.onclick = () => {
    signatureModal.classList.remove('hidden');
    sigTimeInput.value = new Date().toLocaleString(); // Auto update time

    // Delay init canvas to allow layout
    setTimeout(() => {
      initSignaturePad();
      updateModalPreview();
    }, 50);
  };

  closeModalBtn.onclick = () => {
    signatureModal.classList.add('hidden');
  };

  clearSigBtn.onclick = () => {
    if (signaturePad) {
      signaturePad.clear();
      updateModalPreview();
    }
  };

  // Save Logic
  saveSigBtn.onclick = () => {
    const dataUrl = (signaturePad && !signaturePad.isEmpty()) ? signaturePad.toDataURL() : null;
    const html = generateSignatureHTML(dataUrl);

    // Update Main Form
    htmlResultInput.value = html;
    leftPanelPreview.innerHTML = html;

    // Show Preview Container, Hide Setup Button
    openModalBtn.classList.add('hidden');
    sigPreviewContainer.classList.remove('hidden');

    signatureModal.classList.add('hidden');
  };

  // Reset Logic
  resetSigBtn.onclick = () => {
    htmlResultInput.value = '';
    leftPanelPreview.innerHTML = '';

    openModalBtn.classList.remove('hidden');
    sigPreviewContainer.classList.add('hidden');

    // Reset Signature Pad
    if (signaturePad) {
      signaturePad.clear();
    }
  };

  // Field Creation Logic
  const addFieldBtn = document.getElementById('add-field-btn') as HTMLButtonElement;

  addFieldBtn.onclick = () => {
    const page = parseInt((document.getElementById('field-page') as HTMLInputElement).value) || 1;
    const x = parseFloat((document.getElementById('field-x') as HTMLInputElement).value) || 0;
    const y = parseFloat((document.getElementById('field-y') as HTMLInputElement).value) || 0;
    const w = parseFloat((document.getElementById('field-w') as HTMLInputElement).value) || 120;
    const h = parseFloat((document.getElementById('field-h') as HTMLInputElement).value) || 80;
    const type = (document.getElementById('field-type') as HTMLSelectElement).value;

    let content = '';
    if (type === 'text') {
      content = (document.getElementById('field-content-text') as HTMLTextAreaElement).value;
    } else if (type === 'image') {
      content = selectedImageContent || '';
    } else if (type === 'html') {
      content = htmlResultInput.value || '<div>No Signature</div>';
    }

    const draggable = (document.getElementById('flag-draggable') as HTMLInputElement).checked;
    const resizable = (document.getElementById('flag-resizable') as HTMLInputElement).checked;
    const deletable = (document.getElementById('flag-deletable') as HTMLInputElement).checked;

    const fieldId = `field-${Date.now()}`;

    const field = {
      id: fieldId,
      pageIndex: page - 1,
      rect: { x, y, width: w, height: h },
      type: type as any,
      content: content,
      draggable,
      resizable,
      deletable,
      style: {
        border: '1px solid #007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.05)',
      }
    };

    if (!content && type !== 'text') {
      alert('Please provide content (upload image or draw signature)');
      return;
    }

    console.log('Adding field:', field);
    control.addField(field).catch((err: Error) => {
      alert(err.message);
    });
  };

  (window as any).pdfControl = control;
}
