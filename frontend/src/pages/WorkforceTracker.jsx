import React, { useState, useMemo } from 'react';
import {
    Users, Search, FolderKanban, Layers, Settings,
    RotateCcw, Mail, Phone, ArrowUpRight,
    ChevronDown, ChevronUp, TrendingUp, UserCheck, UserX
} from 'lucide-react';
import { useData } from '../context/DataContext';
import SearchableSelect from '../components/SearchableSelect';

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Avatar = ({ emp, size = 44 }) => {
    const colors = ['#881337','#1e40af','#065f46','#7c3aed','#b45309','#0f766e','#be185d','#1d4ed8'];
    const color = colors[(emp.name?.charCodeAt(0) || 0) % colors.length];
    if (emp.photo) {
        return (
            <img src={emp.photo} alt={emp.name}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.8)', flexShrink: 0 }} />
        );
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: size * 0.38,
            border: '2px solid rgba(255,255,255,0.8)', flexShrink: 0, letterSpacing: '-0.5px'
        }}>
            {emp.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
        </div>
    );
};

// ─── Employee Card ────────────────────────────────────────────────────────────
const EmployeeCard = ({ emp, pos, onView }) => {
    const [hovered, setHovered] = useState(false);
    const statusColor = emp.status === 'Active' ? '#10b981' : emp.status === 'Inactive' ? '#f59e0b' : '#ef4444';

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? '#fff' : '#fafbfc',
                border: `1.5px solid ${hovered ? '#881337' : '#e8edf2'}`,
                borderRadius: '16px',
                padding: '1rem 1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '230px',
                flexShrink: 0,
                boxShadow: hovered ? '0 12px 32px rgba(136,19,55,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.22s ease',
                cursor: 'default',
                position: 'relative',
            }}
        >
            {/* Hover Detailed Overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(8px)',
                borderRadius: '15px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: hovered ? 1 : 0,
                pointerEvents: hovered ? 'auto' : 'none',
                transform: hovered ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 10,
                boxShadow: '0 12px 32px rgba(136,19,55,0.15)',
                border: '1.5px solid #881337',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', overflowY: 'auto' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#881337', borderBottom: '1px solid #f1f5f9', paddingBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Complete Details</span>
                        <span style={{ fontSize: '0.62rem', color: '#64748b' }}>{emp.employee_code}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.65rem' }}>
                        {pos?.project_name && (
                            <div>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Project: </span>
                                <span style={{ color: '#0f172a', fontWeight: 500 }}>{pos.project_name}</span>
                            </div>
                        )}
                        {pos?.segment_name && (
                            <div>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Segment: </span>
                                <span style={{ color: '#0f172a', fontWeight: 500 }}>{pos.segment_name}</span>
                            </div>
                        )}
                        {pos?.office_name && (
                            <div>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Office: </span>
                                <span style={{ color: '#0f172a', fontWeight: 500 }}>{pos.office_name}</span>
                            </div>
                        )}
                        {pos?.department_name && (
                            <div>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Dept: </span>
                                <span style={{ color: '#0f172a', fontWeight: 500 }}>{pos.department_name}</span>
                            </div>
                        )}
                        {pos?.section_name && (
                            <div>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Section: </span>
                                <span style={{ color: '#0f172a', fontWeight: 500 }}>{pos.section_name}</span>
                            </div>
                        )}
                        {pos?.position_type_name && (
                            <div>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Type: </span>
                                <span style={{ color: '#0f172a', fontWeight: 500 }}>{pos.position_type_name}</span>
                            </div>
                        )}
                        {pos?.role_name && (
                            <div>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Role: </span>
                                <span style={{ color: '#0f172a', fontWeight: 500 }}>{pos.role_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <button 
                    onClick={() => onView(emp.id)}
                    style={{
                        width: '100%',
                        padding: '6px 0',
                        borderRadius: '8px',
                        background: '#881337',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        transition: 'background 0.2s ease',
                        marginTop: 6
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#9f1239'}
                    onMouseLeave={(e) => e.target.style.background = '#881337'}
                >
                    View Full Profile <ArrowUpRight size={12} />
                </button>
            </div>

            {/* View btn */}
            <button onClick={() => onView(emp.id)} title="View Profile"
                style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 28, height: 28, borderRadius: 8,
                    background: hovered ? '#881337' : '#f1f5f9',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: hovered ? '#fff' : '#94a3b8', transition: 'all 0.2s ease'
                }}>
                <ArrowUpRight size={13} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar emp={emp} size={42} />
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 24 }}>
                        {emp.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 1 }}>{emp.employee_code}</div>
                </div>
            </div>

            {/* Status + Role */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 20,
                    background: `${statusColor}18`, color: statusColor,
                    fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.3px'
                }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                    {emp.status?.toUpperCase()}
                </span>
                {pos?.role_name && (
                    <span style={{
                        padding: '2px 8px', borderRadius: 20,
                        background: 'rgba(136,19,55,0.07)', color: '#881337',
                        fontSize: '0.66rem', fontWeight: 600
                    }}>
                        {pos.role_name}
                    </span>
                )}
                {pos?.role_sub_group_name && (
                    <span style={{
                        padding: '2px 8px', borderRadius: 20,
                        background: 'rgba(30,64,175,0.07)', color: '#1e40af',
                        fontSize: '0.66rem', fontWeight: 600
                    }}>
                        {pos.role_sub_group_name}
                    </span>
                )}
            </div>

            {/* Contact */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {emp.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.69rem', color: '#475569' }}>
                        <Phone size={11} color="#881337" /> {emp.phone}
                    </div>
                )}
                {emp.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.69rem', color: '#475569', overflow: 'hidden' }}>
                        <Mail size={11} color="#881337" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
                    </div>
                )}
            </div>

            {/* Project & Position Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {pos?.project_name && (
                    <div style={{ background: '#fff1f2', borderRadius: 8, padding: '4px 8px', fontSize: '0.67rem', color: '#881337', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pos.project_name}>
                        💼 {pos.project_name}
                    </div>
                )}
                {pos?.name && (
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '4px 8px', fontSize: '0.67rem', color: '#64748b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pos.name}>
                        📌 {pos.name}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Segment Block ────────────────────────────────────────────────────────────
const SegmentBlock = ({ seg, onView }) => {
    const [open, setOpen] = useState(true);
    const emps = [...seg.employees.values()];
    return (
        <div style={{ marginBottom: '1rem' }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    padding: '0.6rem 1rem',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    borderRadius: 10, border: '1px solid #bfdbfe', marginBottom: open ? 10 : 0,
                    userSelect: 'none'
                }}
            >
                <Layers size={14} color="#1e40af" />
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e3a8a', flex: 1 }}>{seg.name}</span>
                <span style={{
                    background: '#1e40af', color: '#fff', borderRadius: 20,
                    padding: '1px 10px', fontSize: '0.7rem', fontWeight: 700
                }}>{emps.length}</span>
                {open ? <ChevronUp size={14} color="#3b82f6" /> : <ChevronDown size={14} color="#3b82f6" />}
            </div>
            {open && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                    {emps.map(e => (
                        <EmployeeCard key={e.id} emp={e} pos={e._matchedPosition} onView={onView} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Project Block ────────────────────────────────────────────────────────────
const ProjectBlock = ({ proj, onView }) => {
    const [open, setOpen] = useState(true);
    const segs = [...proj.segments.values()];
    const total = segs.reduce((sum, s) => sum + s.employees.size, 0);
    const isNone = proj.id === '__none__';

    return (
        <div style={{
            background: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1px solid #e8edf2',
            marginBottom: '1.5rem'
        }}>
            {/* Project header */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    background: isNone
                        ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                        : 'linear-gradient(135deg, #881337 0%, #be185d 60%, #9f1239 100%)',
                    padding: '1.1rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', userSelect: 'none'
                }}
            >
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                    <FolderKanban size={18} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '-0.2px' }}>{proj.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                        {segs.length} Segment{segs.length !== 1 ? 's' : ''} · {total} Employee{total !== 1 ? 's' : ''}
                    </div>
                </div>
                <span style={{
                    background: 'rgba(255,255,255,0.2)', color: '#fff',
                    borderRadius: 20, padding: '3px 14px', fontWeight: 800, fontSize: '0.8rem'
                }}>{total}</span>
                {open ? <ChevronUp size={16} color="rgba(255,255,255,0.8)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.8)" />}
            </div>

            {/* Segments */}
            {open && (
                <div style={{ padding: '1.25rem 1.5rem' }}>
                    {segs.map(seg => (
                        <SegmentBlock key={seg.id} seg={seg} onView={onView} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const WorkforceTracker = () => {
    const {
        allEmployees, projects, positionTypes, roles, roleSubGroups,
        loading, handleViewProfile
    } = useData();

    const [search, setSearch] = useState('');
    const [selProject, setSelProject] = useState('');
    const [selSegment, setSelSegment] = useState('');
    const [selPosType, setSelPosType] = useState('');
    const [selRole, setSelRole] = useState('');
    const [selSubGroup, setSelSubGroup] = useState('');

    // Segments for selected project
    const segmentOptions = useMemo(() => {
        if (!selProject) return [];
        const proj = projects?.find(p => String(p.id) === selProject);
        return proj?.segments?.map(s => ({ id: String(s.id), name: s.name })) || [];
    }, [selProject, projects]);

    // Filter employees
    const filtered = useMemo(() => {
        return (allEmployees || []).filter(emp => {
            if (search.trim()) {
                const t = search.toLowerCase();
                if (!emp.name?.toLowerCase().includes(t) &&
                    !emp.employee_code?.toLowerCase().includes(t) &&
                    !emp.email?.toLowerCase().includes(t) &&
                    !emp.phone?.toLowerCase().includes(t)) return false;
            }
            const anyFilter = selProject || selSegment || selPosType || selRole || selSubGroup;
            if (anyFilter) {
                if (!emp.positions_details?.length) return false;
                return emp.positions_details.some(pos => {
                    if (selProject && String(pos.project_id) !== selProject) return false;
                    if (selSegment && String(pos.segment_id) !== selSegment) return false;
                    if (selPosType && String(pos.position_type_id) !== selPosType) return false;
                    if (selRole && String(pos.role_id) !== selRole) return false;
                    if (selSubGroup && String(pos.role_sub_group_id) !== selSubGroup) return false;
                    return true;
                });
            }
            return true;
        });
    }, [allEmployees, search, selProject, selSegment, selPosType, selRole, selSubGroup]);

    // Build hierarchy: Project → Segment → Employees
    const hierarchy = useMemo(() => {
        const projectMap = new Map();
        filtered.forEach(emp => {
            const positions = emp.positions_details || [];
            const matching = positions.filter(pos => {
                if (selProject && String(pos.project_id) !== selProject) return false;
                if (selSegment && String(pos.segment_id) !== selSegment) return false;
                if (selPosType && String(pos.position_type_id) !== selPosType) return false;
                if (selRole && String(pos.role_id) !== selRole) return false;
                if (selSubGroup && String(pos.role_sub_group_id) !== selSubGroup) return false;
                return true;
            });
            const toGroup = matching.length > 0 ? matching : positions.length > 0 ? [positions[0]] : [{}];
            const seen = new Set();
            toGroup.forEach(pos => {
                const pk = String(pos.project_id || '__none__');
                const sk = String(pos.segment_id || '__none__');
                const dk = `${pk}:${sk}:${emp.id}`;
                if (seen.has(dk)) return;
                seen.add(dk);
                if (!projectMap.has(pk)) {
                    projectMap.set(pk, {
                        id: pk,
                        name: pos.project_name || (pk === '__none__' ? 'No Project Assigned' : pk),
                        segments: new Map()
                    });
                }
                const proj = projectMap.get(pk);
                if (!proj.segments.has(sk)) {
                    proj.segments.set(sk, {
                        id: sk,
                        name: pos.segment_name || (sk === '__none__' ? 'General' : sk),
                        employees: new Map()
                    });
                }
                proj.segments.get(sk).employees.set(emp.id, { ...emp, _matchedPosition: pos });
            });
        });
        return [...projectMap.values()];
    }, [filtered, selProject, selSegment, selPosType, selRole, selSubGroup]);

    const totalEmp = useMemo(() => {
        const ids = new Set();
        hierarchy.forEach(p => p.segments.forEach(s => s.employees.forEach((_, id) => ids.add(id))));
        return ids.size;
    }, [hierarchy]);

    const reset = () => {
        setSearch(''); setSelProject(''); setSelSegment('');
        setSelPosType(''); setSelRole(''); setSelSubGroup('');
    };

    const isDataLoading = loading || (!allEmployees || allEmployees.length === 0 || !projects || projects.length === 0);

    if (isDataLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 48, height: 48, border: '4px solid #f1f5f9', borderTopColor: '#881337', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Loading workforce data…</div>
        </div>
    );

    return (
        <div style={{ padding: '1.5rem 2rem', minHeight: '100vh', background: '#f8fafc' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: 'linear-gradient(135deg, #881337, #be185d)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(136,19,55,0.3)'
                        }}>
                            <Users size={22} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                                Workforce Tracker
                            </h1>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                                Project → Segment → Position Type → Role → Sub Group
                            </p>
                        </div>
                    </div>
                </div>
                {/* Stats */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatBadge icon={<FolderKanban size={13} />} label="Projects" value={hierarchy.length} color="#881337" />
                    <StatBadge icon={<UserCheck size={13} />} label="Employees" value={totalEmp} color="#10b981" />
                    <button onClick={reset} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 10,
                        background: '#fff', border: '1.5px solid #e2e8f0',
                        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                        color: '#64748b', transition: 'all 0.2s ease'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#881337'; e.currentTarget.style.color = '#881337'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                    >
                        <RotateCcw size={13} /> Reset
                    </button>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #e8edf2',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center'
            }}>
                {/* Search */}
                <div style={{ position: 'relative', minWidth: 220 }}>
                    <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search name, code, phone…"
                        style={{
                            width: '100%', paddingLeft: 34, paddingRight: 12,
                            height: 38, border: '1.5px solid #e2e8f0', borderRadius: 10,
                            fontSize: '0.8rem', outline: 'none', background: '#f8fafc',
                            transition: 'border-color 0.2s', boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = '#881337'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>

                <FilterSelect
                    icon={<FolderKanban size={13} color="#881337" />}
                    value={selProject}
                    onChange={v => { setSelProject(v); setSelSegment(''); }}
                    options={projects?.map(p => ({ id: String(p.id), name: p.name })) || []}
                    placeholder="All Projects"
                />

                {segmentOptions.length > 0 && (
                    <FilterSelect
                        icon={<Layers size={13} color="#1e40af" />}
                        value={selSegment}
                        onChange={setSelSegment}
                        options={segmentOptions}
                        placeholder="All Segments"
                    />
                )}

                <FilterSelect
                    icon={<Settings size={13} color="#7c3aed" />}
                    value={selPosType}
                    onChange={setSelPosType}
                    options={positionTypes?.map(pt => ({ id: String(pt.id), name: pt.name })) || []}
                    placeholder="All Position Types"
                />

                <FilterSelect
                    icon={<Users size={13} color="#0f766e" />}
                    value={selRole}
                    onChange={v => { setSelRole(v); setSelSubGroup(''); }}
                    options={roles?.map(r => ({ id: String(r.id), name: r.name })) || []}
                    placeholder="All Role Groups"
                />

                {selRole && (
                    <FilterSelect
                        icon={<TrendingUp size={13} color="#b45309" />}
                        value={selSubGroup}
                        onChange={setSelSubGroup}
                        options={(roles?.find(r => String(r.id) === selRole)?.sub_groups || []).map(sg => ({ id: String(sg.id), name: sg.name }))}
                        placeholder="All Sub Groups"
                    />
                )}
            </div>

            {/* ── Content ── */}
            {hierarchy.length === 0 ? (
                <EmptyState hasFilters={!!(search || selProject || selSegment || selPosType || selRole || selSubGroup)} onReset={reset} />
            ) : (
                hierarchy.map(proj => (
                    <ProjectBlock key={proj.id} proj={proj} onView={handleViewProfile} />
                ))
            )}
        </div>
    );
};

// ─── Helper Components ────────────────────────────────────────────────────────
const StatBadge = ({ icon, label, value, color }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 10,
        background: `${color}10`, border: `1.5px solid ${color}30`
    }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{label}:</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color }}>{value}</span>
    </div>
);

const FilterSelect = ({ icon, value, onChange, options, placeholder }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6,
        background: value ? 'rgba(136,19,55,0.04)' : '#f8fafc',
        border: `1.5px solid ${value ? '#881337' : '#e2e8f0'}`,
        borderRadius: 10, padding: '0 10px', height: 38, minWidth: 160 }}>
        {icon}
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: '0.78rem', color: value ? '#881337' : '#64748b',
                fontWeight: value ? 600 : 400, cursor: 'pointer', flex: 1
            }}
        >
            <option value="">{placeholder}</option>
            {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
    </div>
);

const EmptyState = ({ hasFilters, onReset }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#fff', borderRadius: 20, border: '1px solid #e8edf2',
        padding: '4rem 2rem', gap: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
    }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={32} color="#94a3b8" />
        </div>
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#334155' }}>
                {hasFilters ? 'No Employees Match Filters' : 'No Employees Found'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 6 }}>
                {hasFilters ? 'Try adjusting or resetting your filters.' : 'Employees with assigned positions will appear here.'}
            </div>
        </div>
        {hasFilters && (
            <button onClick={onReset} style={{
                padding: '8px 20px', borderRadius: 10, background: '#881337',
                color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem'
            }}>Reset Filters</button>
        )}
    </div>
);

export default WorkforceTracker;
