export class RightPanel {
    private container: HTMLElement;
    private fieldListContainer: HTMLElement;
    private onRemoveCallback?: (fieldId: string) => void;
    private onUpdateCallback?: (fieldId: string, prop: string, value: any) => void;
    private onClearAllCallback?: () => void;

    constructor() {
        this.container = document.createElement('aside');
        this.container.className = 'right-panel';
        this.container.innerHTML = `
      <div class="panel-section" style="padding: 20px; border-bottom: 1px solid #e9ecef;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div class="panel-title" style="margin:0;">Signature Fields</div>
            <button id="clear-all-btn" style="display:none; font-size:11px; padding:4px 8px; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer;">Clear All</button>
          </div>
          <div class="field-list" style="display: flex; flex-direction: column; gap: 8px;">
              <div style="color:#999; font-size:12px; font-style:italic; padding:10px;">No fields yet</div>
          </div>
      </div>
    `;
        this.fieldListContainer = this.container.querySelector('.field-list') as HTMLElement;
        this.container.querySelector('#clear-all-btn')!.addEventListener('click', () => {
            if (this.onClearAllCallback) this.onClearAllCallback();
        });
    }

    get element() {
        return this.container;
    }

    setCallbacks(onRemove: (id: string) => void, onUpdate: (id: string, prop: string, val: any) => void, onClearAll: () => void) {
        this.onRemoveCallback = onRemove;
        this.onUpdateCallback = onUpdate;
        this.onClearAllCallback = onClearAll;
    }

    updateFields(fields: any[]) {
        this.fieldListContainer.innerHTML = '';
        const clearBtn = this.container.querySelector('#clear-all-btn') as HTMLElement;

        if (fields.length === 0) {
            this.fieldListContainer.innerHTML = '<div style="color:#999; font-size:12px; font-style:italic; padding:10px;">No fields yet</div>';
            if (clearBtn) clearBtn.style.display = 'none';
            return;
        }

        if (clearBtn) clearBtn.style.display = 'block';

        fields.forEach((field, index) => {
            const item = document.createElement('div');
            item.className = 'field-item';
            item.style.padding = '10px';
            item.style.border = '1px solid #dee2e6';
            item.style.borderRadius = '4px';
            item.style.fontSize = '12px';
            item.style.cursor = 'default';
            item.style.marginBottom = '5px';
            item.style.background = 'white';

            const pageLabel = `Page ${field.pageNumber}`;
            const typeLabel = (field.type || 'text').toUpperCase();
            const coords = `x:${Math.round(field.rect.x)}, y:${Math.round(field.rect.y)}`;

            item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:bold;">${index + 1}. ${typeLabel}</span>
            <button class="remove-field-btn" style="border:none; background:none; color:red; cursor:pointer;">×</button>
        </div>
        <div style="color:#666; font-size:11px;">${pageLabel}</div>
        <div style="color:#666; font-size:11px;">${coords}</div>
        <div style="color:#666; font-size:11px;">Size: ${Math.round(field.rect.width)}x${Math.round(field.rect.height)}</div>
        <div style="margin-top:5px; display:flex; gap:10px;">
           <label><input type="checkbox" class="toggle-drag" ${field.draggable ? 'checked' : ''}> Drag</label>
           <label><input type="checkbox" class="toggle-resize" ${field.resizable ? 'checked' : ''}> Resize</label>
        </div>
      `;

            // Events
            item.querySelector('.remove-field-btn')!.addEventListener('click', () => {
                if (this.onRemoveCallback) this.onRemoveCallback(field.id);
            });

            item.querySelector('.toggle-drag')!.addEventListener('change', (e) => {
                if (this.onUpdateCallback) this.onUpdateCallback(field.id, 'draggable', (e.target as HTMLInputElement).checked);
            });

            item.querySelector('.toggle-resize')!.addEventListener('change', (e) => {
                if (this.onUpdateCallback) this.onUpdateCallback(field.id, 'resizable', (e.target as HTMLInputElement).checked);
            });

            this.fieldListContainer.appendChild(item);
        });
    }
}
