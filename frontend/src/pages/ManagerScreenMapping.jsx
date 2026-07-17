import React, { useState, useEffect } from 'react';
import { 
    Shield, 
    Users, 
    Search, 
    Sliders, 
    Check, 
    AlertCircle, 
    Calendar, 
    UserSquare2, 
    FileSpreadsheet,
    ChevronRight,
    CornerDownRight,
    Layers
} from 'lucide-react';
import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';
import api from '../api';

const ManagerScreenMapping = () => {
    const { showNotification } = useData();
    const [loading, setLoading] = useState(true);
    const [managers, setManagers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Subordinates Modal / Detail View
    const [selectedManager, setSelectedManager] = useState(null);
    const [subordinates, setSubordinates] = useState([]);
    const [subLoading, setSubLoading] = useState(false);
    const [showSubModal, setShowSubModal] = useState(false);

    // Screen metadata
    const screens = [
        { id: 'position-shift-rosters', name: 'Shift Roster', icon: <Calendar size={16} /> },
        { id: 'position-assignments', name: 'Position Assignments', icon: <UserSquare2 size={16} /> },
        { id: 'employees', name: 'Employees Registry', icon: <Users size={16} /> },
        { id: 'positions', name: 'Positions Registry', icon: <Layers size={16} /> }
    ];

    const fetchManagers = async () => {
        try {
            setLoading(true);
            const data = await api.get('manager-screen-mappings/');
            setManagers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching manager mappings:', err);
            showNotification('Failed to load screen mappings', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManagers();
    }, []);

    const handleTogglePermission = async (managerId, pattern, currentStatus) => {
        try {
            const nextStatus = !currentStatus;
            
            // Optimistic update
            setManagers(prev => prev.map(mgr => {
                if (mgr.id === managerId) {
                    return {
                        ...mgr,
                        permissions: {
                            ...mgr.permissions,
                            [pattern]: nextStatus
                        }
                    };
                }
                return mgr;
            }));

            await api.post(`manager-screen-mappings/${managerId}/toggle_permission/`, {
                pattern,
                enabled: nextStatus
            });
            
            showNotification(`Screen permission updated successfully`, 'success');
        } catch (err) {
            console.error('Failed to toggle permission:', err);
            showNotification('Failed to update permission', 'error');
            // Revert on failure
            fetchManagers();
        }
    };

    const handleViewSubordinates = async (manager) => {
        setSelectedManager(manager);
        setShowSubModal(true);
        setSubLoading(true);
        try {
            const data = await api.get(`manager-screen-mappings/${manager.id}/subordinates/`);
            setSubordinates(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching subordinates:', err);
            showNotification('Failed to load subordinates list', 'error');
        } finally {
            setSubLoading(false);
        }
    };

    // Filter managers based on search input
    const filteredManagers = managers.filter(mgr => 
        mgr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mgr.employee_code && mgr.employee_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="mapping-wrapper">
            <style>{`
                .mapping-wrapper {
                    padding: 1.5rem;
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                    min-height: calc(100vh - 80px);
                    color: #f8fafc;
                    font-family: 'Outfit', sans-serif;
                }
                .mapping-header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .mapping-title h1 {
                    font-size: 2rem;
                    font-weight: 800;
                    margin: 0;
                    background: linear-gradient(to right, #38bdf8, #a78bfa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .mapping-title p {
                    color: #94a3b8;
                    margin: 0.25rem 0 0 0;
                    font-size: 0.9rem;
                }
                .control-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(30, 41, 59, 0.45);
                    backdrop-filter: blur(12px);
                    padding: 1rem 1.25rem;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    margin-bottom: 1.5rem;
                    gap: 1rem;
                }
                .search-box {
                    position: relative;
                    flex: 1;
                    max-width: 400px;
                }
                .search-icon {
                    position: absolute;
                    left: 0.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
                }
                .search-input {
                    width: 100%;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #f8fafc;
                    padding: 0.6rem 0.8rem 0.6rem 2.25rem;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    outline: none;
                    transition: all 0.3s;
                }
                .search-input:focus {
                    border-color: #38bdf8;
                    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
                }
                .manager-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                }
                .manager-card {
                    background: rgba(30, 41, 59, 0.45);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 16px;
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    transition: all 0.3s;
                }
                .manager-card:hover {
                    border-color: rgba(56, 189, 248, 0.3);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
                    transform: translateY(-2px);
                }
                .manager-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    padding-bottom: 0.75rem;
                }
                .manager-name {
                    font-weight: 700;
                    font-size: 1.1rem;
                    color: #f1f5f9;
                }
                .manager-code {
                    font-size: 0.8rem;
                    color: #64748b;
                    font-family: monospace;
                    margin-top: 0.15rem;
                }
                .sub-count-badge {
                    background: rgba(167, 139, 250, 0.15);
                    color: #a78bfa;
                    padding: 0.25rem 0.6rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    transition: all 0.2s;
                }
                .sub-count-badge:hover {
                    background: rgba(167, 139, 250, 0.3);
                }
                .permissions-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .permission-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(15, 23, 42, 0.3);
                    padding: 0.5rem 0.75rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                }
                .permission-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #cbd5e1;
                }
                /* Custom Toggle Switch */
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 38px;
                    height: 20px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #475569;
                    transition: .3s;
                    border-radius: 20px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 14px;
                    width: 14px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .3s;
                    border-radius: 50%;
                }
                input:checked + .slider {
                    background-color: #38bdf8;
                }
                input:checked + .slider:before {
                    transform: translateX(18px);
                }
                
                /* Modal Styling */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(15, 23, 42, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .modal-content {
                    background: #1e293b;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 20px;
                    width: 100%;
                    max-width: 500px;
                    padding: 1.5rem;
                    color: #f8fafc;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.25rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    padding-bottom: 0.75rem;
                }
                .modal-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #f8fafc;
                }
                .sub-list {
                    max-height: 300px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    padding-right: 0.25rem;
                }
                .sub-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(15, 23, 42, 0.4);
                    padding: 0.6rem 0.8rem;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.03);
                }
                .sub-name {
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: #f1f5f9;
                }
                .sub-code {
                    font-size: 0.75rem;
                    color: #64748b;
                    font-family: monospace;
                }
                .status-active {
                    background: rgba(16, 185, 129, 0.15);
                    color: #10b981;
                    padding: 0.1rem 0.4rem;
                    border-radius: 4px;
                    font-size: 0.65rem;
                    font-weight: 700;
                }
            `}</style>

            <div className="mapping-header-section">
                <div className="mapping-title">
                    <h1>Manager Screen Mapping</h1>
                    <p>Map access roles and enable specific administration views for reporting officers and supervisors.</p>
                </div>
            </div>

            <div className="control-bar">
                <div className="search-box">
                    <Search size={16} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search manager name or employee code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <BavyaSpinner label="Loading mapping policies..." />
                </div>
            ) : filteredManagers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
                    <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <h3>No reporting officers found</h3>
                    <p>Make sure you have registered subordinates under employee profiles in the Registry.</p>
                </div>
            ) : (
                <div className="manager-grid">
                    {filteredManagers.map(mgr => (
                        <div key={mgr.id} className="manager-card">
                            <div className="manager-info">
                                <div>
                                    <div className="manager-name">{mgr.name}</div>
                                    <div className="manager-code">{mgr.employee_code || 'NO CODE'}</div>
                                </div>
                                <div 
                                    className="sub-count-badge" 
                                    onClick={() => handleViewSubordinates(mgr)}
                                    title="Click to view full subordinate chain"
                                >
                                    <Users size={12} />
                                    <span>{mgr.subordinates_count} reports</span>
                                </div>
                            </div>

                            <div className="permissions-section">
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Allotted Views
                                </div>
                                {screens.map(scr => {
                                    const isEnabled = !!mgr.permissions[scr.id];
                                    return (
                                        <div key={scr.id} className="permission-item">
                                            <div className="permission-label">
                                                {scr.icon}
                                                <span>{scr.name}</span>
                                            </div>
                                            <label className="switch">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isEnabled} 
                                                    onChange={() => handleTogglePermission(mgr.id, scr.id, isEnabled)}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Subordinates Modal */}
            {showSubModal && (
                <div className="modal-overlay" onClick={() => setShowSubModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Subordinates reporting to {selectedManager?.name}</h3>
                            <button 
                                style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '1.2rem', cursor: 'pointer' }}
                                onClick={() => setShowSubModal(false)}
                            >
                                &times;
                            </button>
                        </div>
                        {subLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                <BavyaSpinner size="30px" label="Fetching hierarchy..." />
                            </div>
                        ) : subordinates.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                                <p>No direct or indirect subordinates found in tree.</p>
                            </div>
                        ) : (
                            <div className="sub-list">
                                {subordinates.map(sub => (
                                    <div key={sub.id} className="sub-item">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <CornerDownRight size={14} color="#38bdf8" />
                                            <div>
                                                <span className="sub-name">{sub.name}</span>
                                                <span className="sub-code"> ({sub.employee_code || 'N/A'})</span>
                                            </div>
                                        </div>
                                        <span className="status-active">{sub.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerScreenMapping;
