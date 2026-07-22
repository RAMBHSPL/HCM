import React, { useState, useMemo, useEffect } from 'react';
import {
    Users, Search, FolderKanban, Layers, Settings,
    RotateCcw, Mail, Phone, ArrowUpRight,
    ChevronDown, ChevronUp, TrendingUp, UserCheck, UserX,
    Building2, LayoutList
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
    const [page, setPage] = useState(1);
    const pageSize = 24;

    const emps = [...seg.employees.values()];
    const totalPages = Math.ceil(emps.length / pageSize);

    useEffect(() => {
        setPage(1);
    }, [seg]);

    const paginatedEmps = useMemo(() => {
        const start = (page - 1) * pageSize;
        return emps.slice(start, start + pageSize);
    }, [emps, page]);

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
                <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                        {paginatedEmps.map(e => (
                            <EmployeeCard key={e.id} emp={e} pos={e._matchedPosition} onView={onView} />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '1.25rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid #dbeafe',
                            flexWrap: 'wrap',
                            gap: 8,
                            paddingLeft: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.72rem', color: '#1e3a8a', fontWeight: 600 }}>
                                Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, emps.length)} of {emps.length} employees
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                                    style={{
                                        border: '1.5px solid #dbeafe',
                                        background: '#fff',
                                        color: page === 1 ? '#94a3b8' : '#1e40af',
                                        padding: '4px 10px',
                                        borderRadius: 8,
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Prev
                                </button>
                                {getPageNumbers(page, totalPages).map((pNum, idx) => {
                                    if (pNum === '...') {
                                        return <span key={`dots-${idx}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '0.75rem' }}>...</span>;
                                    }
                                    return (
                                        <button
                                            key={pNum}
                                            onClick={() => setPage(pNum)}
                                            style={{
                                                border: '1.5px solid',
                                                borderColor: page === pNum ? '#1e40af' : '#dbeafe',
                                                background: page === pNum ? '#1e40af' : '#fff',
                                                color: page === pNum ? '#fff' : '#1e40af',
                                                padding: '4px 10px',
                                                borderRadius: 8,
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                minWidth: 28,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {pNum}
                                        </button>
                                    );
                                })}
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                    style={{
                                        border: '1.5px solid #dbeafe',
                                        background: '#fff',
                                        color: page === totalPages ? '#94a3b8' : '#1e40af',
                                        padding: '4px 10px',
                                        borderRadius: 8,
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
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

// ─── Section Block ────────────────────────────────────────────────────────────
const SectionBlock = ({ sec, onView }) => {
    const [open, setOpen] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 24;

    const emps = [...sec.employees.values()];
    const totalPages = Math.ceil(emps.length / pageSize);

    useEffect(() => {
        setPage(1);
    }, [sec]);

    const paginatedEmps = useMemo(() => {
        const start = (page - 1) * pageSize;
        return emps.slice(start, start + pageSize);
    }, [emps, page]);

    return (
        <div style={{ marginBottom: '0.75rem' }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    padding: '0.5rem 0.8rem',
                    background: '#f8fafc',
                    borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: open ? 8 : 0,
                    userSelect: 'none'
                }}
            >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }} />
                <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#334155', flex: 1 }}>{sec.name}</span>
                <span style={{
                    background: '#64748b', color: '#fff', borderRadius: 20,
                    padding: '1px 8px', fontSize: '0.65rem', fontWeight: 700
                }}>{emps.length}</span>
                {open ? <ChevronUp size={12} color="#64748b" /> : <ChevronDown size={12} color="#64748b" />}
            </div>
            {open && (
                <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', paddingLeft: '0.5rem', paddingTop: '4px' }}>
                        {paginatedEmps.map(e => (
                            <EmployeeCard key={e.id} emp={e} pos={e._matchedPosition} onView={onView} />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '1.25rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid #e2e8f0',
                            flexWrap: 'wrap',
                            gap: 8,
                            paddingLeft: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                                Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, emps.length)} of {emps.length} employees
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                                    style={{
                                        border: '1.5px solid #e2e8f0',
                                        background: '#fff',
                                        color: page === 1 ? '#94a3b8' : '#475569',
                                        padding: '4px 10px',
                                        borderRadius: 8,
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Prev
                                </button>
                                {getPageNumbers(page, totalPages).map((pNum, idx) => {
                                    if (pNum === '...') {
                                        return <span key={`dots-${idx}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '0.75rem' }}>...</span>;
                                    }
                                    return (
                                        <button
                                            key={pNum}
                                            onClick={() => setPage(pNum)}
                                            style={{
                                                border: '1.5px solid',
                                                borderColor: page === pNum ? '#475569' : '#e2e8f0',
                                                background: page === pNum ? '#475569' : '#fff',
                                                color: page === pNum ? '#fff' : '#475569',
                                                padding: '4px 10px',
                                                borderRadius: 8,
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                minWidth: 28,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {pNum}
                                        </button>
                                    );
                                })}
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                    style={{
                                        border: '1.5px solid #e2e8f0',
                                        background: '#fff',
                                        color: page === totalPages ? '#94a3b8' : '#475569',
                                        padding: '4px 10px',
                                        borderRadius: 8,
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ─── Department Block ─────────────────────────────────────────────────────────
const DepartmentBlock = ({ dept, onView }) => {
    const [open, setOpen] = useState(true);
    const secs = [...dept.sections.values()];
    const total = secs.reduce((sum, s) => sum + s.employees.size, 0);

    return (
        <div style={{
            background: '#faf5ff',
            borderRadius: 14,
            border: '1px solid #e9d5ff',
            padding: '0.85rem',
            marginBottom: '1rem'
        }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    paddingBottom: open ? 10 : 0,
                    userSelect: 'none'
                }}
            >
                <Layers size={14} color="#7c3aed" />
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#5b21b6', flex: 1 }}>{dept.name}</span>
                <span style={{
                    background: '#7c3aed', color: '#fff', borderRadius: 20,
                    padding: '1px 10px', fontSize: '0.7rem', fontWeight: 700
                }}>{total}</span>
                {open ? <ChevronUp size={14} color="#7c3aed" /> : <ChevronDown size={14} color="#7c3aed" />}
            </div>
            {open && (
                <div>
                    {secs.map(sec => (
                        <SectionBlock key={sec.id} sec={sec} onView={onView} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Office Block ─────────────────────────────────────────────────────────────
const OfficeBlock = ({ office, onView }) => {
    const [open, setOpen] = useState(true);
    const depts = [...office.departments.values()];
    const total = depts.reduce((sum, d) => sum + [...d.sections.values()].reduce((sSum, s) => sSum + s.employees.size, 0), 0);
    const isNone = office.id === '__none__';

    return (
        <div style={{
            background: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1px solid #e8edf2',
            marginBottom: '1.5rem'
        }}>
            {/* Office header */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    background: isNone
                        ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                        : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
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
                    <Building2 size={18} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '-0.2px' }}>{office.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                        {depts.length} Department{depts.length !== 1 ? 's' : ''} · {total} Employee{total !== 1 ? 's' : ''}
                    </div>
                </div>
                <span style={{
                    background: 'rgba(255,255,255,0.2)', color: '#fff',
                    borderRadius: 20, padding: '3px 14px', fontWeight: 800, fontSize: '0.8rem'
                }}>{total}</span>
                {open ? <ChevronUp size={16} color="rgba(255,255,255,0.8)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.8)" />}
            </div>

            {/* Departments */}
            {open && (
                <div style={{ padding: '1.25rem 1.5rem' }}>
                    {depts.map(dept => (
                        <DepartmentBlock key={dept.id} dept={dept} onView={onView} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const WorkforceTracker = () => {
    const {
        allEmployees, projects, offices, departments, sections, positionTypes, roles, roleSubGroups,
        loading, handleViewProfile, orgLevels,
        loadEmployeesIfNeeded, employeesLoading
    } = useData();

    useEffect(() => {
        if (loadEmployeesIfNeeded) {
            loadEmployeesIfNeeded();
        }
    }, [loadEmployeesIfNeeded]);

    const [segregationPattern, setSegregationPattern] = useState('project');
    const [search, setSearch] = useState('');
    const [selProject, setSelProject] = useState('');
    const [selSegment, setSelSegment] = useState('');
    const [selOffice, setSelOffice] = useState('');
    const [selOfficeLevel, setSelOfficeLevel] = useState('');
    const [selDepartment, setSelDepartment] = useState('');
    const [selSection, setSelSection] = useState('');
    const [selPosType, setSelPosType] = useState('');
    const [selRole, setSelRole] = useState('');
    const [selSubGroup, setSelSubGroup] = useState('');

    // Segments for selected project
    const segmentOptions = useMemo(() => {
        if (!selProject) return [];
        const proj = projects?.find(p => String(p.id) === selProject);
        return proj?.segments?.map(s => ({ id: String(s.id), name: s.name })) || [];
    }, [selProject, projects]);

    // Departments for selected office
    const departmentOptions = useMemo(() => {
        if (!selOffice) return [];
        return departments?.filter(d => String(d.office) === selOffice || String(d.office_id) === selOffice)
                          .map(d => ({ id: String(d.id), name: d.name })) || [];
    }, [selOffice, departments]);

    // Sections for selected department
    const sectionOptions = useMemo(() => {
        if (!selDepartment) return [];
        return sections?.filter(s => String(s.department) === selDepartment || String(s.department_id) === selDepartment)
                        .map(s => ({ id: String(s.id), name: s.name })) || [];
    }, [selDepartment, sections]);

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
            const anyFilter = selProject || selSegment || selOffice || selOfficeLevel || selDepartment || selSection || selPosType || selRole || selSubGroup;
            if (anyFilter) {
                if (!emp.positions_details?.length) return false;
                return emp.positions_details.some(pos => {
                    if (selProject && String(pos.project_id) !== selProject) return false;
                    if (selSegment && String(pos.segment_id) !== selSegment) return false;
                    if (selOffice && String(pos.office_id) !== selOffice) return false;
                    if (selOfficeLevel && String(pos.office_level_id) !== selOfficeLevel) return false;
                    if (selDepartment && String(pos.department_id) !== selDepartment) return false;
                    if (selSection && String(pos.section_id) !== selSection) return false;
                    if (selPosType && String(pos.position_type_id) !== selPosType) return false;
                    if (selRole && String(pos.role_id) !== selRole) return false;
                    if (selSubGroup && String(pos.role_sub_group_id) !== selSubGroup) return false;
                    return true;
                });
            }
            return true;
        });
    }, [allEmployees, search, selProject, selSegment, selOffice, selOfficeLevel, selDepartment, selSection, selPosType, selRole, selSubGroup]);

    // Build hierarchy:
    // - If Project-wise: Project → Segment → Employees
    // - If Office-wise: Office → Department → Section → Employees
    const hierarchy = useMemo(() => {
        if (segregationPattern === 'project') {
            const projectMap = new Map();
            filtered.forEach(emp => {
                const positions = emp.positions_details || [];
                const matching = positions.filter(pos => {
                    if (selProject && String(pos.project_id) !== selProject) return false;
                    if (selSegment && String(pos.segment_id) !== selSegment) return false;
                    if (selOfficeLevel && String(pos.office_level_id) !== selOfficeLevel) return false;
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
        } else {
            // Office-wise: Office → Department → Section → Employees
            const officeMap = new Map();
            filtered.forEach(emp => {
                const positions = emp.positions_details || [];
                const matching = positions.filter(pos => {
                    if (selProject && String(pos.project_id) !== selProject) return false;
                    if (selOfficeLevel && String(pos.office_level_id) !== selOfficeLevel) return false;
                    if (selOffice && String(pos.office_id) !== selOffice) return false;
                    if (selDepartment && String(pos.department_id) !== selDepartment) return false;
                    if (selSection && String(pos.section_id) !== selSection) return false;
                    if (selPosType && String(pos.position_type_id) !== selPosType) return false;
                    if (selRole && String(pos.role_id) !== selRole) return false;
                    if (selSubGroup && String(pos.role_sub_group_id) !== selSubGroup) return false;
                    return true;
                });
                const toGroup = matching.length > 0 ? matching : positions.length > 0 ? [positions[0]] : [{}];
                const seen = new Set();
                toGroup.forEach(pos => {
                    const ok = String(pos.office_id || '__none__');
                    const dk = String(pos.department_id || '__none__');
                    const sk = String(pos.section_id || '__none__');
                    const key = `${ok}:${dk}:${sk}:${emp.id}`;
                    if (seen.has(key)) return;
                    seen.add(key);
                    if (!officeMap.has(ok)) {
                        officeMap.set(ok, {
                            id: ok,
                            name: pos.office_name || (ok === '__none__' ? 'No Office Assigned' : ok),
                            departments: new Map()
                        });
                    }
                    const officeObj = officeMap.get(ok);
                    if (!officeObj.departments.has(dk)) {
                        officeObj.departments.set(dk, {
                            id: dk,
                            name: pos.department_name || (dk === '__none__' ? 'General Department' : dk),
                            sections: new Map()
                        });
                    }
                    const deptObj = officeObj.departments.get(dk);
                    if (!deptObj.sections.has(sk)) {
                        deptObj.sections.set(sk, {
                            id: sk,
                            name: pos.section_name || (sk === '__none__' ? 'General Section' : sk),
                            employees: new Map()
                        });
                    }
                    deptObj.sections.get(sk).employees.set(emp.id, { ...emp, _matchedPosition: pos });
                });
            });
            return [...officeMap.values()];
        }
    }, [filtered, segregationPattern, selProject, selSegment, selOffice, selOfficeLevel, selDepartment, selSection, selPosType, selRole, selSubGroup]);

    const totalEmp = useMemo(() => {
        const ids = new Set();
        if (segregationPattern === 'project') {
            hierarchy.forEach(p => p.segments.forEach(s => s.employees.forEach((_, id) => ids.add(id))));
        } else {
            hierarchy.forEach(o => o.departments.forEach(d => d.sections.forEach(s => s.employees.forEach((_, id) => ids.add(id)))));
        }
        return ids.size;
    }, [hierarchy, segregationPattern]);

    const reset = () => {
        setSearch('');
        setSelProject(''); setSelSegment('');
        setSelOffice(''); setSelOfficeLevel(''); setSelDepartment(''); setSelSection('');
        setSelPosType(''); setSelRole(''); setSelSubGroup('');
    };

    const isDataLoading = loading || employeesLoading || (!allEmployees || allEmployees.length === 0 || !projects || projects.length === 0);

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
                                {segregationPattern === 'project'
                                    ? 'Project → Segment → Position Type → Role → Sub Group'
                                    : 'Office → Department → Section → Position Type → Role → Sub Group'}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Stats */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatBadge
                        icon={segregationPattern === 'project' ? <FolderKanban size={13} /> : <Building2 size={13} />}
                        label={segregationPattern === 'project' ? 'Projects' : 'Offices'}
                        value={hierarchy.length}
                        color={segregationPattern === 'project' ? '#881337' : '#1e3a8a'}
                    />
                    <StatBadge icon={<UserCheck size={13} />} label="Employees" value={totalEmp} color="#10b981" />
                    
                    {/* Segregation Pattern Toggle */}
                    <div style={{
                        display: 'flex',
                        background: '#f1f5f9',
                        padding: '3px',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        alignItems: 'center',
                        gap: '2px'
                    }}>
                        <button
                            onClick={() => { setSegregationPattern('project'); reset(); }}
                            style={{
                                border: 'none',
                                padding: '5px 12px',
                                borderRadius: '7px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: segregationPattern === 'project' ? '#881337' : 'transparent',
                                color: segregationPattern === 'project' ? '#fff' : '#64748b',
                                boxShadow: segregationPattern === 'project' ? '0 2px 6px rgba(136,19,55,0.2)' : 'none'
                            }}
                        >
                            <FolderKanban size={11} /> Project-wise
                        </button>
                        <button
                            onClick={() => { setSegregationPattern('office'); reset(); }}
                            style={{
                                border: 'none',
                                padding: '5px 12px',
                                borderRadius: '7px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: segregationPattern === 'office' ? '#1e3a8a' : 'transparent',
                                color: segregationPattern === 'office' ? '#fff' : '#64748b',
                                boxShadow: segregationPattern === 'office' ? '0 2px 6px rgba(30,58,138,0.2)' : 'none'
                            }}
                        >
                            <Building2 size={11} /> Office-wise
                        </button>
                    </div>

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

                {segregationPattern === 'project' && segmentOptions.length > 0 && (
                    <FilterSelect
                        icon={<Layers size={13} color="#1e40af" />}
                        value={selSegment}
                        onChange={setSelSegment}
                        options={segmentOptions}
                        placeholder="All Segments"
                    />
                )}

                <FilterSelect
                    icon={<LayoutList size={13} color="#1e3a8a" />}
                    value={selOfficeLevel}
                    onChange={setSelOfficeLevel}
                    options={orgLevels?.map(ol => ({ id: String(ol.id), name: ol.name })) || []}
                    placeholder="All Office Levels"
                />

                {segregationPattern === 'office' && (
                    <>
                        <FilterSelect
                            icon={<Building2 size={13} color="#1e3a8a" />}
                            value={selOffice}
                            onChange={v => { setSelOffice(v); setSelDepartment(''); setSelSection(''); }}
                            options={offices?.map(o => ({ id: String(o.id), name: o.name })) || []}
                            placeholder="All Offices"
                        />

                        {departmentOptions.length > 0 && (
                            <FilterSelect
                                icon={<Layers size={13} color="#7c3aed" />}
                                value={selDepartment}
                                onChange={v => { setSelDepartment(v); setSelSection(''); }}
                                options={departmentOptions}
                                placeholder="All Departments"
                            />
                        )}

                        {sectionOptions.length > 0 && (
                            <FilterSelect
                                icon={<Settings size={13} color="#10b981" />}
                                value={selSection}
                                onChange={setSelSection}
                                options={sectionOptions}
                                placeholder="All Sections"
                            />
                        )}
                    </>
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
                <EmptyState hasFilters={!!(search || selProject || selSegment || selOffice || selDepartment || selSection || selPosType || selRole || selSubGroup)} onReset={reset} />
            ) : (
                segregationPattern === 'project' ? (
                    hierarchy.map(proj => (
                        <ProjectBlock key={proj.id} proj={proj} onView={handleViewProfile} />
                    ))
                ) : (
                    hierarchy.map(office => (
                        <OfficeBlock key={office.id} office={office} onView={handleViewProfile} />
                    ))
                )
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

const getPageNumbers = (current, total) => {
    const pages = [];
    if (total <= 5) {
        for (let i = 1; i <= total; i++) pages.push(i);
    } else {
        if (current <= 3) {
            pages.push(1, 2, 3, 4, '...', total);
        } else if (current >= total - 2) {
            pages.push(1, '...', total - 3, total - 2, total - 1, total);
        } else {
            pages.push(1, '...', current - 1, current, current + 1, '...', total);
        }
    }
    return pages;
};
