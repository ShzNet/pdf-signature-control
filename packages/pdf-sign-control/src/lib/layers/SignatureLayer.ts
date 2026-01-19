import { SignatureField } from '../types.js';
import { EventBus } from '../utils/EventBus.js';
import { InteractionManager, ResizeEventData } from '../interaction/InteractionManager.js';

export class SignatureLayer {
    private element: HTMLElement;
    private fields: SignatureField[] = [];
    private fieldElements: Map<string, HTMLElement> = new Map();
    private scale = 1.0;
    private pageHeight = 0; // Unscaled PDF page height (Points)
    private eventBus: EventBus;
    private interactionManager: InteractionManager;
    public readonly id: string;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
        this.id = Math.random().toString(36).substring(2, 9);

        this.element = document.createElement('div');
        this.element.className = 'signature-layer';
        this.element.dataset.layerId = this.id;
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
        this.fields = fields;
        this.render();
    }

    setPageDimensions(width: number, height: number, scale: number) {
        if (width > 0 && height > 0) {
            this.pageHeight = height;
            this.scale = scale;
            this.interactionManager.setScale(scale);
            this.updatePositions();
        }
    }

    setScale(scale: number) {
        this.scale = scale;
        this.interactionManager.setScale(scale);
        this.updatePositions();
    }

    private handleDragEnd(data: { fieldId: string, clientX: number, clientY: number, elementX: number, elementY: number }) {
        // Delegate to PdfViewer to find target page and calc coords
        this.eventBus.emit('field:drop', {
            fieldId: data.fieldId,
            clientX: data.clientX,
            clientY: data.clientY,
            elementX: data.elementX,
            elementY: data.elementY
        });
    }

    private handleResizeEnd(data: ResizeEventData) {
        const field = this.fields.find(f => f.id === data.fieldId);
        if (field) {
            // Coordinate Conversion: Top-Left (Screen/Unscaled) -> Bottom-Left (PDF)
            // y_pdf = page_height - y_top_left - height
            const pdfY = this.pageHeight - data.y - data.height;

            field.rect = {
                x: data.x,
                y: pdfY,
                width: data.width,
                height: data.height
            };

            this.eventBus.emit('field:ui:resize', {
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

    private selectedFieldId: string | null = null;

    private createFieldElement(field: SignatureField): HTMLElement {
        const div = document.createElement('div');
        div.className = 'sc-signature-field';
        div.dataset.id = field.id;
        div.dataset.moveable = String(field.draggable !== false);
        div.style.position = 'absolute';
        div.style.pointerEvents = 'auto'; // Capture clicks on fields
        div.style.boxSizing = 'border-box';

        // Base styling (can be overridden by field.style)
        // Default visible border as requested
        div.style.border = '1px solid #7FA1C3'; // Light blue-ish
        div.style.backgroundColor = 'rgba(127, 161, 195, 0.1)';
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
            contentDiv.style.fontSize = '7pt';
            contentDiv.style.fontFamily = 'sans-serif';
            contentDiv.style.lineHeight = '1.2';
            contentDiv.style.textAlign = 'center';
        } else if (field.type === 'html') {
            contentDiv.innerHTML = field.content || '';
        } else if (field.type === 'signature') {
            const iframe = document.createElement('iframe');
            // Use explicit dimensions for consistent rendering with preview
            // The content div will be scaled, so iframe should fill it at 100%
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            // Prevents iframe from capturing mouse events, allowing drag/resize on container
            iframe.style.pointerEvents = 'none';
            iframe.srcdoc = field.content || '';
            contentDiv.appendChild(iframe);
        } else if (field.type === 'image') {
            const img = document.createElement('img');
            img.src = field.content || '';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.pointerEvents = 'none';
            contentDiv.appendChild(img);
        }

        // Selection Trigger
        div.addEventListener('mousedown', (e) => {
            // Do NOT stop propagation, so InteractionManager (on parent) receives the event
            // Use the actual field.id from the object, which matches PdfViewer fields
            this.eventBus.emit('field:focus', { fieldId: field.id });
        });

        // Touch support for selection
        div.addEventListener('touchstart', (e) => {
            // Do NOT stop propagation
            this.eventBus.emit('field:focus', { fieldId: field.id });
        }, { passive: false });

        div.appendChild(contentDiv);

        // Add Resize Handles if resizable
        if (field.resizable !== false) {
            this.addResizeHandles(div);
        }

        // Add Delete Button if deletable
        if (field.deletable !== false) {
            this.addDeleteButton(div, field.id);
        }

        // Hover Effects
        div.addEventListener('mouseenter', () => {
            if (this.selectedFieldId !== field.id) {
                this.updateVisuals(div, field, true, false);
            }
        });

        div.addEventListener('mouseleave', () => {
            if (this.selectedFieldId !== field.id) {
                this.updateVisuals(div, field, false, false);
            }
        });

        // Initial positioning
        this.updateElementPosition(div, field);

        // Check if this field should be selected initially (e.g. after re-render)
        if (this.selectedFieldId === field.id) {
            this.updateVisuals(div, field, true, true);
        }

        return div;
    }

    private addResizeHandles(container: HTMLElement) {
        const positions = ['nw', 'ne', 'sw', 'se', 'n', 'e', 's', 'w'];

        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `sc-resize-handle sc-resize-${pos}`;
            handle.dataset.handle = pos;

            // Common Handle Styling
            handle.style.position = 'absolute';
            handle.style.backgroundColor = 'white';
            handle.style.border = '1px solid #0056b3';
            handle.style.zIndex = '2';
            handle.style.boxSizing = 'border-box';

            // Hidden by default, shown when selected
            handle.style.display = 'none';

            const cornerSize = '8px';
            const edgeThick = '6px';
            const edgeLen = '14px';

            switch (pos) {
                // Corners
                case 'nw':
                    handle.style.top = '-4px'; handle.style.left = '-4px';
                    handle.style.width = cornerSize; handle.style.height = cornerSize;
                    handle.style.cursor = 'nwse-resize';
                    break;
                case 'ne':
                    handle.style.top = '-4px'; handle.style.right = '-4px';
                    handle.style.width = cornerSize; handle.style.height = cornerSize;
                    handle.style.cursor = 'nesw-resize';
                    break;
                case 'sw':
                    handle.style.bottom = '-4px'; handle.style.left = '-4px';
                    handle.style.width = cornerSize; handle.style.height = cornerSize;
                    handle.style.cursor = 'nesw-resize';
                    break;
                case 'se':
                    handle.style.bottom = '-4px'; handle.style.right = '-4px';
                    handle.style.width = cornerSize; handle.style.height = cornerSize;
                    handle.style.cursor = 'nwse-resize';
                    break;

                // Edges
                case 'n':
                    handle.style.top = `-${parseInt(edgeThick) / 2}px`;
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.width = edgeLen; handle.style.height = edgeThick;
                    handle.style.cursor = 'ns-resize';
                    break;
                case 's':
                    handle.style.bottom = `-${parseInt(edgeThick) / 2}px`;
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.width = edgeLen; handle.style.height = edgeThick;
                    handle.style.cursor = 'ns-resize';
                    break;
                case 'w':
                    handle.style.left = `-${parseInt(edgeThick) / 2}px`;
                    handle.style.top = '50%';
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.width = edgeThick; handle.style.height = edgeLen;
                    handle.style.cursor = 'ew-resize';
                    break;
                case 'e':
                    handle.style.right = `-${parseInt(edgeThick) / 2}px`;
                    handle.style.top = '50%';
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.width = edgeThick; handle.style.height = edgeLen;
                    handle.style.cursor = 'ew-resize';
                    break;
            }

            container.appendChild(handle);
        });
    }

    private addDeleteButton(container: HTMLElement, id: string) {
        const btn = document.createElement('div');
        btn.className = 'sc-delete-btn';
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        btn.title = 'Delete Field';

        // Style
        btn.style.position = 'absolute';
        btn.style.top = '0';
        btn.style.right = '0';
        btn.style.transform = 'translate(50%, -50%)'; // Center on the top-right corner point
        btn.style.width = '20px';
        btn.style.height = '20px';
        btn.style.borderRadius = '50%';
        btn.style.backgroundColor = '#ff4d4f';
        btn.style.color = 'white';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.cursor = 'pointer';
        btn.style.zIndex = '20';
        btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

        // Visibility Logic - Manage by toggle
        btn.style.display = 'none';

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.eventBus.emit('field:delete', { fieldId: id });
        });

        // Touch support
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.eventBus.emit('field:delete', { fieldId: id });
        }, { passive: false });

        container.appendChild(btn);
    }

    select(fieldId: string | null) {
        this.selectedFieldId = fieldId;
        this.fields.forEach(field => {
            const el = this.fieldElements.get(field.id);
            if (!el) return;

            const isSelected = field.id === fieldId;
            this.updateVisuals(el, field, isSelected, isSelected);
        });
    }

    private updateVisuals(el: HTMLElement, field: SignatureField, showControls: boolean, isSelected: boolean) {
        // Toggle Controls
        const resizeHandles = el.querySelectorAll('.sc-resize-handle');
        resizeHandles.forEach(h => (h as HTMLElement).style.display = showControls ? 'block' : 'none');

        const deleteBtn = el.querySelector('.sc-delete-btn') as HTMLElement;
        if (deleteBtn) {
            deleteBtn.style.display = showControls ? 'flex' : 'none';
        }

        // Apply Visual Selection or Hover style
        if (isSelected) {
            el.style.border = '1px solid #0056b3';
            el.style.backgroundColor = 'rgba(0, 86, 179, 0.1)';
        } else if (showControls) {
            // Hover state (controls shown but not selected)
            el.style.border = '1px solid #0056b3'; // Same border as select? or slightly different?
            // Let's keep it similar to indicate interactivity, maybe lighter bg
            el.style.backgroundColor = 'rgba(0, 86, 179, 0.05)';
        } else {
            // Revert to custom style or default visible style
            el.style.border = field.style?.border || '1px solid #7FA1C3';
            el.style.backgroundColor = field.style?.backgroundColor || 'rgba(127, 161, 195, 0.1)';
        }
    }

    private updatePositions() {
        if (this.pageHeight === 0) {
            return;
        }

        this.fields.forEach(field => {
            const el = this.fieldElements.get(field.id);
            if (el) {
                this.updateElementPosition(el, field);
            }
        });
    }

    private updateElementPosition(el: HTMLElement, field: SignatureField) {
        // field.rect is unscaled PDF Points (72 dpi), Bottom-Left Origin

        // Coordinate Conversion: Bottom-Left (PDF) -> Top-Left (Screen CSS)
        // y_top_left_unscaled = page_height - y_pdf - height_pdf

        if (this.pageHeight === 0) {
            // Defer positioning or hide until dimensions are set
            el.style.display = 'none';
            return;
        }
        el.style.display = 'block';

        const yTopLeftUnscaled = this.pageHeight - field.rect.y - field.rect.height;

        // Wrapper: Screen Pixels (for correct interaction/hit testing)
        // We set the CSS variable for scale here
        el.style.setProperty('--scale', this.scale.toString());

        const x = field.rect.x * this.scale;
        const y = yTopLeftUnscaled * this.scale;
        const w = field.rect.width * this.scale;
        const h = field.rect.height * this.scale;

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;

        // Content: Unscaled Size + Scale Transform (Visual fidelity for text/html)
        // CRITICAL FIX: Use calc() based on parent size and scale variable.
        const content = el.querySelector('.sc-field-content') as HTMLElement;
        if (content) {
            content.style.width = 'calc(100% / var(--scale))';
            content.style.height = 'calc(100% / var(--scale))';
            content.style.transform = 'scale(var(--scale))';
            content.style.transformOrigin = '0 0';
        }
    }

    destroy() {
        this.interactionManager.destroy();
        this.element.remove();
        this.fieldElements.clear();
        this.fields = [];
    }
}
