import { SignatureFieldType } from '@shz/pdf-sign-control';

export interface NewFieldState {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    type: SignatureFieldType;
    content: string;
    draggable: boolean;
    resizable: boolean;
    deletable: boolean;
}
