import { PdfSignReact, PdfSignReactRef } from '@shznet/pdf-sign-react';
import { SignatureField } from '@shznet/pdf-sign-control';
import * as pdfjs from 'pdfjs-dist';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../styles.css';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { SignatureModal } from './components/SignatureModal';
import { base64ToBlobUrl, fillPdfSigning, preparePdfSigning, previewSignatureAppearance } from './sample-api';
import {
  getSignatureWidgetMetadata,
  isSignatureWidgetField,
  NewFieldState,
  SignatureProfileDraft,
  SignatureWidgetMetadata,
  SigningRunState,
} from './types';

const DEFAULT_PROFILE: SignatureProfileDraft = {
  signerName: 'Nguyen Van A',
  roleName: 'Project Manager',
  email: 'nguyenvana@example.com',
  phoneNumber: '0901234567',
  organization: 'ShzNet Sample',
  organizationUnitName: 'Digital Signing',
  departmentName: 'R&D',
  signedAtText: 'Signed at 2026-07-08 09:30 ICT',
  signatureImageId: 'mock-brush-blue',
  templateId: 'default-signature-widget',
  imageType: 0,
  layoutDirection: 0,
  imageSize: 1,
  textSize: 10,
  certificateNameFontSize: 12,
  languageCode: 'vi',
  showCertificateName: true,
  showTimeStamp: true,
  showLabel: true,
  showRoleName: true,
  showEmail: false,
  showPhoneNumber: false,
  showOrganizationUnitName: false,
  showDepartmentName: false,
  penColor: '#163b7a',
  penWidth: 2,
  typedName: 'Nguyen Van A',
  imageBackgroundMode: 'transparent',
  visualGoal: 'gọn hơn',
};

const DEFAULT_NEW_FIELD: NewFieldState = {
  ...DEFAULT_PROFILE,
  page: 1,
  x: 100,
  y: 120,
  width: 180,
  height: 72,
  draggable: true,
  resizable: true,
  deletable: true,
};

function buildFieldMetadata(
  profile: SignatureProfileDraft,
  appearanceId: string,
  appearanceUrl: string,
  width: number,
  height: number
): SignatureWidgetMetadata {
  return {
    kind: 'signature-widget',
    appearanceId,
    appearanceUrl,
    templateId: profile.templateId,
    contentSnapshot: profile,
    previewWidthPt: width,
    previewHeightPt: height,
    previewStatus: 'ready',
  };
}

