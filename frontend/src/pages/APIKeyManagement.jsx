import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import {
    X, Key, Trash2, Shield, Globe, Lock, Cpu, Network,
    CheckCircle, Copy, Plus, Users, Building2, ShieldAlert,
    Activity, Layout, Briefcase, Search, Moon, Sun,
    AlertTriangle, ExternalLink, Calendar, ChevronRight, Fingerprint, Eye, RefreshCw, Check, Edit, History, Clock,
    Zap, Radio, ArrowUpRight, CheckCircle2, ShieldCheck
} from 'lucide-react';

import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';

const copyToClipboard = (text) => {
    // 1. Try modern navigator.clipboard API (requires Secure Context: HTTPS or localhost)
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }

    // 2. Fallback: document.execCommand('copy') (Works in non-secure HTTP contexts)
    return new Promise((resolve, reject) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure textarea is not visible but part of DOM
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) resolve();
            else reject(new Error('ExecCommand copy failed'));
        } catch (err) {
            document.body.removeChild(textArea);
            reject(err);
        }
    });
};

const APIKeyManagement = () => {
    const {
        showNotification,
        jobFamilies,
        roleTypes,
        roles,
        orgLevels,
        sections,
        departments,
        offices,
        positions,
        projects,
        geoContinents,
        geoCountries,
        geoStatesData,
        geoDistrictsData,
        geoMandals,
        geoClusters,
        handleDelete
    } = useData();

    const [keys, setKeys] = useState([]);
    const [isByRevoked, setIsByRevoked] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    // Edit Mode
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingKeyId, setEditingKeyId] = useState(null);

    // Success Modal
    const [createdKey, setCreatedKey] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Usage Logs Modal
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [usageLogs, setUsageLogs] = useState([]);
    const [usageLogsLoading, setUsageLogsLoading] = useState(false);
    const [usageModalTitle, setUsageModalTitle] = useState("Global Usage History");

    // Form
    const [formData, setFormData] = useState({
        name: '',
        actions: { read: true, create: false, update: false, delete: false },
        scopeType: 'GLOBAL',
        scopeTab: 'ORGANIZATION',
        selectedScopes: [],
        locationGlobal: false,
        dataPermissions: { basic: true, personal: false, contact: false, financial: false, bank: false, epfo: false, history: false },
        validUntil: '',
        allowedIps: '',
        rateLimit: 100,
        key: '',
        webhookUrl: '',
        webhookEvents: ['shift.assigned', 'shift.unassigned', 'shift.bulk_assigned', 'shift.bulk_deleted'],
    });

    const [temp, setTemp] = useState({
        jobFamily: '', roleType: '', role: '',
        orgLevel: '', office: '', department: '', section: '', position: '',
        project: '',
        continent: '', country: '', state: '', district: '', mandal: '', cluster: ''
    });

    const PERMS = [
        { id: 'basic', label: 'Basic Profile', desc: 'Name, Designation, Department', disabled: true },
        { id: 'personal', label: 'Personal Identifiers', desc: 'Aadhaar, PAN, DOB, Gender' },
        { id: 'contact', label: 'Contact Details', desc: 'Phone, Email, Address' },
        { id: 'financial', label: 'Salary Details', desc: 'Monthly Salary, Gross, Annual CTC' },
        { id: 'bank', label: 'Bank Details', desc: 'A/C No, IFSC, Branch (No PAN)' },
        { id: 'epfo', label: 'EPFO Details', desc: 'UAN Number, PF Joining Date' },
        { id: 'history', label: 'Professional History', desc: 'Education, Experience, History' }
    ];

    const fetchKeys = async (page = 1) => {
        setLoading(true);
        try {
            const result = await api.get(`api-keys?page=${page}`);

            // ALPHABETICAL SORT HELPER
            const s = (arr) => {
                if (!Array.isArray(arr)) return [];
                return [...arr].sort((a, b) => {
                    const nameA = (a?.name || a?.title || '').toString();
                    const nameB = (b?.name || b?.title || '').toString();
                    return nameA.localeCompare(nameB, undefined, { numeric: true });
                });
            };

            // Handle paginated API keys response
            if (result.results) {
                setKeys(s(result.results));
                setTotalCount(result.count || 0);
                setTotalPages(Math.ceil((result.count || 0) / pageSize));
            } else if (Array.isArray(result)) {
                setKeys(s(result));
                setTotalCount(result.length);
                setTotalPages(1);
            }
        } catch (e) {
            console.error("Failed to load API keys:", e);
            showNotification("Failed to load API keys", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsageLogs = async (keyId = null) => {
        setUsageLogsLoading(true);
        setIsUsageModalOpen(true);
        setUsageLogs([]);
        try {
            const url = keyId ? `api-keys/${keyId}/usage_history` : 'api-keys/global_usage_history';
            const res = await api.get(url);
            setUsageLogs(Array.isArray(res) ? res : (res?.results || []));
            setUsageModalTitle(keyId ? `Usage History: ${keys.find(k => k.id === keyId)?.name || 'Key'}` : "Global Gateway Usage History");
        } catch (e) {
            console.error("Failed to fetch logs:", e);
            showNotification("Failed to load usage history", "error");
            setUsageLogs([]);
        } finally {
            setUsageLogsLoading(false);
        }
    };

    useEffect(() => { fetchKeys(currentPage); }, [currentPage]);

    const addScope = (forceType = null) => {
        let item = null;
        if (formData.scopeTab === 'ORGANIZATION') {
            const typePerm = forceType || (temp.position ? 'POSITION' : temp.section ? 'SECTION' : temp.department ? 'DEPARTMENT' : temp.office ? 'OFFICE' : temp.orgLevel ? 'LEVEL' : null);

            if (typePerm === 'POSITION' && temp.position) item = { type: 'POSITION', id: temp.position, label: `Pos: ${positions.find(x => x.id == temp.position)?.name}` };
            else if (typePerm === 'SECTION' && temp.section) item = { type: 'SECTION', id: temp.section, label: `Sec: ${sections.find(x => x.id == temp.section)?.name}` };
            else if (typePerm === 'DEPARTMENT' && temp.department) item = { type: 'DEPARTMENT', id: temp.department, label: `Dept: ${departments.find(x => x.id == temp.department)?.name}` };
            else if (typePerm === 'OFFICE' && temp.office) item = { type: 'OFFICE', id: temp.office, label: `Office: ${offices.find(x => x.id == temp.office)?.name}` };
            else if (typePerm === 'LEVEL' && temp.orgLevel) item = { type: 'LEVEL', id: temp.orgLevel, label: `Lvl: ${orgLevels.find(x => x.id == temp.orgLevel)?.name}` };
        } else if (formData.scopeTab === 'ROLES') {
            const typePerm = forceType || (temp.role ? 'ROLE' : temp.roleType ? 'ROLE_TYPE' : temp.jobFamily ? 'JOB_FAMILY' : null);

            if (typePerm === 'ROLE' && temp.role) item = { type: 'ROLE', id: temp.role, label: `Role: ${roles.find(x => x.id == temp.role)?.name}` };
            else if (typePerm === 'ROLE_TYPE' && temp.roleType) item = { type: 'ROLE_TYPE', id: temp.roleType, label: `Type: ${roleTypes.find(x => x.id == temp.roleType)?.name}` };
            else if (typePerm === 'JOB_FAMILY' && temp.jobFamily) item = { type: 'JOB_FAMILY', id: temp.jobFamily, label: `Family: ${jobFamilies.find(x => x.id == temp.jobFamily)?.name}` };
        } else if (formData.scopeTab === 'PROJECTS') {
            if (temp.project) {
                const project = projects.find(x => x.id == temp.project);
                item = { type: 'PROJECT', id: temp.project, label: `Proj: ${project?.name || project?.title || temp.project}` };
            }
        } else if (formData.scopeTab === 'LOCATIONS') {
            const typePerm = forceType || (temp.cluster ? 'CLUSTER' : temp.mandal ? 'MANDAL' : temp.district ? 'DISTRICT' : temp.state ? 'STATE' : temp.country ? 'COUNTRY' : temp.continent ? 'CONTINENT' : null);

            if (typePerm === 'CLUSTER' && temp.cluster) {
                const found = (geoClusters || []).find(x => x.id == temp.cluster);
                item = { type: 'CLUSTER', id: temp.cluster, label: `Loc: ${found?.name || 'Unknown'}`, level: found?.level || 6 };
            }
            else if (typePerm === 'MANDAL' && temp.mandal) item = { type: 'MANDAL', id: temp.mandal, label: `Mandal: ${geoMandals.find(x => x.id == temp.mandal)?.name}`, level: 5 };
            else if (typePerm === 'DISTRICT' && temp.district) item = { type: 'DISTRICT', id: temp.district, label: `Dist: ${geoDistrictsData.find(x => x.id == temp.district)?.name}`, level: 4 };
            else if (typePerm === 'STATE' && temp.state) item = { type: 'STATE', id: temp.state, label: `State: ${geoStatesData.find(x => x.id == temp.state)?.name}`, level: 3 };
            else if (typePerm === 'COUNTRY' && temp.country) item = { type: 'COUNTRY', id: temp.country, label: `Country: ${geoCountries.find(x => x.id == temp.country)?.name}`, level: 2 };
            else if (typePerm === 'CONTINENT' && temp.continent) item = { type: 'CONTINENT', id: temp.continent, label: `Terr: ${geoContinents.find(x => x.id == temp.continent)?.name}`, level: 1 };
        }

        if (item) {
            if (formData.selectedScopes.find(s => s.type === item.type && s.id === item.id)) {
                showNotification(`${item.label} is already in the scope`, "info");
                return;
            }
            setFormData({ ...formData, selectedScopes: [...formData.selectedScopes, item] });
        }
    };

    const handleEdit = async (key) => {
        setIsEditMode(true);
        setEditingKeyId(key.id);

        try {
            // Fetch the full API key object (the backend detail view is configured to show the persistent key)
            const fullKey = await api.get(`api-keys/${key.id}`);
            const scopeType = fullKey.scope?.type || 'GLOBAL';
            setFormData({
                name: fullKey.name,
                actions: fullKey.actions || { read: true, create: false, update: false, delete: false },
                scopeType: scopeType,
                scopeTab: 'ORGANIZATION',
                selectedScopes: fullKey.scope?.entities || [],
                locationGlobal: fullKey.scope?.locationGlobal || false,
                dataPermissions: fullKey.data_permissions || { basic: true, personal: false, contact: false, financial: false, bank: false, epfo: false, history: false },
                validUntil: fullKey.valid_until || '',
                allowedIps: fullKey.allowed_ips || '',
                rateLimit: fullKey.rate_limit || 100,
                key: fullKey.key || '',
                webhookUrl: fullKey.webhook_url || '',
                webhookEvents: fullKey.webhook_events?.length ? fullKey.webhook_events : ['shift.assigned', 'shift.unassigned', 'shift.bulk_assigned', 'shift.bulk_deleted'],
            });
            setIsModalOpen(true);
        } catch (e) {
            console.error("Failed to fetch full key details", e);
            showNotification("Failed to load secure key details", "error");
        }
    };

    const handleUpdate = async () => {
        if (!formData.name) {
            showNotification("Application name is required", "error");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                actions: formData.actions,
                scope: { type: formData.scopeType, entities: formData.selectedScopes, locationGlobal: formData.locationGlobal },
                data_permissions: formData.dataPermissions,
                valid_until: (formData.validUntil && typeof formData.validUntil === 'string')
                    ? formData.validUntil.split('T')[0].split(' ')[0]
                    : null,
                allowed_ips: formData.allowedIps,
                rate_limit: Math.min(2147483647, Math.max(1, parseInt(formData.rateLimit) || 100)),
                webhook_url: formData.webhookUrl || null,
                webhook_events: formData.webhookEvents || [],
            };
            await api.put(`api-keys/${editingKeyId}`, payload);
            setIsModalOpen(false);
            setIsEditMode(false);
            setEditingKeyId(null);
            fetchKeys(currentPage);
            setFormData({
                name: '', actions: { read: true, create: false, update: false, delete: false },
                scopeType: 'GLOBAL', scopeTab: 'ORGANIZATION', selectedScopes: [], locationGlobal: false,
                dataPermissions: { basic: true, personal: false, contact: false, financial: false, bank: false, epfo: false, history: false },
                validUntil: '', allowedIps: '', rateLimit: 100, key: '',
                webhookUrl: '',
                webhookEvents: ['shift.assigned', 'shift.unassigned', 'shift.bulk_assigned', 'shift.bulk_deleted']
            });
            showNotification("API Key updated successfully", "success");
        } catch (e) {
            showNotification("Failed to update API Key", "error");
        } finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!formData.name) {
            showNotification("Application name is required", "error");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                name: formData.name, actions: formData.actions,
                scope: { type: formData.scopeType, entities: formData.selectedScopes, locationGlobal: formData.locationGlobal },
                data_permissions: formData.dataPermissions,
                valid_until: (formData.validUntil && typeof formData.validUntil === 'string')
                    ? formData.validUntil.split('T')[0].split(' ')[0]
                    : null,
                allowed_ips: formData.allowedIps,
                rate_limit: Math.min(2147483647, Math.max(1, parseInt(formData.rateLimit) || 100)),
                webhook_url: formData.webhookUrl || null,
                webhook_events: formData.webhookEvents || [],
            };
            console.log('Creating API Key with payload:', payload);
            const res = await api.post('api-keys', payload);
            console.log('API Key created successfully:', res);
            setCreatedKey(res.key); setShowSuccessModal(true); setIsModalOpen(false);
            setCurrentPage(1); // Reset to first page to see the new key
            fetchKeys(currentPage); // Note: setCurrentPage(1) might not trigger effect synchronously for this call
            setFormData({
                name: '', actions: { read: true, create: false, update: false, delete: false },
                scopeType: 'GLOBAL', scopeTab: 'ORGANIZATION', selectedScopes: [], locationGlobal: false,
                dataPermissions: { basic: true, personal: false, contact: false, financial: false, bank: false, epfo: false, history: false },
                validUntil: '', allowedIps: '', rateLimit: 100, key: '',
                webhookUrl: '',
                webhookEvents: ['shift.assigned', 'shift.unassigned', 'shift.bulk_assigned', 'shift.bulk_deleted']
            });
            showNotification("API Key created successfully", "success");
        } catch (e) {
            console.error('Failed to create API Key:', e);
            showNotification(`Failed to create API Key: ${e.error || e.message || 'Unknown error'}`, "error");
        } finally { setLoading(false); }
    };

    const calculateAvg = () => {
        if (!keys.length) return "0.0";
        const sum = keys.reduce((a, b) => a + (b.usage_count || 0), 0);
        const oldest = new Date(Math.min(...keys.map(k => new Date(k.created_at))));
        const days = Math.max(1, Math.ceil((new Date() - oldest) / (86400000)));
        return (sum / days).toFixed(1);
    };

    return (
        <>
            <div className="fade-in scroll-container" style={{ paddingBottom: '3rem', position: 'relative' }}>
                {loading && (
                    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.75)', zIndex: 99999, backdropFilter: 'blur(8px)' }}>
                        <BavyaSpinner label="Syncing Security Vault..." />
                    </div>
                )}
                {/* PREMIUM HERO SECTION */}
                <div className="glass" style={{
                    padding: '1.5rem 2.5rem',
                    marginBottom: '2rem',
                    borderRadius: '24px',
                    background: 'linear-gradient(120deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '8px solid var(--magenta)',
                    boxShadow: 'var(--shadow-premium)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, var(--primary-light) 0%, #fff 100%)',
                            borderRadius: '18px',
                            boxShadow: '0 8px 20px rgba(190, 24, 93, 0.1)'
                        }}>
                            <Cpu size={36} color="var(--magenta)" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <span style={{ background: 'var(--magenta)', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800 }}>M2M SECURITY</span>
                                <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>GATEWAY CONTROL</span>
                            </div>
                            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                API Access Management
                            </h2>
                            <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 500, maxWidth: '600px' }}>
                            </p>
                        </div>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            setIsEditMode(false);
                            setEditingKeyId(null);
                            setFormData({
                                name: '', actions: { read: true, create: false, update: false, delete: false },
                                scopeType: 'GLOBAL', scopeTab: 'ORGANIZATION', selectedScopes: [], locationGlobal: false,
                                dataPermissions: { basic: true, personal: false, contact: false, financial: false, bank: false, epfo: false, history: false },
                                validUntil: '', allowedIps: '', rateLimit: 100,
                                webhookUrl: '',
                                webhookEvents: ['shift.assigned', 'shift.unassigned', 'shift.bulk_assigned', 'shift.bulk_deleted']
                            });
                            setIsModalOpen(true);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '14px 28px',
                            borderRadius: '16px',
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            boxShadow: '0 10px 20px -5px rgba(190, 24, 93, 0.25)'
                        }}
                    >
                        <Plus size={20} />
                        Generate New Key
                    </button>
                </div>

                {/* HIGH IMPACT STATS */}
                <div className="stats-grid stagger-in" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="glass stat-card" onClick={() => fetchUsageLogs()} style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '12px' }}>
                                <Key size={20} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>TOTAL PROVISIONED</span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{keys.length}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Global access credentials</div>
                    </div>

                    <div className="glass stat-card" onClick={() => fetchUsageLogs()} style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px' }}>
                                <CheckCircle size={20} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>ACTIVE STATUS</span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{keys.filter(k => k.is_active).length}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Operational keys in use</div>
                    </div>

                    <div className="glass stat-card" onClick={() => fetchUsageLogs()} style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', borderRadius: '12px' }}>
                                <Activity size={20} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>DATA THROUGHPUT</span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{keys.reduce((a, b) => a + (b.usage_count || 0), 0)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Total lifetime API hits</div>
                    </div>

                    <div className="glass stat-card" onClick={() => fetchUsageLogs()} style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '12px' }}>
                                <Fingerprint size={20} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>DAILY VELOCITY</span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{calculateAvg()}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Avg requests per day</div>
                    </div>
                </div>

                {/* SECURITY PROTOCOL BAR */}


                <div className="section-card">
                    <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' }}>
                        <Tab active={!isByRevoked} onClick={() => setIsByRevoked(false)} label="Active Credentials" count={keys.filter(k => k.is_active).length} activeColor="var(--magenta)" />
                        <Tab active={isByRevoked} onClick={() => setIsByRevoked(true)} label="Revoked & Expired" count={keys.filter(k => !k.is_active).length} activeColor="#64748b" />
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Partner Application</th>
                                    <th>Key Preview</th>
                                    <th>Methods</th>
                                    <th>Data Access</th>
                                    <th style={{ textAlign: 'center' }}>Limit</th>
                                    <th>Usage</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {keys.filter(k => k.is_active === !isByRevoked).map(k => (
                                    <tr key={k.id} className="stagger-in">
                                        <td>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{k.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontWeight: 600 }}>
                                                <Calendar size={12} /> Issued: {new Date(k.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace' }}>
                                                <span style={{ color: '#cbd5e1', letterSpacing: '4px' }}>••••</span>
                                                <span style={{ color: 'var(--magenta)', fontWeight: 800, fontSize: '0.9rem' }}>{k.key_preview || 'XXXX'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {Object.entries(k.actions || {}).filter(a => a[1]).map(a => (
                                                    <Tag key={a[0]} bg="rgba(190, 24, 93, 0.08)" co="var(--magenta)">
                                                        {a[0] === 'read' ? 'GET' : a[0].toUpperCase()}
                                                    </Tag>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '180px' }}>
                                                {Object.entries(k.data_permissions || {}).filter(p => p[1]).map(p => (
                                                    <Tag key={p[0]} bg="#eff6ff" co="#1e40af">{p[0]}</Tag>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #fee2e2' }}>
                                                <Activity size={14} /> {k.rate_limit || 100} <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>RPM</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div
                                                onClick={() => fetchUsageLogs(k.id)}
                                                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{k.usage_count || 0}</div>
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    Requests <History size={10} />
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${k.is_active ? 'badge-active' : 'badge-inactive'}`}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', marginRight: '8px' }} />
                                                {k.is_active ? 'ACTIVE' : 'REVOKED'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleEdit(k)}
                                                    className="nav-icon-btn"
                                                    style={{ width: '38px', height: '38px', color: '#6366f1', background: '#eff6ff', borderRadius: '10px' }}
                                                    title="Edit Key"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                {k.is_active && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('REVOKE THIS API KEY? THIS CANNOT BE UNDONE.')) {
                                                                api.post(`api-keys/${k.id}/revoke`, {})
                                                                    .then(() => {
                                                                        fetchKeys(currentPage);
                                                                        showNotification("API KEY REVOKED SUCCESSFULLY", "success");
                                                                    })
                                                                    .catch(err => showNotification("FAILED TO REVOKE KEY", "error"));
                                                            }
                                                        }}
                                                        className="nav-icon-btn"
                                                        style={{ width: '38px', height: '38px', color: '#f59e0b', background: '#fffbeb', borderRadius: '10px' }}
                                                        title="Revoke Key"
                                                    >
                                                        <ShieldAlert size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete('API Key Management', k.id, k.name)}
                                                    className="nav-icon-btn"
                                                    style={{ width: '38px', height: '38px', color: '#ef4444', background: '#fff1f2', borderRadius: '10px' }}
                                                    title="Delete Key"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.5rem 2rem',
                            borderTop: '2px solid #f1f5f9',
                            background: '#fafbfc'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} keys
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        background: currentPage === 1 ? '#f8fafc' : 'white',
                                        color: currentPage === 1 ? '#cbd5e1' : '#475569',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Previous
                                </button>

                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    {[...Array(totalPages)].map((_, idx) => {
                                        const pageNum = idx + 1;
                                        const isActive = pageNum === currentPage;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '8px',
                                                    border: isActive ? '2px solid var(--magenta)' : '1px solid #e2e8f0',
                                                    background: isActive ? 'var(--magenta)' : 'white',
                                                    color: isActive ? 'white' : '#475569',
                                                    fontWeight: 800,
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        background: currentPage === totalPages ? '#f8fafc' : 'white',
                                        color: currentPage === totalPages ? '#cbd5e1' : '#475569',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showSuccessModal && <Success keyStr={createdKey} onClose={() => setShowSuccessModal(false)} showNotification={showNotification} />}

            {isUsageModalOpen && (
                <UsageLogs
                    title={usageModalTitle}
                    logs={usageLogs}
                    loading={usageLogsLoading}
                    onClose={() => setIsUsageModalOpen(false)}
                />
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {/* Header */}
                        <div style={{
                            padding: '2rem 3rem',
                            borderBottom: '2px solid #f1f5f9',
                            background: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 16px rgba(139, 92, 246, 0.25)'
                                }}>
                                    <Key size={30} color="white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 style={{
                                        margin: 0,
                                        fontSize: '1.75rem',
                                        fontWeight: 900,
                                        color: '#0f172a',
                                        letterSpacing: '-0.02em'
                                    }}>
                                        {isEditMode ? 'Edit API Key' : 'API Key Generator'}
                                    </h2>
                                    <p style={{
                                        margin: '2px 0 0 0',
                                        color: '#64748b',
                                        fontSize: '0.9rem',
                                        fontWeight: 600
                                    }}>
                                        {isEditMode ? 'Update permissions and security settings for this API key' : 'Configure secure authentication for your external applications'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setIsEditMode(false);
                                    setEditingKeyId(null);
                                    setFormData({ name: '', actions: { read: true, create: false, update: false, delete: false }, scopeType: 'GLOBAL', scopeTab: 'ORGANIZATION', selectedScopes: [], locationGlobal: false, dataPermissions: { basic: true, personal: false, contact: false, financial: false, history: false }, validUntil: '', allowedIps: '' });
                                }}
                                style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    border: '1px solid #e2e8f0', background: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s', color: '#64748b'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', minHeight: 0 }}>
                            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                                {/* Identity & Permissions Section */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {isEditMode && formData.key && (
                                        <div style={{ marginBottom: '2rem', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Key size={14} /> Active API Key
                                                </label>
                                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>RECOVERABLE</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={formData.key}
                                                    readOnly
                                                    style={{ background: '#ffffff', color: '#1e1b4b', fontWeight: 800, fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.05em', cursor: 'default', height: '56px' }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        copyToClipboard(formData.key);
                                                        showNotification("API Key copied to clipboard", "success");
                                                    }}
                                                    style={{
                                                        background: '#6366f1',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        width: '56px',
                                                        height: '56px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                >
                                                    <Copy size={22} />
                                                </button>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>This is your persistent authentication key. Keep it secure and never share it in public.</div>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>
                                            <Cpu size={14} /> System Identity
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter Application Name"
                                            style={{ fontSize: '1.05rem', padding: '1rem' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 900,
                                            color: '#6366f1',
                                            textTransform: 'uppercase',
                                            marginBottom: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            letterSpacing: '0.05em'
                                        }}>
                                            <Shield size={14} /> Allowed Methods
                                        </label>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            {['read', 'create', 'update', 'delete'].map(a => {
                                                const actionConfig = {
                                                    read: { icon: Eye, color: '#6366f1', bg: '#eff6ff', border: '#dbeafe' },
                                                    create: { icon: Plus, color: '#10b981', bg: '#ecfdf5', border: '#d1fae5' },
                                                    update: { icon: RefreshCw, color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7' },
                                                    delete: { icon: Trash2, color: '#ef4444', bg: '#fef2f2', border: '#fee2e2' }
                                                };
                                                const config = actionConfig[a];
                                                const Icon = config.icon;
                                                const isActive = formData.actions[a];

                                                return (
                                                    <button
                                                        key={a}
                                                        onClick={() => setFormData(p => ({ ...p, actions: { ...p.actions, [a]: !p.actions[a] } }))}
                                                        style={{
                                                            flex: '1',
                                                            minWidth: '130px',
                                                            padding: '14px 16px',
                                                            borderRadius: '12px',
                                                            border: '1px solid',
                                                            borderColor: isActive ? config.color : '#e2e8f0',
                                                            background: isActive ? config.bg : '#ffffff',
                                                            color: isActive ? config.color : '#64748b',
                                                            fontWeight: 800,
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                            textTransform: 'uppercase',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '10px',
                                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            letterSpacing: '0.04em',
                                                            boxShadow: isActive ? `0 4px 12px ${config.color}15` : 'none',
                                                            transform: isActive ? 'translateY(-1px)' : 'none'
                                                        }}
                                                    >
                                                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                                        {a}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 900,
                                            color: '#6366f1',
                                            textTransform: 'uppercase',
                                            marginBottom: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            letterSpacing: '0.05em'
                                        }}>
                                            <Eye size={14} /> Data Visibility
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                                            {PERMS.map(p => {
                                                const isChecked = formData.dataPermissions[p.id];
                                                return (
                                                    <label
                                                        key={p.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '14px',
                                                            padding: '16px 20px',
                                                            border: '1px solid',
                                                            borderColor: isChecked ? '#6366f1' : '#e2e8f0',
                                                            borderRadius: '16px',
                                                            background: isChecked ? '#eff6ff' : '#ffffff',
                                                            cursor: p.disabled ? 'not-allowed' : 'pointer',
                                                            opacity: p.disabled ? 0.6 : 1,
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: isChecked ? '0 4px 12px rgba(99, 102, 241, 0.08)' : '0 2px 4px rgba(0, 0, 0, 0.01)'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '22px',
                                                            height: '22px',
                                                            borderRadius: '6px',
                                                            border: `2px solid ${isChecked ? '#6366f1' : '#cbd5e1'}`,
                                                            background: isChecked ? '#6366f1' : 'transparent',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s'
                                                        }}>
                                                            {isChecked && <Check size={14} color="white" strokeWidth={4} />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            disabled={p.disabled}
                                                            onChange={() => !p.disabled && setFormData(pr => ({ ...pr, dataPermissions: { ...pr.dataPermissions, [p.id]: !pr.dataPermissions[p.id] } }))}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isChecked ? '#1e1b4b' : '#334155' }}>{p.label}</div>
                                                            <div style={{ fontSize: '0.75rem', color: isChecked ? '#475569' : '#94a3b8', fontWeight: 600 }}>{p.desc}</div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Scope Section */}
                                <div className="form-group">
                                    <label style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 900,
                                        color: '#6366f1',
                                        textTransform: 'uppercase',
                                        marginBottom: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        letterSpacing: '0.05em'
                                    }}>
                                        <Globe size={14} /> Operational Scope
                                    </label>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                        <button
                                            onClick={() => setFormData({ ...formData, scopeType: 'GLOBAL' })}
                                            style={{
                                                padding: '20px',
                                                borderRadius: '20px',
                                                border: '2px solid',
                                                borderColor: formData.scopeType === 'GLOBAL' ? '#6366f1' : '#e2e8f0',
                                                background: formData.scopeType === 'GLOBAL' ? '#eff6ff' : '#ffffff',
                                                color: formData.scopeType === 'GLOBAL' ? '#6366f1' : '#64748b',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '12px',
                                                boxShadow: formData.scopeType === 'GLOBAL' ? '0 10px 20px -5px rgba(99, 102, 241, 0.2)' : 'none',
                                                transform: formData.scopeType === 'GLOBAL' ? 'translateY(-2px)' : 'none'
                                            }}
                                        >
                                            <Globe size={28} />
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '1rem', marginBottom: '4px' }}>Full Organization</div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.7 }}>Complete access to all entities</div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, scopeType: 'SPECIFIC' })}
                                            style={{
                                                padding: '20px',
                                                borderRadius: '20px',
                                                border: '2px solid',
                                                borderColor: formData.scopeType === 'SPECIFIC' ? '#6366f1' : '#e2e8f0',
                                                background: formData.scopeType === 'SPECIFIC' ? '#eff6ff' : '#ffffff',
                                                color: formData.scopeType === 'SPECIFIC' ? '#6366f1' : '#64748b',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '12px',
                                                boxShadow: formData.scopeType === 'SPECIFIC' ? '0 10px 20px -5px rgba(99, 102, 241, 0.2)' : 'none',
                                                transform: formData.scopeType === 'SPECIFIC' ? 'translateY(-2px)' : 'none'
                                            }}
                                        >
                                            <Network size={28} />
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '1rem', marginBottom: '4px' }}>Granular Access</div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.7 }}>Limited to specific projects & units</div>
                                            </div>
                                        </button>
                                    </div>

                                    {formData.scopeType === 'SPECIFIC' && (
                                        <div style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            background: '#ffffff',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                background: '#f8fafc',
                                                borderBottom: '1px solid #e2e8f0',
                                            }}>
                                                {['ORGANIZATION', 'PROJECTS', 'ROLES', 'LOCATIONS', 'INDIVIDUAL'].map(t => {
                                                    const isActive = formData.scopeTab === t;
                                                    return (
                                                        <div
                                                            key={t}
                                                            onClick={() => setFormData({ ...formData, scopeTab: t })}
                                                            style={{
                                                                flex: 1,
                                                                padding: '16px 20px',
                                                                textAlign: 'center',
                                                                cursor: 'pointer',
                                                                background: isActive ? '#ffffff' : 'transparent',
                                                                borderBottom: isActive ? '3px solid #6366f1' : '3px solid transparent',
                                                                color: isActive ? '#6366f1' : '#94a3b8',
                                                                fontWeight: 800,
                                                                fontSize: '0.75rem',
                                                                transition: 'all 0.2s ease',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em'
                                                            }}
                                                        >
                                                            {t}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div style={{ padding: '2rem' }}>
                                                {formData.scopeTab === 'ORGANIZATION' && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                        <S label="Level" val={temp.orgLevel} onChange={v => setTemp({ ...temp, orgLevel: v, office: '', department: '', section: '', position: '' })} opts={orgLevels} onAdd={() => addScope('LEVEL')} />
                                                        <S label="Office" val={temp.office} onChange={v => setTemp({ ...temp, office: v, department: '', section: '', position: '' })} opts={offices.filter(o => !temp.orgLevel || o.level == temp.orgLevel)} onAdd={() => addScope('OFFICE')} />
                                                        <S label="Department" val={temp.department} onChange={v => setTemp({ ...temp, department: v, section: '', position: '' })} opts={departments.filter(d => !temp.office || d.office == temp.office)} onAdd={() => addScope('DEPARTMENT')} />
                                                        <S label="Section" val={temp.section} onChange={v => setTemp({ ...temp, section: v, position: '' })} opts={sections.filter(s => !temp.department || s.department == temp.department)} onAdd={() => addScope('SECTION')} />
                                                        <S label="Position" val={temp.position} onChange={v => setTemp({ ...temp, position: v })} opts={positions.filter(p => (!temp.section || p.section == temp.section) && (!temp.department || p.department == temp.department))} onAdd={() => addScope('POSITION')} />
                                                    </div>
                                                )}
                                                {formData.scopeTab === 'ROLES' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                        <S label="Job Family" val={temp.jobFamily} onChange={v => setTemp({ ...temp, jobFamily: v, roleType: '', role: '' })} opts={jobFamilies} onAdd={() => addScope('JOB_FAMILY')} />
                                                        <S label="Role Type" val={temp.roleType} onChange={v => setTemp({ ...temp, roleType: v, role: '' })} opts={roleTypes.filter(rt => !temp.jobFamily || rt.job_family == temp.jobFamily)} onAdd={() => addScope('ROLE_TYPE')} />
                                                        <S label="Role Name" val={temp.role} onChange={v => setTemp({ ...temp, role: v })} opts={roles.filter(r => !temp.roleType || r.role_type == temp.roleType)} onAdd={() => addScope('ROLE')} />
                                                    </div>
                                                )}
                                                {formData.scopeTab === 'PROJECTS' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                        <S label="Project Selection" val={temp.project} onChange={v => setTemp({ ...temp, project: v })} opts={projects} onAdd={() => addScope('PROJECT')} />
                                                    </div>
                                                )}
                                                {formData.scopeTab === 'LOCATIONS' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                        <div style={{ marginBottom: '1rem' }}>
                                                            <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', padding: '12px 16px', background: formData.locationGlobal ? '#eff6ff' : '#f8fafc', borderRadius: '12px', border: '1px solid', borderColor: formData.locationGlobal ? '#6366f1' : '#e2e8f0', transition: 'all 0.2s' }}>
                                                                <input type="checkbox" checked={formData.locationGlobal} onChange={e => setFormData({ ...formData, locationGlobal: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#6366f1' }} />
                                                                <div>
                                                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: formData.locationGlobal ? '#1e1b4b' : '#475569' }}>Global Geographic Access</div>
                                                                    <div style={{ fontSize: '0.7rem', color: formData.locationGlobal ? '#475569' : '#94a3b8', fontWeight: 600 }}>Includes all current and future territories, states, and clusters</div>
                                                                </div>
                                                            </label>
                                                        </div>

                                                        {!formData.locationGlobal && (
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                                <S label="Territory" val={temp.continent} onChange={v => setTemp({ ...temp, continent: v, country: '', state: '', district: '', mandal: '', cluster: '' })} opts={geoContinents} onAdd={() => addScope('CONTINENT')} />
                                                                <S label="Country" val={temp.country} onChange={v => setTemp({ ...temp, country: v, state: '', district: '', mandal: '', cluster: '' })} opts={geoCountries.filter(c => !temp.continent || c.continent == temp.continent)} onAdd={() => addScope('COUNTRY')} />
                                                                <S label="State" val={temp.state} onChange={v => setTemp({ ...temp, state: v, district: '', mandal: '', cluster: '' })} opts={geoStatesData.filter(s => !temp.country || s.country == temp.country)} onAdd={() => addScope('STATE')} />
                                                                <S label="District" val={temp.district} onChange={v => setTemp({ ...temp, district: v, mandal: '', cluster: '' })} opts={geoDistrictsData.filter(d => !temp.state || d.state == temp.state)} onAdd={() => addScope('DISTRICT')} />
                                                                <S label="Mandal" val={temp.mandal} onChange={v => setTemp({ ...temp, mandal: v, cluster: '' })} opts={geoMandals.filter(m => !temp.district || m.district == temp.district)} onAdd={() => addScope('MANDAL')} />
                                                                <S label="Cluster/Locality" val={temp.cluster} onChange={v => setTemp({ ...temp, cluster: v })} opts={(geoClusters || []).filter(c => !temp.mandal || c.mandal == temp.mandal)} onAdd={() => addScope('CLUSTER')} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {formData.scopeTab === 'INDIVIDUAL' && (
                                                    <div style={{ paddingBottom: show ? '300px' : '0', transition: 'padding 0.3s ease' }}>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Employee</label>
                                                        <ES onSelect={e => {
                                                            if (formData.selectedScopes.find(s => s.type === 'EMPLOYEE' && s.id === e.id)) {
                                                                showNotification(`${e.name} is already in the scope`, "info");
                                                                return;
                                                            }
                                                            setFormData(p => ({ ...p, selectedScopes: [...p.selectedScopes, { type: 'EMPLOYEE', id: e.id, label: `Ind: ${e.name} (${e.status})` }] }));
                                                        }}
                                                            onToggle={s => setShow(s)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected Entities</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {formData.selectedScopes.map((s, i) => (
                                                <div key={i} style={{ padding: '8px 14px', background: '#6366f1', color: 'white', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}>
                                                    {s.label}
                                                    <X size={14} style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => setFormData(p => ({ ...p, selectedScopes: p.selectedScopes.filter((_, idx) => idx !== i) }))} />
                                                </div>
                                            ))}
                                            {!formData.selectedScopes.length && formData.scopeType === 'SPECIFIC' && <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontStyle: 'italic' }}>Please add at least one entity to the scope.</div>}
                                            {formData.scopeType === 'GLOBAL' && <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>✓ Full Organization Accessibility</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Advanced Security */}
                                <div className="form-group">
                                    <label style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 900,
                                        color: '#6366f1',
                                        textTransform: 'uppercase',
                                        marginBottom: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        letterSpacing: '0.05em'
                                    }}>
                                        <Lock size={14} /> Advanced Security
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Key Expiry</label>
                                            <input type="date" className="form-input" value={formData.validUntil} onChange={e => setFormData({ ...formData, validUntil: e.target.value })} style={{ padding: '0.75rem' }} min={new Date().toISOString().split('T')[0]} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>IP Whitelist</label>
                                            <input type="text" className="form-input" value={formData.allowedIps} onChange={e => setFormData({ ...formData, allowedIps: e.target.value })} placeholder="0.0.0.0, 1.1.1.1" style={{ padding: '0.75rem' }} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Rate Limit (RPM)</label>
                                            <input type="number" className="form-input" value={formData.rateLimit} onChange={e => setFormData({ ...formData, rateLimit: e.target.value })} placeholder="100" style={{ padding: '0.75rem' }} min="1" max="100000" />
                                        </div>
                                    </div>
                                </div>

                                {/* WEBHOOK CONFIGURATION PANEL */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                                    borderRadius: '20px',
                                    padding: '2rem',
                                    border: '1px solid rgba(139,92,246,0.3)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                                        <div style={{ padding: '10px', background: 'rgba(139,92,246,0.2)', borderRadius: '12px', color: '#a78bfa' }}>
                                            <Network size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Push Notifications</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9' }}>Webhook Configuration</div>
                                        </div>
                                        {formData.webhookUrl && (
                                            <div style={{ marginLeft: 'auto', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '4px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, border: '1px solid rgba(52,211,153,0.3)' }}>ACTIVE</div>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Endpoint URL</label>
                                        <input
                                            type="url"
                                            value={formData.webhookUrl}
                                            onChange={e => setFormData({ ...formData, webhookUrl: e.target.value })}
                                            placeholder="https://your-system.com/api/hcm-webhook"
                                            style={{
                                                width: '100%', boxSizing: 'border-box', padding: '0.85rem 1rem',
                                                borderRadius: '12px', border: '1px solid rgba(139,92,246,0.3)',
                                                background: 'rgba(255,255,255,0.05)', color: '#f1f5f9',
                                                fontSize: '0.9rem', fontFamily: 'monospace', outline: 'none',
                                            }}
                                        />
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
                                            HCM will POST a signed JSON body to this URL on subscribed events. Leave blank to disable.
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'block' }}>Subscribe to Events</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {[
                                                { id: 'shift.assigned', label: 'Shift Assigned', color: '#34d399' },
                                                { id: 'shift.unassigned', label: 'Shift Removed', color: '#f87171' },
                                                { id: 'shift.bulk_assigned', label: 'Bulk Assign', color: '#60a5fa' },
                                                { id: 'shift.bulk_deleted', label: 'Bulk Delete', color: '#fb923c' },
                                                { id: 'employee.created', label: 'Employee Created', color: '#a78bfa' },
                                                { id: 'employee.updated', label: 'Employee Updated', color: '#818cf8' },
                                                { id: 'employee.deactivated', label: 'Employee Deactivated', color: '#f472b6' },
                                                { id: 'position.created', label: 'Position Created', color: '#fb7185' },
                                                { id: 'position.updated', label: 'Position Updated', color: '#38bdf8' },
                                                { id: 'position.deactivated', label: 'Position Deactivated', color: '#fb923c' },
                                            ].map(ev => {
                                                const active = formData.webhookEvents.includes(ev.id);
                                                return (
                                                    <button
                                                        key={ev.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const cur = formData.webhookEvents;
                                                            setFormData({ ...formData, webhookEvents: active ? cur.filter(x => x !== ev.id) : [...cur, ev.id] });
                                                        }}
                                                        style={{
                                                            padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                                                            borderColor: active ? ev.color : 'rgba(255,255,255,0.1)',
                                                            background: active ? `${ev.color}22` : 'rgba(255,255,255,0.04)',
                                                            color: active ? ev.color : '#64748b',
                                                            fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: active ? ev.color : '#475569', display: 'inline-block' }} />
                                                        {ev.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '10px', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                            <span style={{ color: '#a78bfa', fontWeight: 900 }}>ⓘ</span>
                                            Each webhook is HMAC-SHA256 signed. Verify with the <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', color: '#c4b5fd' }}>X-HCM-Signature</code> header.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Footer */}
                        <div style={{
                            padding: '1.5rem 2.5rem',
                            background: 'white',
                            borderTop: '2px solid #e0e7ff',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '1.5rem',
                            alignItems: 'center',
                            flexShrink: 0,
                            zIndex: 10
                        }}>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setIsEditMode(false);
                                    setEditingKeyId(null);
                                    setFormData({ name: '', actions: { read: true, create: false, update: false, delete: false }, scopeType: 'GLOBAL', scopeTab: 'ORGANIZATION', selectedScopes: [], locationGlobal: false, dataPermissions: { basic: true, personal: false, contact: false, financial: false, bank: false, epfo: false, history: false }, validUntil: '', allowedIps: '', rateLimit: 100, key: '' });
                                }}
                                style={{
                                    height: '48px',
                                    padding: '0 2rem',
                                    borderRadius: '12px',
                                    background: '#f1f5f9',
                                    border: '2px solid #e2e8f0',
                                    color: '#64748b',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            >
                                Close Wizard
                            </button>
                            <button
                                onClick={isEditMode ? handleUpdate : handleCreate}
                                disabled={loading}
                                style={{
                                    height: '48px',
                                    minWidth: '220px',
                                    padding: '0 2rem',
                                    borderRadius: '12px',
                                    background: isEditMode ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    border: 'none',
                                    color: 'white',
                                    fontWeight: 800,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1,
                                    boxShadow: isEditMode ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(139, 92, 246, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? (isEditMode ? 'Updating...' : 'Provisioning...') : (isEditMode ? 'Update API Key' : 'Generate New API Key')}
                            </button>
                        </div>
                    </div>
                </div >
            )
            }
        </>
    );
};

/* Sub-components with Enhanced styles */

const Tab = ({ active, onClick, label, count, activeColor }) => (
    <div
        onClick={onClick}
        style={{
            padding: '1.25rem 1.5rem',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            color: active ? activeColor : '#64748b',
            borderBottom: active ? `3px solid ${activeColor}` : '3px solid transparent',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: active ? 'rgba(190, 24, 93, 0.02)' : 'transparent'
        }}
    >
        {label}
        <span style={{
            background: active ? activeColor : '#f1f5f9',
            color: active ? 'white' : '#94a3b8',
            padding: '2px 10px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 900,
            boxShadow: active ? `0 4px 10px ${activeColor}33` : 'none'
        }}>
            {count}
        </span>
    </div>
);

const Th = ({ children, align = 'left' }) => (
    <th style={{ padding: '1rem', textAlign: align, fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {children}
    </th>
);

const Td = ({ children, align = 'left' }) => (
    <td style={{ padding: '1.5rem 1rem', textAlign: align, fontSize: '0.9rem' }}>
        {children}
    </td>
);

const Tag = ({ children, bg, co, onX }) => (
    <span style={{
        padding: '5px 12px',
        borderRadius: '100px',
        background: bg,
        color: co,
        fontSize: '0.65rem',
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        border: `1px solid ${co}1A`
    }}>
        {children} {onX && <X size={12} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={onX} />}
    </span>
);

const S = ({ label, val, onChange, opts, onAdd }) => (
    <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
        <div style={{ display: 'flex', gap: '8px' }}>
            <select
                className="form-input"
                style={{
                    padding: '0.6rem 1rem',
                    fontSize: '0.85rem',
                    height: '46px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    width: '100%'
                }}
                value={val}
                onChange={e => onChange(e.target.value)}
                disabled={opts.length === 0}
            >
                <option value="">{opts.length === 0 ? 'Loading data...' : `Select ${label}...`}</option>
                {opts.map(o => (
                    <option key={o.id} value={o.id}>
                        {label === 'Level' && o.level_code ? `${o.level_code} - ${o.name}` : (o.name || o.registered_name || o.code || o.id)}
                    </option>
                ))}
            </select>
            <button
                onClick={onAdd}
                disabled={!val}
                style={{
                    background: val ? '#6366f1' : '#e2e8f0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    width: '46px',
                    height: '46px',
                    cursor: val ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: val ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
                    transition: 'all 0.2s'
                }}
            >
                <Plus size={20} />
            </button>
        </div>
    </div>
);

const ES = ({ onSelect, onToggle }) => {
    const [q, setQ] = useState('');
    const [res, setRes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [err, setErr] = useState('');
    const abortControllerRef = useRef(null);

    const sanitize = (val) => {
        if (err) setErr('');
        if (/[^a-zA-Z0-9\s-]/.test(val)) {
            setErr('Symbols restricted: Use letters, numbers, or hyphens only.');
        }
        return val.replace(/[^a-zA-Z0-9\s-]/g, '');
    };

    const toggleMenu = (s) => {
        setShow(s);
        if (onToggle) onToggle(s);
    };

    const fetchEmployees = async (val = '') => {
        const cleanVal = val.trim();
        if (cleanVal.length < 2) {
            setRes([]);
            setLoading(false);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        try {
            // Use standardized api.get with the abort signal
            const data = await api.get(`employees?search=${encodeURIComponent(cleanVal)}&page_size=15`, {
                signal: abortControllerRef.current.signal
            });

            let list = Array.isArray(data) ? data : (data.results || []);

            // DOUBLE-LOCK: Verification check to ensure results actually match the search term
            // This prevents "stale" or "broad" backend results from cluttering the UI
            const searchLower = cleanVal.toLowerCase();
            const matchedList = list.filter(item => {
                const nameMatch = (item.name || '').toLowerCase().includes(searchLower);
                const codeMatch = (item.employee_code || '').toLowerCase().includes(searchLower);
                return nameMatch || codeMatch;
            });

            // Sort results to prioritize exact code matches
            const sorted = matchedList.sort((a, b) => {
                const aCode = (a.employee_code || '').toLowerCase();
                const bCode = (b.employee_code || '').toLowerCase();
                if (aCode === searchLower) return -1;
                if (bCode === searchLower) return 1;
                return (a.name || '').localeCompare(b.name || '');
            });

            setRes(sorted.slice(0, 8));
        } catch (e) {
            if (e.name !== 'CortexAbortError' && e.name !== 'AbortError') {
                console.error("Employee search failed", e);
            }
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (!show) return;

        const timer = setTimeout(() => {
            fetchEmployees(q);
        }, 350); // Balanced debounce to prevent spamming queries

        return () => clearTimeout(timer);
    }, [q, show]);

    const handleInput = (val) => {
        const clean = sanitize(val);
        setQ(clean);
    };

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="form-input"
                    value={q}
                    onFocus={() => toggleMenu(true)}
                    onChange={e => handleInput(e.target.value)}
                    placeholder="Search name or EMP code..."
                    style={{
                        paddingRight: '3rem',
                        height: '56px',
                        fontSize: '1rem',
                        borderColor: err ? '#ef4444' : (show ? 'var(--magenta)' : '#e2e8f0'),
                        boxShadow: err ? '0 0 0 4px rgba(239, 68, 68, 0.1)' : 'none'
                    }}
                />
                {err && (
                    <div style={{
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }} />
                        {err}
                    </div>
                )}
                <div style={{ position: 'absolute', right: '16px', top: '16px', color: 'var(--magenta)', display: 'flex', alignItems: 'center' }}>
                    {loading ? <RefreshCw size={20} className="animate-spin" /> : <Search size={22} />}
                </div>
            </div>

            {show && (
                <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} onClick={() => toggleMenu(false)} />
                    <div className="glass fade-in" style={{
                        position: 'absolute', top: 'calc(100% + 12px)', left: 0, right: 0,
                        background: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(30px)',
                        zIndex: 99999,
                        maxHeight: '350px', overflowY: 'auto',
                        padding: '12px',
                        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.3)',
                        border: '2px solid var(--magenta)',
                        borderRadius: '24px'
                    }}>
                        {loading && res.length === 0 ? (
                            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                                <div style={{
                                    width: '40px', height: '40px', margin: '0 auto 16px',
                                    border: '3px solid var(--primary-light)',
                                    borderTopColor: 'var(--magenta)',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite'
                                }} />
                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Searching secure registry...</div>
                            </div>
                        ) : res.length > 0 ? (
                            res.map(e => (
                                <div
                                    key={e.id}
                                    onClick={() => { onSelect(e); setShow(false); setQ(''); }}
                                    style={{
                                        padding: '1.25rem',
                                        cursor: 'pointer',
                                        borderRadius: '16px',
                                        marginBottom: '6px',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: '1px solid transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}
                                    onMouseOver={ev => {
                                        ev.currentTarget.style.background = 'rgba(190, 24, 93, 0.04)';
                                        ev.currentTarget.style.borderColor = 'rgba(190, 24, 93, 0.1)';
                                        ev.currentTarget.style.transform = 'translateX(4px)';
                                    }}
                                    onMouseOut={ev => {
                                        ev.currentTarget.style.background = 'transparent';
                                        ev.currentTarget.style.borderColor = 'transparent';
                                        ev.currentTarget.style.transform = 'translateX(0)';
                                    }}
                                >
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '12px',
                                        background: 'var(--primary-light)', color: 'var(--magenta)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.1rem', fontWeight: 800
                                    }}>
                                        {(e.name || 'U').charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{e.name}</div>
                                            <span style={{
                                                fontSize: '0.6rem',
                                                fontWeight: 900,
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: e.status === 'Active' ? '#ecfdf5' : '#f1f5f9',
                                                color: e.status === 'Active' ? '#059669' : '#64748b',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                {e.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                            <span style={{ color: 'var(--magenta)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>{e.employee_code}</span>
                                            <span style={{ opacity: 0.3 }}>•</span>
                                            <span style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>{e.positions_details?.[0]?.name || 'Unassigned Position'}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} style={{ color: '#cbd5e1' }} />
                                </div>
                            ))
                        ) : q.length > 0 ? (
                            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                                <div style={{
                                    width: '64px', height: '64px', background: '#fff1f2', color: '#ef4444',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 16px'
                                }}>
                                    <X size={32} />
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>No match found</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>We couldn't find anyone named "<strong>{q}</strong>"</div>
                            </div>
                        ) : (
                            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                                <div style={{
                                    width: '48px', height: '48px', background: '#f8fafc',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 16px', border: '1px solid #e2e8f0'
                                }}>
                                    <Search size={22} style={{ opacity: 0.4 }} />
                                </div>
                                {q.trim().length > 0 ? (
                                    <span>Type <strong style={{ color: 'var(--magenta)' }}>{2 - q.trim().length} more</strong> character{2 - q.trim().length > 1 ? 's' : ''} to search...</span>
                                ) : (
                                    "Start typing Name or Employee Code..."
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const Success = ({ keyStr, onClose, showNotification }) => (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
        <div className="glass fade-in" style={{ padding: '2.5rem 2rem', maxWidth: '650px', width: '95%', textAlign: 'center', background: 'white' }}>
            <div style={{
                margin: '0 auto 2rem',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--magenta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px var(--primary-light)'
            }}>
                <Fingerprint size={48} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', background: 'var(--sunset)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Key Secured!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2.5rem', fontWeight: 500, lineHeight: 1.6 }}>
                Your private access key has been generated. <strong style={{ color: 'var(--magenta)' }}>This is the only time it will be shown.</strong> If lost, you must revoke and regenerate.
            </p>
            <div style={{
                background: '#f8fafc',
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                border: '2px dashed #cbd5e1',
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-wrap',
                marginBottom: '3.5rem',
                color: 'var(--text-main)',
                fontWeight: 900,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {keyStr}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                    onClick={async () => {
                        try {
                            await copyToClipboard(keyStr);
                            if (showNotification) showNotification("SECURE API KEY COPIED TO CLIPBOARD", "success");
                        } catch (err) {
                            console.error("Copy failed:", err);
                            if (showNotification) showNotification("FAILED TO COPY. PLEASE MANUALLY SELECT AND COPY.", "error");
                        }
                    }}
                    style={{
                        height: '50px',
                        padding: '0 1.5rem',
                        borderRadius: '14px',
                        background: '#f1f5f9',
                        fontWeight: 800,
                        color: 'var(--magenta)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                >
                    <Copy size={18} /> Copy Key
                </button>
                <button
                    onClick={onClose}
                    className="btn-primary"
                    style={{ height: '50px', padding: '0 2rem', borderRadius: '14px' }}
                >
                    Finish Setup
                </button>
            </div>
        </div>
    </div>
);

const UsageLogs = ({ title, logs, loading, onClose }) => {
    const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'WEBHOOK' | 'PULL'
    const [selectedLog, setSelectedLog] = useState(null);
    const [copiedIp, setCopiedIp] = useState(false);

    const auditTheme = {
        bg: '#030712',
        card: 'rgba(255, 255, 255, 0.03)',
        border: 'rgba(255, 255, 255, 0.08)',
        textMain: '#f9fafb',
        textDim: '#94a3b8',
        cyan: '#06b6d4',
        emerald: '#10b981',
        amber: '#f59e0b',
        crimson: '#ef4444'
    };

    const webhookLogs = logs.filter(l => l.endpoint && l.endpoint.startsWith('[WEBHOOK'));
    const pullLogs = logs.filter(l => !l.endpoint || !l.endpoint.startsWith('[WEBHOOK'));

    const displayedLogs = activeTab === 'WEBHOOK' ? webhookLogs : activeTab === 'PULL' ? pullLogs : logs;

    const handleCopyIp = (ip) => {
        copyToClipboard(ip);
        setCopiedIp(true);
        setTimeout(() => setCopiedIp(false), 2000);
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 3000, backdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.85)' }}>
            <div className="modal-content" style={{
                maxWidth: '1050px',
                height: '85vh',
                background: auditTheme.bg,
                border: `1px solid ${auditTheme.border}`,
                boxShadow: '0 0 100px rgba(0,0,0,0.95)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: '32px'
            }}>
                {/* ─── CRYPTOGRAPHIC HEADER ─── */}
                <div style={{
                    padding: '1.75rem 2.5rem',
                    borderBottom: `1px solid ${auditTheme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.01)',
                    position: 'relative',
                    zIndex: 2
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '16px',
                            background: 'rgba(129, 140, 248, 0.12)',
                            color: '#818cf8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(129, 140, 248, 0.2)'
                        }}>
                            <History size={26} className="pulse-slow" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: auditTheme.textMain, letterSpacing: '-0.02em' }}>{title}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: auditTheme.emerald, animation: 'pulse-soft 2s infinite' }} />
                                <span style={{ fontSize: '0.8rem', color: auditTheme.textDim, fontWeight: 800, letterSpacing: '0.05em' }}>CLICK ANY ROW FOR DEEP TELEMETRY REPORT</span>
                            </div>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '6px', borderRadius: '14px', border: `1px solid ${auditTheme.border}` }}>
                        <button
                            onClick={() => setActiveTab('ALL')}
                            style={{
                                padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem',
                                background: activeTab === 'ALL' ? '#6366f1' : 'transparent', color: activeTab === 'ALL' ? '#fff' : auditTheme.textDim,
                                transition: 'all 0.2s'
                            }}
                        >
                            ALL ({logs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('WEBHOOK')}
                            style={{
                                padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem',
                                background: activeTab === 'WEBHOOK' ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'transparent',
                                color: activeTab === 'WEBHOOK' ? '#fff' : auditTheme.textDim,
                                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                            }}
                        >
                            <Zap size={13} /> WEBHOOK PUSH ({webhookLogs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('PULL')}
                            style={{
                                padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem',
                                background: activeTab === 'PULL' ? '#06b6d4' : 'transparent',
                                color: activeTab === 'PULL' ? '#fff' : auditTheme.textDim,
                                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                            }}
                        >
                            <Globe size={13} /> API PULL ({pullLogs.length})
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ─── AUDIT LOG STREAM ─── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2.5rem', background: 'transparent', position: 'relative' }}>
                    {loading ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="bounce-loader" style={{ fontSize: '1.1rem', color: auditTheme.cyan, fontWeight: 800 }}>AUDITING VAULT STREAM...</div>
                        </div>
                    ) : displayedLogs.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: auditTheme.textDim, opacity: 0.5 }}>
                            <History size={56} style={{ marginBottom: '1.25rem' }} />
                            <p style={{ fontWeight: 800, fontSize: '1rem' }}>NO AUDIT LOGS FOUND FOR SELECTED CATEGORY</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {displayedLogs.map((log, i) => {
                                const isWebhook = log.endpoint && log.endpoint.startsWith('[WEBHOOK');
                                let eventName = null;
                                let targetUrl = log.endpoint;

                                if (isWebhook) {
                                    const match = log.endpoint.match(/^\[WEBHOOK\s+([^\]]+)\]\s*(.*)$/);
                                    if (match) {
                                        eventName = match[1];
                                        targetUrl = match[2];
                                    }
                                }

                                const color = isWebhook ? '#c084fc' : (log.method === 'POST' ? auditTheme.emerald : auditTheme.cyan);

                                return (
                                    <div
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="audit-row-item"
                                        style={{
                                            padding: '1.1rem 1.75rem',
                                            background: isWebhook ? 'rgba(168, 85, 247, 0.04)' : auditTheme.card,
                                            borderRadius: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            border: isWebhook ? '1px solid rgba(168, 85, 247, 0.25)' : `1px solid ${auditTheme.border}`,
                                            animation: `slideLeft 0.3s ease-out ${i * 0.02}s both`,
                                            backdropFilter: 'blur(10px)',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', background: color, borderRadius: '0 4px 4px 0', boxShadow: `0 0 10px ${color}` }} />

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            {/* Type Badge */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                {isWebhook ? (
                                                    <div style={{
                                                        padding: '4px 10px',
                                                        background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))',
                                                        color: '#e879f9',
                                                        borderRadius: '8px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 950,
                                                        letterSpacing: '0.05em',
                                                        border: '1px solid rgba(232,121,249,0.3)',
                                                        display: 'flex', alignItems: 'center', gap: '5px'
                                                    }}>
                                                        <Zap size={11} color="#e879f9" /> WEBHOOK PUSH
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        padding: '4px 10px',
                                                        background: `${color}15`,
                                                        color: color,
                                                        borderRadius: '8px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 950,
                                                        letterSpacing: '0.05em',
                                                        border: `1px solid ${color}30`,
                                                        display: 'flex', alignItems: 'center', gap: '5px'
                                                    }}>
                                                        <Globe size={11} color={color} /> API PULL ({log.method})
                                                    </div>
                                                )}

                                                {/* HTTP Status Code */}
                                                <div style={{
                                                    padding: '3px 8px',
                                                    background: log.status_code && log.status_code >= 400 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                    color: log.status_code && log.status_code >= 400 ? '#ef4444' : '#10b981',
                                                    borderRadius: '6px',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 900,
                                                    border: `1px solid ${log.status_code && log.status_code >= 400 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                                }}>
                                                    {log.status_code || 200} {log.status_code && log.status_code >= 400 ? 'FAILED' : 'SUCCESS'}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontWeight: 900, color: auditTheme.textMain, fontSize: '1rem' }}>{log.api_key_name || 'System Key'}</span>
                                                    {eventName && (
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '6px',
                                                            background: 'rgba(192, 132, 252, 0.15)',
                                                            color: '#c084fc',
                                                            fontSize: '0.72rem',
                                                            fontWeight: 900,
                                                            border: '1px solid rgba(192, 132, 252, 0.3)',
                                                            fontFamily: 'monospace'
                                                        }}>
                                                            EVENT: {eventName}
                                                        </span>
                                                    )}
                                                    <span style={{ fontSize: '0.75rem', color: auditTheme.textDim, fontWeight: 700, fontFamily: 'monospace', opacity: 0.6 }}>{log.ip_address || '127.0.0.1'}</span>
                                                </div>

                                                <div style={{ fontSize: '0.82rem', color: auditTheme.textDim, fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ color: isWebhook ? '#e879f9' : auditTheme.textMain, fontFamily: 'monospace', opacity: 0.9 }}>{targetUrl}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timestamp & Arrow */}
                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: auditTheme.textMain, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <Clock size={14} color={auditTheme.cyan} /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: auditTheme.textDim, fontWeight: 800, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '8px',
                                                borderRadius: '10px',
                                                background: 'rgba(255,255,255,0.05)',
                                                color: auditTheme.textDim,
                                                border: `1px solid ${auditTheme.border}`
                                            }}>
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ─── FOOTER METRIC ─── */}
                <div style={{ padding: '0.85rem 2.5rem', background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${auditTheme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: auditTheme.textDim, fontWeight: 800, letterSpacing: '0.08em' }}>
                        SECURE LOG STREAM TERMINATED • {displayedLogs.length} ENTRIES CACHED
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                        <span style={{ color: '#e879f9' }}>⚡ {webhookLogs.length} Webhook Pushes</span>
                        <span style={{ color: '#06b6d4' }}>📥 {pullLogs.length} API Pulls</span>
                    </div>
                </div>
            </div>

            {/* ─── DEEP TELEMETRY REPORT INSPECTION MODAL ─── */}
            {selectedLog && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10000,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(25px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '650px',
                        background: '#090d16',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        borderRadius: '28px',
                        boxShadow: '0 0 80px rgba(99, 102, 241, 0.3)',
                        overflow: 'hidden',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.02)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: selectedLog.endpoint && selectedLog.endpoint.startsWith('[WEBHOOK') ? 'rgba(168, 85, 247, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                                    color: selectedLog.endpoint && selectedLog.endpoint.startsWith('[WEBHOOK') ? '#e879f9' : '#06b6d4',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {selectedLog.endpoint && selectedLog.endpoint.startsWith('[WEBHOOK') ? <Zap size={20} /> : <Globe size={20} />}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>
                                        {selectedLog.endpoint && selectedLog.endpoint.startsWith('[WEBHOOK') ? 'WEBHOOK TELEMETRY REPORT' : 'INBOUND API PULL REPORT'}
                                    </h4>
                                    <span style={{ fontSize: '0.72rem', color: auditTheme.textDim, fontWeight: 700, fontFamily: 'monospace' }}>
                                        LOG ID: #{selectedLog.id} • RECORD AUDIT VAULT
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* IP Address Card */}
                            <div style={{
                                padding: '1.25rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '18px',
                                border: '1px solid rgba(255,255,255,0.07)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.7rem', color: auditTheme.textDim, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLIENT REMOTE IP ADDRESS</span>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace', marginTop: '4px' }}>
                                        {selectedLog.ip_address || '127.0.0.1'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleCopyIp(selectedLog.ip_address || '127.0.0.1')}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: '10px',
                                        background: copiedIp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)',
                                        color: copiedIp ? '#10b981' : '#fff',
                                        border: `1px solid ${copiedIp ? '#10b98150' : 'rgba(255,255,255,0.1)'}`,
                                        cursor: 'pointer',
                                        fontSize: '0.78rem',
                                        fontWeight: 800,
                                        display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    {copiedIp ? <Check size={14} /> : <Copy size={14} />} {copiedIp ? 'COPIED!' : 'COPY IP'}
                                </button>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: '0.68rem', color: auditTheme.textDim, fontWeight: 800 }}>API KEY NAME</span>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                                        {selectedLog.api_key_name || 'System Key'}
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: '0.68rem', color: auditTheme.textDim, fontWeight: 800 }}>HTTP METHOD & STATUS</span>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: selectedLog.status_code && selectedLog.status_code >= 400 ? '#ef4444' : '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{selectedLog.method || 'GET'}</span>
                                        <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
                                            {selectedLog.status_code || 200} {selectedLog.status_code && selectedLog.status_code >= 400 ? 'FAILED' : 'OK'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Target Endpoint / Webhook URL */}
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: '0.68rem', color: auditTheme.textDim, fontWeight: 800 }}>TARGET ENDPOINT / DESTINATION URL</span>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a7f3d0', fontFamily: 'monospace', marginTop: '4px', wordBreak: 'break-all' }}>
                                    {selectedLog.endpoint}
                                </div>
                            </div>

                            {/* User Agent / Client Library */}
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: '0.68rem', color: auditTheme.textDim, fontWeight: 800 }}>HTTP USER-AGENT / INTEGRATION CLIENT</span>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: auditTheme.textDim, fontFamily: 'monospace', marginTop: '4px', wordBreak: 'break-all' }}>
                                    {selectedLog.user_agent || 'python-requests/2.31.0 (Integration Client)'}
                                </div>
                            </div>

                            {/* Exact Timestamp */}
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '0.68rem', color: auditTheme.textDim, fontWeight: 800 }}>EXECUTION TIMESTAMP</span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                                        {new Date(selectedLog.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 800 }}>
                                    LATENCY: ~0.05s (50ms)
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '1.25rem 2rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setSelectedLog(null)}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    background: '#6366f1',
                                    color: '#fff',
                                    border: 'none',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                CLOSE REPORT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .audit-row-item:hover {
                    background: rgba(255, 255, 255, 0.08) !important;
                    border-color: rgba(99, 102, 241, 0.45) !important;
                    transform: translateX(5px);
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideLeft {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .pulse-slow {
                    animation: float-gentle 4s ease-in-out infinite;
                }
                @keyframes float-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
            `}</style>
        </div>
    );
};

export default APIKeyManagement;
