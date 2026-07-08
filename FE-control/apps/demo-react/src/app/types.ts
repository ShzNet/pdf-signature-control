import { SignatureField } from '@shznet/pdf-sign-control';

export type SignatureImageType = 0 | 1 | 2;
export type SignatureLayoutDirection = 0 | 1;
export type SignatureImageSize = 0 | 1 | 2;
export type SignatureLanguageCode = 'vi' | 'en';
export type SignatureImageBackgroundMode = 'transparent' | 'white';

export interface SignatureProfileDraft {
  signerName: string;
  roleName: string;
  email: string;
  phoneNumber: string;
  organization: string;
  organizationUnitName: string;
  departmentName: string;
  signedAtText: string;
  signatureImageId: string;
  templateId: string;
  imageType: SignatureImageType;
  layoutDirection: SignatureLayoutDirection;
  imageSize: SignatureImageSize;
  textSize: number;
  certificateNameFontSize: number;
  languageCode: SignatureLanguageCode;
  showCertificateName: boolean;
  showTimeStamp: boolean;
  showLabel: boolean;
  showRoleName: boolean;
  showEmail: boolean;
  showPhoneNumber: boolean;
  showOrganizationUnitName: boolean;
  showDepartmentName: boolean;
  penColor: string;
  penWidth: number;
  typedName: string;
  imageBackgroundMode: SignatureImageBackgroundMode;
  visualGoal: string;
}

export interface NewFieldState extends SignatureProfileDraft {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  draggable: boolean;
  resizable: boolean;
  deletable: boolean;
}

export interface AppearanceResponse {
  appearanceId: string;
  cacheKey: string;
  widthPt: number;
  heightPt: number;
  widthPx: number;
  heightPx: number;
  url: string;
}

export interface SignatureWidgetMetadata {
  kind: 'signature-widget';
  appearanceId: string;
  appearanceUrl: string;
  templateId: string;
  contentSnapshot: SignatureProfileDraft;
  previewWidthPt: number;
  previewHeightPt: number;
  previewStatus: 'idle' | 'loading' | 'ready' | 'error';
  previewError?: string;
}

export interface PrepareSigningResponse {
  signingSessionId: string;
  preparedDocumentId: string;
  fieldName: string;
  signedAttributes: string;
  hashAlgorithm: string;
}

export interface FillSigningResponse {
  finalDocumentId: string;
  fileBytes?: string | null;
}

export interface SigningRunState {
  prepare?: PrepareSigningResponse;
  fill?: FillSigningResponse;
  finalBlobUrl?: string;
  error?: string;
}

export function isSignatureWidgetField(field: SignatureField): boolean {
  return (field.metadata as SignatureWidgetMetadata | undefined)?.kind === 'signature-widget';
}

export function getSignatureWidgetMetadata(field: SignatureField): SignatureWidgetMetadata | null {
  return isSignatureWidgetField(field) ? (field.metadata as SignatureWidgetMetadata) : null;
}
