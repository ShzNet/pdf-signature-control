import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';
import { previewSignatureAppearance } from '../sample-api';
import { SignatureProfileDraft } from '../types';

interface SignatureModalProps {
  isOpen: boolean;
  initialValue: SignatureProfileDraft;
  onClose: () => void;
  onConfirm: (profile: SignatureProfileDraft) => void;
  embedded?: boolean;
  confirmLabel?: string;
}

type ToggleOption<T extends string | number> = {
  value: T;
  label: string;
  icon: string;
};

type DisplayChip = {
  key:
    | 'showTimeStamp'
    | 'showCertificateName'
    | 'showLabel'
    | 'showRoleName'
    | 'showEmail'
    | 'showPhoneNumber'
    | 'showOrganizationUnitName'
    | 'showDepartmentName';
  label: string;
  icon: string;
};

const SIGNATURE_SOURCE_OPTIONS: ToggleOption<0 | 1 | 2>[] = [
  { value: 0, label: 'Vẽ tay', icon: 'draw' },
  { value: 1, label: 'Gõ chữ', icon: 'type' },
  { value: 2, label: 'Tải ảnh', icon: 'image' },
];

const LAYOUT_OPTIONS: ToggleOption<0 | 1>[] = [
  { value: 0, label: 'Ngang', icon: 'layout-horizontal' },
  { value: 1, label: 'Dọc', icon: 'layout-vertical' },
];

const IMAGE_SIZE_OPTIONS: ToggleOption<0 | 1 | 2>[] = [
  { value: 0, label: 'Nhỏ', icon: 'size-small' },
  { value: 1, label: 'Vừa', icon: 'size-medium' },
  { value: 2, label: 'Lớn', icon: 'size-large' },
];

const DISPLAY_CHIPS: DisplayChip[] = [
  { key: 'showTimeStamp', label: 'Ký lúc', icon: 'clock' },
  { key: 'showCertificateName', label: 'Người ký', icon: 'user' },
  { key: 'showLabel', label: 'Nhãn', icon: 'tag' },
  { key: 'showRoleName', label: 'Chức vụ', icon: 'briefcase' },
  { key: 'showEmail', label: 'Email', icon: 'mail' },
  { key: 'showPhoneNumber', label: 'Số điện thoại', icon: 'phone' },
  { key: 'showOrganizationUnitName', label: 'Đơn vị', icon: 'building' },
  { key: 'showDepartmentName', label: 'Phòng ban', icon: 'users' },
];

const PEN_COLORS = ['#111111', '#2563eb', '#dc2626'];
const PEN_WIDTHS = [1, 2, 3];
const FONT_SIZE_PRESETS = [8, 9, 10, 11, 12, 14, 16];

function getPreviewBoxSize(profile: SignatureProfileDraft) {
  const widths = [220, 280, 340];
  const heights = [96, 122, 148];
  const width = widths[profile.imageSize] ?? widths[1];
  const height = heights[profile.imageSize] ?? heights[1];

  return profile.layoutDirection === 1
    ? { width: Math.max(150, Math.round(height * 1.1)), height: Math.round(width * 1.15) }
    : { width, height };
}

