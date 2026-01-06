
import { Component, ViewChild } from '@angular/core';
import { PdfSignAngularComponent } from '@shz/pdf-sign-angular';
import { PdfSignControl, PdfSignControlOptions, ViewMode } from '@shz/pdf-sign-control';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfSignAngularComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  @ViewChild(PdfSignAngularComponent) pdfComponent!: PdfSignAngularComponent;

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

  onControlReady(control: PdfSignControl) {
    console.log('PDF Control ready:', control);
  }

  onPageChange(data: { page: number; total: number }) {
    this.pageInfo = `${data.page} / ${data.total}`;
  }

  onScaleChange(data: { scale: number }) {
    this.zoomInfo = `${Math.round(data.scale * 100)}%`;
  }

  newField = {
    page: 1,
    x: 100,
    y: 100,
    width: 120,
    height: 80,
    type: 'text',
    content: 'Signature Placeholder',
    moveable: true,
    resizable: true,
    deletable: true
  };

  onFieldsChange(fields: any[]) {
    // Update local state from control events (e.g. drag end)
    this.fields = [...fields];
  }

  // Force reference update to trigger child change detection
  refreshFields() {
    this.fields = [...this.fields];
  }

  removeField(id: string) {
    this.fields = this.fields.filter(f => f.id !== id);
  }

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
      draggable: this.newField.moveable,
      resizable: this.newField.resizable,
      deletable: this.newField.deletable,
      style: {
        border: '1px solid #007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.05)',
      }
    };

    control.addField(field).catch((err: Error) => alert(err.message));
  }

  addExternalField() {
    const externalField = {
      id: `ext-${Date.now()}`,
      pageIndex: 0,
      rect: { x: 50, y: 50, width: 100, height: 50 },
      type: 'text',
      content: 'External Field (NG)',
      draggable: true,
      resizable: true,
      deletable: true,
      style: { border: '2px dashed blue', backgroundColor: 'rgba(0,0,255,0.1)' }
    };
    this.fields = [...this.fields, externalField];
  }

  onError(error: Error) {
    console.error('PDF Error:', error);
  }

  // Navigation handlers
  prevPage() {
    this.pdfComponent?.previousPage();
  }

  nextPage() {
    this.pdfComponent?.nextPage();
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
}
