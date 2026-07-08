
import { Component, ElementRef, ViewChild, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfSignControl, PdfSignControlOptions, ViewMode, SignatureField } from '@shznet/pdf-sign-control';

@Component({
  selector: 'lib-pdf-sign-angular',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-sign-angular.html',
  styleUrl: './pdf-sign-angular.css',
})
export class PdfSignAngularComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;

  /** PDF source URL or ArrayBuffer - auto-loads when provided */
  @Input() src?: string | Uint8Array | ArrayBuffer;

  /** Current page number (1-based) - supports two-way binding with [(page)] */
  @Input() page?: number;

  /** Initial view mode: 'scroll' or 'single' */
  @Input() viewMode?: ViewMode;

  /** Initial fields */
  @Input() fields?: SignatureField[];

  /** PDF.js loader options */
  @Input() pdfLoaderOptions?: PdfSignControlOptions['pdfLoaderOptions'];

  /** Emitted when control is ready */
  @Output() ready = new EventEmitter<PdfSignControl>();

  /** Emitted when PDF is loaded */
  @Output() loaded = new EventEmitter<void>();

  /** Emitted when page changes - emits page number for two-way binding */
  @Output() pageChange = new EventEmitter<number>();

  /** Emitted when page changes with full info */
  @Output() pageInfo = new EventEmitter<{ page: number; total: number }>();

  /** Emitted when scale changes */
  @Output() scaleChange = new EventEmitter<{ scale: number }>();

  /** Emitted on error */
  @Output() error = new EventEmitter<Error>();

  /** Emitted when a field is added */
  @Output() fieldAdd = new EventEmitter<SignatureField>();

  /** Emitted when a field is removed */
  @Output() fieldRemove = new EventEmitter<{ fieldId: string }>();

  /** Emitted when a field is updated */
  @Output() fieldUpdate = new EventEmitter<{ fieldId: string, updates: Partial<SignatureField> }>();

  /** Emitted when any field changes (add/remove/update) */
  @Output() fieldsChange = new EventEmitter<SignatureField[]>();

  /** Emitted when field selection changes */
  @Output() selectionChange = new EventEmitter<{ field: SignatureField | null }>();


  private control: PdfSignControl | null = null;

  constructor(private ngZone: NgZone) { }

  ngOnInit() {
    if (this.container) {
      this.control = new PdfSignControl({
        container: this.container.nativeElement,
        viewMode: this.viewMode,
        pdfLoaderOptions: this.pdfLoaderOptions,
        fields: this.fields
      });

      // Setup event listeners
      this.control.on('page:change', (data: { page: number; total: number }) => {
        this.ngZone.run(() => {
          this.pageInfo.emit(data);
          if (this.page !== data.page) {
            this.page = data.page;
            this.pageChange.emit(data.page);
          }
        });
      });

      this.control.on('scale:change', (data: { scale: number }) => {
        this.ngZone.run(() => this.scaleChange.emit(data));
      });

      // Field Events
      this.control.on('field:add', (field: SignatureField) => {
        this.ngZone.run(() => this.fieldAdd.emit(field));
      });
      this.control.on('field:remove', (data: { fieldId: string }) => {
        this.ngZone.run(() => this.fieldRemove.emit(data));
      });
      this.control.on('field:update', (data: { fieldId: string, updates: Partial<SignatureField> }) => {
        this.ngZone.run(() => this.fieldUpdate.emit(data));
      });
      this.control.on('fields:change', (fields: SignatureField[]) => {
        this.ngZone.run(() => this.fieldsChange.emit(fields));
      });
      this.control.on('field:selection-change', (data: { field: SignatureField | null }) => {
        this.ngZone.run(() => this.selectionChange.emit(data));
      });

      this.ready.emit(this.control);

      // Auto-load if src provided
      if (this.src) {
        this.loadPdf(this.src);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['src'] && !changes['src'].firstChange && this.src) {
      this.loadPdf(this.src);
    }
    if (changes['page'] && !changes['page'].firstChange && this.page !== undefined) {
      const currentPage = this.control?.getCurrentPage();
      if (currentPage !== this.page) {
        this.control?.goToPage(this.page);
      }
    }
    if (changes['viewMode'] && !changes['viewMode'].firstChange && this.viewMode) {
      this.control?.setViewMode(this.viewMode);
    }
    if (changes['fields'] && !changes['fields'].firstChange && this.fields) {
      const currentFields = this.control?.getFields();
      if (JSON.stringify(currentFields) === JSON.stringify(this.fields)) {
        return;
      }
      this.control?.setFields(this.fields);
    }
  }

  ngOnDestroy() {
    if (this.control) {
      this.control.destroy();
      this.control = null;
    }
  }

  private loadPdf(source: string | Uint8Array | ArrayBuffer) {
    this.control?.load(source)
      .then(() => this.loaded.emit())
      .catch((err) => this.error.emit(err));
  }

  // Public API methods

  /** Get the underlying PdfSignControl instance */
  getControl(): PdfSignControl | null {
    return this.control;
  }

  /** Load a PDF from URL or ArrayBuffer */
  load(source: string | Uint8Array | ArrayBuffer): Promise<void> {
    return this.control?.load(source) ?? Promise.reject('Control not initialized');
  }

  /** Navigate to specific page */
  goToPage(page: number): void {
    this.control?.goToPage(page);
  }

  /** Go to next page */
  nextPage(): void {
    this.control?.nextPage();
  }

  /** Go to previous page */
  previousPage(): void {
    this.control?.previousPage();
  }

  /** Get current page number */
  getCurrentPage(): number {
    return this.control?.getCurrentPage() ?? 1;
  }

  /** Get total pages */
  getTotalPages(): number {
    return this.control?.getTotalPages() ?? 0;
  }

  /** Set zoom scale */
  setScale(scale: number): void {
    this.control?.setScale(scale);
  }

  /** Get current zoom scale */
  getScale(): number {
    return this.control?.getScale() ?? 1.0;
  }

  /** Set view mode */
  setViewMode(mode: ViewMode): Promise<void> {
    return this.control?.setViewMode(mode) ?? Promise.resolve();
  }

  /** Get current view mode */
  getViewMode(): ViewMode {
    return this.control?.getViewMode() ?? 'scroll';
  }

  /** Clear all fields */
  clearFields(): void {
    this.control?.clearFields();
  }

  /** Print the PDF */
  print(options?: { withSignatures?: boolean }): Promise<void> {
    return this.control?.print(options) ?? Promise.resolve();
  }

  /** Get dimensions of a specific page in PDF points */
  async getPageDimensions(pageIndex: number): Promise<{ width: number; height: number } | null> {
    return this.control?.getPageDimensions(pageIndex) ?? null;
  }

  // Field Management Wrappers

  addField(field: any): void {
    this.control?.addField(field);
  }

  removeField(fieldId: string): void {
    this.control?.removeField(fieldId);
  }

  updateField(fieldId: string, updates: any): void {
    this.control?.updateField(fieldId, updates);
  }

  setFields(fields: any[]): void {
    this.control?.setFields(fields);
  }
}
