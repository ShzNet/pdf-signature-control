import { SignatureField } from '@shznet/pdf-sign-control';
import { AppearanceResponse, FillSigningResponse, getSignatureWidgetMetadata, PrepareSigningResponse, SignatureProfileDraft } from './types';

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export async function previewSignatureAppearance(
  profile: SignatureProfileDraft,
  width: number,
  height: number
): Promise<AppearanceResponse> {
  return postJson<AppearanceResponse>('/api/signature-appearance/preview', {
    templateId: profile.templateId,
    box: {
      width,
      height,
      unit: 'pt',
    },
    content: {
      signerName: profile.signerName,
      roleName: profile.roleName || null,
      organization: profile.organization || null,
      signedAtText: profile.signedAtText,
      signatureImageId: profile.signatureImageId,
      email: profile.email || null,
      phoneNumber: profile.phoneNumber || null,
      organizationUnitName: profile.organizationUnitName || null,
      departmentName: profile.departmentName || null,
      appearanceOptions: {
        imageType: profile.imageType,
        layoutDirection: profile.layoutDirection,
        imageSize: profile.imageSize,
        textSize: profile.textSize,
        certificateNameFontSize: profile.certificateNameFontSize,
        languageCode: profile.languageCode === 'vi' ? 0 : 1,
        showCertificateName: profile.showCertificateName,
        showTimeStamp: profile.showTimeStamp,
        showLabel: profile.showLabel,
        showRoleName: profile.showRoleName,
        showEmail: profile.showEmail,
        showPhoneNumber: profile.showPhoneNumber,
        showOrganizationUnitName: profile.showOrganizationUnitName,
        showDepartmentName: profile.showDepartmentName,
        penColor: profile.penColor,
        penWidth: profile.penWidth,
        typed: profile.typedName ? { name: profile.typedName } : null,
        imageBackgroundMode: profile.imageBackgroundMode === 'white' ? 1 : 0,
        visualGoal: profile.visualGoal,
      },
    },
    render: {
      format: 'png',
    },
  });
}

export async function preparePdfSigning(fields: SignatureField[]): Promise<PrepareSigningResponse> {
  const widgets = fields.map((field) => {
    const metadata = getSignatureWidgetMetadata(field);
    if (!metadata) {
      throw new Error(`Field ${field.id} is missing signature widget metadata.`);
    }

    return {
      widgetId: field.id,
      page: field.pageNumber,
      rect: {
        x: field.rect.x,
        y: field.rect.y,
        width: field.rect.width,
        height: field.rect.height,
        unit: 'pt',
      },
      appearanceId: metadata.appearanceId,
      templateId: metadata.templateId,
      contentSnapshot: {
        signerName: metadata.contentSnapshot.signerName,
        roleName: metadata.contentSnapshot.roleName || null,
        email: metadata.contentSnapshot.email || null,
        phoneNumber: metadata.contentSnapshot.phoneNumber || null,
        organization: metadata.contentSnapshot.organization || null,
        organizationUnitName: metadata.contentSnapshot.organizationUnitName || null,
        departmentName: metadata.contentSnapshot.departmentName || null,
        signedAtText: metadata.contentSnapshot.signedAtText,
        signatureImageId: metadata.contentSnapshot.signatureImageId,
        appearanceOptions: {
          imageType: metadata.contentSnapshot.imageType,
          layoutDirection: metadata.contentSnapshot.layoutDirection,
          imageSize: metadata.contentSnapshot.imageSize,
          textSize: metadata.contentSnapshot.textSize,
          certificateNameFontSize: metadata.contentSnapshot.certificateNameFontSize,
          languageCode: metadata.contentSnapshot.languageCode === 'vi' ? 0 : 1,
          showCertificateName: metadata.contentSnapshot.showCertificateName,
          showTimeStamp: metadata.contentSnapshot.showTimeStamp,
          showLabel: metadata.contentSnapshot.showLabel,
          showRoleName: metadata.contentSnapshot.showRoleName,
          showEmail: metadata.contentSnapshot.showEmail,
          showPhoneNumber: metadata.contentSnapshot.showPhoneNumber,
          showOrganizationUnitName: metadata.contentSnapshot.showOrganizationUnitName,
          showDepartmentName: metadata.contentSnapshot.showDepartmentName,
          penColor: metadata.contentSnapshot.penColor,
          penWidth: metadata.contentSnapshot.penWidth,
          typed: metadata.contentSnapshot.typedName ? { name: metadata.contentSnapshot.typedName } : null,
          imageBackgroundMode: metadata.contentSnapshot.imageBackgroundMode === 'white' ? 1 : 0,
          visualGoal: metadata.contentSnapshot.visualGoal,
        },
      },
    };
  });

  return postJson<PrepareSigningResponse>('/api/pdf-signing/prepare', {
    documentId: 'multipage',
    fieldName: `sig_${Date.now()}`,
    certificateChains: [],
    hashAlgorithm: 0,
    signTime: new Date().toISOString(),
    widgets,
  });
}

export async function fillPdfSigning(
  signingSessionId: string,
  fieldName: string,
  signatureBase64 = ''
): Promise<FillSigningResponse> {
  return postJson<FillSigningResponse>('/api/pdf-signing/fill', {
    signingSessionId,
    fieldName,
    signature: signatureBase64,
  });
}

export function base64ToBlobUrl(base64: string, mimeType: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}