function createIdlePlaceholderDataUrl(label: string, width: number, height: number): string {
  const safeWidth = Math.max(80, Math.round(width));
  const safeHeight = Math.max(40, Math.round(height));
  const fontSize = Math.max(12, Math.min(18, Math.round(safeHeight * 0.22)));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">
      <rect x="1" y="1" width="${safeWidth - 2}" height="${safeHeight - 2}" rx="8" ry="8" fill="rgba(148,163,184,0.08)" stroke="#94a3b8" stroke-dasharray="6 4"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="${fontSize}" fill="#64748b">${label}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildProfileFromNewField(newField: NewFieldState): SignatureProfileDraft {
  return {
    signerName: newField.signerName,
    roleName: newField.roleName,
    email: newField.email,
    phoneNumber: newField.phoneNumber,
    organization: newField.organization,
    organizationUnitName: newField.organizationUnitName,
    departmentName: newField.departmentName,
    signedAtText: newField.signedAtText,
    signatureImageId: newField.signatureImageId,
    templateId: newField.templateId,
    imageType: newField.imageType,
    layoutDirection: newField.layoutDirection,
    imageSize: newField.imageSize,
    textSize: newField.textSize,
    certificateNameFontSize: newField.certificateNameFontSize,
    languageCode: newField.languageCode,
    showCertificateName: newField.showCertificateName,
    showTimeStamp: newField.showTimeStamp,
    showLabel: newField.showLabel,
    showRoleName: newField.showRoleName,
    showEmail: newField.showEmail,
    showPhoneNumber: newField.showPhoneNumber,
    showOrganizationUnitName: newField.showOrganizationUnitName,
    showDepartmentName: newField.showDepartmentName,
    penColor: newField.penColor,
    penWidth: newField.penWidth,
    typedName: newField.typedName || newField.signerName,
    imageBackgroundMode: newField.imageBackgroundMode,
    visualGoal: newField.visualGoal,
  };
}

export function App() {
  const pdfRef = useRef<PdfSignReactRef>(null);
  const previewRefreshTimer = useRef<number | null>(null);
  const lastBlobUrlRef = useRef<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<'confirm' | 'prepare' | 'fill' | null>(null);
  const [isSetupApplied, setIsSetupApplied] = useState(false);
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [newField, setNewField] = useState<NewFieldState>(DEFAULT_NEW_FIELD);
  const [signingState, setSigningState] = useState<SigningRunState>({});

  const pdfLoaderOptions = useMemo(() => ({
    workerSrc: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`,
  }), []);

  const sharedProfile = useMemo(() => buildProfileFromNewField(newField), [newField]);

  const updateNewField = useCallback(<K extends keyof NewFieldState>(key: K, value: NewFieldState[K]) => {
    setNewField((prev) => ({ ...prev, [key]: value }));
    if (key === 'page') {
      setCurrentPage(Number(value));
    }
  }, []);

  const onPageChange = useCallback((page: number, total: number) => {
    setCurrentPage(page);
    setTotalPages(total);
  }, []);

  const onFieldsChange = useCallback((nextFields: SignatureField[]) => {
    setFields([...nextFields]);
  }, []);

  const syncFieldPreview = useCallback(async (field: SignatureField) => {
    const metadata = getSignatureWidgetMetadata(field);
    if (!metadata) {
      return;
    }

    if (metadata.previewStatus !== 'ready') {
      return;
    }

    const needsPreviewRefresh =
      Math.abs(field.rect.width - metadata.previewWidthPt) > 0.5 ||
      Math.abs(field.rect.height - metadata.previewHeightPt) > 0.5;

    if (!needsPreviewRefresh) {
      return;
    }

    const control = pdfRef.current?.getControl();
    if (!control) {
      return;
    }

    control.updateField(field.id, {
      metadata: {
        ...metadata,
        previewStatus: 'loading',
        previewError: undefined,
      },
    });

    try {
      const preview = await previewSignatureAppearance(
        metadata.contentSnapshot,
        field.rect.width,
        field.rect.height
      );

      control.updateField(field.id, {
        content: preview.url,
        metadata: {
          ...metadata,
          appearanceId: preview.appearanceId,
          appearanceUrl: preview.url,
          previewWidthPt: field.rect.width,
          previewHeightPt: field.rect.height,
          previewStatus: 'ready',
          previewError: undefined,
        } satisfies SignatureWidgetMetadata,
      });
    } catch (error) {
      control.updateField(field.id, {
        metadata: {
          ...metadata,
          previewStatus: 'error',
          previewError: error instanceof Error ? error.message : 'Unknown preview error',
        } satisfies SignatureWidgetMetadata,
      });
    }
  }, []);

  useEffect(() => {
    if (previewRefreshTimer.current) {
      window.clearTimeout(previewRefreshTimer.current);
    }

    previewRefreshTimer.current = window.setTimeout(() => {
      fields
        .filter(isSignatureWidgetField)
        .forEach((field) => {
          void syncFieldPreview(field);
        });
    }, 350);

    return () => {
      if (previewRefreshTimer.current) {
        window.clearTimeout(previewRefreshTimer.current);
      }
    };
  }, [fields, syncFieldPreview]);

  useEffect(() => {
    return () => {
      if (lastBlobUrlRef.current) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
      }
    };
  }, []);

  const applyProfileToFields = useCallback(async (fieldIds: string[], profile: SignatureProfileDraft) => {
    const control = pdfRef.current?.getControl();
    const allFields = control?.getFields() ?? [];
    if (!control) {
      throw new Error('Không tìm thấy widget để cập nhật.');
    }

    const targetFields = allFields.filter((field: SignatureField) => fieldIds.includes(field.id));
    if (targetFields.length === 0) {
      throw new Error('Không tìm thấy widget để cập nhật.');
    }

    const fieldGroups = new Map<string, SignatureField[]>();
    for (const field of targetFields) {
      const width = Math.round(field.rect.width * 100) / 100;
      const height = Math.round(field.rect.height * 100) / 100;
      const key = `${width}x${height}`;
      const existing = fieldGroups.get(key);
      if (existing) {
        existing.push(field);
      } else {
        fieldGroups.set(key, [field]);
      }
    }

    await Promise.all(
      Array.from(fieldGroups.values()).map(async (groupFields) => {
        const [{ rect }] = groupFields;
        const preview = await previewSignatureAppearance(profile, rect.width, rect.height);

        groupFields.forEach((field) => {
          control.updateField(field.id, {
            content: preview.url,
            metadata: buildFieldMetadata(profile, preview.appearanceId, preview.url, field.rect.width, field.rect.height),
          });
        });
      })
    );
  }, []);

  const handleAddWidget = useCallback(async () => {
    const control = pdfRef.current?.getControl();
    if (!control) {
      return;
    }

    setIsAddingWidget(true);
    setSigningState((prev) => ({ ...prev, error: undefined }));

    try {
      const fieldId = `widget-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const profile = sharedProfile;
      const placeholderLabel = `Vùng ký ${fields.length + 1}`;

      const field: SignatureField = {
        id: fieldId,
        pageNumber: newField.page,
        rect: {
          x: newField.x,
          y: newField.y,
          width: newField.width,
          height: newField.height,
        },
        type: 'image',
        content: createIdlePlaceholderDataUrl(placeholderLabel, newField.width, newField.height),
        draggable: newField.draggable,
        resizable: newField.resizable,
        deletable: newField.deletable,
        style: {},
        metadata: {
          ...buildFieldMetadata(profile, '', '', newField.width, newField.height),
          previewStatus: 'idle',
        } satisfies SignatureWidgetMetadata,
      };

      await control.addField(field);
      setIsSetupApplied(false);
    } catch (error) {
      setSigningState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add widget',
      }));
    } finally {
      setIsAddingWidget(false);
    }
  }, [fields.length, newField, sharedProfile]);

  const handleApplySharedProfile = useCallback(async (profile: SignatureProfileDraft) => {
    setSigningState((prev) => ({ ...prev, error: undefined }));
    setNewField((prev) => ({ ...prev, ...profile }));
    setBusyAction('confirm');

    try {
      await applyProfileToFields(fields.map((field) => field.id), profile);
      setIsSetupApplied(true);
      setIsSetupModalOpen(false);
    } catch (error) {
      setSigningState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update widgets',
      }));
    } finally {
      setBusyAction(null);
    }
  }, [applyProfileToFields, fields]);

  const handleOpenSetup = useCallback(() => {
    if (fields.length === 0) {
      return;
    }

    setBusyAction('confirm');
    setSigningState((prev) => ({ ...prev, error: undefined, fill: undefined, finalBlobUrl: undefined }));
    setIsSetupModalOpen(true);
    setBusyAction(null);
  }, [fields]);

  const handleClearAll = useCallback(() => {
    pdfRef.current?.clearFields();
    setIsSetupApplied(false);
    setSigningState({});
  }, []);

  const handlePrepare = useCallback(async () => {
    if (fields.length === 0) {
      return;
    }

    setBusyAction('prepare');
    setSigningState((prev) => ({ ...prev, error: undefined, fill: undefined, finalBlobUrl: undefined }));

    try {
      const controlFields = pdfRef.current?.getControl()?.getFields() ?? [];
      const prepare = await preparePdfSigning(controlFields);

      if (lastBlobUrlRef.current) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = null;
      }

      setSigningState({ prepare });
    } catch (error) {
      setSigningState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Prepare failed',
      }));
    } finally {
      setBusyAction(null);
    }
  }, [fields.length]);

  const handleFill = useCallback(async () => {
    if (!signingState.prepare) {
      return;
    }

    setBusyAction('fill');
    setSigningState((prev) => ({ ...prev, error: undefined }));

    try {
      const fill = await fillPdfSigning(signingState.prepare.signingSessionId, signingState.prepare.fieldName, '');
      const finalBlobUrl = fill.fileBytes ? base64ToBlobUrl(fill.fileBytes, 'application/pdf') : undefined;

      if (lastBlobUrlRef.current) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
      }
      lastBlobUrlRef.current = finalBlobUrl ?? null;

      setSigningState((prev) => ({
        ...prev,
        fill,
        finalBlobUrl,
      }));
    } catch (error) {
      setSigningState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Fill failed',
      }));
    } finally {
      setBusyAction(null);
    }
  }, [signingState.prepare]);

  return (
    <>
      <header className="app-header">
        <span>PDF Sign Demo (React Sample + Backend Preview)</span>
      </header>

      <LeftPanel
        newField={newField}
        onChange={updateNewField}
        onAdd={handleAddWidget}
        isAdding={isAddingWidget}
      />

      <main className="main-content">
        <div className="toolbar">
          <div className="control-group">
            <button onClick={() => pdfRef.current?.previousPage()} title="Previous Page">◀</button>
            <div className="page-input-group">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value, 10);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                style={{ width: '50px', textAlign: 'center' }}
              />
              <span> / {totalPages}</span>
            </div>
            <button onClick={() => pdfRef.current?.nextPage()} title="Next Page">▶</button>
          </div>

          <div className="divider"></div>

          <div className="control-group">
            <button onClick={() => setScale((s) => Math.max(0.25, Number((s - 0.25).toFixed(2))))}>−</button>
            <span style={{ minWidth: '50px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(5.0, Number((s + 0.25).toFixed(2))))}>+</button>
          </div>

          <div className="divider"></div>

          <div className="toolbar-hint">
            Drag widget để đổi vị trí. Resize widget để sample React gọi lại backend preview theo kích thước mới.
          </div>
        </div>

        <div id="pdf-container">
          <PdfSignReact
            ref={pdfRef}
            src="/multipage.pdf"
            viewMode="scroll"
            page={currentPage}
            scale={scale}
            pdfLoaderOptions={pdfLoaderOptions}
            onPageChange={onPageChange}
            onScaleChange={setScale}
            onError={(err) => setSigningState((prev) => ({ ...prev, error: err.message }))}
            onFieldsChange={onFieldsChange}
          />
        </div>
      </main>

      <RightPanel
        fieldCount={fields.length}
        isSetupApplied={isSetupApplied}
        signingState={signingState}
        busyAction={busyAction}
        onClearAll={handleClearAll}
        onOpenSetup={handleOpenSetup}
        onPrepare={handlePrepare}
        onFill={handleFill}
      />

      <SignatureModal
        isOpen={isSetupModalOpen}
        initialValue={sharedProfile}
        onClose={() => {
          if (busyAction === 'confirm') {
            return;
          }

          setIsSetupModalOpen(false);
        }}
        onConfirm={handleApplySharedProfile}
        confirmLabel={busyAction === 'confirm' ? 'Đang áp dụng...' : '1. Xác nhận setup'}
      />
    </>
  );
}

export default App;
