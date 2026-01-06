import { EventBus } from '../utils/EventBus.js';
import { ZoomHandler } from '../utils/ZoomHandler.js';
import { PdfLoader, PDFDocumentProxy } from './PdfLoader.js';
import { PdfLoaderOptions, ViewMode, SignatureField } from '../types.js';
import { IViewModeStrategy } from '../strategies/IViewModeStrategy.js';
import { SinglePageStrategy } from '../strategies/SinglePageStrategy.js';
import { ScrollStrategy } from '../strategies/ScrollStrategy.js';

export interface PdfViewerOptions {
    container: HTMLElement;
    pdfLoaderOptions?: PdfLoaderOptions;
    viewMode?: ViewMode;
    fields?: SignatureField[];
}

export class PdfViewer {
    private container: HTMLElement;
    private eventBus: EventBus;
    private loader: PdfLoader;
    private zoomHandler: ZoomHandler;
    private pdfDocument: PDFDocumentProxy | null = null;
    private strategy: IViewModeStrategy | null = null;
    private currentViewMode: ViewMode;

    private currentScale = 1.0;

    constructor(options: PdfViewerOptions) {
        this.container = options.container;
        this.eventBus = new EventBus();
        this.loader = new PdfLoader(options.pdfLoaderOptions);
        this.currentViewMode = options.viewMode ?? 'scroll';

        // Initialize fields
        if (options.fields) {
            this.fields = [...options.fields];
        }

        // Initialize zoom handler for gesture-based zoom
        this.zoomHandler = new ZoomHandler({
            container: this.container,
            getScale: () => this.getScale(),
            setScale: (scale) => this.setScale(scale)
        });
        this.zoomHandler = new ZoomHandler({
            container: this.container,
            getScale: () => this.getScale(),
            setScale: (scale) => this.setScale(scale)
        });
        this.zoomHandler.init();

        // Handle internal events
        this.eventBus.on('field:delete', (data: { fieldId: string }) => {
            this.removeField(data.fieldId);
        });

        this.eventBus.on('field:drop', (data: { fieldId: string, clientX: number, clientY: number, elementX: number, elementY: number }) => {
            this.handleFieldDrop(data.fieldId, data.clientX, data.clientY, data.elementX, data.elementY);
        });

        this.eventBus.on('field:ui:resize', (data: { fieldId: string, updates: Partial<SignatureField> }) => {
            this.updateField(data.fieldId, data.updates);
        });
    }

    async load(source: string | Uint8Array | ArrayBuffer): Promise<void> {
        try {
            this.pdfDocument = await this.loader.loadDocument(source);
            this.eventBus.emit('document:loaded', this.pdfDocument);
            console.log('PDF Loaded, pages:', this.pdfDocument?.numPages);

            await this.initStrategy();
        } catch (error) {
            this.eventBus.emit('error', error);
            throw error;
        }
    }

    private async initStrategy(): Promise<void> {
        if (!this.pdfDocument) return;

        if (this.strategy) {
            this.strategy.destroy();
        }

        this.strategy = this.createStrategy(this.currentViewMode);
        await this.strategy.init(this.container, this.pdfDocument, this.eventBus, this.currentScale);
        if (this.fields.length > 0) {
            this.strategy.setFields(this.fields);
        }
    }

    private createStrategy(mode: ViewMode): IViewModeStrategy {
        switch (mode) {
            case 'single':
                return new SinglePageStrategy();
            case 'scroll':
            default:
                return new ScrollStrategy();
        }
    }

    async setViewMode(mode: ViewMode): Promise<void> {
        if (mode === this.currentViewMode) return;

        this.currentViewMode = mode;
        if (this.pdfDocument) {
            await this.initStrategy();
        }
    }

    getViewMode(): ViewMode {
        return this.currentViewMode;
    }

    goToPage(page: number): void {
        this.strategy?.goToPage(page);
    }

    nextPage(): void {
        this.strategy?.nextPage();
    }

    previousPage(): void {
        this.strategy?.previousPage();
    }

    getCurrentPage(): number {
        return this.strategy?.getCurrentPage() ?? 1;
    }

    getTotalPages(): number {
        return this.strategy?.getTotalPages() ?? 0;
    }

    setScale(scale: number): void {
        this.currentScale = scale;
        this.strategy?.setScale(scale);
    }

    getScale(): number {
        return this.currentScale;
    }

    // Field Management

    private fields: SignatureField[] = [];

    setFields(fields: SignatureField[]): void {
        this.fields = fields;
        this.strategy?.setFields(fields);
    }

    getFields(): SignatureField[] {
        return this.fields;
    }

