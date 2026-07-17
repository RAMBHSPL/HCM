import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { fileToBase64 } from '../api';

// SECURITY: ID Obfuscation to prevent ID enumeration in URL
const ID_SALT = 'ERPS-V1-SECURE';
const obfuscateId = (id) => {
    if (!id) return '';
    try {
        const raw = `ID:${id}:${ID_SALT}`;
        return btoa(raw).replace(/=/g, '').split('').reverse().join('');
    } catch (e) { return id; }
};

const deobfuscateId = (token) => {
    if (!token || String(token).length < 5) return token;
    try {
        const reversed = String(token).split('').reverse().join('');
        const pad = (4 - (reversed.length % 4)) % 4;
        const decoded = atob(reversed + '='.repeat(pad));
        const parts = decoded.split(':');
        if (parts[0] === 'ID' && parts[2] === ID_SALT) return parts[1];
    } catch (e) { return token; }
    return token;
};
import {
    Users,
    Building2,
    FolderKanban,
    Briefcase,
    LayoutDashboard,
    LayoutList,
    LayoutGrid,
    BarChart3,
    Settings,
    ClipboardList,
    UserSquare2,
    FileText,
    GraduationCap,
    Wallet,
    FileDigit,
    ShieldCheck,
    Banknote,
    Globe,
    MapPin,
    Navigation,
    Home,
    Map as MapIcon,
    Layers,
    UserX,
    History,
    Truck,
    Calendar
} from 'lucide-react';

const Network = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="16" y="16" width="6" height="6" rx="1" />
        <rect x="2" y="16" width="6" height="6" rx="1" />
        <rect x="9" y="2" width="6" height="6" rx="1" />
        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
        <path d="M12 12V8" />
    </svg>
);

const resolveEndpointHelper = (type) => {
    const mappings = {
        'Org Levels': 'organization-levels',
        'Job Families': 'job-families',
        'Role Types': 'role-types',
        'Role Names': 'roles',
        'Geo Territory': 'geo-continents',
        'Countries': 'geo-countries',
        'States': 'geo-states',
        'Districts': 'geo-districts',
        'Mandals': 'geo-mandals',
        'Clusters': 'geo-clusters',
        'Visiting Locations': 'visiting-locations',
        'Hotspots': 'visiting-locations',
        'Landmarks': 'landmarks',
        'Jobs': 'jobs',
        'Roles': 'roles',

        'Education': 'employee-education',
        'Experience': 'employee-experience',
        'Employment History': 'employee-employment-history',
        'Bank Details': 'employee-bank-details',
        'EPFO Details': 'employee-epfo-details',
        'Health Details': 'employee-health-details',
        'Salary Details': 'employee-salary-details',
        'Employees': 'employees',
        'Positions': 'positions',
        'Position Assignments': 'position-assignments',
        'Offices': 'offices',
        'Vehicle Swaps': 'vehicle-swaps',
        'VehicleSwaps': 'vehicle-swaps',
        'Vehicle Swap Requests': 'vehicle-swap-requests',
        'VehicleSwapRequests': 'vehicle-swap-requests',
        'Departments': 'departments',
        'Sections': 'sections',
        'Projects': 'projects',
        'Tasks': 'tasks',
        'Task URL Mapping': 'task-urls',
        'Task URLs': 'task-urls',
        'Facility Master': 'facility-masters',
        'FacilityMaster': 'facility-masters',
        'Position Levels': 'position-levels',
        'Delegate Activity': 'position-activity-logs',
        'Login History': 'login-hits',
        'Segments': 'segments',
        'Role Sub Groups': 'role-sub-groups',
        'Workforce Tracker': 'workforce-tracker'
    };

    if (mappings[type]) return mappings[type];

    // 2. Fallback: Search in SECTIONS by name
    const section = SECTIONS.find(s => s.name === type || s.id === type);
    if (section) return section.endpoint;

    // 3. Default Convention
    return type.toLowerCase().replace(/ /g, '-');
};

const DataContext = createContext();

export const SECTIONS = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard />, endpoint: '' },
    { id: 'users', name: 'User Management', icon: <Users />, endpoint: null },
    { id: 'api-keys', name: 'API Key Management', icon: <ShieldCheck />, endpoint: 'api-keys' },
    { id: 'organization', name: 'Structure', icon: <Network />, endpoint: 'offices' },
    { id: 'organization-levels', name: 'Levels', icon: <LayoutList />, endpoint: 'organization-levels' },
    { id: 'offices', name: 'Offices', icon: <Building2 />, endpoint: 'offices' },
    { id: 'vehicle-swaps', name: 'Vehicle Swaps', icon: <Truck />, endpoint: 'vehicle-swaps' },
    { id: 'vehicle-swap-requests', name: 'Vehicle Swap Requests', icon: <Truck />, endpoint: 'vehicle-swap-requests' },
    { id: 'departments', name: 'Departments', icon: <Layers />, endpoint: 'departments' },
    { id: 'sections', name: 'Sections', icon: <LayoutGrid />, endpoint: 'sections' },
    { id: 'facility-masters', name: 'Facility Master', icon: <MapIcon />, endpoint: 'facility-masters' },
    { id: 'job-families', name: 'Job Families', icon: <BarChart3 />, endpoint: 'job-families' },
    { id: 'role-types', name: 'Role Types', icon: <Settings />, endpoint: 'role-types' },
    { id: 'roles', name: 'Role Names', icon: <Settings />, endpoint: 'roles' },
    { id: 'jobs', name: 'Jobs', icon: <ClipboardList />, endpoint: 'jobs' },
    { id: 'employees', name: 'Employees', icon: <Users />, endpoint: 'employees' },
    { id: 'workforce-tracker', name: 'Workforce Tracker', icon: <Users />, endpoint: 'employees' },
    { id: 'positions', name: 'Positions', icon: <UserSquare2 />, endpoint: 'positions' },
    { id: 'position-assignments', name: 'Position Assignments', icon: <Network />, endpoint: 'position-assignments' },
    { id: 'position-levels', name: 'Position Levels', icon: <LayoutList />, endpoint: 'position-levels' },
    { id: 'position-types', name: 'Position Types', icon: <Settings />, endpoint: 'position-types' },
    { id: 'shifts', name: 'Shifts', icon: <Settings />, endpoint: 'shifts' },
    { id: 'position-shift-rosters', name: 'Shift Roster', icon: <Calendar />, endpoint: 'position-shift-rosters' },
    { id: 'shift-change-requests', name: 'Shift Requests', icon: <Calendar />, endpoint: 'shift-change-requests' },
    { id: 'position-screen-mappings', name: 'Position Mapping', icon: <ShieldCheck />, endpoint: 'positions' },
    { id: 'projects', name: 'Projects', icon: <FolderKanban />, endpoint: 'projects' },
    { id: 'segments', name: 'Segments', icon: <Layers />, endpoint: 'segments' },
    { id: 'role-sub-groups', name: 'Role Sub Groups', icon: <Layers />, endpoint: 'role-sub-groups' },
    { id: 'position-activity-logs', name: 'Delegate Activity', icon: <ClipboardList />, endpoint: 'position-activity-logs' },
    { id: 'employee-documents', name: 'Documents', icon: <FileText />, endpoint: 'employee-documents' },
    { id: 'employee-education', name: 'Education', icon: <GraduationCap />, endpoint: 'employee-education' },
    { id: 'employee-experience', name: 'Experience', icon: <Briefcase />, endpoint: 'employee-experience' },
    { id: 'employee-employment-history', name: 'Employment History', icon: <Briefcase />, endpoint: 'employee-employment-history' },
    { id: 'employee-bank-details', name: 'Bank Details', icon: <Wallet />, endpoint: 'employee-bank-details' },
    { id: 'employee-epfo-details', name: 'EPFO Details', icon: <FileDigit />, endpoint: 'employee-epfo-details' },
    { id: 'employee-health-details', name: 'Health Details', icon: <ShieldCheck />, endpoint: 'employee-health-details' },
    { id: 'employee-salary-details', name: 'Salary Details', icon: <Banknote />, endpoint: 'employee-salary-details' },
    { id: 'geo-continents', name: 'Geo Territory', icon: <Globe />, endpoint: 'geo-continents' },
    { id: 'geo-countries', name: 'Countries', icon: <Globe />, endpoint: 'geo-countries' },
    { id: 'geo-states', name: 'States', icon: <MapPin />, endpoint: 'geo-states' },
    { id: 'geo-districts', name: 'Districts', icon: <MapPin />, endpoint: 'geo-districts' },
    { id: 'geo-mandals', name: 'Mandals', icon: <Navigation />, endpoint: 'geo-mandals' },
    { id: 'geo-clusters', name: 'Clusters', icon: <Layers />, endpoint: 'geo-clusters' },
    { id: 'visiting-locations', name: 'Hotspots', icon: <MapPin />, endpoint: 'visiting-locations' },
    { id: 'landmarks', name: 'Landmarks', icon: <MapPin />, endpoint: 'landmarks' },
 
    { id: 'reactivations', name: 'Reactivations', icon: <UserX />, endpoint: 'reactivations' },
    { id: 'audit-logs', name: 'Audit Logs', icon: <ClipboardList />, endpoint: 'audit-logs' },
    { id: 'login-history', name: 'Login History', icon: <History />, endpoint: 'login-hits' }
];
 
