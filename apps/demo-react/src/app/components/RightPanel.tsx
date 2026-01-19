import React from 'react';
import { SignatureField } from '@shznet/pdf-sign-control';

interface RightPanelProps {
    fields: SignatureField[];
    onRemoveField: (id: string) => void;
    onUpdateField: (id: string, key: 'draggable' | 'resizable', value: boolean) => void;
    onClearAll: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ fields, onRemoveField, onUpdateField, onClearAll }) => {
    return (
        <aside className="right-panel">
            <div className="panel-section" style={{ padding: '20px', borderBottom: '1px solid #e9ecef' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div className="panel-title" style={{ margin: 0 }}>Fields</div>
                    {fields.length > 0 && (
                        <button onClick={onClearAll} style={{ fontSize: '11px', padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Clear All
                        </button>
                    )}
                </div>
                <div className="field-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {fields.length === 0 ? (
                        <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic', padding: '10px' }}>No fields yet</div>
                    ) : (
                        fields.map((field, index) => (
                            <div key={field.id} className="field-item" style={{ padding: '10px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '12px', marginBottom: '5px', background: 'white' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{index + 1}. {field.type.toUpperCase()} (P{field.pageNumber})</span>
                                    <button style={{ padding: '2px 5px', fontSize: '10px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '3px' }}
                                        onClick={() => onRemoveField(field.id)}>X</button>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
                                    <label>
                                        <input type="checkbox" checked={field.draggable !== false}
                                            onChange={(e) => onUpdateField(field.id, 'draggable', e.target.checked)}
                                        /> Drag
                                    </label>
                                    <label>
                                        <input type="checkbox" checked={field.resizable !== false}
                                            onChange={(e) => onUpdateField(field.id, 'resizable', e.target.checked)}
                                        /> Resize
                                    </label>
                                </div>

                                {/* Field Details */}
                                <div style={{ marginTop: '5px', color: '#666', fontSize: '10px' }}>
                                    <div>x: {Math.round(field.rect.x)}, y: {Math.round(field.rect.y)}</div>
                                    <div>w: {Math.round(field.rect.width)}, h: {Math.round(field.rect.height)}</div>
                                </div>

                                {/* Live Preview */}
                                {(field.type === 'signature' || field.type === 'html') && field.content && (
                                    <div style={{ marginTop: '5px', border: '1px solid #eee', width: '100%', aspectRatio: '3 / 2', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <iframe srcDoc={field.content} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none', transform: 'scale(0.8)', transformOrigin: 'center' }} title="Preview"></iframe>
                                    </div>
                                )}
                                {field.type === 'image' && field.content && (
                                    <div style={{ marginTop: '5px', maxHeight: '60px', overflow: 'hidden', border: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
                                        <img src={field.content} style={{ maxHeight: '100%', maxWidth: '100%' }} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
};
