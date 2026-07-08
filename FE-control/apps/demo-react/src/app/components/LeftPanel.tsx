import React from 'react';
import { NewFieldState } from '../types';

interface LeftPanelProps {
  newField: NewFieldState;
  onChange: <K extends keyof NewFieldState>(key: K, value: NewFieldState[K]) => void;
  onAdd: () => void;
  isAdding: boolean;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  newField,
  onChange,
  onAdd,
  isAdding,
}) => {
  return (
    <aside className="left-panel">
      <div className="panel-title">Thêm Vùng Ký</div>

      <div className="form-container left-form">
        <div className="sample-note">
          Đặt các vùng ký trước. Panel phải là khu vực setup appearance dùng chung cho tất cả vùng ký trong một lần ký.
        </div>

        <div className="form-group">
          <label>Page</label>
          <input
            type="number"
            value={newField.page}
            min={1}
            onChange={(e) => onChange('page', Math.max(1, Number(e.target.value) || 1))}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>X (pt)</label>
            <input
              type="number"
              value={newField.x}
              onChange={(e) => onChange('x', Number(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label>Y (pt)</label>
            <input
              type="number"
              value={newField.y}
              onChange={(e) => onChange('y', Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Width (pt)</label>
            <input
              type="number"
              value={newField.width}
              onChange={(e) => onChange('width', Math.max(20, Number(e.target.value) || 20))}
            />
          </div>

          <div className="form-group">
            <label>Height (pt)</label>
            <input
              type="number"
              value={newField.height}
              onChange={(e) => onChange('height', Math.max(20, Number(e.target.value) || 20))}
            />
          </div>
        </div>

        <div className="flags-row">
          <label><input type="checkbox" checked={newField.draggable} onChange={(e) => onChange('draggable', e.target.checked)} /> Moveable</label>
          <label><input type="checkbox" checked={newField.resizable} onChange={(e) => onChange('resizable', e.target.checked)} /> Resizable</label>
          <label><input type="checkbox" checked={newField.deletable} onChange={(e) => onChange('deletable', e.target.checked)} /> Deletable</label>
        </div>

        <button className="btn-primary" onClick={onAdd} disabled={isAdding}>
          {isAdding ? 'Đang thêm vùng ký...' : '1. Thêm Vùng Ký'}
        </button>

        <div className="sample-note">
          Sau khi thêm, anh có thể kéo thả và resize trực tiếp trên canvas. Mọi thay đổi setup ở panel phải sẽ áp dụng cho toàn bộ vùng ký hiện có.
        </div>
      </div>
    </aside>
  );
};