    async addField(field: SignatureField): Promise<void> {
        if (!this.pdfDocument) {
            throw new Error('PDF document not loaded');
        }

        // 1. Validate Page Index
        if (field.pageIndex < 0 || field.pageIndex >= this.pdfDocument.numPages) {
            throw new Error(`Invalid page index: ${field.pageIndex}. Document has ${this.pdfDocument.numPages} pages.`);
        }

        // 2. Validate Dimensions
        if (field.rect.width <= 0 || field.rect.height <= 0) {
            throw new Error('Field width and height must be greater than 0');
        }

        // 3. Validate Boundaries
        try {
            // Note: pageIndex is 0-based, getPage is 1-based
            const page = await this.pdfDocument.getPage(field.pageIndex + 1);
            const viewport = page.getViewport({ scale: 1.0 }); // Get unscaled dimensions

            // Check if field is within page boundaries (allowing small floating point margin)
            // PDF Coordinates: 0,0 is Bottom-Left.
            // x, y must be >= 0
            // x + width <= page.width
            // y + height <= page.height

            if (field.rect.x < 0 || field.rect.y < 0) {
                throw new Error(`Field position out of bounds (negative coordinates).`);
            }

            if (field.rect.x + field.rect.width > viewport.width) {
                throw new Error(`Field exceeds page width. (Field X: ${field.rect.x}, Width: ${field.rect.width}, Page Width: ${viewport.width})`);
            }

            if (field.rect.y + field.rect.height > viewport.height) {
                throw new Error(`Field exceeds page height. (Field Y: ${field.rect.y}, Height: ${field.rect.height}, Page Height: ${viewport.height})`);
            }

        } catch (err) {
            console.error('Validation error getting page dimensions:', err);
            // Re-throw if it's our validation error, otherwise generic
            if (err instanceof Error && err.message.startsWith('Field')) throw err;
            throw new Error('Failed to validate field placement against page dimensions.');
        }

        this.fields.push(field);
        this.strategy?.setFields(this.fields);
        this.eventBus.emit('field:add', field);
        this.eventBus.emit('fields:change', this.fields);
    }

    removeField(fieldId: string): void {
        this.fields = this.fields.filter(f => f.id !== fieldId);
        this.strategy?.setFields(this.fields);
        this.eventBus.emit('field:remove', { fieldId });
        this.eventBus.emit('fields:change', this.fields);
    }

    updateField(fieldId: string, updates: Partial<SignatureField>): void {
        const index = this.fields.findIndex(f => f.id === fieldId);
        if (index !== -1) {
            this.fields[index] = { ...this.fields[index], ...updates };
            this.strategy?.setFields(this.fields);
            this.eventBus.emit('field:update', { fieldId, updates });
            this.eventBus.emit('fields:change', this.fields);
        }
    }

    private handleFieldDrop(fieldId: string, clientX: number, clientY: number, elementX: number, elementY: number) {
        const field = this.fields.find(f => f.id === fieldId);
        if (!field) return;

        // 1. Find Target Page using MOUSE position (where the user pointer is)
        const elements = document.elementsFromPoint(clientX, clientY);
        let pageElement = elements.find(el => el.classList && el.classList.contains('page-view')) as HTMLElement;

        // If no page found directly under mouse, find the nearest page
        if (!pageElement || !pageElement.dataset.pageIndex) {
            console.log('Field dropped outside. Finding nearest page...');
            const allPages = Array.from(this.container.querySelectorAll('.page-view')) as HTMLElement[];

            let minDistance = Infinity;
            let nearestPage: HTMLElement | null = null;

            allPages.forEach(page => {
                const rect = page.getBoundingClientRect();

                // Calculate distance from drop point (elementX, elementY) to page rect
                // We use distance to the nearest point on the rect (clamped)
                const clampedX = Math.max(rect.left, Math.min(elementX, rect.right));
                const clampedY = Math.max(rect.top, Math.min(elementY, rect.bottom));

                const dx = elementX - clampedX;
                const dy = elementY - clampedY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < minDistance) {
                    minDistance = dist;
                    nearestPage = page;
                }
            });

            if (nearestPage) {
                pageElement = nearestPage;
            } else {
                console.warn('No pages found to snap to.');
                this.strategy?.setFields(this.fields);
                return;
            }
        }

        const pageIndexStr = pageElement.dataset.pageIndex;
        if (!pageIndexStr) {
            this.strategy?.setFields(this.fields);
            return;
        }
        const newPageIndex = parseInt(pageIndexStr, 10);

        // 2. Calculate Coordinates using ELEMENT position (where the field visual is)
        const rect = pageElement.getBoundingClientRect();
        const scale = this.currentScale;

        // Relative Element Coords (Top-Left based)
        const relX = elementX - rect.left;
        const relY = elementY - rect.top;

        // Get Unscaled Page Viewport
        const pageHeightPdf = rect.height / scale;
        const pageWidthPdf = rect.width / scale;

        const fieldWidthPdf = field.rect.width;
        const fieldHeightPdf = field.rect.height;

        // x_pdf = relX / scale
        let pdfX = relX / scale;

        // y_pdf (Bottom-Left Origin) Calculation:
        // Top Edge relative to Page Top (Screen) = relY
        // Top Edge relative to Page Top (PDF Unscaled) = relY / scale
        // Bottom Edge relative to Page Top (PDF Unscaled) = (relY / scale) + fieldHeightPdf
        // y_pdf (Height from Bottom) = pageHeightPdf - BottomEdge
        let pdfY = pageHeightPdf - (relY / scale) - fieldHeightPdf;

        // 3. Boundary Constraints (Clamp)
        pdfX = Math.max(0, Math.min(pdfX, pageWidthPdf - fieldWidthPdf));
        pdfY = Math.max(0, Math.min(pdfY, pageHeightPdf - fieldHeightPdf));

        // 4. Update Field
        this.updateField(fieldId, {
            pageIndex: newPageIndex,
            rect: {
                ...field.rect,
                x: pdfX,
                y: pdfY
            }
        });

        console.log(`Field dropped on Page ${newPageIndex + 1}`);
    }

    on(event: string, handler: (data: any) => void) {
        this.eventBus.on(event, handler);
    }

    off(event: string, handler: (data: any) => void) {
        this.eventBus.off(event, handler);
    }

    destroy() {
        this.zoomHandler.destroy();
        this.strategy?.destroy();
        this.loader.destroy();
        this.eventBus.clear();
        this.container.innerHTML = '';
    }
}
