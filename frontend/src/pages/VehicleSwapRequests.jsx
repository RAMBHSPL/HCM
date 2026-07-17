import React, { useState, useEffect, useMemo } from 'react';
import {
    Truck, Search, HelpCircle, ArrowLeftRight, Check,
    AlertTriangle, History, RefreshCw, User, Shield, Info,
    MapPin, Globe, Users, ChevronRight, CheckCircle2, XCircle, FileText, Send, CheckCircle, Ban
} from 'lucide-react';
import api from '../api';
import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';

const VehicleSwapRequests = () => {
    const { user, offices, fetchDropdownData } = useData();
    const [swapRequests, setSwapRequests] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [loadingCandidates, setLoadingCandidates] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [actioningRequestId, setActioningRequestId] = useState(null);

    // Request Form State
    const [reqFromOffice, setReqFromOffice] = useState(null);
    const [reqToOffice, setReqToOffice] = useState(null);
    const [reqSwapCrew, setReqSwapCrew] = useState(true);
    const [reqReason, setReqReason] = useState('');
    const [searchReqFrom, setSearchReqFrom] = useState('');
    const [searchReqTo, setSearchReqTo] = useState('');
    const [requestSearch, setRequestSearch] = useState('');

    const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
            const res = await api.get('vehicle-swap-requests/');
            const data = res.data || res;
            const results = data.results || data;
            setSwapRequests(Array.isArray(results) ? results : []);
        } catch (err) {
            console.error("Error loading requests:", err);
        } finally {
            setLoadingRequests(false);
        }
    };

    const fetchCandidates = async () => {
        setLoadingCandidates(true);
        try {
            const res = await api.get('offices/swap-candidates/');
            const data = res.data || res;
            const results = data.results || data;
            setCandidates(Array.isArray(results) ? results : []);
        } catch (err) {
            console.error("Error loading candidates:", err);
        } finally {
            setLoadingCandidates(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchCandidates();
    }, []);

    // Filter office searches
    const filteredReqFromOffices = useMemo(() => {
        if (!searchReqFrom.trim()) return offices.slice(0, 5);
        return offices.filter(o =>
            o.name?.toLowerCase().includes(searchReqFrom.toLowerCase()) ||
            o.sac?.toLowerCase().includes(searchReqFrom.toLowerCase())
        ).slice(0, 5);
    }, [offices, searchReqFrom]);

    const filteredReqToOffices = useMemo(() => {
        const list = candidates.filter(o => o.id !== reqFromOffice?.id);
        if (!searchReqTo.trim()) return list.slice(0, 5);
        return list.filter(o =>
            o.name?.toLowerCase().includes(searchReqTo.toLowerCase()) ||
            o.sac?.toLowerCase().includes(searchReqTo.toLowerCase()) ||
            o.vehicle_code?.toLowerCase().includes(searchReqTo.toLowerCase()) ||
            o.vehicle_no?.toLowerCase().includes(searchReqTo.toLowerCase())
        ).slice(0, 5);
    }, [candidates, searchReqTo, reqFromOffice]);

    // Submit Swap Request
    const handleCreateRequest = async (e) => {
        e.preventDefault();
        if (!reqFromOffice || !reqToOffice) {
            alert("Please select both From and To vehicles.");
            return;
        }
        setSubmitting(true);
        try {
            await api.post('vehicle-swap-requests/', {
                from_office: reqFromOffice.id,
                to_office: reqToOffice.id,
                swap_crew: reqSwapCrew,
                reason: reqReason
            });
            setReqFromOffice(null);
            setReqToOffice(null);
            setReqReason('');
            setSearchReqFrom('');
            setSearchReqTo('');
            alert("Swap request submitted successfully!");
            fetchRequests();
        } catch (err) {
            console.error("Request creation failed:", err);
            alert("Failed to submit request: " + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    // Approve Request
    const handleApproveRequest = async (id) => {
        if (!window.confirm("Are you sure you want to approve this swap request and execute the vehicle/number swap?")) return;
        setActioningRequestId(id);
        try {
            await api.post(`vehicle-swap-requests/${id}/approve/`);
            alert("Swap request approved and vehicles swapped successfully!");
            await Promise.all([fetchRequests(), fetchDropdownData('offices', null, true)]);
        } catch (err) {
            console.error("Approval failed:", err);
            alert("Failed to approve request: " + (err.response?.data?.error || err.message));
        } finally {
            setActioningRequestId(null);
        }
    };

    // Reject Request
    const handleRejectRequest = async (id) => {
        const reason = window.prompt("Enter rejection reason:");
        if (reason === null) return;
        setActioningRequestId(id);
        try {
            await api.post(`vehicle-swap-requests/${id}/reject/`, { comments: reason });
            alert("Swap request rejected.");
            await fetchRequests();
        } catch (err) {
            console.error("Rejection failed:", err);
            alert("Failed to reject request: " + (err.response?.data?.error || err.message));
        } finally {
            setActioningRequestId(null);
        }
    };

    // Filter Requests for search
    const filteredRequests = useMemo(() => {
        if (!requestSearch.trim()) return swapRequests;
        return swapRequests.filter(req =>
            req.from_office_name?.toLowerCase().includes(requestSearch.toLowerCase()) ||
            req.from_office_sac?.toLowerCase().includes(requestSearch.toLowerCase()) ||
            req.to_office_name?.toLowerCase().includes(requestSearch.toLowerCase()) ||
            req.to_office_sac?.toLowerCase().includes(requestSearch.toLowerCase()) ||
            req.requester_name?.toLowerCase().includes(requestSearch.toLowerCase())
        );
    }, [swapRequests, requestSearch]);

    if (loadingRequests || loadingCandidates) {
        return <BavyaSpinner label="Loading Swap Requests dashboard..." />;
    }

    return (
        <div style={{ padding: '2rem 3rem', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            
            <style>
                {`
                .swap-card {
                    background: white; border: 1px solid #e2e8f0; border-radius: 16px;
                    padding: 1.5rem; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }
                .swap-card:hover {
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.07); border-color: #cbd5e1;
                }
                .search-result-item {
                    padding: 10px 14px; cursor: pointer; transition: background 0.2s;
                    border-bottom: 1px solid #f1f5f9; font-size: 0.9rem;
                }
                .search-result-item:hover {
                    background: #f1f5f9;
                }
                .toggle-switch {
                    position: relative; display: inline-block; width: 44px; height: 24px;
                }
                .toggle-switch input { opacity: 0; width: 0; height: 0; }
                .slider {
                    position: absolute; cursor: pointer; inset: 0; background-color: #cbd5e1;
                    transition: .3s; border-radius: 24px;
                }
                .slider:before {
                    position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
                    background-color: white; transition: .3s; border-radius: 50%;
                }
                input:checked + .slider { background-color: #4f46e5; }
                input:checked + .slider:before { transform: translateX(20px); }
                `}
            </style>

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', marginBottom: '4px' }}>
                        <Truck size={18} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>EMS Fleet Management</span>
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>Vehicle Swap Requests</h2>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { fetchRequests(); fetchCandidates(); fetchDropdownData('offices', null, true); }} style={{ background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.6rem 1.2rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        <RefreshCw size={14} /> Refresh Data
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                
                {/* Left side: Requests List */}
                <div className="swap-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={20} color="#4f46e5" />
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 850, color: '#0f172a' }}>Requests Registry Log</h3>
                        </div>
                        <div style={{ width: '300px', display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '6px 12px' }}>
                            <Search size={14} color="#94a3b8" style={{ marginRight: '8px' }} />
                            <input
                                type="text"
                                placeholder="Filter by office or requester..."
                                value={requestSearch}
                                onChange={(e) => setRequestSearch(e.target.value)}
                                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.8rem', width: '100%', color: '#1e293b' }}
                            />
                        </div>
                    </div>

                    {filteredRequests.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 800 }}>
                                        <th style={{ padding: '12px 10px' }}>REQUEST DATE</th>
                                        <th style={{ padding: '12px 10px' }}>REQUESTER</th>
                                        <th style={{ padding: '12px 10px' }}>FROM (SOURCE)</th>
                                        <th style={{ padding: '12px 10px' }}>TO (TARGET)</th>
                                        <th style={{ padding: '12px 10px' }}>CREW</th>
                                        <th style={{ padding: '12px 10px' }}>STATUS</th>
                                        <th style={{ padding: '12px 10px' }}>REASON / COMMENTS</th>
                                        <th style={{ padding: '12px 10px', textAlign: 'center' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map(req => {
                                        const isRequesterSelf = user && (String(req.requester) === String(user.employee_profile_id));
                                        const showActionButtons = req.status === 'PENDING' && (!isRequesterSelf || user?.is_superuser);

                                        return (
                                            <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '14px 10px', fontWeight: 650, color: '#1e293b' }}>
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '14px 10px', fontWeight: 700, color: '#475569' }}>
                                                    {req.requester_name}
                                                </td>
                                                <td style={{ padding: '14px 10px' }}>
                                                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{req.from_office_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                                        {req.from_office_sac} • Vehicle: <span style={{ color: '#4f46e5', fontWeight: 800 }}>{req.from_vehicle_code}</span> ({req.from_vehicle_no || '--'})
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 10px' }}>
                                                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{req.to_office_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                                        {req.to_office_sac} • Vehicle: <span style={{ color: '#4f46e5', fontWeight: 800 }}>{req.to_vehicle_code}</span> ({req.to_vehicle_no || '--'})
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 10px' }}>
                                                    <span style={{
                                                        padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        background: req.swap_crew ? '#e0e7ff' : '#f1f5f9',
                                                        color: req.swap_crew ? '#4f46e5' : '#475569'
                                                    }}>
                                                        {req.swap_crew ? 'YES' : 'NO'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 10px' }}>
                                                    {req.status === 'PENDING' && (
                                                        <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', background: '#fef3c7', color: '#d97706', fontWeight: 800 }}>
                                                            PENDING
                                                        </span>
                                                    )}
                                                    {req.status === 'APPROVED' && (
                                                        <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', background: '#dcfce7', color: '#15803d', fontWeight: 800 }}>
                                                            APPROVED
                                                        </span>
                                                    )}
                                                    {req.status === 'REJECTED' && (
                                                        <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', fontWeight: 800 }}>
                                                            REJECTED
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '14px 10px', fontSize: '0.8rem', color: '#64748b', maxWidth: '200px', wordWrap: 'break-word' }}>
                                                    {req.reason && <div><strong>Reason:</strong> {req.reason}</div>}
                                                    {req.comments && <div><strong>Comments:</strong> {req.comments}</div>}
                                                </td>
                                                <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                                                    {showActionButtons ? (
                                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => handleApproveRequest(req.id)}
                                                                disabled={actioningRequestId !== null}
                                                                title="Approve Request"
                                                                style={{ background: '#dcfce7', border: 'none', padding: '6px 8px', borderRadius: '8px', cursor: 'pointer', color: '#166534', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                                                            >
                                                                <CheckCircle size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectRequest(req.id)}
                                                                disabled={actioningRequestId !== null}
                                                                title="Reject Request"
                                                                style={{ background: '#fee2e2', border: 'none', padding: '6px 8px', borderRadius: '8px', cursor: 'pointer', color: '#991b1b', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                                                            >
                                                                <Ban size={15} />
                                                            </button>
                                                        </div>
                                                    ) : req.status === 'PENDING' ? (
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Self Request</span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Processed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ padding: '4rem', textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
                            <FileText size={36} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 650 }}>No swap requests logged yet.</span>
                        </div>
                    )}
                </div>

                {/* Right side: Submission form */}
                <div className="swap-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                        <Send size={16} color="#4f46e5" />
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Submit Swap Request</h3>
                    </div>

                    <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Source Selector (From Office) */}
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>FROM OFFICE (YOUR VEHICLE)</label>
                            {!reqFromOffice ? (
                                <div style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px' }}>
                                        <Search size={14} color="#94a3b8" style={{ marginRight: '8px' }} />
                                        <input
                                            type="text"
                                            placeholder="Search accessible offices..."
                                            value={searchReqFrom}
                                            onChange={(e) => setSearchReqFrom(e.target.value)}
                                            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1e293b' }}
                                        />
                                    </div>
                                    {filteredReqFromOffices.length > 0 && (
                                        <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', zIndex: 10, marginTop: '3px', maxHeight: '180px', overflowY: 'auto' }}>
                                            {filteredReqFromOffices.map(o => (
                                                <div key={o.id} className="search-result-item" style={{ padding: '8px 10px' }} onClick={() => { setReqFromOffice(o); setSearchReqFrom(''); }}>
                                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{o.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SAC: {o.sac} • Vehicle: {o.vehicle_code || 'None'} ({o.vehicle_no || '--'})</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.9rem' }}>{reqFromOffice.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                                            SAC: {reqFromOffice.sac} • Code: <strong>{reqFromOffice.vehicle_code}</strong> ({reqFromOffice.vehicle_no || '--'})
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setReqFromOffice(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Clear</button>
                                </div>
                            )}
                        </div>

                        {/* Target Selector (To Office) */}
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>TO OFFICE (TARGET VEHICLE)</label>
                            {!reqToOffice ? (
                                <div style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px' }}>
                                        <Search size={14} color="#94a3b8" style={{ marginRight: '8px' }} />
                                        <input
                                            type="text"
                                            placeholder="Search swap candidate vehicles..."
                                            value={searchReqTo}
                                            onChange={(e) => setSearchReqTo(e.target.value)}
                                            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1e293b' }}
                                        />
                                    </div>
                                    {filteredReqToOffices.length > 0 && (
                                        <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', zIndex: 10, marginTop: '3px', maxHeight: '180px', overflowY: 'auto' }}>
                                            {filteredReqToOffices.map(o => (
                                                <div key={o.id} className="search-result-item" style={{ padding: '8px 10px' }} onClick={() => { setReqToOffice(o); setSearchReqTo(''); }}>
                                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{o.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SAC: {o.sac} • Vehicle: {o.vehicle_code || 'None'} ({o.vehicle_no || '--'})</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.9rem' }}>{reqToOffice.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#1d4ed8' }}>
                                            SAC: {reqToOffice.sac} • Code: <strong>{reqToOffice.vehicle_code}</strong> ({reqToOffice.vehicle_no || '--'})
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setReqToOffice(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Clear</button>
                                </div>
                            )}
                        </div>

                        {/* Swap Crew Toggle */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Swap Crew Members</span>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={reqSwapCrew} onChange={(e) => setReqSwapCrew(e.target.checked)} />
                                <span className="slider"></span>
                            </label>
                        </div>

                        {/* Request Reason */}
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>REASON FOR SWAP</label>
                            <textarea
                                rows="3"
                                placeholder="Enter details on why this swap is needed..."
                                value={reqReason}
                                onChange={(e) => setReqReason(e.target.value)}
                                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none', padding: '10px', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !reqFromOffice || !reqToOffice}
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
                                opacity: (!reqFromOffice || !reqToOffice) ? 0.6 : 1
                            }}
                        >
                            {submitting ? <RefreshCw size={14} className="animate-spin" /> : 'Send Request'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default VehicleSwapRequests;
