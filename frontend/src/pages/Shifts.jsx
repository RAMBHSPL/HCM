import React from 'react';
import GenericTable from '../components/GenericTable';

const Shifts = () => {
    const renderTableData = (item) => (
        <td>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{item.name}</div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: 600, background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                    🕒 {item.start_time || '-'} to {item.end_time || '-'}
                </div>
                
                {item.project_name ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'rgba(136, 19, 55, 0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                        📁 Project: {item.project_name}{item.segment_name ? ` - Segment: ${item.segment_name}` : ''}
                    </div>
                ) : (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, background: '#f8fafc', padding: '2px 8px', borderRadius: '6px' }}>
                        🌐 Global Shift
                    </div>
                )}

                {item.assigned_projects && item.assigned_projects.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600, background: '#f0f9ff', padding: '2px 8px', borderRadius: '6px' }}>
                        💼 Active in: {item.assigned_projects.join(', ')}
                    </div>
                )}

                {item.positions_count !== undefined && (
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, background: '#d1fae5', padding: '2px 8px', borderRadius: '6px' }}>
                        👥 Used by: {item.positions_count} position(s)
                    </div>
                )}
            </div>
            
            {item.description && (
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '6px', fontStyle: 'italic' }}>
                    {item.description}
                </div>
            )}
        </td>
    );

    return <GenericTable
        renderTableData={renderTableData}
    />;
};

export default Shifts;
