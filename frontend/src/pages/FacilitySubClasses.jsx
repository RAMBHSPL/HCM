import React from 'react';
import GenericTable from '../components/GenericTable';

const FacilitySubClasses = () => {
    const renderTableData = (item) => (
        <td style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                    {item.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px' }}>
                        Class: {item.facility_class_name || 'N/A'}
                    </span>
                    {item.code && (
                        <span style={{ fontFamily: 'monospace', color: '#64748b' }}>Code: {item.code}</span>
                    )}
                </div>
            </div>
            
            {item.description && (
                <div style={{ 
                    color: '#475569', 
                    fontSize: '0.85rem', 
                    marginTop: '8px', 
                    lineHeight: '1.5', 
                    background: '#f8fafc', 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    borderLeft: '3px solid #cbd5e1' 
                }}>
                    {item.description}
                </div>
            )}
        </td>
    );

    return <GenericTable renderTableData={renderTableData} />;
};

export default FacilitySubClasses;