export const SECTION_GROUPS = [
    { name: 'Dashboard Overview', icon: <LayoutDashboard />, items: ['dashboard', 'users'], standalone: true },
    { name: 'Organization', icon: <Building2 />, items: ['organization', 'organization-levels', 'offices', 'vehicle-swaps', 'vehicle-swap-requests', 'facility-masters', 'departments', 'sections'] },
    { name: 'Job Structure', icon: <Briefcase />, items: ['roles', 'role-sub-groups'] },
    { name: 'Workforce', icon: <Users />, items: ['employees', 'workforce-tracker', 'positions', 'position-assignments', 'position-levels', 'position-types', 'shifts', 'position-shift-rosters', 'shift-change-requests', 'projects', 'position-activity-logs'] },
 
    { name: 'Geo Locations', icon: <Globe />, items: ['geo-continents', 'geo-countries', 'geo-states', 'geo-districts', 'geo-mandals', 'geo-clusters', 'visiting-locations', 'landmarks'] },
    { name: 'Security & Access', icon: <ShieldCheck />, items: ['api-keys', 'position-screen-mappings', 'reactivations', 'audit-logs', 'login-history'] }
];

const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http') || photo.startsWith('data:image')) return photo;
    const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    return `http://${hostname}:8000${photo}`;
};

