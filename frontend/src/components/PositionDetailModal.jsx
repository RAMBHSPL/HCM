import React, { useState } from 'react';
import {
    X,
    MapPin,
    Briefcase,
    Users,
    Settings,
    Sparkles,
    ShieldAlert,
    Network,
    Layers,
    LayoutGrid,
    ClipboardList,
    Building2,
    Calendar,
    ArrowRight,
    Search,
    UserCircle,
    CheckCircle2,
    Clock,
    FolderKanban
} from 'lucide-react';
import BavyaSpinner from './BavyaSpinner';
import { useData } from '../context/DataContext';

const PositionDetailModal = () => {
    const {
        selectedPosition,
        setShowPositionDetail,
        setSelectedPosition,
        handleEdit,
        canEdit
    } = useData();

    const [activeTab, setActiveTab] = useState('Overview');

    const tabs = ['Overview', 'Job & Role', 'Organization Path', 'Tasks & Permissions'];

    const renderHeader = () => (
        <div className="modal-header" style={{
            background: 'linear-gradient(135deg, #be185d 0%, #881337 100%)',
            padding: '2.5rem 2rem 1rem 2rem',
            color: 'white',
            position: 'relative',
            borderBottom: '4px solid rgba(0,0,0,0.1)',
            flexDirection: 'column',
            alignItems: 'flex-start'
        }}>
            <button
                type="button"
                className="btn-close"
                onClick={() => { setShowPositionDetail(false); setSelectedPosition(null); }}
                style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 20
                }}
            >
                <X size={14} /> CLOSE
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{
                    padding: '20px',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '24px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                    <Briefcase size={48} />
                </div>
                <div>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        opacity: 0.9,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: '#fce7f3'
                    }}>
                        POSITION IDENTIFIER: {selectedPosition.id}
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '4px 0', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {selectedPosition.name}
                    </h2>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            padding: '6px 16px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <Building2 size={14} /> {selectedPosition.office_name}
                        </span>
                        <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            padding: '6px 16px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <Layers size={14} /> {selectedPosition.office_level}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '30px', marginTop: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {tabs.map(tab => (
                    <div
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            paddingBottom: '12px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            position: 'relative',
                            transition: 'all 0.3s',
                            opacity: activeTab === tab ? 1 : 0.6,
                            color: 'white'
                        }}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: '3px',
                                background: '#fce7f3',
                                borderRadius: '3px'
                            }} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderOverview = () => (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <div className="detail-two-column-grid" style={{ gap: '3rem' }}>
                <div>
                    <h4 style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={14} /> Primary Assignment
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <DetailItem icon={<Settings />} label="ROLE SPECIFICATION" value={selectedPosition.role_name} subValue={`Code: ${selectedPosition.role_code || 'N/A'}`} />
                        <DetailItem icon={<MapPin />} label="FUNCTIONAL UNIT" value={selectedPosition.department_name} subValue={selectedPosition.section_name ? `Section: ${selectedPosition.section_name}` : 'General Department Assignment'} />
                        {selectedPosition.level_name && (
                            <DetailItem
                                icon={<LayoutGrid />}
                                label="POSITION SENIORITY LEVEL"
                                value={selectedPosition.level_name}
                                subValue={`Rank / Priority: ${selectedPosition.level_rank || 'Standard'}`}
                            />
                        )}
                        {selectedPosition.project_name && (
                            <DetailItem
                                icon={<FolderKanban />}
                                label="PROJECT ASSIGNMENT"
                                value={selectedPosition.project_name}
                                style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1rem' }}
                            />
                        )}
                    </div>
                </div>

                <div>
                    <h4 style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Network size={14} /> Hierarchy & Reporting
                    </h4>
                    <div style={{
                        padding: '2rem',
                        background: '#f8fafc',
                        borderRadius: '24px',
                        border: '1px solid #e2e8f0',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ borderLeft: '3px solid #be185d', paddingLeft: '1.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>REPORTS TO</div>
                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem', marginTop: '6px' }}>
                                {selectedPosition.reporting_to_names?.length
                                    ? selectedPosition.reporting_to_names.join(', ')
                                    : 'Organization Head'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                                {selectedPosition.reporting_to_names?.length ? 'Active Matrix Reporting' : 'Top Level Authority'}
                            </div>
                        </div>

                        <div style={{
                            marginTop: '2rem',
                            padding: '1.25rem',
                            background: selectedPosition.assigned_employee ? '#ecfdf5' : '#fff7ed',
                            borderRadius: '16px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            border: `1px solid ${selectedPosition.assigned_employee ? '#a7f3d0' : '#fed7aa'}`
                        }}>
                            {selectedPosition.assigned_employee ? (
                                <div style={{ background: '#10b981', color: 'white', padding: '10px', borderRadius: '12px' }}>
                                    <UserCircle size={24} />
                                </div>
                            ) : (
                                <div style={{ background: '#f97316', color: 'white', padding: '10px', borderRadius: '12px' }}>
                                    <ShieldAlert size={24} />
                                </div>
                            )}
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>
                                    {selectedPosition.assigned_employee ? 'CURRENT INCUMBENT' : 'OCCUPANCY STATUS'}
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedPosition.assigned_employee ? '#065f46' : '#9a3412' }}>
                                    {selectedPosition.assigned_employee?.name || 'Position is Vacant'}
                                </div>
                                {selectedPosition.assigned_employee && (
                                    <div style={{ fontSize: '0.75rem', color: '#059669' }}>
                                        Joined: {new Date(selectedPosition.assigned_employee.hire_date).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mapped Shifts Section */}
            <div style={{ background: '#fafafa', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ color: '#be185d', fontSize: '0.9rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={18} /> Mapped Operational Shifts
                </h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {selectedPosition.shifts_details && selectedPosition.shifts_details.length > 0 ? (
                        selectedPosition.shifts_details.map(shift => (
                            <div key={shift.id} style={{
                                padding: '12px 18px',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <Clock size={16} color="#be185d" />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{shift.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{shift.start_time?.substring(0, 5)} - {shift.end_time?.substring(0, 5)}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', width: '100%', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                            No operational shifts mapped to this position.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderJobRole = () => (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ background: '#fafafa', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ color: '#be185d', fontSize: '0.9rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ClipboardList size={18} /> Role Specification Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>ROLE CATEGORY</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{selectedPosition.role_details?.name || selectedPosition.role_name}</div>
                        <div style={{ marginTop: '1rem', padding: '8px 12px', background: '#fce7f3', color: '#be185d', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block' }}>
                            Code: {selectedPosition.role_details?.code || 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>DESCRIPTION</div>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, margin: '8px 0' }}>
                            {selectedPosition.role_details?.description || 'No detailed description provided for this role in the central registry.'}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ background: '#fdf2f8', padding: '2.5rem', borderRadius: '24px', border: '1px solid #fce7f3' }}>
                <h4 style={{ color: '#be185d', fontSize: '0.9rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Briefcase size={18} /> Assigned Job Profile
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>LOCKED JOB PROFILE</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{selectedPosition.job_details?.name || selectedPosition.job_name}</div>
                        <div style={{ marginTop: '1rem', padding: '8px 12px', background: 'white', border: '1px solid #fce7f3', color: '#be185d', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block' }}>
                            Job Code: {selectedPosition.job_details?.code || 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>JOB SCOPE</div>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, margin: '8px 0' }}>
                            {selectedPosition.job_details?.description || 'This position follows the standard responsibilities mapped to the assigned job profile.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderOrgPath = () => (
        <div className="fade-in">
            <h4 style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem' }}>
                Structural Context & Breadcrumbs
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <PathItem icon={<Building2 />} label="Establishment / Office" value={selectedPosition.office_name} sub={selectedPosition.office_hierarchy} color="#3b82f6" />
                <ArrowDown />
                <PathItem icon={<Layers />} label="Functional Department" value={selectedPosition.department_name} sub={`Dept Code: ${selectedPosition.department_code || 'N/A'}`} color="#8b5cf6" />
                {selectedPosition.section_name && (
                    <>
                        <ArrowDown />
                        <PathItem icon={<Network />} label="Operational Section" value={selectedPosition.section_name} sub="Specialized unit within the department" color="#ec4899" />
                    </>
                )}
            </div>

            <div style={{ marginTop: '3rem', padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <MapPin color="#64748b" />
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>PHYSICAL/GEOGRAPHIC JURISDICTION</div>
                        <div style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600, marginTop: '4px' }}>
                            {selectedPosition.office_district}, {selectedPosition.office_state}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                            Mandal: {selectedPosition.office_mandal || 'N/A Landmark'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTasks = () => (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h4 style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                        Job Tasks & Security Matrix
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                        These tasks define the incumbent's daily operational scope.
                    </p>
                </div>
                <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                    {selectedPosition.tasks?.length || 0} ACTIVE TASKS
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedPosition.tasks?.length ? (
                    selectedPosition.tasks.map(task => (
                        <div key={task.id} style={{
                            padding: '1.25rem',
                            background: 'white',
                            borderRadius: '16px',
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: task.priority === 'HIGH' ? '#fff1f2' : task.priority === 'MEDIUM' ? '#f0f9ff' : '#f0fdf4',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: task.priority === 'HIGH' ? '#e11d48' : task.priority === 'MEDIUM' ? '#0284c7' : '#16a34a'
                                }}>
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{task.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Code: {task.code} | Priority: <strong>{task.priority || 'NORMAL'}</strong></div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {task.urls?.map((url, i) => (
                                    <div key={i} style={{ padding: '4px 8px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.65rem', border: '1px solid #e2e8f0', color: '#64748b' }}>
                                        {url.url_pattern}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ padding: '4rem', textAlign: 'center', background: '#fafafa', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                        <ShieldAlert size={40} color="#94a3b8" />
                        <div style={{ marginTop: '1rem', fontWeight: 700, color: '#64748b' }}>No Tasks Defined</div>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>This position might rely on generic system permissions.</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="modal-overlay active" style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) {
                setShowPositionDetail(false);
                setSelectedPosition(null);
            }
        }}>
            <div className="modal-content fade-in" style={{ 
                padding: 0, 
                overflow: 'hidden', 
                background: '#fff', 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative' 
            }}>
                {!selectedPosition ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', position: 'relative' }}>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => { setShowPositionDetail(false); setSelectedPosition(null); }}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}
                        >
                            <X size={14} /> CLOSE
                        </button>
                        <BavyaSpinner label="Retrieving Position Details..." />
                    </div>
                ) : (
                    <>
                        {renderHeader()}
                        <div className="modal-form-container" style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
                            {activeTab === 'Overview' && renderOverview()}
                            {activeTab === 'Job & Role' && renderJobRole()}
                            {activeTab === 'Organization Path' && renderOrgPath()}
                            {activeTab === 'Tasks & Permissions' && renderTasks()}
                        </div>
                        <div style={{ padding: '1.5rem 3rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                    <Clock size={14} /> Registered: {new Date(selectedPosition.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {canEdit('positions') && (
                                    <button
                                        className="btn-primary"
                                        onClick={() => {
                                            const pos = selectedPosition;
                                            setShowPositionDetail(false);
                                            setSelectedPosition(null);
                                            handleEdit('Positions', pos);
                                        }}
                                        style={{ padding: '10px 30px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#059669' }}
                                    >
                                        Edit Position
                                    </button>
                                )}
                                <button
                                    className="btn-primary"
                                    onClick={() => { setShowPositionDetail(false); setSelectedPosition(null); }}
                                    style={{ padding: '10px 30px' }}
                                >
                                    Close Registry
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const DetailItem = ({ icon, label, value, subValue }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
        <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem', marginTop: '2px' }}>{value}</div>
            {subValue && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>{subValue}</div>}
        </div>
    </div>
);

const PathItem = ({ icon, label, value, sub, color }) => (
    <div style={{
        padding: '1.5rem',
        background: 'white',
        border: '1px solid #f1f5f9',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.02)'
    }}>
        <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: `${color}15`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {React.cloneElement(icon, { size: 22 })}
        </div>
        <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{sub}</div>
        </div>
    </div>
);

const ArrowDown = () => (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '-10px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '8px', background: 'white', borderRadius: '50%', border: '1px solid #f1f5f9', color: '#94a3b8' }}>
            <ArrowRight size={14} style={{ transform: 'rotate(90deg)' }} />
        </div>
    </div>
);

export default PositionDetailModal;