function Icon({ name }: { name: string }) {
  const commonProps = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'draw':
      return (
        <svg {...commonProps}>
          <path d="M3 14.5 13.8 3.7a1.5 1.5 0 0 1 2.1 0l.4.4a1.5 1.5 0 0 1 0 2.1L5.5 17H3v-2.5Z" />
          <path d="M11.5 6l2.5 2.5" />
        </svg>
      );
    case 'type':
      return (
        <svg {...commonProps}>
          <path d="M4 5h12" />
          <path d="M10 5v10" />
          <path d="M7 15h6" />
        </svg>
      );
    case 'image':
      return (
        <svg {...commonProps}>
          <rect x="3" y="4" width="14" height="12" rx="2" />
          <circle cx="8" cy="8" r="1.5" />
          <path d="m5 14 3.5-3.5L12 14l2-2 2 2" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...commonProps}>
          <circle cx="10" cy="10" r="7.25" />
          <path d="M10 6.5v4l2.5 1.5" />
        </svg>
      );
    case 'user':
      return (
        <svg {...commonProps}>
          <circle cx="10" cy="7" r="2.5" />
          <path d="M4.5 15c1.3-2.2 3.1-3.3 5.5-3.3s4.2 1.1 5.5 3.3" />
        </svg>
      );
    case 'tag':
      return (
        <svg {...commonProps}>
          <path d="M10.5 3H6L3 6v4.5L9.5 17l7.5-7.5V6l-2-3h-4.5Z" />
          <circle cx="7.5" cy="7.5" r="1" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...commonProps}>
          <rect x="3" y="6" width="14" height="10" rx="2" />
          <path d="M7 6V4.5h6V6" />
          <path d="M3 10.5h14" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="14" height="10" rx="2" />
          <path d="m4.5 6.5 5.5 4 5.5-4" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...commonProps}>
          <path d="M6.5 4.5c.4-.4 1-.4 1.4 0l1.4 1.4c.4.4.4 1 0 1.4l-.8.8c.8 1.7 2.1 3 3.8 3.8l.8-.8c.4-.4 1-.4 1.4 0l1.4 1.4c.4.4.4 1 0 1.4l-.9.9c-.7.7-1.8.9-2.7.5A14.5 14.5 0 0 1 4.1 7.2c-.4-.9-.2-2 .5-2.7l.9-.9Z" />
        </svg>
      );
    case 'building':
      return (
        <svg {...commonProps}>
          <path d="M4 16V5.5L10 3l6 2.5V16" />
          <path d="M7 7.5h.01M10 7.5h.01M13 7.5h.01M7 10.5h.01M10 10.5h.01M13 10.5h.01" />
          <path d="M8.5 16v-3h3v3" />
        </svg>
      );
    case 'users':
      return (
        <svg {...commonProps}>
          <circle cx="7" cy="7.5" r="2" />
          <circle cx="13.5" cy="8" r="1.75" />
          <path d="M3.8 15c.8-1.8 2.2-2.7 4.2-2.7S11.4 13.2 12.2 15" />
          <path d="M12 14.6c.6-1.4 1.7-2.1 3.2-2.1 1 0 1.9.3 2.6 1" />
        </svg>
      );
    case 'layout-horizontal':
      return (
        <svg {...commonProps}>
          <rect x="3" y="5.5" width="14" height="9" rx="2" />
          <path d="M7 8.5h6" />
        </svg>
      );
    case 'layout-vertical':
      return (
        <svg {...commonProps}>
          <rect x="5.5" y="3" width="9" height="14" rx="2" />
          <path d="M8 10h4" />
        </svg>
      );
    case 'size-small':
      return (
        <svg {...commonProps}>
          <path d="M5 10h10" />
        </svg>
      );
    case 'size-medium':
      return (
        <svg {...commonProps}>
          <path d="M4 10h12" />
        </svg>
      );
    case 'size-large':
      return (
        <svg {...commonProps}>
          <path d="M3 10h14" />
        </svg>
      );
    default:
      return null;
  }
}

function SourceButton({
  option,
  active,
  onClick,
}: {
  option: ToggleOption<number>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`sig-source-tab${active ? ' active' : ''}`}
      onClick={onClick}
    >
      <span className="sig-icon"><Icon name={option.icon} /></span>
      <span>{option.label}</span>
    </button>
  );
}