export const DataProvider = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const activeSectionRef = React.useRef('dashboard');
    const fetchRef = React.useRef(null);
    const pageCache = React.useRef(new Map()); // High Speed Cache

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(null); // ID of section currently syncing, or null
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activePositionContext, setActivePositionContext] = useState(sessionStorage.getItem('activePositionContext') || null);
    const [offices, setOffices] = useState([]);
    const [allOffices, setAllOffices] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [jobFamilies, setJobFamilies] = useState([]);
    const [roles, setRoles] = useState([]);
    const [roleSubGroups, setRoleSubGroups] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [positions, setPositions] = useState([]);
    const [orgLevels, setOrgLevels] = useState([]);
    const [positionLevels, setPositionLevels] = useState([]);
    const [positionTypes, setPositionTypes] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [roleTypes, setRoleTypes] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [facilityMasters, setFacilityMasters] = useState([]);
    const [jobFamilyMap, setJobFamilyMap] = useState({});
    const [geoContinents, setGeoContinents] = useState([]);
    const [geoCountries, setGeoCountries] = useState([]);
    const [geoStatesData, setGeoStatesData] = useState([]);
    const [geoDistrictsData, setGeoDistrictsData] = useState([]);
    const [geoMandals, setGeoMandals] = useState([]);
    const [geoClusters, setGeoClusters] = useState([]);
    const [geoVisitingLocations, setGeoVisitingLocations] = useState([]);
    const [geoLandmarks, setGeoLandmarks] = useState([]);

    // Pagination State
    const [pagination, setPagination] = useState({
        count: 0,
        next: null,
        previous: null,
        current: 1
    });

    const [stats, setStats] = useState([
        { title: 'Total Employees', value: '0', icon: <Users size={28} />, color: 'linear-gradient(135deg, #881337, #be185d)', trend: 'Loading...' },
        { title: 'Active Units', value: '0', icon: <Building2 size={28} />, color: 'linear-gradient(135deg, #ef4444, #f97316)', trend: 'Loading...' },
        { title: 'Live Projects', value: '0', icon: <FolderKanban size={28} />, color: 'linear-gradient(135deg, #f97316, #eab308)', trend: 'Loading...' },
        { title: 'Open Positions', value: '0', icon: <Briefcase size={28} />, color: 'linear-gradient(135deg, #eab308, #facc15)', trend: 'Loading...' },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState({ type: '', id: null, name: '', reason: '' });

    const [showPositionDetail, setShowPositionDetail] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [showOfficeDetail, setShowOfficeDetail] = useState(false);
    const [selectedOffice, setSelectedOffice] = useState(null);
    const [modalType, setModalType] = useState('');
    const [formData, setFormData] = useState({});
    const [showEmployeeProfile, setShowEmployeeProfile] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [activeProfileTab, setActiveProfileTab] = useState('Employment');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [validationErrors, setValidationErrors] = useState({});
    const [previousModal, setPreviousModal] = useState(null);
    const [orgTab, setOrgTab] = useState('structure');
    const [expandedGroups, setExpandedGroups] = useState(['Organization']);

    const lastSyncRef = React.useRef(null);
    const lastPathRef = React.useRef(location.pathname);
    const [navigationFilter, setNavigationFilter] = useState(null);
    const [oneTimePrefill, setOneTimePrefill] = useState(null);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

    const navigateToSection = (sectionId, filters = null) => {
        if (filters) {
            setNavigationFilter(filters);
            // Also save to sessionStorage as a backup for GenericTable initialization
            sessionStorage.setItem(`filters_${sectionId}`, JSON.stringify(filters));
        }

        // PREVENT HANG: If already in this section, just navigate to the URL
        // but DON'T clear data or set loading unless it's a different section.
        if (sectionId === activeSection) {
            navigate(`/${sectionId}`);
            return;
        }

        // SMART NAVIGATION: Only show the big spinner if we DON'T have a cache for this section.
        // This makes transitions feel instant for pre-fetched data.
        const hasCache = pageCache.current.has(sectionId);
        if (!hasCache) {
            setLoading(true);
        }

        setActiveSection(sectionId);
        setData([]); // Clear the main grid data to prevent mismatch, fallback will use Section data
        sessionStorage.removeItem('loginHitId'); // Clear any specific record views

        navigate(`/${sectionId}`);
    };

    // 1. Sync activeSection and Modal state with URL
    useEffect(() => {
        const fullPath = location.pathname;
        const parts = fullPath.substring(1).split('/');
        const path = parts[0] || 'dashboard';
        const subPath = parts[1]; // 'add', 'edit', 'view'
        const itemId = deobfuscateId(parts[2]); // SECURITY: Decode the masked ID from URL

        const validIds = SECTIONS.map(s => s.id);

        // Catch and redirect leaked modal navigation URLs to the main employee table
        const subRecordPaths = [
            'employee-documents', 'employee-education', 'employee-experience',
            'employee-employment-history', 'employee-bank-details', 'employee-epfo-details',
            'employee-health-details', 'employee-salary-details'
        ];

        if (subRecordPaths.includes(path)) {
            navigate('/employees', { replace: true });
            return;
        }

        if (validIds.includes(path) || path === 'dashboard') {
            if (lastSyncRef.current !== path) {
                // Atomic cleanup on navigation
                lastSyncRef.current = path;

                // PERFORMANCE: Check cache first for 0ms transition
                if (pageCache.current.has(path)) {
                    const cachedData = pageCache.current.get(path);
                    setData(cachedData);
                    setLoading(false); // KILL SPINNER IMMEDIATELY if we have cache
                } else {
                    setData([]); // Only clear if we have absolutely nothing
                    if (path !== 'dashboard' && path !== 'users') {
                        setLoading(true); // Only show spinner if we have NO cache
                    }
                }

                setPagination({ count: 0, next: null, previous: null, current: 1 });
                setActiveSection(path);
                activeSectionRef.current = path;

                // Clear any pending fetch markers for the new path
                fetchRef.current = null;
            }

            // Sync Modal state based on URL sub-path
            if (sessionStorage.getItem('modal_closing') === 'true') {
                // Ignore URL parsing intentionally while animating the modal closed
            } else if (subPath === 'add') {
                if (!showModal) {
                    const section = SECTIONS.find(s => s.id === path);
                    if (section && section.endpoint) {
                        setModalType(section.name);

                        // PRE-FILL LOGIC: If we have context from handleAddOfficeByLevel
                        if (oneTimePrefill && path === oneTimePrefill.section) {
                            setFormData(oneTimePrefill.data);
                            setOneTimePrefill(null); // Clear after use
                        } else {
                            setFormData({});
                        }

                        setShowModal(true);
                    }
                }
            } else if (subPath === 'edit' && itemId) {
                if (!showModal) {
                    const section = SECTIONS.find(s => s.id === path);
                    if (section) {
                        // Find item in current data
                        const item = data.find(i => String(i.id) === String(itemId));
                        if (item) {
                            setModalType(section.name);
                            setFormData(hydrateItem(section.name, item));
                            setShowModal(true);
                        } else if (data.length > 0) {
                            navigate(`/${path}`);
                        }
                    }
                }
            } else if (!subPath && showModal && !previousModal && location.pathname !== lastPathRef.current) {
                // User hit back button to close modal
                setShowModal(false);
                setModalType('');
                setFormData({});
            }

            // Update path ref
            lastPathRef.current = location.pathname;
        }
    }, [location.pathname, data.length]); // Synchronize when URL or data availability triggers changes

    // Ensure sidebar is open on desktop resizing or initial load if missed
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024 && !isSidebarOpen) {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);

        // Check immediately on mount in case initial state was wrong
        if (window.innerWidth > 1024 && !isSidebarOpen) {
            setIsSidebarOpen(true);
        }

        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Authentication State
    const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('authToken'));
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
    });
    const [passwordResetRequired, setPasswordResetRequired] = useState(false);
    const [tabId] = useState(Math.random().toString(36).substr(2, 9));

    // 2. Session Restore (Run ONCE on Mount)
    useEffect(() => {
        const checkAuth = async () => {
            const token = sessionStorage.getItem('authToken');
            if (token) {
                try {
                    const res = await api.get('users/me');
                    if (res && (res.id || res.user?.id)) {
                        const userData = res.user || res;

                        // Enforce multi-tab constraint immediately on startup for duplicated tabs
                        const sessionKey = `active_session_${userData.id}`;
                        const activeSession = JSON.parse(localStorage.getItem(sessionKey));

                        if (activeSession && activeSession.tabId !== tabId && (Date.now() - activeSession.lastSeen < 15000)) {
                            console.warn("Attempted to open a duplicate tab, blocking...");
                            sessionStorage.removeItem('authToken');
                            localStorage.removeItem('user');
                            setIsAuthenticated(false);
                            setUser(null);
                            setError('User already logged in in another tab. Please close other tabs first.');
                            return;
                        }

                        // Claim the session for this valid mount
                        localStorage.setItem(sessionKey, JSON.stringify({ tabId, lastSeen: Date.now() }));

                        setIsAuthenticated(true);
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                    }
                } catch (e) {
                    console.error("Auth check failed:", e);
                    if (!isAuthenticated) { // Only clear if we weren't already authed (likely expired)
                        sessionStorage.removeItem('authToken');
                        localStorage.removeItem('user');
                        setIsAuthenticated(false);
                        setUser(null);
                    }
                }
            }
        };
        checkAuth();
    }, []);

    // 3. Storage listener for cross-tab logout
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (user && e.key === `active_session_${user.id}` && !e.newValue) {
                logout();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user?.id]);

    // Heartbeat to keep session alive in localStorage
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const heartbeat = setInterval(() => {
            const sessionKey = `active_session_${user.id}`;
            localStorage.setItem(sessionKey, JSON.stringify({ tabId, lastSeen: Date.now() }));
        }, 5000);

        const handleUnload = () => {
            localStorage.removeItem(`active_session_${user.id}`);
        };

        window.addEventListener('beforeunload', handleUnload);
        return () => {
            clearInterval(heartbeat);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [isAuthenticated, user, tabId]);



    const [error, setError] = useState('');

    const login = async (username, password) => {
        try {
            // Using standard auth/login endpoint
            const res = await api.post('auth/login', { username, password });
            if (res.token) {
                // Check BEFORE committing the token to prevent the refresh-bypass
                const sessionKey = `active_session_${res.user.id}`;
                const activeSession = JSON.parse(localStorage.getItem(sessionKey));

                if (activeSession && activeSession.tabId !== tabId && (Date.now() - activeSession.lastSeen < 15000)) {
                    throw new Error('User already logged in in another tab. Please close other tabs first.');
                }

                // Store token immediately as it's needed for calls
                sessionStorage.setItem('authToken', res.token);
                if (res.login_hit_id) {
                    sessionStorage.setItem('loginHitId', res.login_hit_id);
                }

                // CLEANUP: Purge any old safe_fetch_cache_* blobs from previous sessions
                // These used to be stored in sessionStorage but caused QuotaExceededError
                Object.keys(sessionStorage).forEach(key => {
                    if (key.startsWith('safe_fetch_cache_')) {
                        sessionStorage.removeItem(key);
                    }
                });

                if (res.requires_password_change) {
                    setPasswordResetRequired(true);
                    setUser(res.user); // Store user details for display
                    // Do NOT set isAuthenticated(true) yet
                    console.log("Login successful, but password reset required.");
                    return { requiresPasswordChange: true };
                }

                // Record active session for cross-tab logout syncing
                localStorage.setItem(sessionKey, JSON.stringify({ tabId, lastSeen: Date.now() }));

                setIsAuthenticated(true);
                setUser(res.user);
                localStorage.setItem('user', JSON.stringify(res.user)); // Store for resilience
                setError(''); // Clear any previous error
                showNotification(`Welcome, ${res.user.username}`);
                return true;
            }
            throw new Error('Invalid response from server');
        } catch (err) {
            // Extract error message from various possible error structures
            let msg = 'Login failed';
            if (typeof err === 'string') {
                msg = err;
            } else if (err.error) {
                msg = err.error;
            } else if (err.detail) {
                msg = err.detail;
            } else if (err.message) {
                msg = err.message;
            } else if (err.details) {
                msg = err.details;
            }
            setError(msg);
            throw new Error(msg);
        }
    };

    const logout = async () => {
        if (user) {
            const loginHitId = sessionStorage.getItem('loginHitId');
            if (loginHitId) {
                try {
                    await api.post('auth/logout', { login_hit_id: loginHitId });
                } catch (err) {
                    console.error("Failed to log logout time:", err);
                }
            }
            localStorage.removeItem(`active_session_${user.id}`);
            localStorage.removeItem('user');
        }
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('loginHitId');

        // SECURITY: Clear all cached filter states and session-bound persistence
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('filters_') || key.startsWith('last_fetch_') || key.startsWith('safe_fetch_cache_')) {
                sessionStorage.removeItem(key);
            }
        });

        // Clear User State
        setIsAuthenticated(false);
        setUser(null);

        // Clear Data State to prevent stale data
        setData([]);
        setStats([]);

        // Clear Dropdown/Context Data
        setOffices([]);
        setAllOffices([]);
        setDepartments([]);
        setSections([]);
        setJobFamilies([]);
        setRoles([]);
        setJobs([]);
        setPositions([]);
        setOrgLevels([]);
        setProjects([]);
        setAllEmployees([]);
        setRoleTypes([]);
        setTasks([]);
        setJobFamilyMap({});

        // Clear Geo Data
        setGeoContinents([]);
        setGeoCountries([]);
        setGeoStatesData([]);
        setGeoDistrictsData([]);
        setGeoVisitingLocations([]);
        setGeoLandmarks([]);
        setGeoMandals([]);
        setGeoClusters([]);


        // Update URL to root to clear specific paths (e.g., /employees)
        navigate('/', { replace: true });
        showNotification('Logged out successfully');
    };

    // Real-time Permission Refresh
    const refreshPermissions = async () => {
        if (!isAuthenticated || !user) return;

        try {
            const res = await api.get('users/me');
            setUser(res); // Update full user object including profile ID
        } catch (err) {
            // console.error('Failed to refresh user data:', err);
        }
    };

    // Auto-refresh permissions (Background Sync) - DISABLED to reduce server load
    useEffect(() => {
        // if (!isAuthenticated) return;

        // const interval = setInterval(() => {
        //     // Background refresh without any logs or UI impact
        //     refreshPermissions();
        // }, 300000);

        // return () => clearInterval(interval);
    }, [isAuthenticated, user?.id]);

    // Permission Helpers
    const getPermissions = () => user?.permissions || {};

    const checkPermission = (path, action = 'view') => {
        if (user?.is_superuser) return true;
        const perms = getPermissions();

        let targetPattern = resolveEndpointHelper(path);





        // Find matching permission pattern
        // Priority:
        // 1. Mapped Endpoint (e.g. employee-employment-history)
        // 2. Mapped Endpoint with slash (/employee-employment-history)
        // 3. Original Path (e.g. Employment History)
        // 4. Wildcard (*)
        const entry =
            perms[targetPattern] ||
            perms[`/${targetPattern}`] ||
            perms[path] ||
            perms[`/${path}`] ||
            perms['*'];

        if (!entry) return false;

        if (!entry.enabled) return false;
        return !!entry[action];
    };

    const canView = (path) => checkPermission(path, 'view');
    const canCreate = (path) => checkPermission(path, 'create');
    const canEdit = (path) => checkPermission(path, 'edit');
    const canDelete = (path) => checkPermission(path, 'delete');

    // UNIVERSAL SORT HELPER: Ensures consistent alphabetical order for all dropdowns and lists
    const universalSort = (arr) => {
        if (!Array.isArray(arr)) return [];
        return [...arr].sort((a, b) => {
            const nameA = (a?.name || a?.employee_name || a?.full_name || a?.title || '').toString().trim();
            const nameB = (b?.name || b?.employee_name || b?.full_name || b?.title || '').toString().trim();
            if (nameA && nameB) {
                return nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
            }
            const codeA = (a?.code || a?.employee_code || '').toString().trim();
            const codeB = (b?.code || b?.employee_code || '').toString().trim();
            return codeA.localeCompare(codeB, undefined, { sensitivity: 'base', numeric: true });
        });
    };

    // LEVEL SORT HELPER: Specifically handles Rank + Code sorting for Org/Pos Levels
    const levelSort = (arr) => {
        if (!Array.isArray(arr)) return [];
        return [...arr].sort((a, b) => {
            const rA = parseFloat(a?.rank) || 0;
            const rB = parseFloat(b?.rank) || 0;
            if (rA !== rB) return rA - rB;
            const cA = (a?.level_code || a?.code || '').toString();
            const cB = (b?.level_code || b?.code || '').toString();
            if (cA && cB) return cA.localeCompare(cB, undefined, { numeric: true });
            return (a?.name || '').localeCompare(b?.name || '');
        });
    };

    const activeSafeRequests = useRef(new Map());

    // Helper: Safe Fetch for Dropdowns/Charts (in-memory dedup only, no sessionStorage to avoid quota issues)
    const safeFetch = async (endpoint, force = false) => {
        try {
            // Deduplicate concurrent active requests for the same endpoint
            if (!force && activeSafeRequests.current.has(endpoint)) {
                return activeSafeRequests.current.get(endpoint);
            }

            const fetchPromise = (async () => {
                const res = await api.get(endpoint, { force });
                const data = Array.isArray(res) ? res : (res?.results || []);
                return data;
            })();

            activeSafeRequests.current.set(endpoint, fetchPromise);

            try {
                const result = await fetchPromise;
                return result;
            } finally {
                activeSafeRequests.current.delete(endpoint);
            }
        } catch (e) { return []; }
    };

    // 4. Fetch data/stats only when section changes OR login status changes
    useEffect(() => {
        if (!isAuthenticated) return;

        if (fetchRef.current === activeSection) {
            setLoading(false); // SAFETY: Clear loading if we're skipping fetch
            return;
        }
        fetchRef.current = activeSection;

        if (activeSection !== 'dashboard' && activeSection !== 'users') {
            // Reset pagination on section change
            setPagination(prev => ({ ...prev, current: 1 }));

            // INSTANT UI: Show cached data immediately if we have it
            if (pageCache.current.has(activeSection)) {
                setData(pageCache.current.get(activeSection));
                setLoading(false);
            } else {
                setData([]);
                setLoading(true);
            }

            // SPECIAL CASE: 'organization' section (Chart) does NOT use GenericTable.
            // We must manually trigger a fetch here for the tree data.
            // GenericTable sections will handle their own fetch on mount.
            if (activeSection === 'organization') {
                Promise.all([
                    safeFetch('offices/all_data'),
                    safeFetch('organization-levels/all_data')
                ]).then(([officesData, levelsData]) => {
                    if (officesData) {
                        setAllOffices(officesData);
                        setOffices(officesData);
                    }
                    if (levelsData) setOrgLevels(levelsData);
                })
                    .catch(err => console.error("Org Chart background fetch failed", err))
                    .finally(() => setLoading(false));
            } else if (activeSection === 'organization-levels') {
                // SPECIAL CASE: 'organization-levels' uses a custom view, not GenericTable
                safeFetch('organization-levels/all_data')
                    .then(data => setOrgLevels(data))
                    .catch(err => console.error(err))
                    .finally(() => setLoading(false));
            } else if (activeSection === 'facility-masters') {
                // SPECIAL CASE: 'facility-masters' uses a custom view, not GenericTable
                safeFetch('facility-masters')
                    .then(data => setData(data))
                    .catch(err => console.error(err))
                    .finally(() => setLoading(false));
            } else if (activeSection === 'position-levels') {
                safeFetch('position-levels')
                    .then(data => setData(data))
                    .catch(err => console.error(err))
                    .finally(() => setLoading(false));
            } else if (activeSection === 'workforce-tracker') {
                // Custom page, does not use GenericTable's fetchData; data is loaded via Wave 2 dropdowns
                setLoading(false);
            } else {
                // UNIVERSAL FIX FOR STANDARD SECTIONS
                // We leave loading as true here. 
                // GenericTable will handle the data fetch immediately upon mounting
                // and will turn off loading when its fetch completes.
                // This ensures a smooth transition without flickering.
            }
        } else if (activeSection === 'dashboard') {
            // Dashboard handles stats but needs consistent loading lifecycle
            setLoading(true);
            fetchStats().finally(() => setLoading(false));
            setData([]); // Clear data to avoid confusion
        }
    }, [activeSection, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchDropdownData();
        }
    }, [isAuthenticated]);

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev =>
            prev.includes(groupName)
                ? prev.filter(g => g !== groupName)
                : [...prev, groupName]
        );
    };

    const selectSection = (id) => {
        const pathParts = location.pathname.substring(1).split('/');
        const currentPath = pathParts[0] || 'dashboard';

        // High-vis log for user to see the app is responding to clicks
        console.log(`%c[Navigation] 👉 Transitioning to: ${id.toUpperCase()}`, 'color: #be185d; font-weight: bold; background: #fff1f2; padding: 2px 5px; border-radius: 4px;');

        // BOUNCE PROTECTION: If already on the base path of this section, ignore double-taps
        // If on a sub-page (edit/view), navigate back but don't clear everything
        if (id === currentPath) {
            if (pathParts.length > 1) {
                navigate(id === 'dashboard' ? '/' : `/${id}`);
            }
            return;
        }

        // PERFORMANCE: ⚡ INSTANT LOAD pattern
        const cachedData = pageCache.current.get(id);
        if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
            console.log(`%c[InstantLoad] ⚡ Showing cached data for: ${id}`, 'color: #0d9488; font-weight: bold;');
            setData(cachedData);
            setLoading(false);
        } else {
            // Only show big loader if we have NO cache to show
            setLoading(true);
            setData([]);
        }

        if (id === 'dashboard') {
            navigate('/');
        } else {
            navigate(`/${id}`);
        }

        setShowModal(false);
        setShowPositionDetail(false);
        setSelectedPosition(null);
        setModalType('');
        setShowEmployeeProfile(false);
        setSelectedEmployee(null);
    };

    const lastRequestedUrl = React.useRef(new Map());
    const activeRequests = React.useRef(new Map());

    const fetchData = async (silent = false, applyState = true, page = 1, filters = {}, force = false) => {
        // USE THE REF: This ensures we always fetch for the ACTUAL current section,
        // even if the section changed during a transition/closure.
        const currentSectionId = activeSectionRef.current;
        const section = SECTIONS.find(s => s.id === currentSectionId);

        if (section && section.endpoint) {
            const requestSection = currentSectionId; // Capture for this specific call
            // STRICT RULE: Silent fetches must NEVER touch the global loading state (spinner),
            // but we track them via 'isSyncing' for non-intrusive UI feedback.
            setIsSyncing(requestSection);

            // SMART SPINNER: Only show the big central loader if we have NO data to show the user
            const hasExistingData = (data && data.length > 0) || pageCache.current.has(requestSection);
            if (!silent && !loading && !hasExistingData) {
                setLoading(true);
            }

            try {
                // Construct URL with pagination/search/filters
                let url = section.endpoint;
                const params = new URLSearchParams();
                if (page > 1) params.append('page', page);

                // Add all non-empty filters
                if (typeof filters === 'string') {
                    if (filters) params.append('search', filters);
                } else {
                    Object.entries(filters).forEach(([key, val]) => {
                        if (val && val !== 'all') {
                            let paramKey = key;
                            if (key === 'searchTerm') paramKey = 'search';
                            else if (key === 'officeLevel') {
                                // For the Offices section, the backend specifically expects 'level'
                                paramKey = (requestSection === 'offices') ? 'level' : 'office_level';
                            }
                            else if (key === 'jobFamily') paramKey = 'job_family';
                            else if (key === 'roleType') paramKey = 'role_type';
                            else if (key === 'clusterType') paramKey = 'cluster_type';
                            else if (key === 'state') paramKey = isNaN(val) ? 'state_name' : 'state';
                            else if (key === 'district') paramKey = isNaN(val) ? 'district_name' : 'district';
                            else if (key === 'mandal') paramKey = isNaN(val) ? 'mandal_name' : 'mandal';
                            else if (key === 'country') paramKey = isNaN(val) ? 'country_name' : 'country';
                            else if (key === 'office') paramKey = (requestSection === 'offices') ? 'id' : 'office';
                            else if (key === 'department') paramKey = 'department';
                            else if (key === 'section') paramKey = 'section';
                            else if (key === 'role') paramKey = 'role_id';
                            else if (key === 'job') paramKey = 'job_id';
                            else if (key === 'task') paramKey = 'task_id';
                            else if (key === 'positionLevel') paramKey = 'position_level';

                            params.append(paramKey, val);
                        }
                    });
                }

                // Append query params
                const queryString = params.toString();
                if (queryString) {
                    url += (url.includes('?') ? '&' : '?') + queryString;
                }

                // --- DEDUPLICATION LOGIC ---
                if (activeRequests.current.has(url)) {
                    return activeRequests.current.get(url).catch(() => null);
                }

                // Track this as the LATEST request for this section
                lastRequestedUrl.current.set(requestSection, url);

                const requestPromise = api.get(url, { force }).finally(() => {
                    activeRequests.current.delete(url);
                });

                activeRequests.current.set(url, requestPromise);
                const result = await requestPromise;

                // --- RACE CONDITION CHECK ---
                if (lastRequestedUrl.current.get(requestSection) !== url) {
                    console.warn(`[DataFetch] 🛑 Ignoring stale response for ${requestSection} (Expected ${lastRequestedUrl.current.get(requestSection)})`);
                    return null;
                }

                let dataToSet = [];
                let paginationInfo = { count: 0, next: null, previous: null, current: 1 };

                if (result && result.results && Array.isArray(result.results)) {
                    // Paginated response
                    dataToSet = result.results;
                    paginationInfo = {
                        count: result.count,
                        next: result.next,
                        previous: result.previous,
                        current: page
                    };
                } else if (Array.isArray(result)) {
                    // Non-paginated response
                    dataToSet = result;
                    paginationInfo = { count: result.length, next: null, previous: null, current: 1 };
                } else if (result && result.results) {
                    // Catch-all for wrapped results without array? Uncommon but safe
                    dataToSet = result.results;
                }

                if (applyState) {
                    const finalData = Array.isArray(result) ? result : (result.results || []);

                    // SAVE TO CACHE: Only cache the first page or basic list for instant return-navigation
                    // We DO THIS even if the section changed, to prevent stale data on return
                    if (page === 1 && (!filters || Object.keys(filters).length === 0)) {
                        pageCache.current.set(requestSection, finalData);
                    }

                    // Only update the active UI data if we are still on the same section
                    if (requestSection === activeSectionRef.current) {
                        setData(finalData);
                        if (result.results) {
                            setPagination(paginationInfo);
                        }
                    }
                }

                // CRITICAL FIX: Do NOT update global 'allOffices' / 'offices' reference list 
                // if we just fetched a PAGINATED subset. This was breaking the org chart.
                // We leave the global lists alone; they should only be updated by specific 'all_data' fetches.

                return dataToSet;
            } catch (err) {
                const sectionName = section ? section.name : 'requested';
                console.error(`Failed to fetch ${requestSection}:`, err);

                // Always notify on errors that affect the ACTIVE view, even if fetch was silent
                if (activeSectionRef.current === requestSection) {
                    setData([]);
                    showNotification(`Failed to load ${sectionName} data`, 'error');
                }
                return null;
            } finally {
                if (requestSection === activeSectionRef.current) {
                    setLoading(false);
                }
                setIsSyncing(prev => prev === requestSection ? null : prev);
            }
        } else {
            if (requestSection === activeSectionRef.current) {
                setLoading(false);
            }
            setIsSyncing(prev => prev === requestSection ? null : prev);
        }
        return null;
    };

    const fetchStats = async (silent = false, applyState = true) => {
        try {
            const res = await api.get('dashboard/stats/');

            const newStats = [
                {
                    title: 'Total Employees',
                    value: (res.employees || 0).toLocaleString(),
                    icon: <Users size={28} />,
                    color: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    trend: 'Across all levels'
                },
                {
                    title: 'Active Units',
                    value: (res.active_units || 0).toLocaleString(),
                    icon: <Building2 size={28} />,
                    color: 'linear-gradient(135deg, var(--primary-dark), #881337)',
                    trend: `${res.offices || 0} Offices / ${res.departments || 0} Depts`
                },
                {
                    title: 'Live Projects',
                    value: (res.projects || 0).toLocaleString(),
                    icon: <FolderKanban size={28} />,
                    color: 'linear-gradient(135deg, #f97316, #ea580c)',
                    trend: 'In progress'
                },
                {
                    title: 'Open Positions',
                    value: (res.open_positions || 0).toLocaleString(),
                    icon: <Briefcase size={28} />,
                    color: 'linear-gradient(135deg, #eab308, #ca8a04)',
                    trend: 'Ready for hire'
                },
            ];

            if (applyState) setStats(newStats);
            return newStats;
        } catch (err) {
            if (!silent) showNotification("Could not load dashboard data", "error");
            return null;
        }
    };

    const fetchDropdownData = async (filterEndpoint = null, preloadedData = null, force = false) => {
        try {
            // If a specific endpoint is provided, only refresh that one
            if (filterEndpoint) {
                // Alias: Facilities are subsets of Offices, so refresh the main Office list
                if (filterEndpoint === 'facilities') filterEndpoint = 'offices';

                let fetchUrl = filterEndpoint;
                const allDataMap = {
                    'organization-levels': 'organization-levels/all_data',
                    'offices': 'offices/all_data',
                    'departments': 'departments/all_data',
                    'sections': 'sections/all_data',
                    'employees': 'employees/all_data',
                    'positions': 'positions/all_data',
                    'geo-continents': 'geo-continents/all_data',
                    'geo-countries': 'geo-countries/all_data',
                    'geo-states': 'geo-states/all_data',
                    'geo-districts': 'geo-districts/all_data',
                    'geo-mandals': 'geo-mandals/all_data',
                    'geo-clusters': 'geo-clusters/all_data',
                    'visiting-locations': 'visiting-locations/all_data',
                    'landmarks': 'landmarks/all_data'
                };
                if (allDataMap[filterEndpoint]) {
                    fetchUrl = allDataMap[filterEndpoint];
                }

                const refreshed = preloadedData || await safeFetch(fetchUrl, force);
                const setterMap = {
                    'organization-levels': (d) => setOrgLevels(levelSort(d)),
                    'offices': (d) => {
                        const sorted = universalSort(d);
                        setOffices(sorted);
                        setAllOffices(sorted);
                    },
                    'departments': (d) => setDepartments(universalSort(d)),
                    'sections': (d) => setSections(universalSort(d)),
                    'job-families': (d) => setJobFamilies(universalSort(d)),
                    'roles': (d) => setRoles(universalSort(d)),
                    'role-sub-groups': (d) => setRoleSubGroups(universalSort(d)),
                    'jobs': (d) => setJobs(universalSort(d)),
                    'positions': (d) => setPositions(universalSort(d)),
                    'projects': (d) => setProjects(universalSort(d)),
                    'employees': (d) => setAllEmployees(universalSort(d)),
                    'geo-continents': (d) => setGeoContinents(universalSort(d)),
                    'geo-countries': (d) => setGeoCountries(universalSort(d)),
                    'geo-states': (d) => setGeoStatesData(universalSort(d)),
                    'geo-districts': (d) => setGeoDistrictsData(universalSort(d)),
                    'geo-mandals': (d) => setGeoMandals(universalSort(d)),
                    'geo-clusters': (d) => setGeoClusters(universalSort(d)),
                    'visiting-locations': (d) => setGeoVisitingLocations(universalSort(d)),
                    'landmarks': (d) => setGeoLandmarks(universalSort(d)),
                    'role-types': (d) => setRoleTypes(universalSort(d)),
                    'tasks': (d) => setTasks(universalSort(d)),
                    'facility-masters': (d) => setFacilityMasters(universalSort(d)),
                    'position-levels': (d) => setPositionLevels(levelSort(d)),
        'position-types': (d) => setPositionTypes(universalSort(d)),
        'shifts': (d) => setShifts(universalSort(d))
                };
                if (setterMap[filterEndpoint]) {
                    setterMap[filterEndpoint](refreshed);
                    if (filterEndpoint === 'job-families') {
                        const jfMap = {};
                        refreshed.forEach(jf => { jfMap[jf.id] = jf.name; });
                        setJobFamilyMap(jfMap);
                    }
                }
                return;
            }

            // ⚡ PERFORMANCE OPTIMIZATION: Progressive Loading Strategy
            // Load data in 3 waves to make the app feel instant while loading everything

            console.log('🚀 [Performance] Wave 1: Loading CRITICAL data (navigation, permissions)...');

            // WAVE 1: CRITICAL - Must load immediately (blocks nothing)
            const wave1 = await Promise.all([
                safeFetch('organization-levels/all_data', force),
                safeFetch('offices/all_data', force),
                safeFetch('job-families', force),
                safeFetch('role-types', force),
                safeFetch('projects', force),
                safeFetch('facility-masters', force)
            ]);

            const [orgLevelsData, officesData, jobFamiliesData, roleTypesData, projectsData, facilityMastersData] = wave1;

            const jfMap = {};
            jobFamiliesData.forEach(jf => { jfMap[jf.id] = jf.name; });

            // WAVE 1 DATA DISPATCH
            setOrgLevels(levelSort(orgLevelsData));
            const sortedOffices = universalSort(officesData);
            setOffices(sortedOffices);
            setAllOffices(sortedOffices);
            setJobFamilies(universalSort(jobFamiliesData));
            setJobFamilyMap(jfMap);
            setRoleTypes(universalSort(roleTypesData));
            setProjects(universalSort(projectsData));
            setFacilityMasters(universalSort(facilityMastersData));

            // Instant Cache Pre-population
            pageCache.current.set('offices', sortedOffices);
            pageCache.current.set('projects', universalSort(projectsData));
            pageCache.current.set('facility-masters', universalSort(facilityMastersData));
            pageCache.current.set('organization-levels', levelSort(orgLevelsData));

            console.log('✅ [Performance] Wave 1 complete. App is now interactive!');

            // WAVE 2: IMPORTANT - Load after 100ms (form dropdowns)
            setTimeout(async () => {
                console.log('🚀 [Performance] Wave 2: Loading IMPORTANT data (forms, dropdowns)...');

                const wave2 = await Promise.all([
                    safeFetch('departments/all_data', force),
                    safeFetch('sections/all_data', force),
                    safeFetch('roles', force),
                    safeFetch('role-sub-groups', force),
                    safeFetch('jobs', force),
                    safeFetch('positions/all_data', force),
                    safeFetch('position-levels', force),
                    safeFetch('position-types', force),
                    safeFetch('shifts', force),
                    safeFetch('tasks', force),
                    safeFetch('employees/all_data', force)
                ]);

                const [departmentsData, sectionsData, rolesData, roleSubGroupsData, jobsData, positionsData, positionLevelsData, positionTypesData, shiftsData, tasksData, employeesData] = wave2;

                setDepartments(universalSort(departmentsData));
                setSections(universalSort(sectionsData));
                setRoles(universalSort(rolesData));
                setRoleSubGroups(universalSort(roleSubGroupsData));
                setJobs(universalSort(jobsData));
                setPositions(universalSort(positionsData));
                setPositionLevels(levelSort(positionLevelsData));
                setPositionTypes(universalSort(positionTypesData));
                setShifts(universalSort(shiftsData));
                setTasks(universalSort(tasksData));
                setAllEmployees(universalSort(employeesData));

                // Instant Cache Pre-population
                const wave2Map = {
                    'departments': departmentsData,
                    'sections': sectionsData,
                    'roles': rolesData,
                    'role-sub-groups': roleSubGroupsData,
                    'jobs': jobsData,
                    'positions': positionsData,
                    'tasks': tasksData,
                    'employees': employeesData
                };

                Object.entries(wave2Map).forEach(([key, items]) => {
                    if (items && Array.isArray(items)) {
                        pageCache.current.set(key, universalSort(items));
                    }
                });

                console.log('✅ [Performance] Wave 2 complete. Forms ready!');
            }, 100);

            // WAVE 3: OPTIONAL - Load after 4000ms (geo data, employees)
            setTimeout(async () => {
                console.log('🚀 [Performance] Wave 3: Loading OPTIONAL data (geo, employees)...');

                const wave3 = await Promise.all([
                    safeFetch('geo-continents/all_data', force),
                    safeFetch('geo-countries/all_data', force),
                    safeFetch('geo-states/all_data', force),
                    safeFetch('geo-districts/all_data', force),
                    safeFetch('geo-mandals/all_data', force),
                    safeFetch('geo-clusters/all_data', force),
                    safeFetch('visiting-locations/all_data', force),
                    safeFetch('landmarks/all_data', force)
                ]);

                const [
                    geoContinentsData, geoCountriesData, geoStatesDataRes, geoDistrictsDataRes,
                    geoMandalsData, geoClustersData, geoVisitingRes, geoLandmarksRes
                ] = wave3;

                // PRE-POPULATE PAGE CACHE for Instant Navigation
                const geoMap = {
                    'geo-continents': geoContinentsData,
                    'geo-countries': geoCountriesData,
                    'geo-states': geoStatesDataRes,
                    'geo-districts': geoDistrictsDataRes,
                    'geo-mandals': geoMandalsData,
                    'geo-clusters': geoClustersData,
                    'visiting-locations': geoVisitingRes,
                    'landmarks': geoLandmarksRes
                };

                Object.entries(geoMap).forEach(([key, items]) => {
                    if (items && Array.isArray(items)) {
                        pageCache.current.set(key, universalSort(items));
                    }
                });
                setGeoContinents(universalSort(geoContinentsData));
                setGeoCountries(universalSort(geoCountriesData));
                setGeoStatesData(universalSort(geoStatesDataRes));
                setGeoDistrictsData(universalSort(geoDistrictsDataRes));
                setGeoMandals(universalSort(geoMandalsData));
                setGeoClusters(universalSort(geoClustersData));
                setGeoVisitingLocations(universalSort(geoVisitingRes));
                setGeoLandmarks(universalSort(geoLandmarksRes));

                console.log('✅ [Performance] Wave 3 complete. All data loaded!');
            }, 4000);

        } catch (err) {
            console.error('[Performance] Data loading failed:', err);
        }
    };

    const showNotification = (message, type = 'success') => {
        let displayMessage = message;

        // If message is an object, parse it to extract meaningful error messages
        if (typeof message === 'object' && message !== null) {
            console.warn('⚠️ showNotification received an object:', message);

            const entries = Object.entries(message);
            if (entries.length > 0) {
                const parsedMessages = entries.map(([key, val]) => {
                    // Skip meta keys
                    if (key === 'error' || key === 'details' || key === 'detail' || key === 'non_field_errors') {
                        if (Array.isArray(val)) return val.join('\n');
                        return typeof val === 'string' ? val : null;
                    }

                    // Extract message text
                    let messageText = Array.isArray(val) ? val[0] : val;

                    // Clean up Django error messages
                    if (typeof messageText === 'string') {
                        if (messageText.toLowerCase().includes('already exists')) {
                            const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                            messageText = `This ${fieldLabel.toLowerCase()} already exists`;
                        } else if (messageText.match(/with this .+ already exists/i)) {
                            const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                            messageText = `This ${fieldLabel.toLowerCase()} already exists`;
                        }
                    }

                    const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                    return `${fieldLabel}: ${messageText}`;
                }).filter(Boolean);

                displayMessage = parsedMessages.length > 0
                    ? parsedMessages.join('\n')
                    : 'An error occurred';
            } else {
                displayMessage = message.detail || message.error || message.message || 'An error occurred';
            }
        }

        // Final safety: ensure it's a string
        if (typeof displayMessage !== 'string') {
            displayMessage = String(displayMessage);
        }

        console.log('📢 Displaying notification:', displayMessage);
        setNotification({ show: true, message: displayMessage, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
    };

    const handleAdd = (type, customData = {}) => {
        if (!canCreate(type)) {
            showNotification(`You do not have permission to add ${type}`, 'error');
            return;
        }
        setValidationErrors({}); // RESET validation errors on add
        if (showModal) {
            setPreviousModal({ type: modalType, data: { ...formData } });
        } else {
            setPreviousModal(null);
        }
        setModalType(type);

        // Inject geographical defaults (Continent: ASIA, Country: INDIA, State: ANDHRA PRADESH)
        const geoDefaults = {};

        // Find IDs for hierarchical filters
        const asia = (geoContinents || []).find(c => String(c.name).toUpperCase() === 'ASIA');
        const india = (geoCountries || []).find(c => String(c.name).toUpperCase() === 'INDIA');
        const ap = (geoStatesData || []).find(s => String(s.name).toUpperCase() === 'ANDHRA PRADESH');

        if (asia) geoDefaults._territory_filter = String(asia.id);
        if (india) geoDefaults._country_filter = String(india.id);
        if (ap) geoDefaults._state_filter = String(ap.id);

        // Handle forms that use direct IDs (like States or Districts creation)
        if (india && (type === 'States')) geoDefaults.country = String(india.id);
        if (ap && (type === 'Districts')) geoDefaults.state = String(ap.id);

        // Handle forms that use names (Offices, Facilities, Projects, etc.)
        geoDefaults.country_name = 'INDIA';
        geoDefaults.state_name = 'ANDHRA PRADESH';

        setFormData({ ...geoDefaults, ...customData });
        setShowModal(true);

        // Update URL to reflect "Add"
        // Update URL to reflect "Add"
        const section = SECTIONS.find(s => s.name === type);
        if (section && (!showEmployeeProfile || type === 'Employees')) {
            navigate(`/${section.id}/add`);
        }
    };

    const hydrateItem = (type, item) => {
        if (type === 'Task URL Mapping') {
            // Find all existing mappings for this task to populate the bulk wizard
            const safeData = Array.isArray(data) ? data : [];
            const relatedMappings = safeData.filter(m => m && m.task === item.task);
            return {
                ...item,
                _bulk_items: relatedMappings
            };
        } else if (type === 'Employees') {
            // Special handling for employees: extract position IDs
            let positionIds = item.positions || [];
            if ((!positionIds || positionIds.length === 0) && item.positions_details && item.positions_details.length > 0) {
                positionIds = item.positions_details.map(p => p.id);
            }

            // Derive organizational filters from the primary position to pre-populate dropdowns
            const primaryPos = item.positions_details && item.positions_details.length > 0 ? item.positions_details[0] : null;
            const assignmentFilters = {};
            if (primaryPos) {
                assignmentFilters._emp_level_filter = primaryPos.office_level_id || '';
                assignmentFilters._emp_office_filter = primaryPos.office_id || '';
                assignmentFilters._emp_dept_filter = primaryPos.department_id || '';
                assignmentFilters._emp_section_filter = primaryPos.section_id || '';
            }

            return {
                ...item,
                positions: positionIds,
                ...assignmentFilters
            };
        } else {
            // General Hydration: Convert object values and arrays of objects to IDs where appropriate
            const hydratedItem = { ...item };

            // SECURITY/CONTEXT FIX: Map backend IDs to frontend field names for dropdown context
            if (hydratedItem.job_family_id && !hydratedItem.job_family) {
                hydratedItem.job_family = hydratedItem.job_family_id;
            }
            if (hydratedItem.role_type_id && !hydratedItem.role_type) {
                hydratedItem.role_type = hydratedItem.role_type_id;
            }
            if (hydratedItem.role_id && !hydratedItem.role) {
                hydratedItem.role = hydratedItem.role_id;
            }

            // Special handling for Clusters to derive UI-only state (urban_type/rural_type)
            if (type === 'Clusters') {
                if (item.mandal_name) {
                    hydratedItem._territory_filter = item.continent_id;
                    hydratedItem._country_filter = item.country_id;
                    hydratedItem._state_filter = item.state_id;
                    hydratedItem._district_filter = item.district_id;
                }
            }

            // Special handling for Positions to extract project and segment context
            if (type === 'Positions') {
                hydratedItem._pos_project = item.project_id || '';
                hydratedItem._pos_segment = item.segment_id || '';
            }

            // Special handling for Role Sub Groups to extract project and segment context from its Role Group
            if (type === 'Role Sub Groups') {
                const roleId = item.role_group && typeof item.role_group === 'object' ? item.role_group.id : item.role_group;
                const roleObj = roles?.find(r => String(r.id) === String(roleId));
                if (roleObj) {
                    const rProjId = roleObj.project_id || (roleObj.project && typeof roleObj.project === 'object' ? roleObj.project.id : roleObj.project) || '';
                    const rSegId = roleObj.segment_id || (roleObj.segment && typeof roleObj.segment === 'object' ? roleObj.segment.id : roleObj.segment) || '';
                    hydratedItem._sg_project = String(rProjId);
                    hydratedItem._sg_segment = String(rSegId);
                }
            }

            Object.keys(hydratedItem).forEach(key => {
                if (key === 'segments') return;
                const val = hydratedItem[key];

                // Case 1: Single Object (ForeignKey)
                if (val && typeof val === 'object' && val.id && !Array.isArray(val)) {
                    hydratedItem[key] = val.id;
                }

                // Case 2: Array of Objects (ManyToMany)
                if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0].id) {
                    // Extract IDs from list of objects
                    hydratedItem[key] = val.map(obj => obj.id);
                }
            });
            return hydratedItem;
        }
    };

    const handleEdit = (type, item) => {
        // Allow self-profile editing regardless of general permissions
        const isSelfProfileEdit = type === 'Employees' && item._is_profile_edit === true;

        if (!isSelfProfileEdit && !canEdit(type)) {
            showNotification(`You do not have permission to edit this ${type}`, 'error');
            return;
        }
        setValidationErrors({}); // RESET validation errors on edit
        setModalType(type);
        setFormData(hydrateItem(type, item));
        setShowModal(true);

        // Update URL to reflect "Edit" with MASKED ID
        const section = SECTIONS.find(s => s.name === type);
        if (section && (!showEmployeeProfile || type === 'Employees')) {
            const maskedId = obfuscateId(item.id);
            navigate(`/${section.id}/edit/${maskedId}`);
        }
    };

    const fetchPositionDetail = async (id) => {
        // Open modal immediately with spinner (don't use global loading which hides the page)
        setSelectedPosition(null);
        setShowPositionDetail(true);
        try {
            const result = await api.get(`positions/${id}/details/`);
            setSelectedPosition(result);
        } catch (err) {
            console.error("Failed to fetch position details:", err);
            showNotification("Could not load position details. Please try again.", "error");
            setShowPositionDetail(false);
        }
    };

    const handleViewOffice = (item) => {
        setSelectedOffice(item);
        setShowOfficeDetail(true);
    };

    const handleAddOfficeByLevel = (levelId) => {
        if (!checkPermission('Offices', 'create')) {
            showNotification(`You do not have permission to add Offices`, 'error');
            return;
        }

        // Set one-time prefill context instead of persistent filter
        setOneTimePrefill({
            section: 'offices',
            data: { level: levelId }
        });

        setShowPositionDetail(false);
        setSelectedPosition(null);
        setShowEmployeeProfile(false);
        setSelectedEmployee(null);

        // Navigate to the target page (/add subpath triggers the modal sync)
        navigate('/offices/add');
    };

    const handleDelete = (type, id, itemName = 'this record') => {
        setDeleteConfig({ type, id, name: itemName, reason: '' });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        const { type, id, reason } = deleteConfig;
        const isEmployee = type === 'Employees';

        if (isEmployee && !reason.trim()) {
            showNotification('Deletion reason is required for employees', 'error');
            return;
        }

        const endpoint = resolveEndpoint(type);
        try {
            setLoading(true);
            const deleteData = isEmployee ? { reason: reason.trim() } : null;
            await api.delete(`${endpoint}/${id}`, deleteData);

            showNotification(`${type} deleted successfully`, 'success');
            setShowDeleteModal(false);

            // Refresh silently with current filters to maintain view consistency
            const currentSectionId = activeSectionRef.current;
            const currentFiltersRaw = sessionStorage.getItem(`filters_${currentSectionId}`);
            const currentFilters = currentFiltersRaw ? JSON.parse(currentFiltersRaw) : {};

            // Parallel refresh to ensure dashboard reflects changes ASAP
            await Promise.all([
                fetchData(true, true, pagination.current || 1, currentFilters, true),
                fetchStats(true, true),
                fetchDropdownData(null, null, true)
            ]);

            // Refresh selected employee profile if open
            if (selectedEmployee && showEmployeeProfile) {
                api.get(`employees/${selectedEmployee.id}`)
                    .then(res => setSelectedEmployee(res.data || res))
                    .catch(err => console.error("Failed to refresh profile:", err));
            }
        } catch (err) {
            console.error("Delete error:", err);
            const msg = err.response?.data?.error || err.error || "Error deleting record";
            showNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };


    // Helper to view profile (Self or Others)
    const handleViewProfile = async (id) => {
        if (!id) {
            showNotification("No profile linked to this account.", "info");
            return;
        }
        try {
            const res = await api.get(`employees/${id}`);
            const empData = res.data || res;
            setSelectedEmployee(empData);
            setShowEmployeeProfile(true);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            showNotification("Failed to load profile details", "error");
        }
    };

    // Helper to resolve API endpoint based on type
    const resolveEndpoint = (type) => {
        return resolveEndpointHelper(type);
    };

    const closeModal = () => {
        // Only ask for confirmation if the form has some real data entered
        const userProvidedKeys = Object.keys(formData).filter(k => !k.startsWith('_'));

        // Check if it's an edit form (has ID) or a new form that has at least 1 field filled
        const isEdit = !!formData.id;
        const hasPhoto = !!(formData.photo || formData.employee_photo);

        // Show confirmation for:
        // 1. New forms with any data entered
        // 2. Edit forms (always show confirmation since they have data)
        // 3. Forms with photos uploaded
        if (isEdit || userProvidedKeys.length > 0 || hasPhoto) {
            setShowCancelModal(true);
            return;
        }

        executeClose();
    };

    const confirmCancel = () => {
        setShowCancelModal(false);
        executeClose();
    };

    const executeClose = () => {
        if (previousModal) {
            setModalType(previousModal.type);
            setFormData(previousModal.data);
            setPreviousModal(null);
        } else {
            setShowModal(false);
            setModalType('');
            setFormData({});
            setValidationErrors({}); // RESET validation errors on close

            // Reset URL - Go back to base section if we were in add/edit
            const parts = location.pathname.split('/');
            if (parts.length > 2 && (parts[1] === 'add' || parts[1] === 'edit')) {
                navigate(`/${parts[0]}`);
            } else {
                // Robust reset: if current path is e.g. /projects/add, return to /projects
                const pathParts = location.pathname.substring(1).split('/');
                if (pathParts[1] === 'add' || pathParts[1] === 'edit') {
                    navigate(`/${pathParts[0]}`);
                }
            }
        }
    };

    const handleFormSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        const currentSectionId = activeSectionRef.current; // Capture section at start
        let endpoint = resolveEndpoint(modalType);

        // Send data directly to the section's endpoint (e.g., 'geo-clusters' for Clusters)
        const effectiveFormData = { ...formData };

        // --- CUSTOM PRE-SUBMISSION VALIDATION ---
        if (modalType === 'Clusters' && !effectiveFormData.id && effectiveFormData.code) {
            const hasDuplicateCode = (geoClusters || []).some(c =>
                c.code && effectiveFormData.code &&
                String(c.code).toUpperCase() === String(effectiveFormData.code).toUpperCase()
            );
            if (hasDuplicateCode) {
                showNotification(`The Cluster Code "${effectiveFormData.code.toUpperCase()}" already exists. Please use a unique 3-4 character code.`, 'error');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            // Clean up effectiveFormData before submission (remove keys starting with _)
            const cleanedData = Object.fromEntries(
                Object.entries(effectiveFormData).filter(([key, val]) => {
                    if (key.startsWith('_')) return false;
                    // Prevent sending existing photo URL strings back to the backend
                    if ((key === 'photo' || key === 'employee_photo') && typeof val === 'string') return false;
                    return true;
                }).map(([key, val]) => {
                    // FIX: Convert empty strings to null for optional/exclusive integer/float fields
                    const numericFields = [
                        'mandal_id', 'district_id', 'state_id', 'country_id',
                        'job_family', 'role_type', 'role', 'job', 'task', 'position_id', 'employee_id',
                        'employee', 'position', 'project', 'facility_master',
                        'height', 'weight', 'basic_salary', 'hra', 'conveyance_allowance', 'medical_allowance', 'special_allowance', 'other_allowances'
                    ];

                    if (val === '' && numericFields.includes(key)) {
                        return [key, null];
                    }
                    return [key, val];
                })
            );

            // 0. HANDLE FILE CONVERSION (Translate Files to Base64 for DB Storage)
            const photoFields = ['photo', 'certificate', 'experience_letter', 'file'];
            for (const field of photoFields) {
                if (cleanedData[field] instanceof File) {
                    try {
                        cleanedData[field] = await fileToBase64(cleanedData[field]);
                    } catch (err) {
                        console.error(`Failed to convert ${field} to Base64:`, err);
                    }
                }
            }

            let payload;

            if (modalType === 'Task URL Mapping' && formData._bulk_items) {
                // Special case for bulk mapping: send the array directly
                payload = formData._bulk_items;
            } else {
                // Now that files are converted to Base64 strings, we can send everything as JSON
                payload = cleanedData;
            }

            // 1. PERFORM API CALL
            let response;
            if (formData.id && !(modalType === 'Task URL Mapping' && formData._bulk_items)) {
                response = await api.put(`${endpoint}/${formData.id}`, payload);
            } else {
                const bulkUrl = modalType === 'Task URL Mapping' ? `${endpoint}/?task=${formData.task}` : endpoint;
                response = await api.post(bulkUrl, payload);
            }

            // --- IMMEDIATE STATE UPDATE (Instant UX) ---
            if (response && response.id) {
                // 1. Update active UI data only if user is still on that section
                if (activeSectionRef.current === currentSectionId) {
                    setData(prev => {
                        if (!Array.isArray(prev)) return prev;
                        if (formData.id) {
                            // Replace updated item
                            return prev.map(item => String(item.id) === String(response.id) ? response : item);
                        }
                        // Prepend new item (Instant insertion)
                        return [response, ...prev];
                    });
                }

                // 2. ALWAYS update page cache for this section so transitions are ACCURATE and INSTANT
                const cachedData = pageCache.current.get(currentSectionId);
                if (cachedData && Array.isArray(cachedData)) {
                    if (formData.id) {
                        pageCache.current.set(currentSectionId, cachedData.map(item => String(item.id) === String(response.id) ? response : item));
                    } else {
                        // Prepend to cache (unless already there)
                        const exists = cachedData.some(item => String(item.id) === String(response.id));
                        if (!exists) {
                            pageCache.current.set(currentSectionId, [response, ...cachedData]);
                        }
                    }
                }
            }

            // 2. FETCH UPDATED DATA (Force Refresh Page 1 to ensure order/consistency)
            // Perform refreshes in the background NOT blocking the UI
            setTimeout(() => {
                // Recover current filter state from sessionStorage to keep UI consistent during background refresh
                let currentFilters = {};
                try {
                    const saved = sessionStorage.getItem(`filters_${currentSectionId}`);
                    if (saved) currentFilters = JSON.parse(saved);
                } catch (e) {
                    console.warn("[DataContext] Could not restore filters for background refresh:", e);
                }

                const refreshTasks = [
                    fetchData(true, true, formData.id ? (pagination.current || 1) : 1, currentFilters, true), // Page pagination.current for edits, Page 1 for adds
                    fetchStats(true, true),
                    fetchDropdownData(endpoint, null, true) // Force refresh for specific endpoint
                ];

                // ⚡ INTELLIGENT SYNC: If we updated a Geo component, refresh the entire Geo chain
                // to ensure all cascading dropdowns on other pages are synchronized.
                if (endpoint.startsWith('geo-') || ['visiting-locations', 'landmarks'].includes(endpoint)) {
                    refreshTasks.push(fetchDropdownData(null, null, true)); // Full sync for Geo with FORCE
                }

                Promise.all(refreshTasks).catch(err => console.error("Background refresh failed:", err));
            }, 100);

            // 3. CLOSE MODAL & CLEANUP
            if (previousModal) {
                setModalType(previousModal.type);
                setFormData(previousModal.data);
                setPreviousModal(null);
            } else {
                // Set temporary flag so the URL effect doesn't immediately reopen the modal on data change
                sessionStorage.setItem('modal_closing', 'true');

                setShowModal(false);
                setPreviousModal(null);

                // Clear URL
                const pathParts = location.pathname.substring(1).split('/');
                if (pathParts[1] === 'add' || pathParts[1] === 'edit') {
                    navigate(`/${pathParts[0]}`, { replace: true });
                }

                setTimeout(() => sessionStorage.removeItem('modal_closing'), 300);
            }

            // 4. NOTIFICATIONS & CLEANUP (Non-blocking)
            if (formData.id && !(modalType === 'Task URL Mapping' && formData._bulk_items)) {
                showNotification(`${modalType} updated successfully`);
            } else {
                showNotification(modalType === 'Task URL Mapping' ? `${modalType} configuration saved` : `${modalType} created successfully`);
            }

            setIsSubmitting(false);

            // Sync Selected Employee if we just edited them or their sub-records
            if (selectedEmployee) {
                if (modalType === 'Employees' && String(selectedEmployee.id) === String(formData.id)) {
                    setSelectedEmployee(response);
                    const isSelfUpdate = user && (String(selectedEmployee.id) === String(user.employee_profile_id));
                    if (isSelfUpdate) refreshPermissions().catch(() => { });
                } else if (showEmployeeProfile) {
                    api.get(`employees/${selectedEmployee.id}`)
                        .then(res => setSelectedEmployee(res.data || res))
                        .catch(err => console.error("Failed to refresh profile:", err));
                }
            }

        } catch (err) {
            console.log('🔴 RAW ERROR OBJECT:', err);
            console.log('🔴 ERROR TYPE:', typeof err);
            console.log('🔴 ERROR KEYS:', err ? Object.keys(err) : 'null');

            let errorMessage = `Error saving ${modalType}`;

            if (err && typeof err === 'object') {
                // If it's a standard validation error object from DRF
                const entries = Object.entries(err);
                console.log('🔴 ERROR ENTRIES:', entries);

                if (entries.length > 0) {
                    let messages = entries.map(([key, val]) => {
                        console.log(`🔴 Processing field: ${key}, value:`, val);

                        // Handler for potential JSON strings in error/details keys
                        if (key === 'error' || key === 'details' || key === 'detail') {
                            if (typeof val === 'string') {
                                try {
                                    const parsed = JSON.parse(val);
                                    if (typeof parsed === 'object' && parsed !== null) {
                                        return Object.entries(parsed).map(([nKey, nVal]) => {
                                            let msg = Array.isArray(nVal) ? nVal[0] : nVal;
                                            if (typeof msg !== 'string') return null;
                                            const label = nKey.charAt(0).toUpperCase() + nKey.slice(1).replace(/_/g, ' ');
                                            if (msg.toLowerCase().includes('already exists') || msg.match(/with this .+ already exists/i)) {
                                                msg = `This ${label.toLowerCase()} already exists`;
                                            }
                                            return `• ${label}: ${msg}`;
                                        });
                                    }
                                    return val;
                                } catch (e) { return val; }
                            }
                            return null;
                        }

                        // Direct field-level errors
                        let messageText = Array.isArray(val) ? val[0] : val;
                        if (typeof messageText !== 'string') return null;

                        const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                        if (messageText.toLowerCase().includes('already exists') || messageText.match(/with this .+ already exists/i)) {
                            if (key === 'code' && modalType === 'Clusters') {
                                messageText = "This Cluster Code is already in use. Please use a unique 3-5 letter code.";
                            } else {
                                messageText = `This ${fieldLabel.toLowerCase()} already exists`;
                            }
                        } else if (messageText.toLowerCase().includes('must be unique')) {
                            messageText = `This ${fieldLabel.toLowerCase()} already exists`;
                        }

                        return `• ${fieldLabel}: ${messageText}`;
                    }).flat().filter(Boolean);

                    // Deduplicate identical messages
                    messages = [...new Set(messages)];
                    console.log('🔴 FINAL DEDUPLICATED MESSAGES:', messages);

                    if (messages.length > 0) {
                        errorMessage = messages.join('\n');
                    } else if (err.detail || err.error || err.non_field_errors) {
                        errorMessage = err.detail || err.error || (Array.isArray(err.non_field_errors) ? err.non_field_errors[0] : err.non_field_errors);
                    } else if (err && typeof err === 'object' && Object.values(err).some(v => Array.isArray(v) && v[0]?.toString().toLowerCase().includes('this field is required'))) {
                        errorMessage = 'Please fill all the mandatory details (*)';
                    } else {
                        errorMessage = 'Validation error occurred. Please check your input.';
                    }
                } else {
                    // No entries found, try to extract any string value
                    errorMessage = err.detail || err.error || err.message || 'An error occurred';
                    console.log('🔴 No entries, SET errorMessage to:', errorMessage);
                }
            } else if (typeof err === 'string') {
                errorMessage = err;
                console.log('🔴 Error is string, SET errorMessage to:', errorMessage);
            }

            // Final safety check: ensure errorMessage is a string
            if (typeof errorMessage !== 'string') {
                console.error('🔴 ERROR: errorMessage is not a string!', errorMessage);
                errorMessage = 'An unexpected error occurred';
            }

            console.log('🔴 FINAL ERROR MESSAGE (type: ' + typeof errorMessage + '):', errorMessage);
            showNotification(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };



    // Cleanup redundant effects that were at the end of the file

    const switchPositionContext = (id) => {
        if (!id) {
            sessionStorage.removeItem('activePositionContext');
            setActivePositionContext(null);
            showNotification("Switched back to Standard Mode", "info");
        } else {
            sessionStorage.setItem('activePositionContext', id);
            setActivePositionContext(id);
            showNotification("Acting Mode Activated", "success");
        }
        // Force refresh data to reflect new context
        refreshPermissions();
        fetchData();
        fetchStats();
    };

    const value = {
        activeSection, setActiveSection,
        data, setData,
        stats, setStats,
        loading, setLoading,
        activePositionContext, switchPositionContext,
        isSyncing, setIsSyncing,
        isSubmitting, setIsSubmitting,
        lastFetchRef: fetchRef, // Expose for debugging if needed
        navigateToSection,
        navigationFilter,
        setNavigationFilter,
        canView, canCreate, canEdit, canDelete,
        showModal, setShowModal,
        showDeleteModal, setShowDeleteModal,
        deleteConfig, setDeleteConfig,
        confirmDelete,

        showPositionDetail, setShowPositionDetail,
        selectedPosition, setSelectedPosition,
        showOfficeDetail,
        setShowOfficeDetail,
        selectedOffice,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        setSelectedOffice,
        modalType, setModalType,
        showEmployeeProfile, setShowEmployeeProfile,
        selectedEmployee, setSelectedEmployee,
        activeProfileTab, setActiveProfileTab,
        formData, setFormData,
        offices, setOffices,
        allOffices, setAllOffices,
        departments, setDepartments,
        sections, setSections,
        jobFamilies, setJobFamilies,
        roles, setRoles,
        roleSubGroups, setRoleSubGroups,
        jobs, setJobs,
        positions, setPositions,
        orgLevels, setOrgLevels,
        projects, setProjects,
        facilityMasters, setFacilityMasters,
        positionLevels, setPositionLevels,
        positionTypes, setPositionTypes,
        shifts, setShifts,
        documentTypes: [], // Removed section
        allEmployees, setAllEmployees,
        roleTypes, setRoleTypes,
        tasks, setTasks,
        jobFamilyMap, setJobFamilyMap,
        geoContinents, setGeoContinents,
        geoCountries, setGeoCountries,
        geoStatesData, setGeoStatesData,
        geoDistrictsData, setGeoDistrictsData,
        geoMandals, setGeoMandals,
        geoClusters, setGeoClusters,

        geoVisitingLocations, setGeoVisitingLocations,
        geoLandmarks, setGeoLandmarks,
        notification, setNotification,
        validationErrors, setValidationErrors,
        previousModal, setPreviousModal,
        orgTab, setOrgTab,
        isAuthenticated, login, logout, user, error, refreshPermissions,
        passwordResetRequired, setPasswordResetRequired,
        expandedGroups, setExpandedGroups,
        toggleGroup, selectSection,
        fetchData, fetchStats, fetchDropdownData,
        pagination, setPagination, // Export pagination
        showNotification, handleAdd, handleEdit, handleDelete, handleFormSubmit,
        closeModal,
        handleViewOffice, handleViewProfile, fetchPositionDetail, handleAddOfficeByLevel,
        getPhotoUrl,
        showCancelModal, setShowCancelModal, confirmCancel,
        isBulkUploadOpen, setIsBulkUploadOpen
    };

    window.__dataContext = value;
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
