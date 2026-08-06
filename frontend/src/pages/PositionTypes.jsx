import React from 'react';
import GenericTable from '../components/GenericTable';

const PositionTypes = () => {
    const renderTableData = (item) => (
        <td>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{item.name}</div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                {item.project_name ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'rgba(136, 19, 55, 0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                        📁 Project: {item.project_name}{item.segment_name ? ` - Segment: ${item.segment_name}` : ''}
                    </div>
                ) : (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, background: '#f8fafc', padding: '2px 8px', borderRadius: '6px' }}>
                        🌐 Global Type
                    </div>
                )}

                {item.shifts_details && item.shifts_details.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600, background: '#f0f9ff', padding: '2px 8px', borderRadius: '6px' }}>
                        🕒 Shifts: {item.shifts_details.map(s => s.name).join(', ')}
                    </div>
                )}

                {item.role_name && (
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, background: '#f0fdf4', padding: '2px 8px', borderRadius: '6px' }}>
                        👤 Role: {item.role_name}
                    </div>
                )}

                {item.job_name && (
                    <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, background: '#f5f3ff', padding: '2px 8px', borderRadius: '6px' }}>
                        💼 Job: {item.job_name}
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

export default PositionTypes;
