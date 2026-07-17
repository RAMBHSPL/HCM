import React, { useState, useEffect, useMemo } from 'react';
import {
    Truck, Search, HelpCircle, ArrowLeftRight, Check,
    AlertTriangle, History, RefreshCw, User, Shield, Info,
    MapPin, Globe, Users, ChevronRight, CheckCircle2, XCircle
} from 'lucide-react';
import api from '../api';
import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';

const VehicleSwaps = () => {
    const { offices, fetchDropdownData } = useData();
    const fetchOffices = () => fetchDropdownData('offices', null, true);
    const [swapLogs, setSwapLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Swap State
    const [officeA, setOfficeA] = useState(null);
    const [officeB, setOfficeB] = useState(null);
    const [swapCrew, setSwapCrew] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Crew Loading States
    const [crewA, setCrewA] = useState([]);
    const [crewB, setCrewB] = useState([]);
    const [loadingCrewA, setLoadingCrewA] = useState(false);
    const [loadingCrewB, setLoadingCrewB] = useState(false);

    // Search/Filters for selectors & logs
    const [searchA, setSearchA] = useState('');
    const [searchB, setSearchB] = useState('');
    const [logSearch, setLogSearch] = useState('');

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const res = await api.get('vehicle-swaps/');
            const data = res.data || res;
            const results = data.results || data;
            setSwapLogs(Array.isArray(results) ? results : []);
        } catch (err) {
            console.error("Error loading swap logs:", err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    // Load Crew A when officeA is selected
    useEffect(() => {
        if (!officeA) {
            setCrewA([]);
            return;
        }
        const loadCrewA = async () => {
            setLoadingCrewA(true);
            try {
                const res = await api.get(`positions/?office=${officeA.id}`);
                const data = res.data || res;
                const results = data.results || data;
                setCrewA(Array.isArray(results) ? results : []);
            } catch (err) {
                console.error("Failed to load Crew A:", err);
            } finally {
                setLoadingCrewA(false);
            }
        };
        loadCrewA();
    }, [officeA]);

    // Load Crew B when officeB is selected
    useEffect(() => {
        if (!officeB) {
            setCrewB([]);
            return;
        }
        const loadCrewB = async () => {
            setLoadingCrewB(true);
            try {
                const res = await api.get(`positions/?office=${officeB.id}`);
                const data = res.data || res;
                const results = data.results || data;
                setCrewB(Array.isArray(results) ? results : []);
            } catch (err) {
                console.error("Failed to load Crew B:", err);
            } finally {
                setLoadingCrewB(false);
            }
        };
        loadCrewB();
    }, [officeB]);

    // Filter offices for dropdowns
    const filteredOfficesA = useMemo(() => {
        if (!searchA.trim()) return [];
        return offices.filter(o =>
            (o.name?.toLowerCase().includes(searchA.toLowerCase()) ||
            o.sac?.toLowerCase().includes(searchA.toLowerCase())) &&
            o.id !== officeB?.id
        ).slice(0, 5);
    }, [offices, searchA, officeB]);

    const filteredOfficesB = useMemo(() => {
        if (!searchB.trim()) return [];
        return offices.filter(o =>
            (o.name?.toLowerCase().includes(searchB.toLowerCase()) ||
            o.sac?.toLowerCase().includes(searchB.toLowerCase())) &&
            o.id !== officeA?.id
        ).slice(0, 5);
    }, [offices, searchB, officeA]);

    // Execute the swap API call
    const executeSwap = async () => {
        if (!officeA || !officeB) return;
        setSubmitting(true);
        try {
            await api.post('offices/swap-vehicles/', {
                office_a_sac: officeA.sac,
                office_b_sac: officeB.sac,
                swap_crew: swapCrew
            });
            
            // Trigger UI reset
            setShowConfirmModal(false);
            setOfficeA(null);
            setOfficeB(null);
            setSearchA('');
            setSearchB('');
            
            // Refresh data
            await Promise.all([fetchOffices(), fetchLogs()]);
            alert("Vehicles and vehicle plate numbers swapped successfully!");
        } catch (err) {
            console.error("Swap failed:", err);
            alert("Vehicle swap failed: " + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    // Filter Logs for search
    const filteredLogs = useMemo(() => {
        if (!logSearch.trim()) return swapLogs;
        return swapLogs.filter(log =>
            log.sac_a?.toLowerCase().includes(logSearch.toLowerCase()) ||
            log.sac_b?.toLowerCase().includes(logSearch.toLowerCase()) ||
            log.old_vehicle_code_a?.toLowerCase().includes(logSearch.toLowerCase()) ||
            log.old_vehicle_code_b?.toLowerCase().includes(logSearch.toLowerCase()) ||
            log.triggered_by?.toLowerCase().includes(logSearch.toLowerCase())
        );
    }, [swapLogs, logSearch]);

    // Only wait for loadingLogs to finish
    if (loadingLogs) return <BavyaSpinner label="Loading Swap dashboard..." />;

    return (
        <div style={{ padding: '2.5rem 3.5rem', maxWidth: '1650px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;950&display=swap');
                
                .swap-card {
                    background: white; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 28px;
                    padding: 2.25rem; 
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
                    box-shadow: 0 4px 30px rgba(15, 23, 42, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.8);
                    position: relative; 
                    overflow: hidden;
                }
                .swap-card::before {
                    content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 6px;
                    background: transparent; transition: background 0.3s ease;
                }
                .swap-card.active-a::before {
                    background: linear-gradient(90deg, #6366f1, #818cf8);
                }
                .swap-card.active-b::before {
                    background: linear-gradient(90deg, #10b981, #34d399);
                }
                .swap-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 24px 38px -4px rgba(15, 23, 42, 0.08), 0 8px 16px -4px rgba(15, 23, 42, 0.03);
                    border-color: #cbd5e1;
                }
                .search-input-wrapper {
                    display: flex; align-items: center; background: #f8fafc; border: 1.5px solid #e2e8f0;
                    border-radius: 18px; padding: 0.9rem 1.3rem; transition: all 0.3s ease;
                    box-shadow: inset 0 2px 4px rgba(15, 23, 42, 0.02);
                }
                .search-input-wrapper:focus-within {
                    border-color: #6366f1; background: #ffffff;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), inset 0 2px 4px rgba(15, 23, 42, 0.01);
                }
                .search-result-item {
                    padding: 14px 18px; cursor: pointer; transition: all 0.2s ease;
                    border-bottom: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 4px;
                }
                .search-result-item:hover {
                    background: #f5f3ff; padding-left: 24px;
                }
                .search-result-item:last-child {
                    border-bottom: none;
                }
                .vehicle-telemetry-box {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: #ffffff; border-radius: 20px; padding: 1.5rem;
                    position: relative; box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 12px 20px -8px rgba(0, 0, 0, 0.15);
                    overflow: hidden; border: 1px solid #334155;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .vehicle-telemetry-box::after {
                    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                    background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 65%);
                    pointer-events: none;
                }
                
                /* Realistic Indian Plate Graphics */
                .real-license-plate {
                    display: inline-flex; align-items: stretch; background: #ffffff; 
                    border: 3.5px solid #1e293b; border-radius: 10px; overflow: hidden; 
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.8);
                    height: 42px; margin-top: 4px;
                }
                .real-license-plate .blue-ind-strip {
                    background: #1d4ed8; color: #ffffff; display: flex; flex-direction: column; 
                    align-items: center; justifyContent: center; padding: 0 5px; 
                    font-size: 0.52rem; fontWeight: 900; line-height: 1.1; letter-spacing: 0.02em;
                    border-right: 2px solid #1e293b;
                }
                .real-license-plate .blue-ind-strip span.circle-star {
                    font-size: 8px; margin-bottom: 2px; color: #facc15;
                }
                .real-license-plate .plate-number-text {
                    padding: 0 14px; color: #1e293b; font-weight: 950; font-size: 1.1rem; 
                    display: flex; align-items: center; justify-content: center;
                    letter-spacing: 0.08em; font-family: 'Consolas', 'Courier New', monospace; background: #facc15;
                }

                .crew-chip {
                    display: inline-flex; align-items: center; gap: 8px; font-size: 0.78rem;
                    padding: 8px 14px; background: #f8fafc; border: 1.5px solid #e2e8f0;
                    border-radius: 12px; font-weight: 650; color: #334155; transition: all 0.25s ease;
                }
                .crew-chip:hover {
                    background: #e2e8f0; border-color: #cbd5e1; transform: translateY(-2px);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                }
                .glow-pulse {
                    animation: pulseGlow 1.8s infinite alternate;
                }
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 8px rgba(99, 102, 241, 0.3), 0 0 12px rgba(99, 102, 241, 0.1); }
                    100% { box-shadow: 0 0 25px rgba(99, 102, 241, 0.8), 0 0 35px rgba(99, 102, 241, 0.4); }
                }
                .rotate-hover {
                    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .rotate-hover:hover {
                    transform: rotate(180deg) scale(1.15);
                }
                .toggle-switch {
                    position: relative; display: inline-block; width: 52px; height: 28px;
                }
                .toggle-switch input { opacity: 0; width: 0; height: 0; }
                .slider {
                    position: absolute; cursor: pointer; inset: 0; background-color: #cbd5e1;
                    transition: .4s cubic-bezier(0.16, 1, 0.3, 1); border-radius: 24px;
                }
                .slider:before {
                    position: absolute; content: ""; height: 22px; width: 22px; left: 3px; bottom: 3px;
                    background-color: white; transition: .4s cubic-bezier(0.16, 1, 0.3, 1); border-radius: 50%;
                    box-shadow: 0 3px 6px rgba(0,0,0,0.12);
                }
                input:checked + .slider { background-color: #6366f1; }
                input:checked + .slider:before { transform: translateX(24px); }
                
                .custom-table {
                    width: 100%; border-collapse: separate; border-spacing: 0; text-align: left;
                }
                .custom-table th {
                    background: #f8fafc; color: #475569; font-weight: 750;
                    text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.06em;
                    padding: 1.25rem 1.75rem; border-bottom: 2.5px solid #e2e8f0;
                }
                .custom-table tr {
                    transition: all 0.25s ease;
                }
                .custom-table tr:hover td {
                    background: #f8fafc;
                }
                .custom-table td {
                    padding: 1.3rem 1.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem;
                }

                @keyframes dash {
                    to { stroke-dashoffset: -40; }
                }
                `}
            </style>

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.75rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', marginBottom: '6px' }}>
                        <div style={{ background: '#e0e7ff', padding: '6px', borderRadius: '8px' }}>
                            <Truck size={18} style={{ filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2))' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>EMS Fleet Operations</span>
                    </div>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 950, color: '#0f172a', margin: 0, letterSpacing: '-0.035em' }}>Vehicle Swap Control</h2>
                </div>
                <div>
                    <button 
                        onClick={() => { fetchOffices(); fetchLogs(); }} 
                        style={{ 
                            background: 'white', color: '#334155', border: '1px solid #cbd5e1', 
                            borderRadius: '16px', padding: '0.8rem 1.6rem', cursor: 'pointer', 
                            fontWeight: 750, fontSize: '0.85rem', display: 'flex', alignItems: 'center', 
                            gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' 
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white'; }}
                    >
                        <RefreshCw size={14} /> Refresh Dashboard
                    </button>
                </div>
            </div>

            {/* Main Swap Selector Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2.5rem', alignItems: 'stretch', marginBottom: '3.5rem', position: 'relative' }}>
                
                {/* SVG Animated Flow Path */}
                {officeA && officeB && (
                    <div style={{ position: 'absolute', top: '50%', left: '12%', right: '12%', height: '40px', transform: 'translateY(-50%)', zIndex: 0, pointerEvents: 'none' }}>
                        <svg width="100%" height="40" viewBox="0 0 1000 40" preserveAspectRatio="none">
                            <path d="M 0,20 C 250,5 750,35 1000,20" fill="none" stroke="url(#indigoGrad)" strokeWidth="3" strokeDasharray="8 6" style={{ animation: 'dash 1.8s linear infinite' }} />
                            <defs>
                                <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                )}

                {/* Office A Selector & Card */}
                <div className={`swap-card ${officeA ? 'active-a' : ''}`} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '380px' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ 
                                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', width: '30px', height: '30px', 
                                    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)'
                                }}>A</span>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Location Slot A</h3>
                            </div>
                            {officeA && (
                                <button 
                                    onClick={() => { setOfficeA(null); setSearchA(''); }} 
                                    style={{ background: '#fee2e2', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 800, padding: '5px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
                                >
                                    Change Office
                                </button>
                            )}
                        </div>

                        {!officeA ? (
                            <div style={{ position: 'relative' }}>
                                <div className="search-input-wrapper">
                                    <Search size={18} color="#94a3b8" style={{ marginRight: '12px' }} />
                                    <input
                                        type="text"
                                        placeholder="Search by SAC or Office Name..."
                                        value={searchA}
                                        onChange={(e) => setSearchA(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.92rem', width: '100%', color: '#0f172a', fontWeight: 550 }}
                                    />
                                </div>
                                {filteredOfficesA.length > 0 && (
                                    <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '18px', boxShadow: '0 15px 30px -5px rgba(0,0,0,0.12)', zIndex: 10, marginTop: '8px', overflow: 'hidden' }}>
                                        {filteredOfficesA.map(o => (
                                            <div key={o.id} className="search-result-item" onClick={() => setOfficeA(o)}>
                                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{o.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                                    <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>SAC: {o.sac}</span>
                                                    <span>•</span>
                                                    <span>Vehicle: <strong style={{ color: '#6366f1' }}>{o.vehicle_code || 'None'}</strong> {o.vehicle_no ? `(${o.vehicle_no})` : ''}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ background: '#f8fafc', padding: '1.1rem 1.4rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Service Area Office</span>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 850, color: '#0f172a', marginTop: '3px' }}>{officeA.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#4f46e5', marginTop: '6px', display: 'inline-block', background: '#e0e7ff', padding: '2px 8px', borderRadius: '6px', fontWeight: 750 }}>SAC ID: {officeA.sac}</div>
                                </div>

                                <div className="vehicle-telemetry-box">
                                    <div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fleet Code</span>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 950, color: '#818cf8', marginTop: '2px', letterSpacing: '-0.02em' }}>{officeA.vehicle_code || 'UNASSIGNED'}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Plate Number</span>
                                        {officeA.vehicle_no ? (
                                            <div className="real-license-plate">
                                                <div className="blue-ind-strip">
                                                    <span className="circle-star">★</span>
                                                    <span>IND</span>
                                                </div>
                                                <div className="plate-number-text">{officeA.vehicle_no}</div>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>No registration plate</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Crew display */}
                    {officeA && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                <Users size={16} color="#6366f1" />
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Positions ({crewA.length})</span>
                            </div>
                            {loadingCrewA ? (
                                <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <RefreshCw size={14} className="animate-spin" color="#6366f1" />
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 550 }}>Loading positions...</span>
                                </div>
                            ) : crewA.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '100px', overflowY: 'auto' }}>
                                    {crewA.map(pos => (
                                        <div key={pos.id} className="crew-chip">
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }}></span>
                                            <span>{pos.name}</span>
                                            <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 500 }}>({pos.reporting_to_name || 'Crew'})</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '12px', border: '1.5px dashed #e2e8f0', borderRadius: '14px', textAlign: 'center', background: '#f8fafc' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>No positions assigned to this office</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mid arrow / swap trigger */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', zIndex: 2 }}>
                    <div className={`rotate-hover ${officeA && officeB ? 'glow-pulse' : ''}`} style={{ 
                        width: '64px', height: '64px', 
                        background: officeA && officeB ? 'linear-gradient(135deg, #6366f1 0%, #059669 100%)' : '#e2e8f0', 
                        color: officeA && officeB ? 'white' : '#94a3b8', 
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        boxShadow: officeA && officeB ? '0 12px 25px -4px rgba(99, 102, 241, 0.45)' : '0 4px 12px rgba(0,0,0,0.03)', 
                        transition: 'all 0.4s ease', cursor: officeA && officeB ? 'pointer' : 'default',
                        border: officeA && officeB ? '3px solid white' : 'none'
                    }}
                    onClick={() => officeA && officeB && setShowConfirmModal(true)}
                    >
                        <ArrowLeftRight size={26} />
                    </div>
                    {officeA && officeB && (
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            style={{ 
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', borderRadius: '16px', 
                                padding: '0.9rem 2rem', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', 
                                boxShadow: '0 12px 20px -5px rgba(15, 23, 42, 0.3)', transition: 'all 0.2s',
                                letterSpacing: '0.03em', border: '1px solid #334155'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 24px -5px rgba(15, 23, 42, 0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(15, 23, 42, 0.3)'; }}
                        >
                            Trigger Swap
                        </button>
                    )}
                </div>

                {/* Office B Selector & Card */}
                <div className={`swap-card ${officeB ? 'active-b' : ''}`} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '380px' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ 
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', width: '30px', height: '30px', 
                                    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)'
                                }}>B</span>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Location Slot B</h3>
                            </div>
                            {officeB && (
                                <button 
                                    onClick={() => { setOfficeB(null); setSearchB(''); }} 
                                    style={{ background: '#fee2e2', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 800, padding: '5px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
                                >
                                    Change Office
                                </button>
                            )}
                        </div>

                        {!officeB ? (
                            <div style={{ position: 'relative' }}>
                                <div className="search-input-wrapper">
                                    <Search size={18} color="#94a3b8" style={{ marginRight: '12px' }} />
                                    <input
                                        type="text"
                                        placeholder="Search by SAC or Office Name..."
                                        value={searchB}
                                        onChange={(e) => setSearchB(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.92rem', width: '100%', color: '#0f172a', fontWeight: 550 }}
                                    />
                                </div>
                                {filteredOfficesB.length > 0 && (
                                    <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '18px', boxShadow: '0 15px 30px -5px rgba(0,0,0,0.12)', zIndex: 10, marginTop: '8px', overflow: 'hidden' }}>
                                        {filteredOfficesB.map(o => (
                                            <div key={o.id} className="search-result-item" onClick={() => setOfficeB(o)}>
                                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{o.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                                    <span style={{ background: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>SAC: {o.sac}</span>
                                                    <span>•</span>
                                                    <span>Vehicle: <strong style={{ color: '#059669' }}>{o.vehicle_code || 'None'}</strong> {o.vehicle_no ? `(${o.vehicle_no})` : ''}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ background: '#f8fafc', padding: '1.1rem 1.4rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Service Area Office</span>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 850, color: '#0f172a', marginTop: '3px' }}>{officeB.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '6px', display: 'inline-block', background: '#d1fae5', padding: '2px 8px', borderRadius: '6px', fontWeight: 750 }}>SAC ID: {officeB.sac}</div>
                                </div>

                                <div className="vehicle-telemetry-box">
                                    <div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fleet Code</span>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 950, color: '#34d399', marginTop: '2px', letterSpacing: '-0.02em' }}>{officeB.vehicle_code || 'UNASSIGNED'}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Plate Number</span>
                                        {officeB.vehicle_no ? (
                                            <div className="real-license-plate">
                                                <div className="blue-ind-strip">
                                                    <span className="circle-star">★</span>
                                                    <span>IND</span>
                                                </div>
                                                <div className="plate-number-text">{officeB.vehicle_no}</div>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>No registration plate</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Crew display */}
                    {officeB && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                <Users size={16} color="#059669" />
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Positions ({crewB.length})</span>
                            </div>
                            {loadingCrewB ? (
                                <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <RefreshCw size={14} className="animate-spin" color="#10b981" />
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 550 }}>Loading positions...</span>
                                </div>
                            ) : crewB.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '100px', overflowY: 'auto' }}>
                                    {crewB.map(pos => (
                                        <div key={pos.id} className="crew-chip">
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                                            <span>{pos.name}</span>
                                            <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 500 }}>({pos.reporting_to_name || 'Crew'})</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '12px', border: '1.5px dashed #e2e8f0', borderRadius: '14px', textAlign: 'center', background: '#f8fafc' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>No positions assigned to this office</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Crew Swapping Toggle Row */}
            {officeA && officeB && (
                <div className="swap-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem', background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)', borderLeft: '6px solid #6366f1', boxShadow: '0 10px 20px -8px rgba(99,102,241,0.1)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(99,102,241,0.15)' }}><Users size={24} /></div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Simultaneous Crew Relocation</h4>
                            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>If enabled, staff positions assigned to Office A will swap to Office B and vice versa along with the vehicle.</p>
                        </div>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={swapCrew} onChange={(e) => setSwapCrew(e.target.checked)} />
                        <span className="slider"></span>
                    </label>
                </div>
            )}

            {/* Swap History Log Table */}
            <div className="swap-card" style={{ padding: '2.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '10px', borderRadius: '14px', boxShadow: '0 4px 10px rgba(124,58,237,0.1)' }}>
                            <History size={22} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Direct Swap Log Registry</h3>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>System audit log of all successful and failed operations.</span>
                        </div>
                    </div>
                    <div style={{ width: '340px', display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '9px 16px', transition: 'all 0.3s' }}
                         onFocusCapture={e => e.currentTarget.style.borderColor = '#6366f1'}
                         onBlurCapture={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                        <Search size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
                        <input
                            type="text"
                            placeholder="Filter by SAC, Unit Code, or Trigger User..."
                            value={logSearch}
                            onChange={(e) => setLogSearch(e.target.value)}
                            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.88rem', width: '100%', color: '#1e293b', fontWeight: 550 }}
                        />
                    </div>
                </div>

                {filteredLogs.length > 0 ? (
                    <div style={{ overflowX: 'auto', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,0.015)' }}>
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>SWAP TIMESTAMP</th>
                                    <th>OFFICE A (SAC)</th>
                                    <th>OFFICE B (SAC)</th>
                                    <th>OLD VEHICLE A</th>
                                    <th>NEW VEHICLE A</th>
                                    <th>CREW MOVED</th>
                                    <th>TRIGGERED BY</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id}>
                                        <td style={{ fontWeight: 650, color: '#475569', whiteSpace: 'nowrap' }}>
                                            {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{log.office_a_name}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 750, marginTop: '3px', display: 'inline-block', background: '#e0e7ff', padding: '1px 6px', borderRadius: '4px' }}>{log.sac_a}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{log.office_b_name}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 750, marginTop: '3px', display: 'inline-block', background: '#d1fae5', padding: '1px 6px', borderRadius: '4px' }}>{log.sac_b}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ color: '#ef4444', fontWeight: 850, fontSize: '0.92rem' }}>{log.old_vehicle_code_a || '--'}</span>
                                                {log.old_vehicle_no_a && (
                                                    <span style={{ fontSize: '0.72rem', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '5px', width: 'fit-content', fontWeight: 700, fontFamily: 'monospace' }}>
                                                        {log.old_vehicle_no_a}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ color: '#10b981', fontWeight: 900, fontSize: '0.92rem' }}>{log.new_vehicle_code_a || '--'}</span>
                                                {log.new_vehicle_no_a && (
                                                    <span style={{ fontSize: '0.72rem', color: '#047857', background: '#d1fae5', padding: '2px 6px', borderRadius: '5px', width: 'fit-content', fontWeight: 700, fontFamily: 'monospace' }}>
                                                        {log.new_vehicle_no_a}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '5px 12px', borderRadius: '10px', fontSize: '0.75rem',
                                                fontWeight: 800,
                                                background: log.crew_swapped ? 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' : '#f1f5f9',
                                                color: log.crew_swapped ? '#4f46e5' : '#475569',
                                                border: log.crew_swapped ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid #e2e8f0'
                                            }}>
                                                {log.crew_swapped ? 'YES' : 'NO'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 800, color: '#334155' }}>
                                            {log.triggered_by}
                                        </td>
                                        <td>
                                            {log.status === 'SUCCESS' ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '10px', background: '#dcfce7', color: '#15803d', fontWeight: 850, boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)' }}>
                                                    <CheckCircle2 size={13} />
                                                    SUCCESS
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '10px', background: '#fee2e2', color: '#b91c1c', fontWeight: 850, boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)' }} title={log.error_message}>
                                                    <XCircle size={13} />
                                                    FAILED
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '5rem', textAlign: 'center', border: '2.5px dashed #e2e8f0', borderRadius: '24px', background: '#fafafa' }}>
                        <Truck size={48} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
                        <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 700 }}>No swap registry logs found matching search.</span>
                    </div>
                )}
            </div>

            {/* Swap Confirmation Modal */}
            {showConfirmModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', borderRadius: '32px', width: '100%', maxWidth: '680px', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.3)', overflow: 'hidden', padding: '2.5rem', border: '1px solid #e2e8f0' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1.5rem', color: '#b45309' }}>
                            <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '18px', boxShadow: '0 4px 12px rgba(180, 83, 9, 0.08)' }}>
                                <AlertTriangle size={34} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em' }}>Confirm Fleet Swap</h3>
                                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>This updates production dispatch operations immediately.</span>
                            </div>
                        </div>

                        <p style={{ color: '#475569', fontSize: '0.96rem', lineHeight: 1.6, margin: '0 0 2rem', fontWeight: 500 }}>
                            You are about to swap active vehicles and plates between the selected service areas. Please confirm the direction and assignments below.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
                            
                            {/* Visual Swap Flow Diagram */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '1.75rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                
                                {/* Slot A info */}
                                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                                    <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Office A ({officeA?.sac})</span>
                                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.1rem', marginTop: '6px' }}>{officeA?.vehicle_code}</div>
                                    {officeA?.vehicle_no && (
                                        <div style={{ display: 'inline-block', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '6px', padding: '2px 6px', fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace', fontWeight: 800, marginTop: '4px' }}>
                                            {officeA?.vehicle_no}
                                        </div>
                                    )}
                                </div>

                                {/* Flow indicators */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ background: '#e0e7ff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ArrowLeftRight size={18} color="#4f46e5" />
                                    </div>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Swap Unit</span>
                                </div>

                                {/* Slot B info */}
                                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Office B ({officeB?.sac})</span>
                                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.1rem', marginTop: '6px' }}>{officeB?.vehicle_code}</div>
                                    {officeB?.vehicle_no && (
                                        <div style={{ display: 'inline-block', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '6px', padding: '2px 6px', fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace', fontWeight: 800, marginTop: '4px' }}>
                                            {officeB?.vehicle_no}
                                        </div>
                                    )}
                                </div>

                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 800 }}>Simultaneous Crew Move</span>
                                <span style={{ fontSize: '0.82rem', fontWeight: 900, color: swapCrew ? '#6366f1' : '#b45309', background: swapCrew ? '#e0e7ff' : '#fffbeb', padding: '5px 12px', borderRadius: '10px', border: swapCrew ? '1px solid rgba(99,102,241,0.15)' : '1px solid rgba(180,83,9,0.1)' }}>
                                    {swapCrew ? 'ENABLED (SWAP CREWS)' : 'DISABLED (CREWS REMAIN)'}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '14px', padding: '0.8rem 1.6rem', fontWeight: 750, cursor: 'pointer', fontSize: '0.88rem', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeSwap}
                                disabled={submitting}
                                style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '14px',
                                    padding: '0.8rem 1.85rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    fontSize: '0.88rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 8px 20px -3px rgba(239, 68, 68, 0.4)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                            >
                                {submitting ? <RefreshCw size={14} className="animate-spin" /> : 'Confirm Swap'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleSwaps;
