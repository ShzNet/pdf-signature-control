import React from 'react';
import { SignatureFieldType } from '@shz/pdf-sign-control';
import { NewFieldState } from '../types';

interface LeftPanelProps {
    newField: NewFieldState;
    onChange: (key: keyof NewFieldState, value: any) => void;
    onAdd: () => void;
    onOpenSigModal: () => void;
    onClearSigContent: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ newField, onChange, onAdd, onOpenSigModal, onClearSigContent }) => {
    return (
        <aside className="left-panel">
            <div className="panel-title">Create Field</div>
            <div className="form-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div className="form-group">
                    <label>Page</label>
                    <input type="number" value={newField.page} min={1} style={{ width: '100%' }}
                        onChange={e => onChange('page', parseInt(e.target.value) || 1)} />
                </div>
                <div className="form-row" style={{ display: 'flex', gap: '5px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>X (pt)</label>
                        <input type="number" value={newField.x} style={{ width: '100%' }}
                            onChange={e => onChange('x', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Y (pt)</label>
                        <input type="number" value={newField.y} style={{ width: '100%' }}
                            onChange={e => onChange('y', parseFloat(e.target.value) || 0)} />
                    </div>
                </div>
                <div className="form-row" style={{ display: 'flex', gap: '5px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Width</label>
                        <input type="number" value={newField.width} style={{ width: '100%' }}
                            onChange={e => onChange('width', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Height</label>
                        <input type="number" value={newField.height} style={{ width: '100%' }}
                            onChange={e => onChange('height', parseFloat(e.target.value) || 0)} />
                    </div>
                </div>
                <div className="form-group">
                    <label>Type</label>
                    <select style={{ width: '100%' }} value={newField.type} onChange={e => {
                        const newType = e.target.value as SignatureFieldType;
                        // Handle type change logic here or in parent? 
                        // Parent logic was:
                        // setNewField(prev => ({
                        //   ...prev,
                        //   type: newType,
                        //   content: newType === 'signature' ? '' : (newType === 'text' ? 'Text Field' : '')
                        // }));
                        // We can delegate this logic to onChange or handle passing both.
                        // Simplified: just call onChange for type, and let parent handle content reset if needed? 
                        // Or easier: duplicate the logic here to call onChange multiple times? No state updates are async.
                        // Better to handle complex updates in parent. 
                        // BUT for now, I'll assume onChange handles simple key-value. 
                        // I will update interface to allow bulk update or just modify parent handler. 
                        // Actually, I can just call onChange('type', newType) and assume parent handles side effects? 
                        // No, generic onChange typically doesn't. 
                        // I'll manually call onChange for content too.
                        onChange('type', newType);
                        onChange('content', newType === 'signature' ? '' : (newType === 'text' ? 'Text Field' : ''));
                    }}>
                        <option value="text">Text</option>
                        <option value="signature">Signature Widget</option>
                        <option value="image">Image (Upload)</option>
                    </select>
                </div>

                {/* Dynamic Content Inputs */}
                {newField.type === 'text' && (
                    <div className="form-group">
                        <label>Content</label>
                        <textarea rows={3} value={newField.content} style={{ width: '100%' }} onChange={e => onChange('content', e.target.value)} />
                    </div>
                )}

                {newField.type === 'image' && (
                    <div className="form-group">
                        <label>Upload Image</label>
                        <input type="file" accept="image/*" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                const reader = new FileReader();
                                reader.onload = (ev) => onChange('content', ev.target?.result as string);
                                reader.readAsDataURL(e.target.files[0]);
                            }
                        }} />
                        {newField.content && newField.content !== 'Signature Placeholder' && (
                            <div style={{ marginTop: '5px', maxHeight: '50px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                <img src={newField.content} style={{ maxHeight: '50px' }} />
                            </div>
                        )}
                    </div>
                )}

                {newField.type === 'signature' && (
                    <div className="form-group">
                        <label>Signature Configuration</label>
                        {!newField.content || newField.content === 'Signature Placeholder' ? (
                            <button className="btn-secondary" style={{ width: '100%', marginBottom: '5px' }} onClick={onOpenSigModal}>
                                Setup Signature
                            </button>
                        ) : (
                            <div style={{ border: '1px solid #dee2e6', padding: '5px', borderRadius: '4px', background: 'white' }}>
                                <div style={{ fontSize: '11px', marginBottom: '5px', overflow: 'hidden', width: '100%', aspectRatio: '3 / 2', border: '1px dotted #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <iframe srcDoc={newField.content} title="Field Preview" style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}></iframe>
                                </div>
                                <button className="btn-secondary" style={{ width: '100%', fontSize: '11px', padding: '4px' }} onClick={onClearSigContent}>
                                    Reset / Clear
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="flags-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <label><input type="checkbox" checked={newField.draggable} onChange={e => onChange('draggable', e.target.checked)} /> Moveable</label>
                    <label><input type="checkbox" checked={newField.resizable} onChange={e => onChange('resizable', e.target.checked)} /> Resizable</label>
                    <label><input type="checkbox" checked={newField.deletable} onChange={e => onChange('deletable', e.target.checked)} /> Deletable</label>
                </div>

                <button className="btn-primary" onClick={onAdd} style={{ width: '100%' }}>Add Field</button>
            </div>
        </aside>
    );
};
