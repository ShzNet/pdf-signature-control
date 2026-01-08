
import { Component, ViewChild, ElementRef } from '@angular/core';
import { PdfSignAngularComponent } from '@shz/pdf-sign-angular';
import { PdfSignControl, PdfSignControlOptions, ViewMode } from '@shz/pdf-sign-control';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import SignaturePad from 'signature_pad';
import { SignatureGenerator, SignatureConfig } from './signature-generator';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfSignAngularComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  @ViewChild(PdfSignAngularComponent) pdfComponent!: PdfSignAngularComponent;
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private sanitizer: DomSanitizer) { }


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

  // Signature Modal State
  isModalOpen = false;
  activeTab: 'drawing' | 'certName' | 'image' = 'drawing';
  signaturePad?: SignaturePad;

  // Config
  sigLayout: 'horizontal' | 'vertical' = 'horizontal';
  sigFontSize = 5;
  infoLines: string[] = ['Ký số bởi: Trần Văn Chiến', 'Thời gian:'];

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

  // Tab Inputs
  certName = '';
  drawingColor = '#2563eb';
  penWidth = 1;
  selectedImage: string | null = null;

  // Preview
  previewHtml: SafeHtml | string = '';
  private sigGen = new SignatureGenerator();

  onControlReady(control: PdfSignControl) {
    console.log('PDF Control ready:', control);
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
    this.fields = [...this.fields];
  }

  removeField(id: string) {
    this.fields = this.fields.filter(f => f.id !== id);
  }

  // === Modal Logic ===

  openModal() {
    this.isModalOpen = true;
    this.updatePreview();

    // Defer generic initialization to ensure ViewChild is available
    setTimeout(() => {
      this.initSignaturePad();
      this.updatePreview();
    }, 100);
  }

  closeModal() {
    this.isModalOpen = false;
  }

  switchTab(tab: 'drawing' | 'certName' | 'image') {
    this.activeTab = tab;
    if (tab === 'drawing') {
      setTimeout(() => this.resizeCanvas(), 50);
    }
    this.updatePreview();
  }

  // Info Lines
  addInfoLine() {
    this.infoLines.push('');
    this.updatePreview();
  }

  removeInfoLine(index: number) {
    this.infoLines.splice(index, 1);
    this.updatePreview();
  }

  updateInfoLine(index: number, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.infoLines[index] = val;
    this.updatePreview();
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  // Signature Pad
  initSignaturePad() {
    if (this.signatureCanvas && !this.signaturePad) {
      this.signaturePad = new SignaturePad(this.signatureCanvas.nativeElement, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: this.drawingColor,
        minWidth: this.penWidth,
        maxWidth: this.penWidth + 1.5
      });

      this.signaturePad.addEventListener('endStroke', () => this.updatePreview());
      this.resizeCanvas();
    }
  }

  resizeCanvas() {
    const canvas = this.signatureCanvas?.nativeElement;
    if (canvas && this.signaturePad) {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);
      this.signaturePad.clear(); // Warning: this clears drawing on resize
    }
  }

  setDrawingColor(color: string) {
    this.drawingColor = color;
    if (this.signaturePad) {
      this.signaturePad.penColor = color;
    }
  }

  setPenWidth(width: number) {
    this.penWidth = width;
    if (this.signaturePad) {
      this.signaturePad.minWidth = width;
      this.signaturePad.maxWidth = width + 1.5;
    }
  }

  // Image Upload
  triggerImageUpload() {
    document.getElementById('sig-image-upload')?.click();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImage = e.target?.result as string;
        this.updatePreview();
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  // Generator
  updatePreview() {
    const config: SignatureConfig = {
      layout: this.sigLayout,
      fontSize: this.sigFontSize,
      infoLines: [...this.infoLines],
      visualType: this.activeTab === 'image' ? 'image' : (this.activeTab === 'certName' ? 'text' : 'drawing'),
      visualContent: this.getVisualContent()
    };
    const html = this.sigGen.generate(config);
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getVisualContent(): string {
    if (this.activeTab === 'certName') return this.certName || 'Tên của bạn';
    if (this.activeTab === 'image') return this.selectedImage || '';
    if (this.activeTab === 'drawing') return this.signaturePad?.toDataURL() || '';
    return '';
  }

  saveSignature() {
    if (!this.pdfComponent) return;
    const control = this.pdfComponent.getControl();
    if (!control) return;

    // Generate final HTML
    const config: SignatureConfig = {
      layout: this.sigLayout,
      fontSize: this.sigFontSize,
      infoLines: [...this.infoLines],
      visualType: this.activeTab === 'image' ? 'image' : (this.activeTab === 'certName' ? 'text' : 'drawing'),
      visualContent: this.getVisualContent()
    };
    const finalHtml = this.sigGen.generate(config);

    // Add Field
    const fieldId = `field-${Date.now()}`;
    const field = {
      id: fieldId,
      pageIndex: 0, // Default to page 1 for demo
      rect: { x: 100, y: 100, width: 120, height: 80 },
      type: 'signature', // IMPORTANT: Use signature type
      content: finalHtml,
      draggable: true,
      resizable: true,
      deletable: true,
      style: {
        border: '1px solid #007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.05)',
      }
    };

    control.addField(field as any).catch((err: Error) => alert(err.message));
    this.closeModal();
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
