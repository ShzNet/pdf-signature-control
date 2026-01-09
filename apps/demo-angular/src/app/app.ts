import { Component, ViewChild } from '@angular/core';
import { PdfSignAngularComponent } from '@shznet/pdf-sign-angular';
import { PdfSignControl, PdfSignControlOptions, ViewMode } from '@shznet/pdf-sign-control';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { LeftPanelComponent } from './components/left-panel/left-panel.component';
import { RightPanelComponent } from './components/right-panel/right-panel.component';
import { SignatureModalComponent } from './components/signature-modal/signature-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfSignAngularComponent, LeftPanelComponent, RightPanelComponent, SignatureModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  @ViewChild(PdfSignAngularComponent) pdfComponent!: PdfSignAngularComponent;

  constructor(public sanitizer: DomSanitizer) { }

  pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
  viewMode: ViewMode = 'scroll';

  pageInfo = '1 / ?';
  zoomInfo = '100%';
  currentDate = new Date().toLocaleDateString();

  pdfLoaderOptions: PdfSignControlOptions['pdfLoaderOptions'] = {
    workerSrc: 'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs',
    cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.530/cmaps/',
    cMapPacked: true
  };

  fields: any[] = [];
  isModalOpen = false;

  // Generic Field Form State
  newField = {
    page: 1,
    x: 100,
    y: 100,
    width: 120,
    height: 80,
    type: 'text',
    content: 'Text Field',
    draggable: true,
    resizable: true,
    deletable: true
  };

  handleAddField() {
    if (!this.pdfComponent) return;
    const control = this.pdfComponent.getControl();
    if (!control) return;

    const fieldId = `field-${Date.now()}`;
    const field = {
      id: fieldId,
      pageIndex: this.newField.page - 1,
      rect: {
        x: this.newField.x,
        y: this.newField.y,
        width: this.newField.width,
        height: this.newField.height
      },
      type: this.newField.type,
      content: this.newField.content,
      draggable: this.newField.draggable,
      resizable: this.newField.resizable,
      deletable: this.newField.deletable,
      style: {
        border: '1px solid #007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.05)',
      }
    };

    control.addField(field as any).catch((err: Error) => alert(err.message));
  }

  onControlReady(control: PdfSignControl) {
    console.log('PDF Control ready:', control);
  }

  prevPage() {
    this.pdfComponent?.getControl()?.previousPage();
  }

  nextPage() {
    this.pdfComponent?.getControl()?.nextPage();
  }

  onError(error: any) {
    console.error('PDF Error:', error);
  }

  onPageChange(data: { page: number; total: number }) {
    this.pageInfo = `${data.page} / ${data.total}`;
  }

  onScaleChange(data: { scale: number }) {
    this.zoomInfo = `${Math.round(data.scale * 100)}%`;
  }

  onFieldsChange(fields: any[]) {
    this.fields = [...fields];
  }

  refreshFields() {
    // Trigger update if needed, usually references handled by component
    this.fields = [...this.fields];
  }

  removeField(id: string) {
    this.fields = this.fields.filter(f => f.id !== id);
  }

  // === Modal Logic ===
  openSignatureModal() {
    this.isModalOpen = true;
  }

  closeSignatureModal() {
    this.isModalOpen = false;
  }

  onSignatureSave(html: string) {
    this.newField.content = html;
    this.closeSignatureModal();
  }

  onClearSignatureContent() {
    this.newField.content = '';
  }

  // Zoom handlers  
  zoomIn() {
    const currentScale = this.pdfComponent?.getScale() ?? 1;
    this.pdfComponent?.setScale(currentScale + 0.25);
  }

  zoomOut() {
    const currentScale = this.pdfComponent?.getScale() ?? 1;
    this.pdfComponent?.setScale(currentScale - 0.25);
  }

  printOriginal() {
    this.pdfComponent?.print({ withSignatures: false });
  }
}
