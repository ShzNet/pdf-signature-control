// @ts-ignore
import SignaturePad from 'signature_pad';
import { SignatureConfig, SignatureGenerator } from '../signature-generator';
import { SignaturePreview } from './SignaturePreview';

export class SignatureModal {
    private element: HTMLDivElement;
    private signaturePad: any;
    private preview: SignaturePreview;
    private generator = new SignatureGenerator(); // For final generation

    // State
    private activeTab = 'drawing';
    private drawingColor = '#2563eb';
    private penWidth = 1;
    private layout: 'horizontal' | 'vertical' = 'horizontal';
    private fontSize = 5;
    private infoLines = ['Signed by: Alice', 'Date:'];
    private certName = '';
    private selectedImage: string | null = null;

    private onConfirmCallback?: (html: string) => void;

    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay hidden';
        this.element.innerHTML = `
      <div class="modal-content sig-modal">
          <div class="sig-modal-header">
              <h3>Signature Configuration</h3>
              <button class="close-btn" id="sig-close-btn">×</button>
          </div>
          <div class="sig-modal-body">
              <div class="sig-modal-content">
                  <div class="sig-left-panel">
                      <div class="sig-tabs">
                          <button class="sig-tab active" data-tab="drawing">Draw</button>
                          <button class="sig-tab" data-tab="certName">Name</button>
                          <button class="sig-tab" data-tab="image">Image</button>
                      </div>
                      
                      <!-- Drawing -->
                      <div id="sig-tab-drawing" class="tab-content">
                          <div class="signature-pad-container">
                              <canvas class="signature-pad"></canvas>
                          </div>
                          <div class="sig-controls">
                              <div class="control-row">
                                  <button class="color-btn active" data-color="#2563eb" style="background:#2563eb"></button>
                                  <button class="color-btn" data-color="#1f2937" style="background:#1f2937"></button>
                                  <button class="color-btn" data-color="#dc2626" style="background:#dc2626"></button>
                              </div>
                              <div class="control-row">
                                  <button class="pen-btn active" data-width="1" style="width:8px;height:8px"></button>
                                  <button class="pen-btn" data-width="2.5" style="width:12px;height:12px"></button>
                              </div>
                          </div>
                      </div>
                      
                      <!-- Name -->
                      <div id="sig-tab-certName" class="tab-content hidden">
                          <div class="certname-input-container">
                              <input type="text" class="certname-input" placeholder="Enter your name">
                          </div>
                      </div>
                      
                      <!-- Image -->
                      <div id="sig-tab-image" class="tab-content hidden">
                          <div class="image-upload-container">
                              <input type="file" accept="image/*" hidden>
                              <div class="image-preview">
                                  <div class="upload-placeholder">
                                      <div class="upload-icon">☁️</div>
                                      <div>Click to upload</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div class="option-group" style="margin-top:20px;">
                          <div class="option-label">Layout</div>
                          <div class="toggle-group">
                              <button class="toggle-btn active" data-layout="horizontal">Horizontal</button>
                              <button class="toggle-btn" data-layout="vertical">Vertical</button>
                          </div>
                      </div>
                  </div>
                  
                  <div class="sig-right-panel">
                      <div class="option-group">
                          <div class="option-label">Display Content</div>
                          <div class="info-lines-list"></div>
                          <button class="add-line-btn">+ Add Line</button>
                      </div>
                      
                      <div class="option-group">
                          <div class="option-label">Font Size</div>
                          <input type="range" min="3" max="9" value="5" class="slider">
                      </div>
                      
                      <div class="option-group">
                          <div class="option-label">Preview</div>
                          <div class="sig-preview" id="sig-modal-preview-container"></div>
                      </div>
                  </div>
              </div>
          </div>
          <div class="modal-actions">
              <button class="btn-secondary" id="sig-cancel-btn">Cancel</button>
              <button class="sig-confirm-btn" id="sig-confirm-btn">Confirm</button>
          </div>
      </div>
    `;

        document.body.appendChild(this.element);

        // Init Preview
        const previewContainer = this.element.querySelector('#sig-modal-preview-container') as HTMLElement;
        this.preview = new SignaturePreview(previewContainer);

