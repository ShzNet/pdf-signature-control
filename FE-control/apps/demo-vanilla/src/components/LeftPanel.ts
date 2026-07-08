export interface NewFieldData {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'text' | 'image' | 'signature';
    content: string;
    draggable: boolean;
    resizable: boolean;
    deletable: boolean;
}

export class LeftPanel {
    private container: HTMLElement;
    private onAddCallback?: (data: NewFieldData) => void;
    private onOpenSignatureModalCallback?: () => void;

    // Elements
    private typeSelect!: HTMLSelectElement;
    private contentTextDiv!: HTMLDivElement;
    private contentImageDiv!: HTMLDivElement;
    private contentHtmlDiv!: HTMLDivElement;
    private signatureResultInput!: HTMLInputElement;
    private signaturePreviewContainer!: HTMLDivElement;
    private signaturePreview!: HTMLDivElement;
    private openSigModalBtn!: HTMLButtonElement;

    private selectedImageContent: string | null = null;

    constructor() {
        this.container = document.createElement('aside');
        this.container.className = 'left-panel';
        this.container.innerHTML = `
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
              <textarea id="field-content-text" rows="3" style="width: 100%;">Text Field</textarea>
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

        this.bindElements();
        this.setupListeners();
        this.updateInputVisibility();
    }

    get element() {
        return this.container;
    }

    setCallbacks(onAdd: (data: NewFieldData) => void, onOpenSigModal: () => void) {
        this.onAddCallback = onAdd;
        this.onOpenSignatureModalCallback = onOpenSigModal;
    }

    setSignatureResult(html: string) {
        this.signatureResultInput.value = html;

        // Render static preview
        this.signaturePreview.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.srcdoc = html;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.pointerEvents = 'none';
        this.signaturePreview.appendChild(iframe);

        this.openSigModalBtn.classList.add('hidden');
        this.signaturePreviewContainer.classList.remove('hidden');
    }

    private bindElements() {
        this.typeSelect = this.container.querySelector('#field-type') as HTMLSelectElement;
        this.contentTextDiv = this.container.querySelector('#input-text-container') as HTMLDivElement;
        this.contentImageDiv = this.container.querySelector('#input-image-container') as HTMLDivElement;
        this.contentHtmlDiv = this.container.querySelector('#input-html-container') as HTMLDivElement;

        this.signatureResultInput = this.container.querySelector('#field-content-html') as HTMLInputElement;
        this.signaturePreviewContainer = this.container.querySelector('#sig-preview-container') as HTMLDivElement;
        this.signaturePreview = this.container.querySelector('#html-preview') as HTMLDivElement;
        this.openSigModalBtn = this.container.querySelector('#open-sig-modal-btn') as HTMLButtonElement;
    }

    private setupListeners() {
        // Type change
        this.typeSelect.addEventListener('change', () => this.updateInputVisibility());

        // Image Upload
        const fileInput = this.container.querySelector('#field-content-file') as HTMLInputElement;
        const imagePreview = this.container.querySelector('#image-preview') as HTMLDivElement;
        fileInput.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    this.selectedImageContent = evt.target?.result as string;
                    imagePreview.innerHTML = `<img src="${this.selectedImageContent}" style="max-height:50px;">`;
                };
                reader.readAsDataURL(file);
            }
        });

        // Signature Modal Open
        this.openSigModalBtn.addEventListener('click', () => {
            if (this.onOpenSignatureModalCallback) this.onOpenSignatureModalCallback();
        });

        // Signature Reset
        this.container.querySelector('#reset-sig-btn')!.addEventListener('click', () => {
            this.signatureResultInput.value = '';
            this.signaturePreview.innerHTML = '';
            this.openSigModalBtn.classList.remove('hidden');
            this.signaturePreviewContainer.classList.add('hidden');
        });

        // Add Field
        this.container.querySelector('#add-field-btn')!.addEventListener('click', () => this.handleAddField());
    }

    private updateInputVisibility() {
        const type = this.typeSelect.value;
        this.contentTextDiv.classList.toggle('hidden', type !== 'text');
        this.contentImageDiv.classList.toggle('hidden', type !== 'image');
        this.contentHtmlDiv.classList.toggle('hidden', type !== 'signature');
    }

    private handleAddField() {
        if (!this.onAddCallback) return;

        const page = parseInt((this.container.querySelector('#field-page') as HTMLInputElement).value) || 1;
        const x = parseFloat((this.container.querySelector('#field-x') as HTMLInputElement).value) || 0;
        const y = parseFloat((this.container.querySelector('#field-y') as HTMLInputElement).value) || 0;
        const w = parseFloat((this.container.querySelector('#field-w') as HTMLInputElement).value) || 120;
        const h = parseFloat((this.container.querySelector('#field-h') as HTMLInputElement).value) || 80;
        const type = this.typeSelect.value as any;

        let content = '';
        if (type === 'text') {
            content = (this.container.querySelector('#field-content-text') as HTMLTextAreaElement).value;
        } else if (type === 'image') {
            content = this.selectedImageContent || '';
        } else if (type === 'signature') {
            content = this.signatureResultInput.value || '';
        }

        const draggable = (this.container.querySelector('#flag-draggable') as HTMLInputElement).checked;
        const resizable = (this.container.querySelector('#flag-resizable') as HTMLInputElement).checked;
        const deletable = (this.container.querySelector('#flag-deletable') as HTMLInputElement).checked;

        if (!content && type !== 'text') {
            alert('Please provide content (upload image or draw signature)');
            return;
        }

        this.onAddCallback({
            page, x, y, width: w, height: h, type, content, draggable, resizable, deletable
        });
    }
}
