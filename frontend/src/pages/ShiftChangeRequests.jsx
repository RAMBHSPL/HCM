import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar, Search, RefreshCw, User, Shield, Info, Users, CheckCircle, Ban, Send, FileText, ArrowRight, CheckCircle2, XCircle, Clock, Eye, AlertTriangle, Layers
} from 'lucide-react';
import api from '../api';
import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';

const ShiftChangeRequests = () => {
    const { user } = useData();
    const [requests, setRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [positions, setPositions] = useState([]);
    const [shifts, setShifts] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [actioningId, setActioningId] = useState(null);

    // Selected Request for detailed view
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rightTab, setRightTab] = useState('details'); // 'details' or 'create'

    // Form states
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [selectedShift, setSelectedShift] = useState(null);
    const [reqDate, setReqDate] = useState('');
    const [reqReason, setReqReason] = useState('');

    // Search/filter states
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [positionSearch, setPositionSearch] = useState('');
    const [requestSearch, setRequestSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchRequests = async () => {
        try {
            const res = await api.get('shift-change-requests/');
            const data = res.data || res;
            const results = data.results || data;
            const sorted = (Array.isArray(results) ? results : []).sort((a, b) => b.id - a.id);
            setRequests(sorted);
            
            // Re-select request if updated
            if (selectedRequest) {
                const updated = sorted.find(r => r.id === selectedRequest.id);
                if (updated) setSelectedRequest(updated);
            } else if (sorted.length > 0) {
                setSelectedRequest(sorted[0]);
            }
        } catch (err) {
            console.error("Error loading requests:", err);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [empRes, posRes, shiftRes] = await Promise.all([
                api.get('employees/all_data/'),
                api.get('positions/all_data/'),
                api.get('shifts/')
            ]);
            setEmployees(Array.isArray(empRes) ? empRes : empRes.results || []);
            setPositions(Array.isArray(posRes) ? posRes : posRes.results || []);
            setShifts(Array.isArray(shiftRes) ? shiftRes : shiftRes.results || []);
        } catch (err) {
            console.error("Error loading dropdown data:", err);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchRequests(), fetchDropdowns()]);
            setLoading(false);
        };
        loadAll();
    }, []);

    // Summary statistics
    const stats = useMemo(() => {
        const total = requests.length;
        const pendingConsent = requests.filter(r => r.status === 'PENDING_CONSENT').length;
        const pendingApproval = requests.filter(r => r.status === 'PENDING_APPROVAL').length;
        const approved = requests.filter(r => r.status === 'APPROVED').length;
        return { total, pendingConsent, pendingApproval, approved };
    }, [requests]);

    // Form search filters
    const filteredEmployees = useMemo(() => {
        if (!employeeSearch.trim()) return [];
        return employees.filter(e =>
            e.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
            e.employee_code?.toLowerCase().includes(employeeSearch.toLowerCase())
        ).slice(0, 5);
    }, [employees, employeeSearch]);

    const filteredPositions = useMemo(() => {
        if (!positionSearch.trim()) return [];
        return positions.filter(p =>
            p.name?.toLowerCase().includes(positionSearch.toLowerCase()) ||
            p.code?.toLowerCase().includes(positionSearch.toLowerCase())
        ).slice(0, 5);
    }, [positions, positionSearch]);

    // Main requests filter
    const filteredRequests = useMemo(() => {
        let list = requests;
        if (statusFilter !== 'ALL') {
            list = list.filter(r => r.status === statusFilter);
        }
        if (requestSearch.trim()) {
            const query = requestSearch.toLowerCase();
            list = list.filter(r =>
                r.employee_name?.toLowerCase().includes(query) ||
                r.requested_by_name?.toLowerCase().includes(query) ||
                r.position_name?.toLowerCase().includes(query) ||
                r.to_shift_name?.toLowerCase().includes(query)
            );
        }
        return list;
    }, [requests, requestSearch, statusFilter]);

    // Handle Create Request
    const handleCreateRequest = async (e) => {
        e.preventDefault();
        if (!selectedEmployee || !selectedPosition || !selectedShift || !reqDate) {
            alert("Please fill in all request fields.");
            return;
        }
        setSubmitting(true);
        try {
            await api.post('shift-change-requests/', {
                employee: selectedEmployee.id,
                position: selectedPosition.id,
                to_shift: selectedShift.id,
                date: reqDate,
                reason: reqReason
            });
            setSelectedEmployee(null);
            setSelectedPosition(null);
            setSelectedShift(null);
            setReqDate('');
            setReqReason('');
            alert("Shift Change Request submitted successfully!");
            await fetchRequests();
            setRightTab('details');
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Failed to submit request: " + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    // Consent Action (Accept/Decline)
    const handleConsent = async (id, actionVal) => {
        const comment = actionVal === 'decline' ? window.prompt("Enter reason for declining consent:") : "";
        if (actionVal === 'decline' && comment === null) return;
        
        setActioningId(id);
        try {
            await api.post(`shift-change-requests/${id}/consent/`, { action: actionVal, reason: comment });
            alert(`Consent ${actionVal === 'accept' ? 'accepted' : 'declined'} successfully!`);
            await fetchRequests();
        } catch (err) {
            console.error("Consent failed:", err);
            alert("Failed to submit consent: " + (err.response?.data?.error || err.message));
        } finally {
            setActioningId(null);
        }
    };

    // Manager Approve Action
    const handleApprove = async (id) => {
        if (!window.confirm("Are you sure you want to approve this shift change request?")) return;
        setActioningId(id);
        try {
            await api.post(`shift-change-requests/${id}/approve/`);
            alert("Request approved and shift updated in roster!");
            await fetchRequests();
        } catch (err) {
            console.error("Approval failed:", err);
            alert("Failed to approve request: " + (err.response?.data?.error || err.message));
        } finally {
            setActioningId(null);
        }
    };

    // Manager Reject Action
    const handleReject = async (id) => {
        const reason = window.prompt("Enter rejection reason:");
        if (reason === null) return;
        setActioningId(id);
        try {
            await api.post(`shift-change-requests/${id}/reject/`, { admin_notes: reason });
            alert("Request rejected.");
            await fetchRequests();
        } catch (err) {
            console.error("Rejection failed:", err);
            alert("Failed to reject request: " + (err.response?.data?.error || err.message));
        } finally {
            setActioningId(null);
        }
    };

    // Admin/Manager Override Action
    const handleOverride = async (id) => {
        if (!window.confirm("Override will bypass employee consent and immediately apply the shift change. Proceed?")) return;
        setActioningId(id);
        try {
            await api.post(`shift-change-requests/${id}/override/`);
            alert("Request overridden and shift updated directly!");
            await fetchRequests();
        } catch (err) {
            console.error("Override failed:", err);
            alert("Failed to override request: " + (err.response?.data?.error || err.message));
        } finally {
            setActioningId(null);
        }
    };

    if (loading) {
        return <BavyaSpinner label="Loading Shift Change requests dashboard..." />;
    }

    return (
        <div style={{ padding: '2rem 3rem', maxWidth: '1700px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            
            <style>
                {`
                .dashboard-card {
                    background: white; border: 1px solid #e2e8f0; border-radius: 16px;
                    padding: 1.5rem; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);
                }
                .dashboard-card:hover {
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.06); border-color: #cbd5e1;
                }
                .row-selected {
                    background: #f5f3ff !important; border-left: 4px solid #6366f1 !important;
                }
                .registry-table th {
                    text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.08em; padding: 14px 10px;
                }
                .registry-table td {
                    padding: 14px 10px; vertical-align: middle; transition: background 0.15s;
                }
                .search-result-item {
                    padding: 10px 14px; cursor: pointer; transition: background 0.2s;
                    border-bottom: 1px solid #f1f5f9; font-size: 0.85rem;
                }
                .search-result-item:hover {
                    background: #f1f5f9;
                }
                .tab-btn {
                    padding: 0.8rem 1.5rem; border: none; border-bottom: 3px solid transparent;
                    background: none; font-weight: 750; font-size: 0.9rem; cursor: pointer;
                    color: #64748b; transition: all 0.2s; display: flex; alignItems: center; gap: 8px;
                }
                .tab-btn.active {
                    color: #4f46e5; border-bottom-color: #4f46e5;
                }
                .timeline-node {
                    position: relative; padding-left: 28px; margin-bottom: 24px;
                }
                .timeline-node::before {
                    content: ''; position: absolute; left: 10px; top: 22px; bottom: -28px;
                    width: 2px; background: #e2e8f0;
                }
                .timeline-node:last-child::before {
                    display: none;
                }
                .timeline-icon {
                    position: absolute; left: 0; top: 0; width: 22px; height: 22px;
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    background: #e2e8f0; font-size: 10px; color: #64748b; z-index: 1;
                }
                .timeline-icon.completed {
                    background: #dcfce7; color: #166534;
                }
                .timeline-icon.pending {
                    background: #fef3c7; color: #b45309;
                }
                .timeline-icon.declined {
                    background: #fee2e2; color: #991b1b;
                }
                `}
            </style>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', marginBottom: '4px' }}>
                        <Calendar size={18} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Roster & Shift Operations</span>
                    </div>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Shift Change Requests</h2>
                </div>
                <div>
                    <button onClick={() => { fetchRequests(); fetchDropdowns(); }} style={{ background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.65rem 1.3rem', cursor: 'pointer', fontWeight: 750, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <RefreshCw size={14} /> Refresh Roster Data
                    </button>
                </div>
            </div>

            {/* Analytics Stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8' }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Total Requests logged</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 850, color: '#0f172a' }}>{stats.total}</div>
                    </div>
                </div>
                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: '#fffbeb', color: '#b45309' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Awaiting Employee Consent</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 850, color: '#b45309' }}>{stats.pendingConsent}</div>
                    </div>
                </div>
                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: '#f5f3ff', color: '#6d28d9' }}>
                        <Shield size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Awaiting Manager Approval</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 850, color: '#6d28d9' }}>{stats.pendingApproval}</div>
                    </div>
                </div>
                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: '#f0fdf4', color: '#15803d' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Approved & Applied</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 850, color: '#15803d' }}>{stats.approved}</div>
                    </div>
                </div>
            </div>

            {/* Split Screen Workspace */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem', alignItems: 'start' }}>
                
                {/* Left Side: Requests Registry */}
                <div className="dashboard-card" style={{ padding: '2rem', minHeight: '600px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Layers size={20} color="#4f46e5" />
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 850, color: '#0f172a' }}>Registry & Logs</h3>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING_CONSENT">Awaiting Consent</option>
                                <option value="PENDING_APPROVAL">Awaiting Approval</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>

                            <div style={{ width: '260px', display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px' }}>
                                <Search size={14} color="#94a3b8" style={{ marginRight: '8px' }} />
                                <input
                                    type="text"
                                    placeholder="Search by name, position..."
                                    value={requestSearch}
                                    onChange={(e) => setRequestSearch(e.target.value)}
                                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.8rem', width: '100%', color: '#1e293b' }}
                                />
                            </div>
                        </div>
                    </div>

                    {filteredRequests.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="registry-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontWeight: 800 }}>
                                        <th>Date Logged</th>
                                        <th>Employee Details</th>
                                        <th>Target Change</th>
                                        <th>Roster Status</th>
                                        <th style={{ textAlign: 'center' }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map(req => {
                                        const isSelected = selectedRequest && selectedRequest.id === req.id;
                                        return (
                                            <tr 
                                                key={req.id} 
                                                className={isSelected ? 'row-selected' : ''}
                                                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                                                onClick={() => { setSelectedRequest(req); setRightTab('details'); }}
                                            >
                                                <td style={{ fontWeight: 650, color: '#475569' }}>
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{req.employee_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Position: {req.position_name}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 850, color: '#4f46e5' }}>{new Date(req.date).toLocaleDateString()}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                                        <span>{req.from_shift_name || 'None'}</span>
                                                        <ArrowRight size={10} />
                                                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{req.to_shift_name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', fontWeight: 800,
                                                        background: req.status === 'APPROVED' ? '#dcfce7' : req.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                                                        color: req.status === 'APPROVED' ? '#15803d' : req.status === 'REJECTED' ? '#b91c1c' : '#d97706'
                                                    }}>
                                                        {req.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '4px' }}>
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ padding: '6rem 2rem', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                            <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
                            <h4 style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', fontWeight: 700 }}>No requests match the selection filter.</h4>
                            <p style={{ margin: '4px 0 0', color: '#cbd5e1', fontSize: '0.8rem' }}>Toggle status filter or search parameters.</p>
                        </div>
                    )}
                </div>

                {/* Right Side: Tabbed Action & Initiation Centre */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Tabs Header */}
                    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: 'white', borderRadius: '12px 12px 0 0', padding: '0 8px' }}>
                        <button 
                            className={`tab-btn ${rightTab === 'details' ? 'active' : ''}`}
                            onClick={() => setRightTab('details')}
                        >
                            <Eye size={16} /> Workflow Details
                        </button>
                        <button 
                            className={`tab-btn ${rightTab === 'create' ? 'active' : ''}`}
                            onClick={() => setRightTab('create')}
                        >
                            <Send size={16} /> Initiate Request
                        </button>
                    </div>

                    {/* Tab 1: Workflow Details & Actions */}
                    {rightTab === 'details' && (
                        <div className="dashboard-card" style={{ padding: '2rem' }}>
                            {selectedRequest ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Request Code: #{selectedRequest.id}</span>
                                        <h3 style={{ margin: '4px 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>{selectedRequest.employee_name}</h3>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Position: {selectedRequest.position_name}</span>
                                    </div>

                                    {/* Action Timeline */}
                                    <div>
                                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 800, color: '#475569' }}>Approval Timeline & Status</h4>
                                        
                                        {/* Step 1: Initiation */}
                                        <div className="timeline-node">
                                            <div className="timeline-icon completed">
                                                <User size={10} />
                                            </div>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 800, color: '#1e293b' }}>Request Initiated</div>
                                                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>By {selectedRequest.requested_by_name}</div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{new Date(selectedRequest.created_at).toLocaleString()}</div>
                                                {selectedRequest.reason && (
                                                    <div style={{ marginTop: '6px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontStyle: 'italic', borderLeft: '3px solid #cbd5e1' }}>
                                                        "{selectedRequest.reason}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Step 2: Employee Consent */}
                                        <div className="timeline-node">
                                            <div className={`timeline-icon ${
                                                selectedRequest.employee_consent === 'ACCEPTED' ? 'completed' : 
                                                selectedRequest.employee_consent === 'DECLINED' ? 'declined' : 'pending'
                                            }`}>
                                                <CheckCircle2 size={10} />
                                            </div>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 800, color: '#1e293b' }}>Employee Consent</div>
                                                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                                                    Status: <span style={{ fontWeight: 800 }}>{selectedRequest.employee_consent}</span>
                                                </div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Target employee: {selectedRequest.employee_name}</div>
                                            </div>
                                        </div>

                                        {/* Step 3: Manager Approval */}
                                        <div className="timeline-node">
                                            <div className={`timeline-icon ${
                                                selectedRequest.status === 'APPROVED' ? 'completed' :
                                                selectedRequest.status === 'REJECTED' ? 'declined' : 'pending'
                                            }`}>
                                                <Shield size={10} />
                                            </div>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 800, color: '#1e293b' }}>Manager / Admin Approval</div>
                                                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                                                    Roster State: <span style={{ fontWeight: 800 }}>{selectedRequest.status}</span>
                                                </div>
                                                {selectedRequest.admin_notes && (
                                                    <div style={{ marginTop: '6px', background: '#fef2f2', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontStyle: 'italic', borderLeft: '3px solid #fecaca' }}>
                                                        Notes: "{selectedRequest.admin_notes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Container */}
                                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {/* Determine user context for actions */}
                                        {(() => {
                                            const isTargetEmployee = user && (String(selectedRequest.employee) === String(user.employee_profile_id));
                                            const showConsentActions = selectedRequest.status === 'PENDING_CONSENT' && isTargetEmployee;
                                            
                                            // Show approval if supervisor and not target employee (or is superuser)
                                            const showApprovalActions = (selectedRequest.status === 'PENDING_APPROVAL' || selectedRequest.status === 'PENDING_CONSENT') && (!isTargetEmployee || user?.is_superuser);

                                            if (selectedRequest.status === 'APPROVED' || selectedRequest.status === 'REJECTED') {
                                                return (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: selectedRequest.status === 'APPROVED' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${selectedRequest.status === 'APPROVED' ? '#bbf7d0' : '#fecaca'}` }}>
                                                        {selectedRequest.status === 'APPROVED' ? <CheckCircle color="#15803d" size={16} /> : <XCircle color="#b91c1c" size={16} />}
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 750, color: selectedRequest.status === 'APPROVED' ? '#15803d' : '#b91c1c' }}>
                                                            Workflow Completed: Request is {selectedRequest.status}
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {showConsentActions && (
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <button
                                                                onClick={() => handleConsent(selectedRequest.id, 'accept')}
                                                                disabled={actioningId !== null}
                                                                style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                            >
                                                                <CheckCircle2 size={16} /> Sign & Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleConsent(selectedRequest.id, 'decline')}
                                                                disabled={actioningId !== null}
                                                                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                            >
                                                                <XCircle size={16} /> Decline
                                                            </button>
                                                        </div>
                                                    )}

                                                    {showApprovalActions && (
                                                        <>
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <button
                                                                    onClick={() => handleApprove(selectedRequest.id)}
                                                                    disabled={actioningId !== null}
                                                                    style={{ flex: 1, background: '#6366f1', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                                >
                                                                    <CheckCircle size={16} /> Approve Schedule
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(selectedRequest.id)}
                                                                    disabled={actioningId !== null}
                                                                    style={{ flex: 1, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                                >
                                                                    <Ban size={16} /> Reject Request
                                                                </button>
                                                            </div>

                                                            {/* Admin Override */}
                                                            {user?.is_superuser && selectedRequest.status === 'PENDING_CONSENT' && (
                                                                <button
                                                                    onClick={() => handleOverride(selectedRequest.id)}
                                                                    disabled={actioningId !== null}
                                                                    style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, width: '100%' }}
                                                                >
                                                                    Force Admin Override (Bypass Consent)
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {!showConsentActions && !showApprovalActions && (
                                                        <div style={{ textAlign: 'center', background: '#f1f5f9', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                            <Info size={14} color="#64748b" />
                                                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Awaiting actions from other participants.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                                    <Info size={24} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>Select a request from the list to preview details & actions.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Initiate Shift Request Form */}
                    {rightTab === 'create' && (
                        <div className="dashboard-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '1.25rem' }}>
                                <Send size={16} color="#4f46e5" />
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 850, color: '#0f172a' }}>Initiate Shift Change</h3>
                            </div>

                            <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Employee Selector */}
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>TARGET EMPLOYEE</label>
                                    {!selectedEmployee ? (
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px' }}>
                                                <Search size={14} color="#94a3b8" style={{ marginRight: '8px' }} />
                                                <input
                                                    type="text"
                                                    placeholder="Search employee by name/code..."
                                                    value={employeeSearch}
                                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1e293b' }}
                                                />
                                            </div>
                                            {filteredEmployees.length > 0 && (
                                                <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', zIndex: 10, marginTop: '3px', maxHeight: '180px', overflowY: 'auto' }}>
                                                    {filteredEmployees.map(e => (
                                                        <div key={e.id} className="search-result-item" onClick={() => { setSelectedEmployee(e); setEmployeeSearch(''); }}>
                                                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{e.name}</div>
                                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Code: {e.employee_code}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.9rem' }}>{selectedEmployee.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Code: {selectedEmployee.employee_code}</div>
                                            </div>
                                            <button type="button" onClick={() => setSelectedEmployee(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Clear</button>
                                        </div>
                                    )}
                                </div>

                                {/* Position Selector */}
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>TARGET POSITION</label>
                                    {!selectedPosition ? (
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px' }}>
                                                <Search size={14} color="#94a3b8" style={{ marginRight: '8px' }} />
                                                <input
                                                    type="text"
                                                    placeholder="Search position by name/code..."
                                                    value={positionSearch}
                                                    onChange={(e) => setPositionSearch(e.target.value)}
                                                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1e293b' }}
                                                />
                                            </div>
                                            {filteredPositions.length > 0 && (
                                                <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', zIndex: 10, marginTop: '3px', maxHeight: '180px', overflowY: 'auto' }}>
                                                    {filteredPositions.map(p => (
                                                        <div key={p.id} className="search-result-item" onClick={() => { setSelectedPosition(p); setPositionSearch(''); }}>
                                                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Code: {p.code}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.9rem' }}>{selectedPosition.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#1d4ed8' }}>Code: {selectedPosition.code}</div>
                                            </div>
                                            <button type="button" onClick={() => setSelectedPosition(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Clear</button>
                                        </div>
                                    )}
                                </div>

                                {/* Date Selector */}
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>EFFECTIVE DATE</label>
                                    <input
                                        type="date"
                                        value={reqDate}
                                        onChange={(e) => setReqDate(e.target.value)}
                                        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', padding: '8px 12px', fontSize: '0.85rem', color: '#1e293b' }}
                                    />
                                </div>

                                {/* Shift Selector */}
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>TO SHIFT (TARGET)</label>
                                    <select
                                        value={selectedShift ? selectedShift.id : ''}
                                        onChange={(e) => {
                                            const sh = shifts.find(s => String(s.id) === e.target.value);
                                            setSelectedShift(sh || null);
                                        }}
                                        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', padding: '8px 12px', fontSize: '0.85rem', color: '#1e293b' }}
                                    >
                                        <option value="">-- Select Target Shift --</option>
                                        {shifts.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.start_time?.substring(0, 5)} - {s.end_time?.substring(0, 5)})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reason / Comments */}
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>REASON FOR CHANGE</label>
                                    <textarea
                                        rows="3"
                                        placeholder="State reason (e.g. coverage, operational urgency...)"
                                        value={reqReason}
                                        onChange={(e) => setReqReason(e.target.value)}
                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none', padding: '10px', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !selectedEmployee || !selectedPosition || !selectedShift || !reqDate}
                                    style={{
                                        background: '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '0.75rem 1.25rem',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        opacity: (!selectedEmployee || !selectedPosition || !selectedShift || !reqDate) ? 0.6 : 1
                                    }}
                                >
                                    {submitting ? <RefreshCw size={14} className="animate-spin" /> : 'Send Request'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShiftChangeRequests;
