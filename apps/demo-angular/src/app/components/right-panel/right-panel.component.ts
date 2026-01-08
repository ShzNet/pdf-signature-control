import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-right-panel',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './right-panel.component.html',
    styles: []
})
export class RightPanelComponent {
    @Input() fields: any[] = [];
    @Output() remove = new EventEmitter<string>();
    @Output() update = new EventEmitter<void>();

    constructor(public sanitizer: DomSanitizer) { }

    onRemove(id: string) {
        this.remove.emit(id);
    }

    onUpdate() {
        this.update.emit();
    }
}
