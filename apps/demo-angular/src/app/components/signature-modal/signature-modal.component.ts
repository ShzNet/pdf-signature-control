import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import SignaturePad from 'signature_pad';
import { SignatureConfig, SignatureGenerator } from '../../signature-generator';
import { SignaturePreviewComponent } from '../signature-preview/signature-preview.component';

@Component({
    selector: 'app-signature-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, SignaturePreviewComponent],
    templateUrl: './signature-modal.component.html',
    styles: []
})
export class SignatureModalComponent {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<string>();

    @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;

    // State
    activeTab: 'drawing' | 'certName' | 'image' = 'drawing';
    signaturePad?: SignaturePad;

    // Config
    sigLayout: 'horizontal' | 'vertical' = 'horizontal';
    sigFontSize = 5;
    infoLines: string[] = ['Signed by: Alice', 'Date:'];
    certName = '';
    drawingColor = '#2563eb';
    penWidth = 1;
    selectedImage: string | null = null;

    // Preview Config for Child Component
    previewConfig?: SignatureConfig;

    private sigGen = new SignatureGenerator();

    constructor(public sanitizer: DomSanitizer, private zone: NgZone, private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.updatePreview();
    }

    ngOnChanges() {
        if (this.isOpen) {
            this.updatePreview();
            // Defer initialization to ensure ViewChild is available
            setTimeout(() => {
                this.initSignaturePad();
                this.updatePreview();
            }, 100);
        }
    }

    onClose() {
        this.close.emit();
    }

    onSave() {
        if (this.activeTab === 'drawing' && this.signaturePad?.isEmpty()) {
            alert('Please draw a signature first.');
            return;
        }
        if (this.activeTab === 'certName' && !this.certName.trim()) {
            alert('Please enter a name.');
            return;
        }
        if (this.activeTab === 'image' && !this.selectedImage) {
            alert('Please select an image.');
            return;
        }

        const config: SignatureConfig = {
            layout: this.sigLayout,
            fontSize: this.sigFontSize,
            infoLines: [...this.infoLines],
            visualType: this.activeTab === 'image' ? 'image' : (this.activeTab === 'certName' ? 'text' : 'drawing'),
            visualContent: this.getVisualContent()
        };
        const finalHtml = this.sigGen.generate(config);
        this.save.emit(finalHtml);
        this.onClose();
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

            this.signaturePad.addEventListener('endStroke', () => {
                this.zone.run(() => this.updatePreview());
            });
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
            this.signaturePad.clear();
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
        document.getElementById('sig-image-upload-comp')?.click();
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
        this.previewConfig = {
            layout: this.sigLayout,
            fontSize: this.sigFontSize,
            infoLines: [...this.infoLines],
            visualType: this.activeTab === 'image' ? 'image' : (this.activeTab === 'certName' ? 'text' : 'drawing'),
            visualContent: this.getVisualContent()
        };
        this.cdr.detectChanges();
    }

    getVisualContent(): string {
        if (this.activeTab === 'certName') return this.certName || 'Your Name';
        if (this.activeTab === 'image') return this.selectedImage || '';
        if (this.activeTab === 'drawing') return this.signaturePad?.toDataURL() || '';
        return '';
    }
}
