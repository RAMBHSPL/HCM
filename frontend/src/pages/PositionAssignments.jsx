import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    UserPlus,
    CheckCircle2,
    XCircle,
    Clock,
    ShieldAlert,
    ShieldCheck,
    BarChart3,
    ArrowRightLeft,
    Users,
    MapPin,
    Calendar,
    Eye,
    RefreshCw,
    ArrowDownCircle
} from 'lucide-react';
import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const PositionAssignments = () => {
    const navigate = useNavigate();
    const {
        user, setModalType, setFormData, setShowModal, showModal, SECTIONS,
        refreshPermissions, fetchStats, fetchDropdownData,
        activePositionContext, showNotification, switchPositionContext
    } = useData();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('incoming'); // incoming, made, approval, reports

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const res = await api.get('position-assignments/');
            const results = (res && res.results) || res;
            setAssignments(Array.isArray(results) ? results : []);

            if (!results || (Array.isArray(results) && results.length === 0)) {
                console.warn("No assignments returned from API.");
            }
        } catch (err) {
            console.error("Error fetching assignments:", err);
            // Optionally setAssignments([]) here if needed, but error shouldn't crash it
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [activePositionContext]);

    useEffect(() => {
        if (!showModal) {
            fetchAssignments();
        }
    }, [showModal]);

    const handleAction = async (id, action) => {
        try {
            const res = await api.post(`position-assignments/${id}/${action}/`);
            if (res.error) throw res;

            fetchAssignments();
            refreshPermissions();
            fetchStats(true);
            fetchDropdownData();
            showNotification(`Assignment ${action}ed successfully`, 'success');

        } catch (err) {
            const msg = err.error || err.detail || `Error performing ${action}`;
            alert(msg);
        }
    };

    const handleExtend = async (id) => {
        const newDate = prompt("Enter new expiry date (YYYY-MM-DD):", new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
        if (!newDate) return;

        try {
            const res = await api.post(`position-assignments/${id}/extend/`, { expires_at: newDate });
            if (res.error) throw res;

            showNotification(`Assignment extended to ${newDate}`, 'success');
            fetchAssignments();
            refreshPermissions();
            fetchStats(true);

        } catch (err) {
            const msg = err.error || err.detail || "Failed to extend assignment";
            alert(msg);
        }
    };

    const openAssignModal = () => {
        const primaryPos = (myPositions && myPositions.length > 0) ? myPositions[0] : (user?.positions_details?.[0] || {});

        setFormData({
            assignee: '',
            position: primaryPos.id ? String(primaryPos.id) : '',
            assignment_type: 'NORMAL',
            notes: '',
            expires_at: '',
            _assignee_level_filter: 'SAME', // Default to same level for quicker selection
            _assignee_office_filter: primaryPos.office_id ? String(primaryPos.office_id) : '',
            _assignee_rank_filter: '',
            _selected_position_name: primaryPos.name || '',
            _selected_position_office: primaryPos.office_name || '',
            _selected_position_dept: primaryPos.department_name || ''
        });
        setModalType('Position Assignments');
        setShowModal(true);
    };

    // RESTRICTION LOGIC
    const [myPositions, setMyPositions] = React.useState(user?.positions_details || []);

    useEffect(() => {
        if (user?.positions_details && Array.isArray(user.positions_details)) {
            setMyPositions(user.positions_details);
        } else if (user && !user.positions_details) {
            refreshPermissions();
            setMyPositions([]);
        }
    }, [user, user?.id]);

    const isDataLoaded = myPositions.length > 0;
    const isMyOwnPosition = myPositions.some(p => String(p?.id) === String(activePositionContext));

    // STRICT RESTRICTION: Acting Mode is blocked for assignments.
    if (activePositionContext) {
        return (
            <div className="fade-in" style={{ padding: '4rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                <ShieldAlert size={64} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Restricted Access</h2>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace', margin: '0.5rem 0' }}>
                    Acting Mode Active
                </div>
                <p style={{ fontSize: '1.1rem', color: '#64748b', margin: '1rem 0 2rem' }}>
                    You are currently in <strong>Acting Mode</strong>.
                    <br />
                    To manage position assignments, please switch to <strong>Standard Mode</strong> (Reporting Manager View).
                </p>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#475569', marginBottom: '1.5rem' }}>
                    Assignments are managed from your primary dashboard, not while acting as another user.
                </div>
                <button
                    onClick={() => switchPositionContext(null)}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'white',
                        color: '#64748b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                >
                    Switch to Standard Mode
                </button>
            </div>
        );
    }

    // INFO: Explain why access is granted despite Acting Mode
    const isOwnerAccess = activePositionContext && isMyOwnPosition;

    // Unified loading state check
    const isActuallyLoading = loading && assignments.length === 0;
    const isSecurityChecking = !user;

    const filteredAssignments = (tabOverride = null) => {
        const currentTab = tabOverride || activeTab;
        const empId = user?.employee_profile_id;

        if (!assignments) return [];
        if (!empId) return [];

        switch (currentTab) {
            case 'incoming':
                return assignments.filter(a => String(a.assignee) === String(empId) && !a.assignee_accepted && a.status !== 'REJECTED' && a.status !== 'REVOKED');
            case 'made':
                return assignments.filter(a => {
                    const assignorId = typeof a.assignor === 'object' ? a.assignor?.id : a.assignor;
                    return String(assignorId) === String(empId);
                });
            case 'approval':
                return assignments.filter(a => {
                    const approvers = (a.approver_ids || []).map(id => String(id));
                    const isApprover = String(a.assignor_reporting_head_id) === String(empId) || approvers.includes(String(empId));
                    return isApprover && !a.reporting_head_approved && a.status !== 'REJECTED' && a.status !== 'REVOKED';
                });
            case 'reports':
                return assignments.filter(a => {
                    const assignorId = typeof a.assignor === 'object' ? a.assignor?.id : a.assignor;
                    const assigneeId = typeof a.assignee === 'object' ? a.assignee?.id : a.assignee;
                    const approvers = (a.approver_ids || []).map(id => String(id));
                    const isInvolved = String(assignorId) === String(empId) || String(assigneeId) === String(empId) || approvers.includes(String(empId));

                    if (!isInvolved) return false;

                    const isIncoming = String(assigneeId) === String(empId) && !a.assignee_accepted && a.status !== 'REJECTED';
                    const isApproval = (String(a.assignor_reporting_head_id) === String(empId) || approvers.includes(String(empId))) && !a.reporting_head_approved && a.status !== 'REJECTED';

                });
            default: return [];
        }
    };

    const sortedAssignments = [...filteredAssignments()].sort((a, b) => (a.position_name || '').localeCompare(b.position_name || ''));

    return (
        <div className="fade-in" style={{ padding: '2rem', position: 'relative', minHeight: '600px' }}>
            {(isActuallyLoading || isSecurityChecking) && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.75)',
                    zIndex: 99999,
                    backdropFilter: 'blur(8px)'
                }}>
                    <BavyaSpinner label={isSecurityChecking ? "Validating Security Context..." : "Syncing Professional Assignments..."} />
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ArrowRightLeft className="text-primary" size={32} /> Position Assignments
                    </h1>
                    <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontWeight: 500 }}>Manage delegation and assignment of your positions</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={fetchAssignments}
                        style={{
                            padding: '0.75rem 1.25rem',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={18} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                    {!activePositionContext && (
                        <button
                            onClick={openAssignModal}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 10px 15px -3px rgba(136, 19, 55, 0.2)',
                                cursor: 'pointer'
                            }}
                        >
                            <UserPlus size={18} /> New Assignment
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                {[
                    { id: 'incoming', label: 'Incoming Requests', icon: <UserPlus size={16} /> },
                    { id: 'made', label: 'My Assignments', icon: <Briefcase size={16} /> },
                    { id: 'approval', label: 'Approval Queue', icon: <ShieldAlert size={16} /> },
                    { id: 'reports', label: 'Assignment Reports', icon: <BarChart3 size={16} /> }
                ].map(tab => {
                    const count = filteredAssignments(tab.id).length;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: activeTab === tab.id ? 'rgba(136, 19, 55, 0.05)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary)' : '#64748b',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginBottom: '-0.65rem',
                                position: 'relative'
                            }}
                        >
                            {tab.icon} {tab.label}
                            {count > 0 && (tab.id === 'incoming' || tab.id === 'approval') && (
                                <span style={{
                                    background: 'var(--primary)', color: 'white', fontSize: '0.7rem',
                                    padding: '2px 6px', borderRadius: '10px', marginLeft: '6px'
                                }}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {sortedAssignments.length > 0 ? sortedAssignments.map(item => (
                    <div
                        key={item.id}
                        className="premium-card"
                        style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #f1f5f9',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {item.assignment_type === 'FORCED' && (
                            <div style={{
                                position: 'absolute', top: '12px', right: '-35px', background: '#ef4444', color: 'white',
                                padding: '4px 40px', fontSize: '0.65rem', fontWeight: 800, transform: 'rotate(45deg)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                FORCED
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(136, 19, 55, 0.1)',
                                color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Briefcase size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{item.position_name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <ArrowRightLeft size={14} />
                                    {activeTab === 'made' ? `To: ${item.assignee_name}` : `From: ${item.assignor_name}`}
                                </div>
                            </div>
                            <div style={{
                                padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700,
                                background: item.status === 'APPROVED' ? '#dcfce7' : (item.status === 'REJECTED' ? '#fee2e2' : '#fef9c3'),
                                color: item.status === 'APPROVED' ? '#166534' : (item.status === 'REJECTED' ? '#991b1b' : '#854d0e')
                            }}>
                                {item.status_display}
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Assignee Acceptance</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.85rem', fontWeight: 600, color: item.assignee_accepted ? '#166534' : '#64748b' }}>
                                    {item.assignee_accepted ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                    {item.assignee_accepted ? 'Accepted' : 'Awaiting'}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Head Approval</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.85rem', fontWeight: 600, color: item.reporting_head_approved ? '#166534' : '#64748b' }}>
                                    {item.reporting_head_approved ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                    {item.reporting_head_approved ? 'Approved' : 'Awaiting'}
                                </div>
                            </div>
                        </div>

                        {item.notes && (
                            <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.25rem', padding: '0 0.5rem', fontStyle: 'italic' }}>
                                "{item.notes}"
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {activeTab === 'incoming' && !item.assignee_accepted && (
                                <>
                                    <button
                                        onClick={() => handleAction(item.id, 'accept')}
                                        style={{ flex: 1, padding: '0.6rem', background: '#166534', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    >
                                        <CheckCircle2 size={16} /> Accept
                                    </button>
                                    <button
                                        onClick={() => handleAction(item.id, 'reject')}
                                        style={{ flex: 1, padding: '0.6rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                </>
                            )}

                            {activeTab === 'approval' && !item.reporting_head_approved && (
                                <>
                                    <button
                                        onClick={() => handleAction(item.id, 'approve')}
                                        style={{ flex: 1, padding: '0.6rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    >
                                        <ShieldCheck size={16} /> Approve Delegation
                                    </button>
                                    <button
                                        onClick={() => handleAction(item.id, 'reject')}
                                        style={{ padding: '0.6rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        <XCircle size={16} />
                                    </button>
                                </>
                            )}

                            {activeTab === 'reports' && (
                                <div style={{ flex: 1, display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => navigate(`/position-activity-logs?assignment=${item.id}`)}
                                        style={{ flex: 1, padding: '0.6rem', background: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    >
                                        <Eye size={16} /> Activity
                                    </button>
                                    <button
                                        onClick={() => handleExtend(item.id)}
                                        style={{ flex: 1, padding: '0.6rem', background: '#f1f5f9', color: 'var(--primary)', border: '1px solid rgba(136, 19, 55, 0.2)', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    >
                                        <Clock size={16} /> Extend
                                    </button>
                                </div>
                            )}

                            {activeTab === 'made' && (
                                <button
                                    onClick={() => handleExtend(item.id)}
                                    style={{ flex: 1, padding: '0.6rem', background: '#f1f5f9', color: 'var(--primary)', border: '1px solid rgba(136, 19, 55, 0.2)', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <Clock size={16} /> Extend Date
                                </button>
                            )}
                        </div>
                    </div>
                )) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                        <Clock size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                        <h3 style={{ margin: 0, color: '#64748b' }}>No {activeTab} assignments found</h3>
                        <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>Assignments matching your current filter will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PositionAssignments;
