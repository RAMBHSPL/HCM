import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar, Search, RefreshCw, User, Shield, Info, Users, CheckCircle, Ban, Send, FileText, ArrowRight, CheckCircle2, XCircle, Clock, Eye, AlertTriangle, Layers, Filter, CheckSquare, Sparkles
} from 'lucide-react';
import api from '../api';
import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';
import SearchableSelect from '../components/SearchableSelect';

const ShiftChangeRequests = () => {
    const dataContext = useData() || {};
    const user = dataContext.user;
    const globalShifts = dataContext.shifts || [];
    const globalEmployees = dataContext.allEmployees || [];
    const globalPositions = dataContext.positions || [];
    const { loadEmployeesIfNeeded, loadPositionsIfNeeded } = dataContext;

    const [requests, setRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [positions, setPositions] = useState([]);
    const [shifts, setShifts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [actioningId, setActioningId] = useState(null);

    // Day-by-day roster cards for employee
    const [myRosterCards, setMyRosterCards] = useState([]);

    // Selected Request for detailed view
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rightTab, setRightTab] = useState('create'); // 'create', 'details', 'approvals'

    // Form states
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [selectedShift, setSelectedShift] = useState(null);
    const [reqDate, setReqDate] = useState('');
    const [reqReason, setReqReason] = useState('');

    const availableTargetShifts = useMemo(() => {
        const fallback = shifts.length > 0 ? shifts : globalShifts;
        if (selectedPosition && selectedPosition.shifts_details && selectedPosition.shifts_details.length > 0) {
            return selectedPosition.shifts_details;
        }
        if (selectedPosition && selectedPosition.shifts && selectedPosition.shifts.length > 0 && fallback.length > 0) {
            const posShiftIds = selectedPosition.shifts.map(s => typeof s === 'object' ? s.id : s);
            const matched = fallback.filter(s => posShiftIds.includes(s.id));
            if (matched.length > 0) return matched;
        }
        return fallback;
    }, [selectedPosition, shifts, globalShifts]);

    // Current shift lookup for selected date
    const [currentShiftInfo, setCurrentShiftInfo] = useState(null);
    const [fetchingCurrentShift, setFetchingCurrentShift] = useState(false);

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
            if (globalShifts.length > 0) {
                setShifts(globalShifts);
                return;
            }
            const shiftRes = await api.get('shifts/').catch(() => []);
            if (Array.isArray(shiftRes) && shiftRes.length > 0) setShifts(shiftRes);
        } catch (err) {
            console.error("Error loading dropdown data:", err);
        }
    };


    const fetchMyRosterCards = async (empId) => {
        if (!empId) return;
        try {
            const res = await api.get(`position-shift-rosters/?employee=${empId}`);
            const data = res.data || res;
            const list = Array.isArray(data) ? data : data.results || [];
            const sorted = list.sort((a, b) => new Date(a.date) - new Date(b.date));
            setMyRosterCards(sorted.slice(0, 14)); // Show next 14 days
        } catch (err) {
            console.error("Error fetching roster cards:", err);
        }
    };

    // Reactively sync global data context lists as they complete loading
    useEffect(() => {
        if (employees.length === 0 && globalEmployees.length > 0) setEmployees(globalEmployees);
        if (positions.length === 0 && globalPositions.length > 0) setPositions(globalPositions);
        if (shifts.length === 0 && globalShifts.length > 0) setShifts(globalShifts);
    }, [globalEmployees, globalPositions, globalShifts]);

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            try {
                await fetchRequests();
                fetchDropdowns(); // Non-blocking background fetch
            } catch (err) {
                console.error("Error loading dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, []);

    // Auto-fill logged-in employee & position directly from user object
    useEffect(() => {
        if (user && user.employee_profile_id && !selectedEmployee) {
            let myEmp = employees.find(e => String(e.id) === String(user.employee_profile_id));
            if (!myEmp) {
                myEmp = {
                    id: user.employee_profile_id,
                    name: user.employee_name || user.username,
                    employee_code: user.username,
                    positions_details: user.positions_details || []
                };
            }
            setSelectedEmployee(myEmp);
        }
    }, [user, employees, selectedEmployee]);

    // Fetch roster cards when selectedEmployee changes
    useEffect(() => {
        if (selectedEmployee) {
            fetchMyRosterCards(selectedEmployee.id);
        } else if (user && user.employee_profile_id) {
            fetchMyRosterCards(user.employee_profile_id);
        }
    }, [user, selectedEmployee]);

    // Auto-fill position when selectedEmployee changes
    useEffect(() => {
        if (selectedEmployee && !selectedPosition) {
            if (selectedEmployee.positions_details && selectedEmployee.positions_details.length > 0) {
                setSelectedPosition(selectedEmployee.positions_details[0]);
            } else if (selectedEmployee.positions && selectedEmployee.positions.length > 0) {
                const firstP = selectedEmployee.positions[0];
                const targetId = typeof firstP === 'object' ? firstP.id : firstP;
                const matchedPos = positions.find(p => String(p.id) === String(targetId) || p.name === targetId);
                if (matchedPos) {
                    setSelectedPosition(matchedPos);
                } else if (typeof firstP === 'object' && firstP.name) {
                    setSelectedPosition(firstP);
                }
            } else if (positions.length > 0) {
                setSelectedPosition(positions[0]);
            }
        }
    }, [selectedEmployee, positions, selectedPosition]);

    // Auto-fetch current shift when employee & date are selected
    useEffect(() => {
        if (selectedEmployee && reqDate) {
            // Instant lookup from already loaded myRosterCards
            const matchCard = myRosterCards.find(r => String(r.date) === String(reqDate));
            if (matchCard && matchCard.shift_name) {
                const startT = matchCard.shift_start_time?.substring(0, 5) || '';
                const endT = matchCard.shift_end_time?.substring(0, 5) || '';
                setCurrentShiftInfo(`${matchCard.shift_name}${startT ? ` (${startT} - ${endT})` : ''}`);
                setFetchingCurrentShift(false);
                return;
            }

            const lookupCurrentShift = async () => {
                setFetchingCurrentShift(true);
                try {
                    const res = await api.get(`position-shift-rosters/?employee=${selectedEmployee.id}&date=${reqDate}`);
                    const data = res.data || res;
                    const results = data.results || data;
                    if (Array.isArray(results) && results.length > 0) {
                        const rost = results[0];
                        const startT = rost.shift_start_time?.substring(0, 5) || '';
                        const endT = rost.shift_end_time?.substring(0, 5) || '';
                        setCurrentShiftInfo(rost.shift_name ? `${rost.shift_name}${startT ? ` (${startT} - ${endT})` : ''}` : 'Morning Shift (Default Assigned)');
                    } else {
                        setCurrentShiftInfo('Morning Shift (Default Assigned)');
                    }
                } catch (err) {
                    setCurrentShiftInfo('Morning Shift (Default Assigned)');
                } finally {
                    setFetchingCurrentShift(false);
                }
            };
            lookupCurrentShift();
        } else {
            setCurrentShiftInfo('Morning Shift (Default Assigned)');
            setFetchingCurrentShift(false);
        }
    }, [selectedEmployee, reqDate, myRosterCards]);

    // Summary statistics
    const stats = useMemo(() => {
        const total = requests.length;
        const pendingConsent = requests.filter(r => r.status === 'PENDING_CONSENT').length;
        const pendingApproval = requests.filter(r => r.status === 'PENDING_APPROVAL').length;
        const approved = requests.filter(r => r.status === 'APPROVED').length;
        return { total, pendingConsent, pendingApproval, approved };
    }, [requests]);

    // Filter requests needing action from current user
    const actionableRequests = useMemo(() => {
        return requests.filter(req => {
            const isTargetEmp = user && String(req.employee) === String(user.employee_profile_id);
            if (req.status === 'PENDING_CONSENT' && isTargetEmp) return true;
            if ((req.status === 'PENDING_APPROVAL' || req.status === 'PENDING_CONSENT') && (!isTargetEmp || user?.is_superuser)) return true;
            return false;
        });
    }, [requests, user]);


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
            setSelectedShift(null);
            setReqDate('');
            setReqReason('');
            setCurrentShiftInfo(null);
            alert("Shift Change Request submitted successfully!");
            await fetchRequests();
            if (selectedEmployee) fetchMyRosterCards(selectedEmployee.id);
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
            if (selectedEmployee) fetchMyRosterCards(selectedEmployee.id);
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
            if (selectedEmployee) fetchMyRosterCards(selectedEmployee.id);
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
                    padding: 0.8rem 1.4rem; border: none; border-bottom: 3px solid transparent;
                    background: none; font-weight: 750; font-size: 0.88rem; cursor: pointer;
                    color: #64748b; transition: all 0.2s; display: flex; align-items: center; gap: 8px;
                }
                .tab-btn.active {
                    color: #4f46e5; border-bottom-color: #4f46e5; background: #eef2ff; border-radius: 8px 8px 0 0;
                }
                .roster-card {
                    background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem;
                    min-width: 175px; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .roster-card:hover {
                    transform: translateY(-3px); border-color: #6366f1; box-shadow: 0 8px 16px rgba(99, 102, 241, 0.12);
                }
                .roster-card.active-card {
                    background: #eef2ff; border: 2px solid #4f46e5; box-shadow: 0 6px 12px rgba(79, 70, 229, 0.15);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', marginBottom: '4px' }}>
                        <Calendar size={18} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Roster & Shift Operations</span>
                    </div>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Shift Change Requests</h2>
                </div>
                <div>
                    <button onClick={() => { fetchRequests(); fetchDropdowns(); if (selectedEmployee) fetchMyRosterCards(selectedEmployee.id); }} style={{ background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.65rem 1.3rem', cursor: 'pointer', fontWeight: 750, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <RefreshCw size={14} /> Refresh Roster Data
                    </button>
                </div>
            </div>

            {/* Visual Day-by-Day Roster Shift Cards Carousel */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                        <Sparkles size={18} color="#4f46e5" />
                        <span style={{ fontSize: '1rem', fontWeight: 850 }}>My Assigned Shift Roster (Click any day to request a shift change)</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Showing upcoming 14 days schedule</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '10px' }}>
                    {myRosterCards.length > 0 ? (
                        myRosterCards.map(card => {
                            const isCardSelected = reqDate === card.date;
                            return (
                                <div 
                                    key={card.id} 
                                    className={`roster-card ${isCardSelected ? 'active-card' : ''}`}
                                    onClick={() => {
                                        setReqDate(card.date);
                                        setCurrentShiftInfo(card.shift_name ? `${card.shift_name} (${card.shift_start_time?.substring(0,5) || ''} - ${card.shift_end_time?.substring(0,5) || ''})` : 'Morning Shift');
                                        setRightTab('create');
                                    }}
                                >
                                    <div style={{ fontSize: '0.72rem', fontWeight: 850, color: '#64748b', textTransform: 'uppercase' }}>
                                        {new Date(card.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
                                        {card.shift_name || 'Morning Shift'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                        <span style={{ fontSize: '0.68rem', color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                            Assigned
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            Change <ArrowRight size={10} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: '1rem', background: 'white', border: '1px dashed #cbd5e1', borderRadius: '12px', fontSize: '0.82rem', color: '#64748b', width: '100%' }}>
                            No active shift cards found for the selected employee. Select an employee to view their day-by-day shift roster.
                        </div>
                    )}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', alignItems: 'start' }}>
                
                {/* Left Side: Requests Registry */}
                <div className="dashboard-card" style={{ padding: '2rem', minHeight: '600px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Layers size={20} color="#4f46e5" />
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 850, color: '#0f172a' }}>Registry & Audit Logs</h3>
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

                            <div style={{ width: '240px', display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px' }}>
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
                                        <th style={{ textAlign: 'center' }}>Action</th>
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
                                                        <span>{req.from_shift_name || 'Morning Shift'}</span>
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
                                                    <button style={{ background: '#eef2ff', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontWeight: 750, fontSize: '0.75rem' }}>
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ padding: '5rem 2rem', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                            <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
                            <h4 style={{ margin: 0, color: '#64748b', fontSize: '1rem', fontWeight: 800 }}>No requests logged yet</h4>
                            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Click any shift day card above or use the <strong>Initiate Request</strong> tab to submit a shift change!</p>
                        </div>
                    )}
                </div>

                {/* Right Side: Tabbed Workspace */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Workspace Header Tabs */}
                    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: 'white', borderRadius: '12px 12px 0 0', padding: '0 8px' }}>
                        <button 
                            className={`tab-btn ${rightTab === 'create' ? 'active' : ''}`}
                            onClick={() => setRightTab('create')}
                        >
                            <Send size={16} /> Initiate Request
                        </button>
                        <button 
                            className={`tab-btn ${rightTab === 'details' ? 'active' : ''}`}
                            onClick={() => setRightTab('details')}
                        >
                            <Eye size={16} /> Request Details
                        </button>
                        <button 
                            className={`tab-btn ${rightTab === 'approvals' ? 'active' : ''}`}
                            onClick={() => setRightTab('approvals')}
                        >
                            <CheckSquare size={16} /> Approvals Queue ({actionableRequests.length})
                        </button>
                    </div>

                    {/* Tab 1: Initiate Shift Request Form */}
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
                                        <SearchableSelect
                                            endpoint="employees/all_data"
                                            value=""
                                            onChange={(e, option) => {
                                                setSelectedEmployee(option);
                                            }}
                                            placeholder="Search employee by name/code..."
                                        />
                                    ) : (
                                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.9rem' }}>{selectedEmployee.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Code: {selectedEmployee.employee_code}</div>
                                            </div>
                                            <button type="button" onClick={() => setSelectedEmployee(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Change</button>
                                        </div>
                                    )}
                                </div>

                                {/* Position Selector */}
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>TARGET POSITION</label>
                                    {!selectedPosition ? (
                                        <SearchableSelect
                                            endpoint="positions/all_data"
                                            value=""
                                            onChange={(e, option) => {
                                                setSelectedPosition(option);
                                            }}
                                            placeholder="Search position by name/code..."
                                        />
                                    ) : (
                                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.85rem' }}>{selectedPosition.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#1d4ed8' }}>Code: {selectedPosition.code}</div>
                                            </div>
                                            <button type="button" onClick={() => setSelectedPosition(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Change</button>
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
                                        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', padding: '10px 12px', fontSize: '0.85rem', color: '#1e293b' }}
                                    />
                                </div>

                                {/* Current Shift vs Target Shift Live Comparison Box */}
                                {reqDate && (
                                    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '12px 14px' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7e22ce', textTransform: 'uppercase', marginBottom: '6px' }}>Shift Transfer Comparison</div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.7rem', color: '#6b21a8' }}>Current Shift:</div>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#581c87' }}>
                                                    {fetchingCurrentShift ? 'Checking roster...' : (currentShiftInfo || 'Morning Shift')}
                                                </div>
                                            </div>
                                            <ArrowRight size={16} color="#9333ea" />
                                            <div style={{ flex: 1, textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#6b21a8' }}>Target Shift:</div>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4c1d95' }}>
                                                    {selectedShift ? selectedShift.name : 'Select below...'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Shift Selector */}
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>TO SHIFT (TARGET)</label>
                                    <select
                                        value={selectedShift ? selectedShift.id : ''}
                                        onChange={(e) => {
                                            const sh = availableTargetShifts.find(s => String(s.id) === e.target.value);
                                            setSelectedShift(sh || null);
                                        }}
                                        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', padding: '10px 12px', fontSize: '0.85rem', color: '#1e293b' }}
                                    >
                                        <option value="">-- Select Target Shift --</option>
                                        {availableTargetShifts.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.start_time ? `(${s.start_time.substring(0, 5)} - ${s.end_time?.substring(0, 5)})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reason / Comments */}
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>REASON FOR CHANGE</label>
                                    <textarea
                                        rows="3"
                                        placeholder="State reason (e.g. personal request, operational urgency...)"
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
                                        padding: '0.85rem 1.25rem',
                                        fontWeight: 800,
                                        fontSize: '0.95rem',
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
                                    {submitting ? <RefreshCw size={14} className="animate-spin" /> : 'Send Shift Request'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Tab 2: Workflow Details & Actions */}
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
                                        {(() => {
                                            const isTargetEmployee = user && (String(selectedRequest.employee) === String(user.employee_profile_id));
                                            const showConsentActions = selectedRequest.status === 'PENDING_CONSENT' && isTargetEmployee;
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
                                                        </>
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

                    {/* Tab 3: Approvals Queue */}
                    {rightTab === 'approvals' && (
                        <div className="dashboard-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '1.25rem' }}>
                                <CheckSquare size={16} color="#4f46e5" />
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 850, color: '#0f172a' }}>Pending Approvals Queue</h3>
                            </div>

                            {actionableRequests.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {actionableRequests.map(req => {
                                        const isTargetEmp = user && String(req.employee) === String(user.employee_profile_id);
                                        return (
                                            <div key={req.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 850, color: '#0f172a', fontSize: '1rem' }}>{req.employee_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Position: {req.position_name}</div>
                                                    </div>
                                                    <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, background: '#fef3c7', color: '#b45309' }}>
                                                        {req.status.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#4338ca', fontWeight: 750, margin: '8px 0' }}>
                                                    <span>{req.from_shift_name || 'Morning Shift'}</span>
                                                    <ArrowRight size={12} />
                                                    <span>{req.to_shift_name}</span>
                                                    <span style={{ color: '#64748b', fontWeight: 500 }}>(Date: {new Date(req.date).toLocaleDateString()})</span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                    {isTargetEmp && req.status === 'PENDING_CONSENT' ? (
                                                        <>
                                                            <button onClick={() => handleConsent(req.id, 'accept')} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                                                                Accept
                                                            </button>
                                                            <button onClick={() => handleConsent(req.id, 'decline')} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                                                                Decline
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleApprove(req.id)} style={{ flex: 1, background: '#6366f1', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                                                                Approve
                                                            </button>
                                                            <button onClick={() => handleReject(req.id)} style={{ flex: 1, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ padding: '3rem 1rem', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                                    <CheckCircle size={36} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                                    <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 800 }}>No items awaiting your approval</h4>
                                    <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>Requests assigned to you will appear here.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShiftChangeRequests;
