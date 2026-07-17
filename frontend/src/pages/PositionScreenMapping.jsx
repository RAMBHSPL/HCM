import React, { useState, useEffect, useRef } from 'react';
import { 
    Shield, 
    Layers, 
    Search, 
    AlertCircle, 
    Calendar, 
    UserSquare2, 
    Users, 
    Lock,
    Network,
    Globe,
    MapPin,
    Navigation,
    ClipboardList,
    Building2,
    FolderKanban,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';
import api from '../api';

// Custom Searchable Dropdown Component
const SearchableSelect = ({ label, options, value, onChange, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => String(opt.id) === String(value));
    const displayValue = selectedOption ? selectedOption.name : placeholder;

    const filteredOptions = options.filter(opt => 
        (opt.name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="searchable-select-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div className="filter-select-label">{label}</div>
            <div 
                className="searchable-select-trigger" 
                onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
                style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.25rem',
                    transition: 'all 0.3s',
                    borderColor: isOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                    minHeight: '38px',
                    boxSizing: 'border-box'
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85%' }}>
                    {displayValue}
                </span>
                <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#64748b', flexShrink: 0 }} />
            </div>

            {isOpen && (
                <div 
                    className="searchable-select-dropdown"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        background: '#1e293b',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        marginTop: '4px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                        maxHeight: '250px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <input 
                            type="text"
                            placeholder="Type to search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                background: 'rgba(15, 23, 42, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                color: '#f8fafc',
                                padding: '0.4rem 0.6rem',
                                fontSize: '0.8rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            autoFocus
                        />
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1, padding: '0.25rem' }}>
                        {filteredOptions.length === 0 ? (
                            <div style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                                No results found
                            </div>
                        ) : (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        color: String(value) === String(opt.id) ? '#38bdf8' : '#cbd5e1',
                                        fontSize: '0.8rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        background: String(value) === String(opt.id) ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.target.style.background = String(value) === String(opt.id) ? 'rgba(56, 189, 248, 0.1)' : 'transparent'}
                                >
                                    {opt.name}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const PositionScreenMapping = () => {
    const { showNotification, offices, orgLevels } = useData();
    const [loading, setLoading] = useState(true);
    const [positions, setPositions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [selectedOffice, setSelectedOffice] = useState('all');
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [permLoading, setPermLoading] = useState(false);
    
    // Collapsible screen groups state
    const [expandedGroups, setExpandedGroups] = useState({
        'Dashboard & Administration': true,
        'Organization & Job Structure': true,
        'Workforce & Operations': true,
        'Geo Locations': true
    });

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    // Debounce search term to prevent excessive backend queries
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 400);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Grouped screens list matching all system routes
    const screenGroups = [
        {
            name: 'Dashboard & Administration',
            screens: [
                { id: 'dashboard', name: 'Dashboard', icon: <Building2 size={16} /> },
                { id: 'users', name: 'User Management', icon: <UserSquare2 size={16} /> },
                { id: 'api-keys', name: 'API Key Management', icon: <Shield size={16} /> },
                { id: 'reactivations', name: 'Reactivations', icon: <UserSquare2 size={16} /> },
                { id: 'audit-logs', name: 'Audit Logs', icon: <AlertCircle size={16} /> },
                { id: 'login-history', name: 'Login History', icon: <AlertCircle size={16} /> }
            ]
        },
        {
            name: 'Organization & Job Structure',
            screens: [
                { id: 'organization', name: 'Structure', icon: <Layers size={16} /> },
                { id: 'organization-levels', name: 'Levels', icon: <Layers size={16} /> },
                { id: 'offices', name: 'Offices', icon: <Building2 size={16} /> },
                { id: 'departments', name: 'Departments', icon: <Building2 size={16} /> },
                { id: 'sections', name: 'Sections', icon: <Building2 size={16} /> },
                { id: 'facility-masters', name: 'Facility Master', icon: <Building2 size={16} /> },
                { id: 'job-families', name: 'Job Families', icon: <Layers size={16} /> },
                { id: 'role-types', name: 'Role Types', icon: <Layers size={16} /> },
                { id: 'roles', name: 'Role Names', icon: <Layers size={16} /> },
                { id: 'jobs', name: 'Jobs', icon: <Layers size={16} /> },
                { id: 'tasks', name: 'Tasks', icon: <Layers size={16} /> },
                { id: 'task-urls', name: 'Task URL Mapping', icon: <Layers size={16} /> }
            ]
        },
        {
            name: 'Workforce & Operations',
            screens: [
                { id: 'employees', name: 'Employees', icon: <Users size={16} /> },
                { id: 'positions', name: 'Positions', icon: <Layers size={16} /> },
                { id: 'position-assignments', name: 'Position Assignments', icon: <Network size={16} /> },
                { id: 'position-levels', name: 'Position Levels', icon: <Layers size={16} /> },
                { id: 'position-types', name: 'Position Types', icon: <Layers size={16} /> },
                { id: 'shifts', name: 'Shifts', icon: <Calendar size={16} /> },
                { id: 'position-shift-rosters', name: 'Shift Roster', icon: <Calendar size={16} /> },
                { id: 'projects', name: 'Projects', icon: <FolderKanban size={16} /> },
                { id: 'position-activity-logs', name: 'Delegate Activity', icon: <ClipboardList size={16} /> },
                { id: 'vehicle-swaps', name: 'Vehicle Swaps', icon: <Layers size={16} /> },
                { id: 'vehicle-swap-requests', name: 'Vehicle Swap Requests', icon: <Layers size={16} /> }
            ]
        },
        {
            name: 'Geo Locations',
            screens: [
                { id: 'geo-continents', name: 'Geo Territory', icon: <Globe size={16} /> },
                { id: 'geo-countries', name: 'Countries', icon: <Globe size={16} /> },
                { id: 'geo-states', name: 'States', icon: <MapPin size={16} /> },
                { id: 'geo-districts', name: 'Districts', icon: <MapPin size={16} /> },
                { id: 'geo-mandals', name: 'Mandals', icon: <Navigation size={16} /> },
                { id: 'geo-clusters', name: 'Clusters', icon: <Layers size={16} /> },
                { id: 'visiting-locations', name: 'Hotspots', icon: <MapPin size={16} /> },
                { id: 'landmarks', name: 'Landmarks', icon: <MapPin size={16} /> }
            ]
        }
    ];

    const fetchPositions = async () => {
        // Coherence validation: if selectedOffice is not 'all', verify that it belongs to selectedLevel
        if (selectedOffice && selectedOffice !== 'all') {
            const officeObj = offices.find(o => String(o.id) === String(selectedOffice));
            if (officeObj && selectedLevel !== 'all') {
                const officeLvl = String(officeObj.level || officeObj.level_id);
                if (officeLvl !== String(selectedLevel)) {
                    // Do not query backend with mismatched filters (wait for selectedOffice state reset to 'all')
                    return;
                }
            }
        }

        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (selectedOffice && selectedOffice !== 'all') {
                queryParams.append('office', selectedOffice);
            }
            if (selectedLevel && selectedLevel !== 'all') {
                queryParams.append('level', selectedLevel);
            }
            if (debouncedSearch) {
                queryParams.append('search', debouncedSearch);
            }

            // Performance Optimization: If no filter/search is applied, limit page_size to 50 for instant initial load.
            // Otherwise, fetch up to 1000 items to show all matches within that specific subset.
            const hasActiveFilters = (selectedOffice && selectedOffice !== 'all') || 
                                     (selectedLevel && selectedLevel !== 'all') || 
                                     debouncedSearch;
            queryParams.append('page_size', hasActiveFilters ? '1000' : '50');

            const queryString = queryParams.toString();
            const endpoint = `positions/${queryString ? `?${queryString}` : ''}`;
            
            const data = await api.get(endpoint);
            const list = data.results || data;
            const posList = Array.isArray(list) ? list : [];
            setPositions(posList);
            
            // Auto select the first position if none selected or if previously selected is no longer in the list
            if (posList.length > 0) {
                const stillExists = posList.find(p => p.id === selectedPosition?.id);
                if (!stillExists) {
                    handleSelectPosition(posList[0]);
                }
            } else {
                setSelectedPosition(null);
            }
        } catch (err) {
            console.error('Error fetching positions:', err);
            showNotification('Failed to load positions list', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPosition = async (pos) => {
        setSelectedPosition(pos);
        setPermLoading(true);
        try {
            const data = await api.get(`positions/${pos.id}/screen_permissions/`);
            setPermissions(data || {});
        } catch (err) {
            console.error('Error loading permissions:', err);
            showNotification('Failed to load screen permissions', 'error');
        } finally {
            setPermLoading(false);
        }
    };

    // When Level changes, reset Selected Office
    useEffect(() => {
        setSelectedOffice('all');
    }, [selectedLevel]);

    // Reactively refetch when filters change
    useEffect(() => {
        fetchPositions();
    }, [selectedOffice, selectedLevel, debouncedSearch]);

    const handleTogglePermission = async (pattern, permissionType, currentStatus) => {
        if (!selectedPosition) return;
        
        const nextStatus = !currentStatus;
        
        // Optimistic UI update
        setPermissions(prev => ({
            ...prev,
            [pattern]: {
                ...prev[pattern],
                [permissionType]: nextStatus
            }
        }));

        try {
            await api.post(`positions/${selectedPosition.id}/toggle_screen_permission/`, {
                pattern,
                permission_type: permissionType,
                enabled: nextStatus
            });
            showNotification(`${permissionType.toUpperCase()} permission updated for ${selectedPosition.name}`, 'success');
        } catch (err) {
            console.error('Failed to update permission:', err);
            showNotification('Failed to save permission update', 'error');
            // Revert changes on error
            if (selectedPosition) {
                handleSelectPosition(selectedPosition);
            }
        }
    };

    // Note: Search filtering is now done server-side using the `search` query parameter.
    // We just render whatever the server returns.
    const filteredPositions = positions;

    const levelOptions = [
        { id: 'all', name: 'All Levels' },
        ...(orgLevels || [])
    ];

    const filteredOffices = offices ? offices.filter(off => 
        selectedLevel === 'all' || 
        String(off.level) === String(selectedLevel) || 
        String(off.level_id) === String(selectedLevel)
    ) : [];

    const officeOptions = [
        { id: 'all', name: 'All Offices' },
        ...filteredOffices
    ];

    return (
        <div className="pos-mapping-wrapper">
            <style>{`
                .pos-mapping-wrapper {
                    padding: 1.5rem;
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                    min-height: calc(100vh - 80px);
                    color: #f8fafc;
                    font-family: 'Outfit', sans-serif;
                }
                .pos-mapping-header {
                    margin-bottom: 1.5rem;
                }
                .pos-mapping-header h1 {
                    font-size: 2rem;
                    font-weight: 800;
                    margin: 0;
                    background: linear-gradient(to right, #38bdf8, #a78bfa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .pos-mapping-header p {
                    color: #94a3b8;
                    margin: 0.25rem 0 0 0;
                    font-size: 0.9rem;
                }
                .split-layout {
                    display: grid;
                    grid-template-columns: 380px 1fr;
                    gap: 1.5rem;
                    height: calc(100vh - 200px);
                    min-height: 550px;
                }
                .left-pane {
                    background: rgba(30, 41, 59, 0.45);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    overflow: visible; /* Required for absolute select dropdowns to not get clipped */
                }
                .pane-search {
                    padding: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .search-box {
                    position: relative;
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
                }
                .filters-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                }
                .filter-select-box {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .filter-select-label {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .positions-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .position-item-card {
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .position-item-card:hover {
                    background: rgba(255, 255, 255, 0.06);
                    transform: translateX(4px);
                }
                .position-item-card.active {
                    background: rgba(56, 189, 248, 0.15);
                    border-color: rgba(56, 189, 248, 0.4);
                }
                .position-name {
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: #f1f5f9;
                }
                .position-code {
                    font-size: 0.75rem;
                    color: #64748b;
                    font-family: monospace;
                    margin-top: 0.2rem;
                }
                .right-pane {
                    background: rgba(30, 41, 59, 0.45);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    padding: 1.5rem;
                }
                .detail-header {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    padding-bottom: 1rem;
                    margin-bottom: 1rem;
                }
                .detail-title {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .detail-subtitle {
                    color: #94a3b8;
                    font-size: 0.85rem;
                    margin-top: 0.25rem;
                }
                .group-header {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 0.85rem 1.25rem;
                    border-radius: 8px;
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .group-header:hover {
                    background: rgba(255, 255, 255, 0.06);
                }
                .group-title {
                    font-weight: 700;
                    font-size: 0.95rem;
                    color: #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .screens-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .screens-table th {
                    text-align: left;
                    color: #94a3b8;
                    font-weight: 600;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
                .screens-table td {
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                }
                .screen-row:hover {
                    background: rgba(255, 255, 255, 0.01);
                }
                .screen-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .screen-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: rgba(56, 189, 248, 0.1);
                    color: #38bdf8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .screen-name-text {
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: #f1f5f9;
                }
                .screen-path-text {
                    font-size: 0.75rem;
                    color: #64748b;
                    font-family: monospace;
                    margin-top: 0.15rem;
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
                .permission-toggle-cell {
                    text-align: center;
                }
                .no-position-selected {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #64748b;
                    text-align: center;
                }
            `}</style>

            <div className="pos-mapping-header">
                <h1>Position Screen Mapping</h1>
                <p>Define dynamic screen access and operations permissions for employees assigned to specific Positions.</p>
            </div>

            <div className="split-layout">
                {/* Left Pane - Positions List */}
                <div className="left-pane">
                    <div className="pane-search">
                        <div className="search-box">
                            <Search size={16} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search position name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="filters-grid">
                            <div className="filter-select-box">
                                <SearchableSelect 
                                    label="Level"
                                    options={levelOptions}
                                    value={selectedLevel}
                                    onChange={setSelectedLevel}
                                    placeholder="All Levels"
                                />
                            </div>
                            <div className="filter-select-box">
                                <SearchableSelect 
                                    label="Office"
                                    options={officeOptions}
                                    value={selectedOffice}
                                    onChange={setSelectedOffice}
                                    placeholder="All Offices"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="positions-list">
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                <BavyaSpinner size="30px" label="Loading positions..." />
                            </div>
                        ) : filteredPositions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                <AlertCircle size={24} style={{ marginBottom: '0.5rem' }} />
                                <p>No positions found</p>
                            </div>
                        ) : (
                            filteredPositions.map(pos => (
                                <div 
                                    key={pos.id} 
                                    className={`position-item-card ${selectedPosition?.id === pos.id ? 'active' : ''}`}
                                    onClick={() => handleSelectPosition(pos)}
                                >
                                    <div>
                                        <div className="position-name">{pos.name}</div>
                                        <div className="position-code">{pos.code}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        {pos.level_name && (
                                            <span style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px', color: '#a78bfa' }}>
                                                {pos.level_name}
                                            </span>
                                        )}
                                        <div style={{ color: '#64748b' }}>
                                            <Layers size={14} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Pane - Permissions Editor */}
                <div className="right-pane">
                    {selectedPosition ? (
                        <>
                            <div className="detail-header">
                                <div className="detail-title">
                                    <Shield size={22} color="#38bdf8" />
                                    <span>Permissions for {selectedPosition.name}</span>
                                </div>
                                <div className="detail-subtitle">
                                    Position Code: <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedPosition.code}</strong> 
                                    {selectedPosition.office_name && ` | Office: ${selectedPosition.office_name}`}
                                </div>
                            </div>

                            {permLoading ? (
                                <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <BavyaSpinner label="Fetching permissions..." />
                                </div>
                            ) : (
                                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {screenGroups.map(group => {
                                        const isExpanded = expandedGroups[group.name];
                                        return (
                                            <div key={group.name} style={{ marginBottom: '1.25rem' }}>
                                                <div 
                                                    className="group-header"
                                                    onClick={() => toggleGroup(group.name)}
                                                >
                                                    <span className="group-title">
                                                        <FolderKanban size={16} color="#a78bfa" />
                                                        {group.name} ({group.screens.length})
                                                    </span>
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </div>

                                                {isExpanded && (
                                                    <table className="screens-table">
                                                        <thead>
                                                            <tr>
                                                                <th style={{ width: '40%' }}>Screen / Module</th>
                                                                <th style={{ width: '15%', textAlign: 'center' }}>View</th>
                                                                <th style={{ width: '15%', textAlign: 'center' }}>Create</th>
                                                                <th style={{ width: '15%', textAlign: 'center' }}>Edit</th>
                                                                <th style={{ width: '15%', textAlign: 'center' }}>Delete</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {group.screens.map(scr => {
                                                                const permState = permissions[scr.id] || { view: false, create: false, edit: false, delete: false };
                                                                return (
                                                                    <tr key={scr.id} className="screen-row">
                                                                        <td>
                                                                            <div className="screen-info">
                                                                                <div className="screen-icon">
                                                                                    {scr.icon}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="screen-name-text">{scr.name}</div>
                                                                                    <div className="screen-path-text">/{scr.id}</div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="permission-toggle-cell">
                                                                            <label className="switch">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={!!permState.view} 
                                                                                    onChange={() => handleTogglePermission(scr.id, 'view', !!permState.view)}
                                                                                />
                                                                                <span className="slider"></span>
                                                                            </label>
                                                                        </td>
                                                                        <td className="permission-toggle-cell">
                                                                            <label className="switch">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={!!permState.create} 
                                                                                    onChange={() => handleTogglePermission(scr.id, 'create', !!permState.create)}
                                                                                />
                                                                                <span className="slider"></span>
                                                                            </label>
                                                                        </td>
                                                                        <td className="permission-toggle-cell">
                                                                            <label className="switch">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={!!permState.edit} 
                                                                                    onChange={() => handleTogglePermission(scr.id, 'edit', !!permState.edit)}
                                                                                />
                                                                                <span className="slider"></span>
                                                                            </label>
                                                                        </td>
                                                                        <td className="permission-toggle-cell">
                                                                            <label className="switch">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={!!permState.delete} 
                                                                                    onChange={() => handleTogglePermission(scr.id, 'delete', !!permState.delete)}
                                                                                />
                                                                                <span className="slider"></span>
                                                                            </label>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-position-selected">
                            <Lock size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <h3>No position selected</h3>
                            <p>Select a position from the list to map screen and functionality permissions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PositionScreenMapping;
