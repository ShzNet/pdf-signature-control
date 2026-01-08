import { PdfSignControl, ViewMode } from '@shz/pdf-sign-control';
// @ts-ignore
import SignaturePad from 'signature_pad';
import './styles.css';
import { SignatureGenerator, SignatureConfig } from './signature-generator';

const app = document.getElementById('root');

if (app) {
  // Initialize Generator
  const sigGen = new SignatureGenerator();

  // Section 1 image upload storage
  let section1ImageBase64: string | null = null;


  // ... (Update Select Option) ...
  // In Header/HTML generation:
  // <option value="signature">Signature Widget</option>

  // ... (Update Add Field Logic) ...
  // if (type === 'signature') ...

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
                <option value="signature">Signature Widget</option>
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
            <label>Signature Configuration</label>
            
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
      <div class="modal-content sig-modal">
          <!-- Header -->
          <div class="sig-modal-header">
              <h3>Thêm chữ ký</h3>
              <button id="close-modal-btn" class="close-btn">×</button>
          </div>
          
          <div class="sig-modal-body">
              <div class="sig-modal-content">
                  <!-- Left: Visual Input -->
                  <div class="sig-left-panel">
                      <!-- Tabs -->
                      <div class="sig-tabs">
                          <button class="sig-tab active" data-tab="drawing">Vẽ</button>
                          <button class="sig-tab" data-tab="certName">Tên</button>
                          <button class="sig-tab" data-tab="image">Ảnh</button>
                      </div>
                      
                      <!-- Drawing Tab -->
                      <div id="tab-drawing" class="tab-content">
                          <div class="signature-pad-container">
                              <canvas id="signature-canvas" class="signature-pad"></canvas>
                          </div>
                          <div class="sig-controls">
                              <div class="control-row">
                                  <span class="control-label">Màu sắc</span>
                                  <button class="color-btn active" data-color="#2563eb" style="background:#2563eb"></button>
                                  <button class="color-btn" data-color="#1f2937" style="background:#1f2937"></button>
                                  <button class="color-btn" data-color="#dc2626" style="background:#dc2626"></button>
                              </div>
                              <div class="control-row">
                                  <span class="control-label">Nét bút</span>
                                  <button class="pen-btn active" data-width="1" style="width:8px;height:8px"></button>
                                  <button class="pen-btn" data-width="2.5" style="width:12px;height:12px"></button>
                              </div>
                          </div>
                      </div>
                      
                      <!-- CertName Tab -->
                      <div id="tab-certName" class="tab-content hidden">
                          <div class="certname-input-container">
                              <input type="text" id="section1-certname-text" placeholder="Nhập tên chứng thư" class="certname-input">
                          </div>
                      </div>
                      
                      <!-- Image Tab -->
                      <div id="tab-image" class="tab-content hidden">
                          <div class="image-upload-container" id="image-upload-area">
                              <div id="section1-image-preview" class="image-preview">
                                  <div class="upload-placeholder">
                                      <div class="upload-icon">📁</div>
                                      <div>Nhấn để tải ảnh lên</div>
                                  </div>
                              </div>
                              <input type="file" id="section1-image-file" accept="image/*" style="display:none">
                          </div>
                      </div>
                      
                      <!-- Layout Options -->
                      <div class="option-group">
                          <div class="option-label">Bố cục</div>
                          <div class="toggle-group">
                              <button class="toggle-btn active" data-layout="horizontal">Ngang</button>
                              <button class="toggle-btn" data-layout="vertical">Dọc</button>
                          </div>
                      </div>
                  </div>
                  
                  <!-- Right: Info & Preview -->
                  <div class="sig-right-panel">
                      <!-- Info Lines -->
                      <div class="option-group">
                          <div class="option-label">Nội dung hiển thị</div>
                          <div class="info-lines-list" id="info-lines-list">
                              <div class="info-line-item">
                                  <input type="text" class="info-line-input" value="Ký số bởi: Trần Văn Chiến" placeholder="Nhập nội dung...">
                                  <button class="remove-line-btn" title="Xóa">×</button>
                              </div>
                              <div class="info-line-item">
                                  <input type="text" class="info-line-input" value="Thời gian:" placeholder="Nhập nội dung...">
                                  <button class="remove-line-btn" title="Xóa">×</button>
                              </div>
                          </div>
                          <button class="add-line-btn" id="add-info-line-btn">+ Thêm dòng</button>
                      </div>
                      
                      <!-- Font Size -->
                      <div class="option-group">
                          <div class="option-label">Cỡ chữ</div>
                          <input type="range" id="font-size-slider" min="6" max="12" value="9" class="slider">
                      </div>
                      
                      <!-- Preview -->
                      <div class="option-group">
                          <div class="option-label">Xem trước</div>
                          <div id="modal-sig-preview" class="sig-preview">
                              <div class="preview-placeholder">Preview</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          
          <!-- Footer -->
          <div class="modal-actions">
              <button class="btn-secondary" id="cancel-modal-btn">Hủy</button>
              <button class="btn-primary sig-confirm-btn" id="save-sig-btn">Xác nhận</button>
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
            <div style="color:#999; font-size:12px; font-style:italic; padding:10px;">No fields yet</div>
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

  // Debug Events
  control.on('field:add', (field: any) => {
    console.log('EVENT field:add', field);
  });
  control.on('field:remove', (data: any) => {
    console.log('EVENT field:remove', data);
  });
  control.on('field:update', (data: any) => {
    console.log('EVENT field:update', data);
  });

  // Sync Fields to Right Panel
  const fieldListContainer = document.querySelector('.right-panel .field-list') as HTMLDivElement;

  const renderFields = (fields: any[]) => {
    if (!fieldListContainer) return;
    fieldListContainer.innerHTML = '';

    fields.forEach((field, index) => {
      const item = document.createElement('div');
      item.className = 'field-item';
      item.style.padding = '10px';
      item.style.border = '1px solid #dee2e6';
      item.style.borderRadius = '4px';
      item.style.fontSize = '12px';
      item.style.cursor = 'pointer';
      item.style.marginBottom = '5px';
      item.style.background = 'white';

      // Basic Info
      const pageLabel = `Page ${field.pageIndex + 1}`;
      const typeLabel = field.type.toUpperCase();
      const coords = `x:${Math.round(field.rect.x)}, y:${Math.round(field.rect.y)}`;

      item.innerHTML = `
            <div style="font-weight:bold; margin-bottom:2px;">${index + 1}. ${typeLabel} (${pageLabel})</div>
            <div style="color:#666; font-size:11px;">${coords}</div>
            <div style="color:#666; font-size:11px;">Size: ${Math.round(field.rect.width)}x${Math.round(field.rect.height)}</div>
          `;

      item.onclick = () => {
        // Optional: Highlight field or scroll to it
        console.log('Clicked field:', field.id);
      };

      fieldListContainer.appendChild(item);
    });
  };

  control.on('fields:change', (fields: any[]) => {
    console.log('EVENT fields:change', fields);
    renderFields(fields);
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

  const updateInputVisibility = () => {
    const type = typeSelect.value;
    contentTextDiv.classList.add('hidden');
    contentImageDiv.classList.add('hidden');
    contentHtmlDiv.classList.add('hidden');

    if (type === 'text') contentTextDiv.classList.remove('hidden');
    if (type === 'image') contentImageDiv.classList.remove('hidden');
    if (type === 'signature') contentHtmlDiv.classList.remove('hidden');
  };

  typeSelect.onchange = updateInputVisibility;
  // Initialize state (in case browser preserved selection on reload)
  updateInputVisibility();

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
  const cancelModalBtn = document.getElementById('cancel-modal-btn') as HTMLButtonElement;
  const saveSigBtn = document.getElementById('save-sig-btn') as HTMLButtonElement;
  const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;

  // Modal preview element
  let modalPreviewDiv = document.getElementById('modal-sig-preview');

  // Containers in Left Panel
  const sigPreviewContainer = document.getElementById('sig-preview-container') as HTMLDivElement;
  const leftPanelPreview = document.getElementById('html-preview') as HTMLDivElement;
  const resetSigBtn = document.getElementById('reset-sig-btn') as HTMLButtonElement;
  const htmlResultInput = document.getElementById('field-content-html') as HTMLInputElement;

  // State
  let signaturePad: any = null;
  let currentTab = 'drawing';
  let currentPenColor = '#2563eb';
  let currentPenWidth = 1;
  let currentLayout: 'horizontal' | 'vertical' = 'horizontal';

  // Initialize signature pad
  function initSignaturePad() {
    if (!signaturePad && canvas) {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight - 4;
      }
      signaturePad = new SignaturePad(canvas, {
        minWidth: currentPenWidth,
        maxWidth: currentPenWidth * 2.5,
        penColor: currentPenColor
      });
      signaturePad.addEventListener('endStroke', updateModalPreview);
    }
  }

  // Tab switching logic
  function setupTabSwitching() {
    const tabs = document.querySelectorAll('.sig-tab');
    const tabContents = {
      drawing: document.getElementById('tab-drawing'),
      certName: document.getElementById('tab-certName'),
      image: document.getElementById('tab-image')
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = (tab as HTMLElement).dataset.tab as string;
        currentTab = tabName;

        // Update tab styles
        tabs.forEach(t => {
          const el = t as HTMLElement;
          if (el.dataset.tab === tabName) {
            el.style.background = '#f59e0b';
            el.style.color = 'white';
            el.style.border = 'none';
            el.classList.add('active');
          } else {
            el.style.background = 'white';
            el.style.color = '#374151';
            el.style.border = '1px solid #e5e7eb';
            el.classList.remove('active');
          }
        });

        // Toggle content visibility
        Object.entries(tabContents).forEach(([key, content]) => {
          if (content) {
            content.classList.toggle('hidden', key !== tabName);
          }
        });

        // Init signature pad if drawing tab
        if (tabName === 'drawing') {
          setTimeout(initSignaturePad, 50);
        }
        updateModalPreview();
      });
    });
  }

  // Color picker
  function setupColorPicker() {
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const color = (btn as HTMLElement).dataset.color || '#2563eb';
        currentPenColor = color;
        colorBtns.forEach(b => (b as HTMLElement).style.borderColor = 'transparent');
        (btn as HTMLElement).style.borderColor = color;
        if (signaturePad) {
          signaturePad.penColor = color;
        }
      });
    });
  }

  // Pen width picker
  function setupPenPicker() {
    const penBtns = document.querySelectorAll('.pen-btn');
    penBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const width = parseFloat((btn as HTMLElement).dataset.width || '1');
        currentPenWidth = width;
        penBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (signaturePad) {
          signaturePad.minWidth = width;
          signaturePad.maxWidth = width * 2.5;
        }
      });
    });
  }

  // Layout toggle
  function setupLayoutToggle() {
    const layoutBtns = document.querySelectorAll('.toggle-btn[data-layout]');
    layoutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentLayout = (btn as HTMLElement).dataset.layout as 'horizontal' | 'vertical';
        layoutBtns.forEach(b => {
          const el = b as HTMLElement;
          if (el.dataset.layout === currentLayout) {
            el.style.background = '#f59e0b';
            el.style.color = 'white';
          } else {
            el.style.background = 'white';
            el.style.color = '#374151';
          }
        });
        updateModalPreview();
      });
    });
  }

  // Image upload
  function setupImageUpload() {
    const uploadArea = document.getElementById('image-upload-area');
    const fileInput = document.getElementById('section1-image-file') as HTMLInputElement;
    const previewDiv = document.getElementById('section1-image-preview');

    uploadArea?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && previewDiv) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          section1ImageBase64 = evt.target?.result as string;
          previewDiv.innerHTML = `<img src="${section1ImageBase64}" style="max-height:140px; max-width:100%; object-fit:contain;">`;
          updateModalPreview();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Font size slider
  function setupFontSizeSlider() {
    const slider = document.getElementById('font-size-slider') as HTMLInputElement;
    slider?.addEventListener('input', updateModalPreview);
    slider?.addEventListener('change', updateModalPreview);
  }

  // CertName input
  function setupCertNameInput() {
    const input = document.getElementById('section1-certname-text');
    input?.addEventListener('input', updateModalPreview);
  }

  function renderPreview(container: HTMLElement, html: string) {
    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.pointerEvents = 'none';
    iframe.srcdoc = html;
    container.appendChild(iframe);
  }

  function updateModalPreview() {
    if (!modalPreviewDiv) return;
    const html = generateNewSignatureHTML();
    renderPreview(modalPreviewDiv, html);
  }

  // Get info lines from inputs
  function getInfoLines(): string[] {
    const container = document.getElementById('info-lines-list');
    if (!container) return [];
    const inputs = container.querySelectorAll('.info-line-input') as NodeListOf<HTMLInputElement>;
    return Array.from(inputs).map(input => input.value).filter(v => v.trim() !== '');
  }

  // Build SignatureConfig from modal state
  function buildSignatureConfig(): SignatureConfig {
    const fontSize = parseInt((document.getElementById('font-size-slider') as HTMLInputElement)?.value) || 10;

    // Determine visual type and content
    let visualType: 'image' | 'drawing' | 'text' = 'image';
    let visualContent: string | undefined = undefined;

    if (currentTab === 'drawing' && signaturePad && !signaturePad.isEmpty()) {
      visualType = 'drawing';
      visualContent = signaturePad.toDataURL();
    } else if (currentTab === 'image' && section1ImageBase64) {
      visualType = 'image';
      visualContent = section1ImageBase64;
    } else if (currentTab === 'certName') {
      visualType = 'text';
      visualContent = (document.getElementById('section1-certname-text') as HTMLInputElement)?.value || '';
    }

    return {
      layout: currentLayout,
      fontSize,
      sectionRatio: 35,
      visualType,
      visualContent,
      infoLines: getInfoLines()
    };
  }

  // Generate HTML using SignatureGenerator
  function generateNewSignatureHTML(): string {
    const config = buildSignatureConfig();
    return sigGen.generate(config);
  }

  // Open modal
  openModalBtn.onclick = () => {
    signatureModal.classList.remove('hidden');
    setTimeout(() => {
      initSignaturePad();
      updateModalPreview();
    }, 100);
  };

  // Close modal
  closeModalBtn.onclick = () => signatureModal.classList.add('hidden');
  cancelModalBtn?.addEventListener('click', () => signatureModal.classList.add('hidden'));



  // Save
  saveSigBtn.onclick = () => {
    const html = generateNewSignatureHTML();
    htmlResultInput.value = html;
    renderPreview(leftPanelPreview, html);
    openModalBtn.classList.add('hidden');
    sigPreviewContainer.classList.remove('hidden');
    signatureModal.classList.add('hidden');
  };

  // Reset
  resetSigBtn.onclick = () => {
    htmlResultInput.value = '';
    leftPanelPreview.innerHTML = '';
    openModalBtn.classList.remove('hidden');
    sigPreviewContainer.classList.add('hidden');
    if (signaturePad) signaturePad.clear();
    section1ImageBase64 = null;
  };

  // Initialize all modal interactions
  setupTabSwitching();
  setupColorPicker();
  setupPenPicker();
  setupInfoLines();
  setupLayoutToggle();
  setupImageUpload();
  setupFontSizeSlider();
  setupCertNameInput();

  // Setup info lines (add/remove/edit with live preview)
  function setupInfoLines() {
    const container = document.getElementById('info-lines-list');
    const addBtn = document.getElementById('add-info-line-btn');

    // Add new line
    addBtn?.addEventListener('click', () => {
      if (!container) return;
      const newItem = document.createElement('div');
      newItem.className = 'info-line-item';
      newItem.innerHTML = `
        <input type="text" class="info-line-input" value="" placeholder="Nhập nội dung...">
        <button class="remove-line-btn" title="Xóa">×</button>
      `;
      container.appendChild(newItem);

      // Focus new input
      const newInput = newItem.querySelector('.info-line-input') as HTMLInputElement;
      newInput?.focus();

      // Add event listeners for new item
      newInput?.addEventListener('input', updateModalPreview);
      newItem.querySelector('.remove-line-btn')?.addEventListener('click', () => {
        newItem.remove();
        updateModalPreview();
      });

      updateModalPreview();
    });

    // Setup existing lines
    container?.querySelectorAll('.info-line-item').forEach(item => {
      const input = item.querySelector('.info-line-input') as HTMLInputElement;
      const removeBtn = item.querySelector('.remove-line-btn');

      input?.addEventListener('input', updateModalPreview);
      removeBtn?.addEventListener('click', () => {
        item.remove();
        updateModalPreview();
      });
    });
  }

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
    } else if (type === 'signature') {
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
