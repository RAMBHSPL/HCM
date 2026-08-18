import React from 'react';
import { Plus, Settings, X, Map, Clock, Navigation, LayoutGrid } from 'lucide-react';
import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';

const FacilityMasters = () => {
    const {
        data,
        loading,
        handleEdit,
        handleDelete,
        handleAdd,
        canCreate,
        canEdit,
        canDelete
    } = useData();

    if (loading) {
        return (
            <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BavyaSpinner label="Syncing Facility Templates..." />
            </div>
        );
    }

    return (
        <div className="fade-in">
            <header className="section-header">
                <div>
                    <h1 className="section-title">Facility Master Registry</h1>
                    <p className="section-subtitle">Manage structural templates and project associations for facilities</p>
                </div>
                {canCreate('facility-masters') && (
                    <button className="btn-primary" onClick={() => handleAdd('Facility Master')}>
                        <Plus size={18} /> Add New Template
                    </button>
                )}
            </header>

            <div className="glass section-card" style={{ padding: '0' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: '2.5rem' }}>Facility Master Details</th>
                            <th>Configuration</th>
                            <th>Status</th>
                            <th>Registry Date</th>
                            <th style={{ textAlign: 'right', paddingRight: '2.5rem' }}>Control</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...data].sort((a, b) => a.name.localeCompare(b.name)).map((item, index) => (
                            <tr key={item.id || index} className="fade-in">
                                <td style={{ paddingLeft: '2.5rem' }}>
                                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <span style={{ fontWeight: 700, background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '6px' }}>{item.project_name}</span>
                                        <span style={{ fontWeight: 600, color: '#94a3b8' }}>Codes: {item.location_code}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 700 }}>
                                            <LayoutGrid size={12} /> {item.project_type_display}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 600 }}>
                                            <Clock size={12} /> {item.life_display}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                            <Navigation size={12} /> {item.deployment_mode_name || item.mode_display || item.mode || 'N/A'}
                                        </div>
                                        {(item.facility_class_name || item.facility_sub_class_name) && (
                                            <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#4338ca', fontWeight: 600 }}>
                                                <Layers size={12} /> {item.facility_class_name || 'Class N/A'} {item.facility_sub_class_name ? `→ ${item.facility_sub_class_name}` : ''}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${item.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                                        {item.status || 'Active'}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ textAlign: 'right', paddingRight: '2.5rem' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        {canEdit('facility-masters') && (
                                            <button className="nav-link" style={{ padding: '8px', minWidth: 'auto' }} onClick={() => handleEdit('Facility Master', item)}>
                                                <Settings size={16} />
                                            </button>
                                        )}
                                        {canDelete('facility-masters') && (
                                            <button className="nav-link" style={{ padding: '8px', minWidth: 'auto', color: '#ef4444' }} onClick={() => handleDelete('Facility Master', item.id)}>
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                                    <Map size={48} style={{ opacity: 0.1, margin: '0 auto 1rem' }} />
                                    No facility templates found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FacilityMasters;
