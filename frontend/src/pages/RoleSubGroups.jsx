import React from 'react';
import { useData } from '../context/DataContext';
import GenericTable from '../components/GenericTable';

const RoleSubGroups = () => {
    const renderTableData = React.useCallback((item) => (
        <td>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
                {item.name} {item.code && <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem' }}>({item.code})</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, background: '#f8fafc', padding: '2px 8px', borderRadius: '6px' }}>
                    Role Group: {item.role_group_name || 'N/A'}
                </div>
                {item.description && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                        {item.description}
                    </div>
                )}
            </div>
        </td>
    ), []);

    return <GenericTable renderTableData={renderTableData} />;
};

export default RoleSubGroups;
