import React from 'react';
import { SigningRunState } from '../types';

interface RightPanelProps {
  fieldCount: number;
  isSetupApplied: boolean;
  signingState: SigningRunState;
  busyAction: 'confirm' | 'prepare' | 'fill' | null;
  onClearAll: () => void;
  onOpenSetup: () => void;
  onPrepare: () => void;
  onFill: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  fieldCount,
  isSetupApplied,
  signingState,
  busyAction,
  onClearAll,
  onOpenSetup,
  onPrepare,
  onFill,
}) => {
  return (
    <aside className="right-panel">
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-title">Thông Tin Ký</div>
          {fieldCount > 0 && (
            <button className="danger-link" onClick={onClearAll}>Clear All</button>
          )}
        </div>

        <div className="run-summary">
          <div>Số vùng ký: {fieldCount}</div>
          <div>Setup chung: appearance dùng chung cho toàn bộ vùng ký</div>
          <div>Prepare: thực hiện sau khi xác nhận trong modal setup</div>
        </div>

        {fieldCount === 0 && (
          <div className="empty-hint">Thêm ít nhất một vùng ký ở panel trái để bắt đầu.</div>
        )}
      </div>

      <div className="panel-section signing-panel">
        <div className="panel-title">Signing Flow</div>
        <button className="btn-primary" disabled={fieldCount === 0 || busyAction !== null} onClick={onOpenSetup}>
          {busyAction === 'confirm' ? 'Opening Setup...' : '1. Xác nhận ký'}
        </button>
        <button
          className="btn-secondary full-width"
          disabled={!isSetupApplied || busyAction !== null}
          onClick={onPrepare}
        >
          {busyAction === 'prepare' ? 'Preparing File...' : '2. Prepare File'}
        </button>
        <button
          className="btn-secondary full-width"
          disabled={!signingState.prepare || busyAction !== null}
          onClick={onFill}
        >
          {busyAction === 'fill' ? 'Filling...' : '3. Fill Sample Signature'}
        </button>

        <div className="sample-note">
          Luồng 3 bước: <code>1. Xác nhận ký</code> -&gt; mở modal setup và lấy preview cho các vùng ký -&gt; <code>2. Prepare File</code> -&gt; <code>3. Fill Sample Signature</code>.
        </div>

        <div className="run-summary">
          <div>Session: {signingState.prepare?.signingSessionId ?? '-'}</div>
          <div>Field: {signingState.prepare?.fieldName ?? '-'}</div>
          <div>Prepared Doc: {signingState.prepare?.preparedDocumentId ?? '-'}</div>
          <div>Final Doc: {signingState.fill?.finalDocumentId ?? '-'}</div>
        </div>

        {signingState.error && <div className="error-box">{signingState.error}</div>}

        {signingState.finalBlobUrl && (
          <a className="open-link" href={signingState.finalBlobUrl} target="_blank" rel="noreferrer">
            Open Final Signed PDF
          </a>
        )}

        <div className="sample-note">
          Button `Fill Sample Signature` gửi `signature = ""` để backend sample tự ký bằng cert giả. Khi cắm signer thật, thay bước này bằng raw signature bytes từ HSM/client.
        </div>
      </div>
    </aside>
  );
};