        this.setupEventListeners();
        this.renderInfoLines();
    }

    open(onConfirm: (html: string) => void) {
        this.onConfirmCallback = onConfirm;
        this.element.classList.remove('hidden');

        // Delay init canvas to allow layout
        setTimeout(() => {
            this.initCanvas();
            this.updatePreview();
        }, 100);
    }

    close() {
        this.element.classList.add('hidden');
    }

    private setupEventListeners() {
        // Close / Cancel
        this.element.querySelector('#sig-close-btn')!.addEventListener('click', () => this.close());
        this.element.querySelector('#sig-cancel-btn')!.addEventListener('click', () => this.close());
        this.element.querySelector('#sig-confirm-btn')!.addEventListener('click', () => {
            const config = this.buildConfig();
            const html = this.generator.generate(config);
            if (this.onConfirmCallback) this.onConfirmCallback(html);
            this.close();
        });

        // Tabs
        const tabs = this.element.querySelectorAll('.sig-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const t = tab as HTMLElement;
                this.activeTab = t.dataset['tab']!;

                // Update UI
                tabs.forEach(x => x.classList.remove('active'));
                t.classList.add('active');

                this.element.querySelector('#sig-tab-drawing')!.classList.toggle('hidden', this.activeTab !== 'drawing');
                this.element.querySelector('#sig-tab-certName')!.classList.toggle('hidden', this.activeTab !== 'certName');
                this.element.querySelector('#sig-tab-image')!.classList.toggle('hidden', this.activeTab !== 'image');

                if (this.activeTab === 'drawing') setTimeout(() => this.initCanvas(), 50);
                this.updatePreview();
            });
        });

        // Layout
        const layoutBtns = this.element.querySelectorAll('.toggle-btn');
        layoutBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const b = btn as HTMLElement;
                this.layout = b.dataset['layout'] as 'horizontal' | 'vertical';
                layoutBtns.forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                this.updatePreview();
            });
        });

        // Colors
        const colorBtns = this.element.querySelectorAll('.color-btn');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const b = btn as HTMLElement;
                this.drawingColor = b.dataset['color']!;
                colorBtns.forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                if (this.signaturePad) this.signaturePad.penColor = this.drawingColor;
            });
        });

        // Pen Width
        const penBtns = this.element.querySelectorAll('.pen-btn');
        penBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const b = btn as HTMLElement;
                this.penWidth = parseFloat(b.dataset['width']!);
                penBtns.forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                if (this.signaturePad) {
                    this.signaturePad.minWidth = this.penWidth;
                    this.signaturePad.maxWidth = this.penWidth + 1.5;
                }
            });
        });

        // Name Input
        const nameInput = this.element.querySelector('.certname-input') as HTMLInputElement;
        nameInput.addEventListener('input', (e) => {
            this.certName = (e.target as HTMLInputElement).value;
            this.updatePreview();
        });

        // Image Upload
        const uploadContainer = this.element.querySelector('.image-upload-container') as HTMLElement;
        const fileInput = uploadContainer.querySelector('input') as HTMLInputElement;
        uploadContainer.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    this.selectedImage = evt.target?.result as string;
                    const preview = uploadContainer.querySelector('.image-preview') as HTMLElement;
                    preview.innerHTML = `<img src="${this.selectedImage}" style="max-width:100%;max-height:100%;object-fit:contain">`;
                    this.updatePreview();
                };
                reader.readAsDataURL(file);
            }
        });

        // Font Size
        const slider = this.element.querySelector('.slider') as HTMLInputElement;
        slider.addEventListener('input', (e) => {
            this.fontSize = parseInt((e.target as HTMLInputElement).value);
            this.updatePreview();
        });

        // Info Lines Add
        this.element.querySelector('.add-line-btn')!.addEventListener('click', () => {
            this.infoLines.push('');
            this.renderInfoLines();
            this.updatePreview();
        });
    }

    private renderInfoLines() {
        const container = this.element.querySelector('.info-lines-list') as HTMLElement;
        container.innerHTML = '';
        this.infoLines.forEach((line, index) => {
            const div = document.createElement('div');
            div.className = 'info-line-item';
            div.innerHTML = `
            <input type="text" class="info-line-input" value="${line}">
            <button class="remove-line-btn">×</button>
          `;

            const input = div.querySelector('input') as HTMLInputElement;
            input.addEventListener('input', (e) => {
                this.infoLines[index] = (e.target as HTMLInputElement).value;
                this.updatePreview();
            });

            div.querySelector('button')!.addEventListener('click', () => {
                this.infoLines.splice(index, 1);
                this.renderInfoLines();
                this.updatePreview();
            });

            container.appendChild(div);
        });
    }

    private initCanvas() {
        const canvas = this.element.querySelector('.signature-pad') as HTMLCanvasElement;
        if (!this.signaturePad && canvas) {
            // Resize
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext('2d')?.scale(ratio, ratio);

            this.signaturePad = new SignaturePad(canvas, {
                backgroundColor: 'rgba(255,255,255,0)',
                penColor: this.drawingColor,
                minWidth: this.penWidth,
                maxWidth: this.penWidth + 1.5
            });

            this.signaturePad.addEventListener('endStroke', () => this.updatePreview());
        } else if (this.signaturePad) {
            // just clear/resize logic if needed?
            // Actually existing main.ts re-inits sometimes.
            // For simplicity, let's keep one instance but handle resize?
            // Simplest is to clear and resize if dimensions changed
        }
    }

    private buildConfig(): SignatureConfig {
        let visualType: 'any' = 'text'; // temporary type to satisfy compilation until I check full types
        let visualContent = '';

        if (this.activeTab === 'drawing') {
            visualType = 'drawing';
            visualContent = this.signaturePad ? this.signaturePad.toDataURL() : '';
        } else if (this.activeTab === 'image') {
            visualType = 'image';
            visualContent = this.selectedImage || '';
        } else {
            visualType = 'text';
            visualContent = this.certName || 'Your Name';
        }

        return {
            layout: this.layout,
            fontSize: this.fontSize,
            infoLines: [...this.infoLines],
            visualType: visualType as any,
            visualContent
        };
    }

    private updatePreview() {
        const config = this.buildConfig();
        this.preview.render(config);
    }
}
