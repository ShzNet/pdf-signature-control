import { SignatureField } from '../types.js';
import { CoordinateUtils } from '../utils/CoordinateUtils.js';
import { EventBus } from '../utils/EventBus.js';
import { InteractionManager, DragEventData, ResizeEventData } from '../interaction/InteractionManager.js';

export class SignatureLayer {
    private element: HTMLElement;
    private fields: SignatureField[] = [];
    private fieldElements: Map<string, HTMLElement> = new Map();
    private scale = 1.0;
    private eventBus: EventBus;
    private interactionManager: InteractionManager;

    // Callbacks
    private onFieldClick?: (field: SignatureField, e: MouseEvent) => void;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
        this.element = document.createElement('div');
        this.element.className = 'signature-layer';
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.zIndex = '10';
        this.element.style.pointerEvents = 'none'; // Pass through clicks to canvas where no fields exist

        this.interactionManager = new InteractionManager(this.element, {
            onDragEnd: (data) => this.handleDragEnd(data),
            onResizeEnd: (data) => this.handleResizeEnd(data)
        });
    }

    getElement(): HTMLElement {
        return this.element;
    }

    setFields(fields: SignatureField[]) {
        // Diffing or full re-render? For simplicity, full re-render for now.
        // Optimization: track IDs and only add/remove/update.
        this.fields = fields;
        this.render();
    }

    setScale(scale: number) {
        this.scale = scale;
        this.interactionManager.setScale(scale);
        this.updatePositions();
    }

    private handleDragEnd(data: DragEventData) {
        // Update local field cache? Or just emit?
        const field = this.fields.find(f => f.id === data.fieldId);
        if (field) {
            field.rect.x = data.x;
            field.rect.y = data.y;

            this.eventBus.emit('field:update', {
                fieldId: data.fieldId,
                updates: { rect: field.rect }
            });
        }
    }

    private handleResizeEnd(data: ResizeEventData) {
        const field = this.fields.find(f => f.id === data.fieldId);
        if (field) {
            field.rect = {
                x: data.x,
                y: data.y,
                width: data.width,
                height: data.height
            };

            this.eventBus.emit('field:update', {
                fieldId: data.fieldId,
                updates: { rect: field.rect }
            });
        }
    }

    private render() {
        this.element.innerHTML = '';
        this.fieldElements.clear();

        this.fields.forEach(field => {
            const fieldEl = this.createFieldElement(field);
            this.element.appendChild(fieldEl);
            this.fieldElements.set(field.id, fieldEl);
        });
    }

    private createFieldElement(field: SignatureField): HTMLElement {
        const div = document.createElement('div');
        div.className = 'sc-signature-field';
        div.dataset.id = field.id;
        div.style.position = 'absolute';
        div.style.pointerEvents = 'auto'; // Capture clicks on fields
        div.style.boxSizing = 'border-box';

        // Base styling (can be overridden by field.style)
        div.style.border = '1px solid #0056b3';
        div.style.backgroundColor = 'rgba(0, 86, 179, 0.1)';
        div.style.cursor = field.draggable !== false ? 'move' : 'default';

        // Apply custom styles
        if (field.style) {
            Object.assign(div.style, field.style);
        }

        // Render content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'sc-field-content';
        // Size and Transform will be set by updateElementPosition
        contentDiv.style.overflow = 'hidden';
        contentDiv.style.display = 'flex';
        contentDiv.style.alignItems = 'center';
        contentDiv.style.justifyContent = 'center';

        // Handle content types
        if (field.type === 'text') {
            contentDiv.textContent = field.content || '';
            contentDiv.style.whiteSpace = 'pre-wrap';
        } else if (field.type === 'html') {
            contentDiv.innerHTML = field.content || '';
        } else if (field.type === 'image') {
            const img = document.createElement('img');
            img.src = field.content || '';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.pointerEvents = 'none';
            contentDiv.appendChild(img);
        }

        div.appendChild(contentDiv);

        // Add Resize Handles if resizable
        if (field.resizable !== false) {
            this.addResizeHandles(div);
        }

        // Add Delete Button if deletable
        if (field.deletable !== false) {
            this.addDeleteButton(div, field.id);
        }

        // Initial positioning
        this.updateElementPosition(div, field);

        return div;
    }

    private addResizeHandles(container: HTMLElement) {
        const positions = ['nw', 'ne', 'sw', 'se'];
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `sc-resize-handle sc-resize-${pos}`;
            handle.dataset.handle = pos;

            // Handle Styling
            handle.style.position = 'absolute';
            handle.style.width = '10px';
            handle.style.height = '10px';
            handle.style.backgroundColor = 'white';
            handle.style.border = '1px solid #0056b3';
            handle.style.zIndex = '2';

            switch (pos) {
                case 'nw': handle.style.top = '-5px'; handle.style.left = '-5px'; handle.style.cursor = 'nwse-resize'; break;
                case 'ne': handle.style.top = '-5px'; handle.style.right = '-5px'; handle.style.cursor = 'nesw-resize'; break;
                case 'sw': handle.style.bottom = '-5px'; handle.style.left = '-5px'; handle.style.cursor = 'nesw-resize'; break;
                case 'se': handle.style.bottom = '-5px'; handle.style.right = '-5px'; handle.style.cursor = 'nwse-resize'; break;
            }

            container.appendChild(handle);
        });
    }

    private addDeleteButton(container: HTMLElement, id: string) {
        const btn = document.createElement('button');
        btn.className = 'sc-delete-btn';
        btn.innerHTML = '×';
        btn.title = 'Delete Field';

        // Style
        btn.style.position = 'absolute';
        btn.style.top = '-25px';
        btn.style.right = '0';
        btn.style.width = '20px';
        btn.style.height = '20px';
        btn.style.borderRadius = '50%';
        btn.style.border = 'none';
        btn.style.backgroundColor = '#dc3545';
        btn.style.color = 'white';
        btn.style.fontSize = '14px';
        btn.style.lineHeight = '1';
        btn.style.cursor = 'pointer';
        btn.style.display = 'none'; // Show on hover of field? Or always?

        // Show btn on hover of container
        container.addEventListener('mouseenter', () => btn.style.display = 'block');
        container.addEventListener('mouseleave', () => btn.style.display = 'none');

        // Event is handled by global delegation or specific listener? 
        // Let's rely on event bubbling and global handler, or dispatch a custom event.
        // But for buttons, specific listener is fine.
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Don't trigger field click
            this.eventBus.emit('field:delete', { fieldId: id });
        });

        container.appendChild(btn);
    }

    private updatePositions() {
        this.fields.forEach(field => {
            const el = this.fieldElements.get(field.id);
            if (el) {
                this.updateElementPosition(el, field);
            }
        });
    }

    private updateElementPosition(el: HTMLElement, field: SignatureField) {
        // field.rect is unscaled PDF Points (72 dpi)

        // Wrapper: Screen Pixels (for correct interaction/hit testing)
        const x = field.rect.x * this.scale;
        const y = field.rect.y * this.scale;
        const w = field.rect.width * this.scale;
        const h = field.rect.height * this.scale;

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;

        // Content: Unscaled Size + Scale Transform (Visual fidelity for text/html)
        const content = el.querySelector('.sc-field-content') as HTMLElement;
        if (content) {
            content.style.width = `${field.rect.width}px`;
            content.style.height = `${field.rect.height}px`;
            content.style.transform = `scale(${this.scale})`;
            content.style.transformOrigin = '0 0';
        }
    }

    destroy() {
        this.element.remove();
        this.fieldElements.clear();
        this.fields = [];
    }
}
