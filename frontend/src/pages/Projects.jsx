import React from 'react';
import { useData } from '../context/DataContext';
import GenericTable from '../components/GenericTable';
import { Building2, X, Search } from 'lucide-react';

const Projects = () => {
    const { projects } = useData();
    const [openUnitsProjectId, setOpenUnitsProjectId] = React.useState(null);
    const [unitsSearchTerm, setUnitsSearchTerm] = React.useState('');

    // Find the project data for the modal
    const openProject = React.useMemo(() =>
        projects?.find(p => p.id === openUnitsProjectId),
        [projects, openUnitsProjectId]);

    // Filter units based on search term
    const filteredUnits = React.useMemo(() => {
        if (!openProject?.assigned_offices_details) return [];
        if (!unitsSearchTerm.trim()) return openProject.assigned_offices_details;

        const term = unitsSearchTerm.toLowerCase().trim();
        return openProject.assigned_offices_details.filter(u =>
            u.name?.toLowerCase().includes(term) ||
            u.code?.toLowerCase().includes(term)
        );
    }, [openProject, unitsSearchTerm]);

    const renderTableData = React.useCallback((item, { searchTerm, HighlightTerm }) => (
        <>
            <td style={{ paddingLeft: '2.5rem' }}>
                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>
                    <HighlightTerm text={item.name} term={searchTerm} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontWeight: 700, background: '#f8fafc', padding: '2px 8px', borderRadius: '6px' }}>
                        <HighlightTerm text={item.code} term={searchTerm} />
                    </span>
                    <span style={{ fontWeight: 600 }}>
                        <HighlightTerm text={item.assigned_level_name || 'Global'} term={searchTerm} />
                    </span>
                    <span style={{ fontWeight: 600, background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '6px' }}>{item.project_type_display}</span>
                    {item.has_segments && item.segments && item.segments.length > 0 && (
                        <span style={{ fontWeight: 600, background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: '6px' }}>
                            Segments: {item.segments.map(s => s.name).join(', ')}
                        </span>
                    )}
                    {item.assigned_offices_details?.length > 0 && (
                        <div
                            className={`project-units-container ${openUnitsProjectId === item.id ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setUnitsSearchTerm(''); // Reset search when opening new
                                setOpenUnitsProjectId(item.id);
                            }}
                        >
                            • {item.assigned_offices_details.length} Units
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
                <div>{new Date(item.created_at).toLocaleDateString()}</div>
                {item.end_date && (() => {
                    const now = new Date();
                    const end = new Date(item.end_date);
                    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

                    if (diffDays < 0) {
                        return <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>⚠️ Expired</div>;
                    } else if (diffDays <= 10) {
                        return <div style={{ fontSize: '0.65rem', color: '#f97316', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>⏳ Ends in {diffDays} days</div>;
                    }
                    return null;
                })()}
            </td>
        </>
    ), [openUnitsProjectId]);

    // Close modal when clicking anywhere else
    React.useEffect(() => {
        const handleClose = () => setOpenUnitsProjectId(null);
        window.addEventListener('click', handleClose);
        return () => window.removeEventListener('click', handleClose);
    }, []);

    return (
        <>
            <GenericTable renderTableData={renderTableData} />

            {/* Centered Modal for Unit List */}
            {openProject && (
                <>
                    <div className="project-units-backdrop" onClick={() => setOpenUnitsProjectId(null)} />
                    <div className="project-units-tooltip">
                        <div className="tooltip-header">
                            <div>
                                <h3>
                                    <Building2 size={24} /> {openProject.name} Units
                                </h3>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                                        {filteredUnits.length} Found
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                                        • {openProject.assigned_offices_details.length} Total
                                    </span>
                                </div>
                            </div>
                            <button className="close-popover-btn" onClick={() => setOpenUnitsProjectId(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search Bar inside Modal */}
                        <div className="popover-search-container">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={unitsSearchTerm}
                                onChange={(e) => setUnitsSearchTerm(e.target.value)}
                                className="popover-search-input"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                            {unitsSearchTerm && (
                                <button className="clear-search" onClick={() => setUnitsSearchTerm('')}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="tooltip-content">
                            {filteredUnits.length > 0 ? (
                                filteredUnits.map(f => (
                                    <div key={f.id} className="tooltip-item">
                                        <span>{f.name}</span>
                                        <span className="unit-code">{f.code}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                                    <div style={{ fontWeight: 700 }}>No units match your search</div>
                                    <div style={{ fontSize: '0.8rem' }}>Try searching with a different keyword</div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Projects;
