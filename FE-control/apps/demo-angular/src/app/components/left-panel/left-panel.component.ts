import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-left-panel',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './left-panel.component.html',
    styles: []
})
export class LeftPanelComponent {
    @Input() newField: any;
    @Output() newFieldChange = new EventEmitter<any>();
    @Output() addToPdf = new EventEmitter<void>();
    @Output() requestSignatureSetup = new EventEmitter<void>();
    @Output() clearSignatureContent = new EventEmitter<void>();

    constructor(public sanitizer: DomSanitizer) { }

    onTypeChange(type: string) {
        if (type === 'signature') {
            this.newField.content = '';
        } else if (type === 'text') {
            this.newField.content = 'Text Field';
        } else {
            this.newField.content = '';
        }
    }

    onGenericImageSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.newField.content = e.target?.result as string;
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    onAdd() {
        this.addToPdf.emit();
    }

    onSetupSignature() {
        this.requestSignatureSetup.emit();
    }

    onClearSignature() {
        this.clearSignatureContent.emit();
    }
}
