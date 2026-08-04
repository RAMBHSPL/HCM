import React from 'react';
import { useData } from '../context/DataContext';
import GenericTable from '../components/GenericTable';

const Jobs = () => {
    const renderTableData = React.useCallback((item, { searchTerm, HighlightTerm } = {}) => (
        <td>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
                {HighlightTerm ? <HighlightTerm text={item.name} term={searchTerm} /> : item.name}
                {item.code && (
                    <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem', marginLeft: '6px' }}>
                        ({HighlightTerm ? <HighlightTerm text={item.code} term={searchTerm} /> : item.code})
                    </span>
                )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                {item.job_family_name && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, background: '#f8fafc', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        Family: {item.job_family_name}
                    </div>
                )}
                {item.role_type_name && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, background: '#f8fafc', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        Type: {item.role_type_name}
                    </div>
                )}
                {item.role_name && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'rgba(136, 19, 55, 0.05)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(136, 19, 55, 0.1)' }}>
                        Role: {item.role_name}
                    </div>
                )}
            </div>
            {item.description && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginTop: '8px', lineHeight: '1.4' }}>
                    {item.description}
                </div>
            )}
        </td>
    ), []);

    return <GenericTable renderTableData={renderTableData} />;
};

export default Jobs;