function SegmentedToggle<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="sig-segmented">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={`sig-segmented-option${value === option.value ? ' active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          <span className="sig-icon"><Icon name={option.icon} /></span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  initialValue,
  onClose,
  onConfirm,
  embedded = false,
  confirmLabel = 'Xác nhận',
}) => {
  const [draft, setDraft] = useState<SignatureProfileDraft>(initialValue);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const drawSourceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraft(initialValue);
    setPreviewError('');
    drawSourceRef.current = initialValue.imageType === 0 ? initialValue.signatureImageId : null;
  }, [initialValue, isOpen]);

  useEffect(() => {
    if (!isOpen || draft.imageType !== 0 || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.offsetWidth || 520;
    const height = canvas.offsetHeight || 360;
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const context = canvas.getContext('2d');
    context?.setTransform(1, 0, 0, 1, 0, 0);
    context?.scale(ratio, ratio);

    const pad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: draft.penColor,
      minWidth: draft.penWidth,
      maxWidth: Math.max(draft.penWidth * 2, draft.penWidth + 1),
    });

    signaturePadRef.current = pad;

    if (drawSourceRef.current?.startsWith('data:image/')) {
      pad.fromDataURL(drawSourceRef.current, { ratio });
    }

    const syncDrawing = () => {
      if (pad.isEmpty()) {
        drawSourceRef.current = '';
        setDraft((prev) => ({ ...prev, signatureImageId: '' }));
        return;
      }

      const dataUrl = pad.toDataURL('image/png');
      drawSourceRef.current = dataUrl;
      setDraft((prev) => ({ ...prev, signatureImageId: dataUrl }));
    };

    pad.addEventListener('endStroke', syncDrawing);

    return () => {
      pad.off();
      signaturePadRef.current = null;
    };
  }, [draft.imageType, draft.penColor, draft.penWidth, isOpen]);

  useEffect(() => {
    if (!signaturePadRef.current) {
      return;
    }

    signaturePadRef.current.penColor = draft.penColor;
    signaturePadRef.current.minWidth = draft.penWidth;
    signaturePadRef.current.maxWidth = Math.max(draft.penWidth * 2, draft.penWidth + 1);
  }, [draft.penColor, draft.penWidth]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (draft.imageType === 2 && !draft.signatureImageId.startsWith('data:image/')) {
      setPreviewUrl('');
      setPreviewLoading(false);
      setPreviewError('Tải ảnh chữ ký để xem trước.');
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError('');

      try {
        const size = getPreviewBoxSize(draft);
        const preview = await previewSignatureAppearance(draft, size.width, size.height);
        setPreviewUrl(preview.url);
      } catch (error) {
        setPreviewError(error instanceof Error ? error.message : 'Không thể tạo xem trước');
      } finally {
        setPreviewLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [draft, isOpen]);

  const update = <K extends keyof SignatureProfileDraft>(key: K, value: SignatureProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSourceChange = (value: 0 | 1 | 2) => {
    setDraft((prev) => ({
      ...prev,
      imageType: value,
      typedName: value === 1 ? prev.typedName || prev.signerName : prev.typedName,
      signatureImageId: value === 0 ? drawSourceRef.current || prev.signatureImageId : prev.signatureImageId,
    }));
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return;
      }

      setDraft((prev) => ({
        ...prev,
        imageType: 2,
        signatureImageId: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) {
    return null;
  }

  const content = (
    <div className={`modal-content sig-modal signature-setup-modal${embedded ? ' embedded' : ''}`}>
      <div className="sig-modal-header signature-setup-header">
        <h3>Thiết lập chữ ký</h3>
        {!embedded && (
          <button type="button" className="close-btn" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        )}
      </div>

      <div className="signature-setup-body">
        <section className="signature-source-panel">
          <div className="sig-source-tabs">
            {SIGNATURE_SOURCE_OPTIONS.map((option) => (
              <SourceButton
                key={option.value}
                option={option}
                active={draft.imageType === option.value}
                onClick={() => handleSourceChange(option.value)}
              />
            ))}
          </div>

          <div className="signature-canvas-card">
            {draft.imageType === 0 && (
              <>
                <canvas ref={canvasRef} className="signature-draw-surface" />
                <div className={`signature-canvas-empty${draft.signatureImageId ? ' hidden' : ''}`}>
                  <span className="sig-icon large"><Icon name="draw" /></span>
                  <span>Vẽ chữ ký của bạn tại đây</span>
                </div>
              </>
            )}

            {draft.imageType === 1 && (
              <div className="signature-typed-stage">
                <input
                  type="text"
                  className="signature-typed-input"
                  value={draft.typedName}
                  placeholder="Nhập chữ ký dạng gõ"
                  onChange={(event) => update('typedName', event.target.value)}
                />
                <p className="signature-stage-hint">Tên này sẽ được backend render thành ảnh chữ ký dạng chữ gõ.</p>
              </div>
            )}

            {draft.imageType === 2 && (
              <button
                type="button"
                className="signature-upload-stage"
                onClick={() => fileInputRef.current?.click()}
              >
                {draft.signatureImageId.startsWith('data:image/') ? (
                  <img src={draft.signatureImageId} alt="Uploaded signature" className="signature-upload-preview" />
                ) : (
                  <>
                    <span className="sig-icon large"><Icon name="image" /></span>
                    <span>Tải ảnh chữ ký lên</span>
                    <small>PNG nền trong suốt hoặc JPG đều dùng được</small>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="signature-source-footer">
            <div className="signature-control-group">
              <span className="signature-control-label">Màu bút</span>
              <div className="signature-swatch-row">
                {PEN_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`signature-swatch${draft.penColor === color ? ' active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => update('penColor', color)}
                    aria-label={`Màu ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="signature-control-group">
              <span className="signature-control-label">Độ dày nét</span>
              <div className="signature-thickness-row">
                {PEN_WIDTHS.map((width) => (
                  <button
                    key={width}
                    type="button"
                    className={`signature-thickness${draft.penWidth === width ? ' active' : ''}`}
                    onClick={() => update('penWidth', width)}
                    aria-label={`Độ dày ${width}`}
                  >
                    <span style={{ height: `${width + 1}px` }} />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="signature-reset-btn"
              onClick={() => {
                signaturePadRef.current?.clear();
                drawSourceRef.current = '';
                update('signatureImageId', '');
              }}
            >
              Đặt lại
            </button>
          </div>
        </section>

        <section className="signature-options-panel">
          <div className="signature-options-section">
            <h4>Nội dung hiển thị</h4>
            <div className="signature-chip-grid">
              {DISPLAY_CHIPS.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className={`signature-chip${draft[chip.key] ? ' active' : ''}`}
                  onClick={() => update(chip.key, !draft[chip.key])}
                >
                  <span className="sig-icon"><Icon name={chip.icon} /></span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="signature-options-row">
            <div className="signature-options-section">
              <h4>Bố cục</h4>
              <SegmentedToggle
                options={LAYOUT_OPTIONS}
                value={draft.layoutDirection}
                onChange={(value) => update('layoutDirection', value)}
              />
            </div>

            <div className="signature-options-section">
              <h4>Kích thước ảnh</h4>
              <SegmentedToggle
                options={IMAGE_SIZE_OPTIONS}
                value={draft.imageSize}
                onChange={(value) => update('imageSize', value)}
              />
            </div>
          </div>

          <div className="signature-options-section">
            <h4>Cỡ chữ</h4>
            <div className="signature-font-grid">
              <label>
                <span>Nội dung ({draft.textSize}pt)</span>
                <input
                  type="range"
                  min={6}
                  max={24}
                  step={1}
                  value={draft.textSize}
                  onChange={(event) => update('textSize', Number(event.target.value))}
                />
              </label>
              <label>
                <span>Tên người ký ({draft.certificateNameFontSize}pt)</span>
                <input
                  type="range"
                  min={6}
                  max={32}
                  step={1}
                  value={draft.certificateNameFontSize}
                  onChange={(event) => update('certificateNameFontSize', Number(event.target.value))}
                />
              </label>
            </div>
            <div className="signature-font-presets">
              {FONT_SIZE_PRESETS.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`signature-font-preset${draft.textSize === size ? ' active' : ''}`}
                  onClick={() => update('textSize', size)}
                >
                  {size}pt
                </button>
              ))}
            </div>
          </div>

          <div className="signature-options-section">
            <h4>Ngôn ngữ</h4>
            <select
              value={draft.languageCode}
              onChange={(event) => update('languageCode', event.target.value as 'vi' | 'en')}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="signature-options-section">
            <h4>Xem trước</h4>
            <div className="signature-preview-card">
              {previewLoading && <div className="signature-preview-state">Đang tạo xem trước...</div>}
              {!previewLoading && previewError && <div className="signature-preview-state error">{previewError}</div>}
              {!previewLoading && !previewError && previewUrl && (
                <img src={previewUrl} alt="Signature preview" className="signature-preview-image" />
              )}
            </div>
          </div>

          <div className="signature-options-section">
            <h4>Dữ liệu người ký</h4>
            <div className="signature-form-grid">
              <label>
                <span>Người ký</span>
                <input type="text" value={draft.signerName} onChange={(event) => update('signerName', event.target.value)} />
              </label>
              <label>
                <span>Chức vụ</span>
                <input type="text" value={draft.roleName} onChange={(event) => update('roleName', event.target.value)} />
              </label>
              <label>
                <span>Email</span>
                <input type="text" value={draft.email} onChange={(event) => update('email', event.target.value)} />
              </label>
              <label>
                <span>Số điện thoại</span>
                <input type="text" value={draft.phoneNumber} onChange={(event) => update('phoneNumber', event.target.value)} />
              </label>
              <label>
                <span>Đơn vị</span>
                <input type="text" value={draft.organization} onChange={(event) => update('organization', event.target.value)} />
              </label>
              <label>
                <span>Phòng ban</span>
                <input type="text" value={draft.departmentName} onChange={(event) => update('departmentName', event.target.value)} />
              </label>
              <label>
                <span>Bộ phận</span>
                <input
                  type="text"
                  value={draft.organizationUnitName}
                  onChange={(event) => update('organizationUnitName', event.target.value)}
                />
              </label>
              <label>
                <span>Thời gian ký</span>
                <input type="text" value={draft.signedAtText} onChange={(event) => update('signedAtText', event.target.value)} />
              </label>
            </div>
          </div>
        </section>
      </div>

      <div className="signature-setup-footer">
        {!embedded && <button type="button" className="signature-footer-btn" onClick={onClose}>Hủy</button>}
        <button type="button" className="signature-footer-btn primary" onClick={() => onConfirm(draft)}>
          {confirmLabel}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="signature-file-input"
        onChange={handleUpload}
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="modal-overlay">
      {content}
    </div>
  );
};
