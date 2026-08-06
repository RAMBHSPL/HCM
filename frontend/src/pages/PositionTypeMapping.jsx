import React, { useState, useEffect, useMemo } from 'react';
import { 
    Layers, 
    Search, 
    Plus, 
    Trash2, 
    AlertCircle, 
    FolderKanban, 
    Briefcase, 
    Users, 
    CheckCircle2,
    FileSpreadsheet,
    Link2,
    Link2Off
} from 'lucide-react';
import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';
import api from '../api';

const SelectField = ({ label, options, value, onChange, placeholder = "Select...", disabled = false }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '200px' }}>
            {label && (
                <label style={{ 
                    fontSize: '0.75rem', 
                    color: '#94a3b8', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em' 
                }}>
                    {label}
                </label>
            )}
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                style={{
                    background: disabled ? 'rgba(15, 23, 42, 0.3)' : 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: disabled ? '#64748b' : '#f8fafc',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    outline: 'none',
                    transition: 'all 0.3s',
                    width: '100%',
                    boxSizing: 'border-box'
                }}
            >
                <option value="" style={{ background: '#1e293b', color: '#64748b' }}>{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.id} value={opt.id} style={{ background: '#1e293b', color: '#f8fafc' }}>
                        {opt.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

const PositionTypeMapping = () => {
    const { 
        projects, 
        roles, 
        jobs, 
        positionTypes, 
        setPositionTypes, 
        showNotification 
    } = useData();

    // Selected state
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedSegment, setSelectedSegment] = useState('');
    
    // Form state
    const [formPositionType, setFormPositionType] = useState('');
    const [formRole, setFormRole] = useState('');
    const [formJob, setFormJob] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Active project object
    const activeProject = useMemo(() => {
        return projects?.find(p => String(p.id) === String(selectedProject));
    }, [projects, selectedProject]);

    // Active segments for selected project
    const segments = useMemo(() => {
        return activeProject?.segments || [];
    }, [activeProject]);

    // Reset fields when project or segment changes
    useEffect(() => {
        setFormPositionType('');
        setFormRole('');
        setFormJob('');
    }, [selectedProject, selectedSegment]);

    // Reset job if role changes
    useEffect(() => {
        setFormJob('');
    }, [formRole]);

    // Filtered Position Types for the creation dropdown
    const availablePositionTypes = useMemo(() => {
        if (!selectedProject) return [];
        return positionTypes.filter(pt => {
            const ptProjId = pt.project_id || (pt.project && typeof pt.project === 'object' ? pt.project.id : pt.project);
            if (String(ptProjId) !== String(selectedProject)) return false;

            if (selectedSegment) {
                const ptSegId = pt.segment_id || (pt.segment && typeof pt.segment === 'object' ? pt.segment.id : pt.segment);
                if (String(ptSegId) !== String(selectedSegment)) return false;
            }

            // Exclude already fully mapped position types from creation list
            return !(pt.role && pt.job);
        });
    }, [positionTypes, selectedProject, selectedSegment]);

    // Filtered Roles (by project and segment)
    const availableRoles = useMemo(() => {
        if (!selectedProject) return [];
        return roles.filter(r => {
            const rProjId = r.project_id || (r.project && typeof r.project === 'object' ? r.project.id : r.project);
            if (!rProjId) return true; // Global roles should be available in all projects!
            if (String(rProjId) !== String(selectedProject)) return false;

            if (selectedSegment) {
                const rSegId = r.segment_id || (r.segment && typeof r.segment === 'object' ? r.segment.id : r.segment);
                if (!rSegId) return true; // Global segment roles apply to all segments
                return String(rSegId) === String(selectedSegment);
            }
            return true;
        });
    }, [roles, selectedProject, selectedSegment]);

    // Filtered Jobs (by selected Role)
    const availableJobs = useMemo(() => {
        if (!formRole) return [];
        return jobs.filter(j => {
            const jRoleId = j.role_id || (j.role && typeof j.role === 'object' ? j.role.id : j.role);
            return String(jRoleId) === String(formRole);
        });
    }, [jobs, formRole]);

    // Existing mapped position types list for audit table
    const mappedPositionTypes = useMemo(() => {
        if (!selectedProject) return [];
        return positionTypes.filter(pt => {
            const ptProjId = pt.project_id || (pt.project && typeof pt.project === 'object' ? pt.project.id : pt.project);
            if (String(ptProjId) !== String(selectedProject)) return false;

            if (selectedSegment) {
                const ptSegId = pt.segment_id || (pt.segment && typeof pt.segment === 'object' ? pt.segment.id : pt.segment);
                if (String(ptSegId) !== String(selectedSegment)) return false;
            }

            return (pt.role || pt.job);
        });
    }, [positionTypes, selectedProject, selectedSegment]);

    // Handle creation of a new mapping association
    const handleCreateMapping = async (e) => {
        e.preventDefault();
        if (!formPositionType || !formRole) {
            showNotification('Please select Position Type and Role Group.', 'warning');
            return;
        }

        try {
            setIsSubmitting(true);
            const ptId = formPositionType;
            const roleId = parseInt(formRole);
            const jobId = formJob ? parseInt(formJob) : null;

            await api.patch(`position-types/${ptId}/`, {
                role: roleId,
                job: jobId
            });

            // Find role and job names for display and updating context
            const selectedRoleObj = roles.find(r => String(r.id) === String(roleId));
            const selectedJobObj = jobs.find(j => String(j.id) === String(jobId));

            // Update DataContext positionTypes globally so it propagates instantly
            const updatedPTs = positionTypes.map(pt => {
                if (String(pt.id) === String(ptId)) {
                    return {
                        ...pt,
                        role: roleId,
                        role_name: selectedRoleObj ? selectedRoleObj.name : '',
                        job: jobId,
                        job_name: selectedJobObj ? selectedJobObj.name : ''
                    };
                }
                return pt;
            });
            setPositionTypes(updatedPTs);

            showNotification('Mapping created successfully!', 'success');

            // Reset form selections
            setFormPositionType('');
            setFormRole('');
            setFormJob('');
        } catch (err) {
            console.error('Error creating position type mapping:', err);
            showNotification('Failed to create mapping.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle deletion of an existing mapping association
    const handleDeleteMapping = async (ptId) => {
        try {
            setDeletingId(ptId);
            await api.patch(`position-types/${ptId}/`, {
                role: null,
                job: null
            });

            // Update DataContext positionTypes globally so it propagates instantly
            const updatedPTs = positionTypes.map(pt => {
                if (String(pt.id) === String(ptId)) {
                    return {
                        ...pt,
                        role: null,
                        role_name: '',
                        job: null,
                        job_name: ''
                    };
                }
                return pt;
            });
            setPositionTypes(updatedPTs);

            showNotification('Mapping removed successfully', 'success');
        } catch (err) {
            console.error('Error removing position type mapping:', err);
            showNotification('Failed to remove mapping', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="tagging-wrapper">
            <style>{`
                .tagging-wrapper {
                    padding: 2rem;
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                    min-height: calc(100vh - 80px);
                    color: #f8fafc;
                    font-family: 'Outfit', sans-serif;
                }
                .tagging-header {
                    margin-bottom: 2rem;
                }
                .tagging-header h1 {
                    font-size: 2.25rem;
                    font-weight: 800;
                    margin: 0;
                    background: linear-gradient(to right, #38bdf8, #a78bfa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .tagging-header p {
                    color: #94a3b8;
                    margin: 0.5rem 0 0 0;
                    font-size: 1rem;
                }
                .filter-panel {
                    background: rgba(30, 41, 59, 0.45);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                    align-items: flex-end;
                    margin-bottom: 2rem;
                }
                .filter-item {
                    flex: 1;
                    min-width: 240px;
                }
                .mapping-workspace-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }
                .workspace-card {
                    background: rgba(30, 41, 59, 0.45);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 1.75rem;
                }
                .card-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-top: 0;
                    margin-bottom: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #fff;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    padding-bottom: 0.75rem;
                }
                .form-flex {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.25rem;
                    align-items: flex-end;
                }
                .submit-btn {
                    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
                    color: #ffffff;
                    border: none;
                    padding: 0.7rem 1.5rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s;
                    height: 42px;
                    box-sizing: border-box;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .submit-btn:hover {
                    opacity: 0.95;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
                }
                .submit-btn:disabled {
                    background: #475569;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
                .mapping-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .mapping-table th {
                    text-align: left;
                    color: #94a3b8;
                    font-weight: 600;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
                .mapping-table td {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                    vertical-align: middle;
                }
                .mapping-row:hover {
                    background: rgba(255, 255, 255, 0.02);
                }
                .pt-name-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .pt-name {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: #f1f5f9;
                }
                .badge {
                    font-size: 0.7rem;
                    background: rgba(167, 139, 250, 0.15);
                    color: #a78bfa;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 600;
                    display: inline-block;
                }
                .badge-job {
                    background: rgba(56, 189, 248, 0.15);
                    color: #38bdf8;
                }
                .delete-btn {
                    background: rgba(244, 63, 94, 0.1);
                    color: #f43f5e;
                    border: 1px solid rgba(244, 63, 94, 0.2);
                    padding: 0.45rem;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .delete-btn:hover {
                    background: #f43f5e;
                    color: #fff;
                    border-color: #f43f5e;
                }
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem 2rem;
                    color: #64748b;
                    text-align: center;
                    gap: 1rem;
                }
            `}</style>

            <div className="tagging-header">
                <h1><Layers size={28} /> Position & Role Types Mappings</h1>
                <p>Link your Project-specific Position Types directly to functional Roles and Jobs to enable automated data hydration.</p>
            </div>

            <div className="filter-panel">
                <div className="filter-item">
                    <SelectField 
                        label="Project Selection"
                        options={projects?.map(p => ({ id: p.id, name: p.name })) || []}
                        value={selectedProject}
                        onChange={setSelectedProject}
                        placeholder="Choose Project..."
                    />
                </div>

                {segments.length > 0 && (
                    <div className="filter-item">
                        <SelectField 
                            label="Segment Filter"
                            options={segments.map(s => ({ id: s.id, name: s.name }))}
                            value={selectedSegment}
                            onChange={setSelectedSegment}
                            placeholder="All Segments"
                        />
                    </div>
                )}
            </div>

            {!selectedProject ? (
                <div className="workspace-card">
                    <div className="empty-state">
                        <FolderKanban size={48} style={{ opacity: 0.3, color: '#38bdf8' }} />
                        <h3 style={{ margin: 0, color: '#e2e8f0' }}>No Project Selected</h3>
                        <p style={{ margin: 0, maxWidth: '400px' }}>Please select a Project from the dropdown above to view and map its Position Types.</p>
                    </div>
                </div>
            ) : (
                <div className="mapping-workspace-grid">
                    
                    {/* Creation Form */}
                    <div className="workspace-card">
                        <h3 className="card-title">
                            <Link2 size={18} color="#06b6d4" />
                            <span>Create New Tagging Association</span>
                        </h3>
                        <form onSubmit={handleCreateMapping} className="form-flex">
                            <SelectField 
                                label="Position Type"
                                options={availablePositionTypes.map(pt => ({ id: pt.id, name: pt.name }))}
                                value={formPositionType}
                                onChange={setFormPositionType}
                                placeholder={availablePositionTypes.length === 0 ? "No Untagged Position Types" : "Select Position Type..."}
                                disabled={availablePositionTypes.length === 0}
                            />

                            <SelectField 
                                label="Role Group"
                                options={availableRoles.map(r => ({ id: r.id, name: r.name }))}
                                value={formRole}
                                onChange={setFormRole}
                                placeholder="Select Role..."
                            />

                            <SelectField 
                                label="Associated Job"
                                options={availableJobs.map(j => ({ id: j.id, name: j.name }))}
                                value={formJob}
                                onChange={setFormJob}
                                placeholder={!formRole ? "Select Role First" : availableJobs.length === 0 ? "No Jobs Linked to Role" : "Select Job..."}
                                disabled={!formRole || availableJobs.length === 0}
                            />

                            {isSubmitting ? (
                                <div style={{ minWidth: '100px', display: 'flex', justifyContent: 'center', paddingBottom: '0.5rem' }}>
                                    <BavyaSpinner size="24px" />
                                </div>
                            ) : (
                                <button 
                                    type="submit" 
                                    className="submit-btn"
                                    disabled={!formPositionType || !formRole}
                                >
                                    <Plus size={16} />
                                    <span>Map Association</span>
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Audit / List Table */}
                    <div className="workspace-card" style={{ padding: 0 }}>
                        <div style={{ padding: '1.75rem 1.75rem 0 1.75rem' }}>
                            <h3 className="card-title" style={{ borderBottom: 'none', marginBottom: 0 }}>
                                <CheckCircle2 size={18} color="#10b981" />
                                <span>Active Tagging Associations ({mappedPositionTypes.length})</span>
                            </h3>
                        </div>

                        {mappedPositionTypes.length === 0 ? (
                            <div className="empty-state" style={{ padding: '3rem 2rem' }}>
                                <Link2Off size={36} style={{ opacity: 0.2 }} />
                                <p style={{ margin: 0 }}>No active role or job mappings found for the current project filters.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="mapping-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '30%' }}>Position Type</th>
                                            <th style={{ width: '30%' }}>Role Group Tag</th>
                                            <th style={{ width: '30%' }}>Associated Job Tag</th>
                                            <th style={{ width: '10%', textAlign: 'center' }}>Remove Link</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mappedPositionTypes.map(pt => {
                                            const isDeleting = deletingId === pt.id;
                                            return (
                                                <tr key={pt.id} className="mapping-row">
                                                    <td>
                                                        <div className="pt-name-cell">
                                                            <span className="pt-name">{pt.name}</span>
                                                            {pt.segment_name && (
                                                                <span style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start', fontWeight: 600 }}>
                                                                    {pt.segment_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {pt.role_name ? (
                                                            <span className="badge">{pt.role_name}</span>
                                                        ) : (
                                                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>None</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {pt.job_name ? (
                                                            <span className="badge badge-job">{pt.job_name}</span>
                                                        ) : (
                                                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>None</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {isDeleting ? (
                                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                <BavyaSpinner size="18px" />
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                className="delete-btn"
                                                                onClick={() => handleDeleteMapping(pt.id)}
                                                                title="Delete Mapping"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
};

export default PositionTypeMapping;
