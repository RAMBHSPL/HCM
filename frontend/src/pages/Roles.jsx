import React from 'react';
import { useData } from '../context/DataContext';
import GenericTable from '../components/GenericTable';
import BavyaSpinner from '../components/BavyaSpinner';

const Roles = () => {
    const { loading } = useData();



    const renderTableData = React.useCallback((item) => (
        <td>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{item.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, background: '#f8fafc', padding: '2px 8px', borderRadius: '6px' }}>
                    Type: {item.role_type_name}
                </div>
                {item.project_name && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'rgba(136, 19, 55, 0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                        📁 Project: {item.project_name}{item.segment_name ? ` - Segment: ${item.segment_name}` : ''}
                    </div>
                )}
            </div>
        </td>
    ), []);

    return <GenericTable renderTableData={renderTableData} />;
};

export default Roles;
