import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Building2,
    FolderKanban,
    Briefcase,
    ChevronRight,
    Settings,
    Activity,
    ShieldAlert,
    TrendingUp,
    Clock,
    CheckCircle2,
    LayoutGrid,
    Layers,
    ShieldCheck,
    ClipboardList
} from 'lucide-react';
import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';

const Dashboard = () => {
    const navigate = useNavigate();
    const {
        stats,
        handleAdd,
        fetchStats,
        canCreate,
        user,
        allEmployees,
        offices,
        projects,
        handleEdit,
        refreshPermissions // Add this
    } = useData();
    const [time, setTime] = useState(new Date());
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);

        // Auto-refresh profile and stats on dashboard entry to ensure acting context is loaded
        refreshPermissions();
        fetchStats(true);

        return () => clearInterval(timer);
    }, []);

    // Generate Dynamic Activity Feed
    useEffect(() => {
        const events = [];

        // 1. Employee Events
        if (allEmployees?.length > 0) {
            allEmployees.slice(-3).reverse().forEach((emp, i) => {
                events.push({
                    id: `emp-${emp.id}`,
                    type: 'EMPLOYEE',
                    title: 'New Talent Acquisition',
                    desc: `${emp.name} joined as ${emp.designation || 'Team Member'}`,
                    time: i === 0 ? 'Just now' : `${i + 2} hours ago`,
                    icon: <Users size={16} />,
                    color: '#be185d',
                    bg: '#fdf2f8'
                });
            });
        }

        // 2. Office Events
        if (offices?.length > 0) {
            offices.slice(-2).reverse().forEach((off, i) => {
                events.push({
                    id: `off-${off.id}`,
                    type: 'OFFICE',
                    title: 'Facility Expansion',
                    desc: `New office commissioned: ${off.name}`,
                    time: '1 day ago',
                    icon: <Building2 size={16} />,
                    color: '#059669',
                    bg: '#ecfdf5'
                });
            });
        }

        // 3. Project Events
        if (projects?.length > 0) {
            projects.slice(-2).reverse().forEach((proj, i) => {
                events.push({
                    id: `proj-${proj.id}`,
                    type: 'PROJECT',
                    title: 'Project Update',
                    desc: `New initiative: ${proj.name}`,
                    time: '2 days ago',
                    icon: <FolderKanban size={16} />,
                    color: '#f97316',
                    bg: '#fff7ed'
                });
            });
        }

        // Fallback to System Events if no data
        if (events.length === 0) {
            events.push(
                { id: 'sys-1', title: 'System Indexing', desc: 'Database optimization completed.', time: '10 mins ago', icon: <CheckCircle2 size={16} />, color: '#64748b', bg: '#f1f5f9' },
                { id: 'sys-2', title: 'Data Synchronization', desc: 'Geo-location data synced.', time: '45 mins ago', icon: <Activity size={16} />, color: '#64748b', bg: '#f1f5f9' },
                { id: 'sys-3', title: 'Backup Protocol', desc: 'Daily incremental backup successful.', time: '2 hours ago', icon: <Clock size={16} />, color: '#64748b', bg: '#f1f5f9' }
            );
        }

        setRecentActivity(events.slice(0, 5));
    }, [allEmployees, offices, projects]);


    // Define cohesive ONE HCM gradient themes for stat cards
    const getStatGradient = (idx) => {
        const gradients = [
            'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)', // Deep Indigo
            'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)', // Deep Violet
            'linear-gradient(135deg, #0369a1 0%, #06b6d4 100%)', // Oceanic Cyan
            'linear-gradient(135deg, #047857 0%, #10b981 100%)'  // Emerald Green
        ];
        return gradients[idx % gradients.length];
    };

    return (
        <div className="fade-in stagger-in" style={{ paddingBottom: '3rem', width: '100%' }}>

            {/* EXECUTIVE HERO BANNER */}
            <div style={{
                padding: '2rem 2.5rem',
                marginBottom: '2rem',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                <div style={{ position: 'relative', zIndex: 2, maxWidth: '650px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                        <span style={{
                            background: 'rgba(16, 185, 129, 0.18)',
                            color: '#34d399',
                            border: '1px solid rgba(52, 211, 153, 0.3)',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span className="live-dot" style={{ width: '6px', height: '6px', background: '#34d399', borderRadius: '50%', boxShadow: '0 0 8px #34d399' }}></span>
                            SYSTEM ONLINE
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.1rem', fontWeight: 900, lineHeight: '1.25', marginBottom: '0.5rem', letterSpacing: '-0.03em', color: 'white' }}>
                        Welcome back, <span style={{ background: 'linear-gradient(135deg, #a5b4fc, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.employee_name || user?.username || 'Administrator'}</span>
                    </h1>
                    <p style={{ color: '#cbd5e1', fontSize: '0.92rem', fontWeight: 500, lineHeight: '1.5', margin: 0 }}>
                        ONE HCM Enterprise Dashboard • Real-time operations, organizational hierarchy & workforce analytics.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 2 }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.07)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        padding: '1rem 1.5rem',
                        borderRadius: '18px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Role</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', marginTop: '2px' }}>{user?.is_superuser ? 'Super Admin' : (user?.position_name || 'System Admin')}</div>
                    </div>
                </div>

                {/* Ambient Decorative Glows */}
                <div style={{
                    position: 'absolute',
                    top: '-40%',
                    right: '-10%',
                    width: '350px',
                    height: '350px',
                    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '-40%',
                    left: '20%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(79, 70, 229, 0.25) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }}></div>
            </div>

            {/* STATS GRID */}
            <div className="stats-grid stagger-in" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
                {stats.map((stat, idx) => (
                    <div key={idx} 
                        className="stat-card" 
                        onClick={() => stat.title === 'Live Projects' ? navigate('/project-analytics') : null}
                        style={{
                            background: getStatGradient(idx),
                            padding: '1.5rem',
                            borderRadius: '20px',
                            minHeight: '150px',
                            cursor: stat.title === 'Live Projects' ? 'pointer' : 'default',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            boxShadow: '0 12px 25px -5px rgba(79, 70, 229, 0.25)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(79, 70, 229, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 12px 25px -5px rgba(79, 70, 229, 0.25)';
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    padding: '10px',
                                    background: 'rgba(255, 255, 255, 0.18)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '14px',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {React.cloneElement(stat.icon, { size: 22 })}
                                </div>
                                <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '4px 10px',
                                    background: 'rgba(255, 255, 255, 0.18)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '20px',
                                    color: 'white',
                                    letterSpacing: '0.08em'
                                }}>
                                    LIVE SYNC
                                </span>
                            </div>
                            <h3 style={{
                                marginTop: '1.25rem',
                                opacity: 0.88,
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: 'white'
                            }}>
                                {stat.title}
                            </h3>
                            <div style={{
                                fontSize: '2.2rem',
                                fontWeight: 900,
                                margin: '0.15rem 0',
                                letterSpacing: '-0.03em',
                                color: 'white'
                            }}>
                                {stat.value}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', opacity: 0.9, fontWeight: 700, color: 'white', marginTop: '0.5rem' }}>
                            <TrendingUp size={14} /> {stat.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* CRITICAL ALERTS SECTION */}
            {(() => {
                const now = new Date();
                const criticalProjects = (projects || []).filter(p => {
                    if (!p.end_date) return false;
                    const end = new Date(p.end_date);
                    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                    return diffDays <= 10;
                }).sort((a, b) => new Date(a.end_date) - new Date(b.end_date));

                if (criticalProjects.length === 0) return null;

                return (
                    <div className="stagger-in" style={{ marginBottom: '2.5rem' }}>
                        <div className="glass" style={{
                            padding: '2rem',
                            borderRadius: '20px',
                            borderLeft: '5px solid #f43f5e',
                            background: 'white',
                            boxShadow: 'var(--shadow-premium)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '12px', background: '#ffe4e6', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShieldAlert size={24} color="#f43f5e" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Critical Operational Alerts</h3>
                                    <p style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500, margin: '2px 0 0 0' }}>Project portfolio milestones requiring immediate oversight</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {criticalProjects.slice(0, 3).map(proj => {
                                    const end = new Date(proj.end_date);
                                    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                                    const isExpired = diffDays < 0;

                                    return (
                                        <div key={proj.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1.1rem 1.25rem',
                                            background: isExpired ? '#fff1f2' : '#f0f4ff',
                                            borderRadius: '14px',
                                            border: `1.5px solid ${isExpired ? '#fecdd3' : '#e0e7ff'}`
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{
                                                    width: '42px',
                                                    height: '42px',
                                                    borderRadius: '12px',
                                                    background: isExpired ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                                                }}>
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{proj.name}</div>
                                                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>Target End Date: {new Date(proj.end_date).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 800,
                                                    padding: '5px 12px',
                                                    borderRadius: '20px',
                                                    background: isExpired ? '#ffe4e6' : '#e0e7ff',
                                                    color: isExpired ? '#e11d48' : '#4f46e5',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    {isExpired ? 'EXPIRED' : `${diffDays} DAYS REMAINING`}
                                                </span>
                                                <button
                                                    onClick={() => handleEdit('Projects', proj)}
                                                    style={{
                                                        background: 'white',
                                                        border: '1.5px solid #c7d2fe',
                                                        color: '#4f46e5',
                                                        padding: '6px 14px',
                                                        borderRadius: '10px',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    Details <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* QUICK ACTIONS SECTION */}
            <div className="stagger-in">
                <div className="glass" style={{ padding: '2rem 2.5rem', borderRadius: '24px', background: 'white', boxShadow: 'var(--shadow-premium)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '10px', background: '#eef2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LayoutGrid size={22} color="#4f46e5" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Quick Actions</h3>
                                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0', fontWeight: 500 }}>Create & provision organizational entities instantly</p>
                            </div>
                        </div>
                        <button
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                padding: '8px 16px',
                                borderRadius: '12px',
                                color: '#4f46e5',
                                background: '#eef2ff',
                                border: '1.5px solid #c7d2fe',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => alert("Dashboard personalization feature is coming in the next update!")}
                        >
                            <Settings size={15} /> Customize
                        </button>
                    </div>

                    <div className="dashboard-actions-grid">
                        {[
                            { title: 'Provision Office', icon: <Building2 />, color: '#eef2ff', txt: '#4f46e5', type: 'Offices' },
                            { title: 'Add Employee', icon: <Users />, color: '#f3e8ff', txt: '#7c3aed', type: 'Employees' },
                            { title: 'New Project', icon: <FolderKanban />, color: '#e0f2fe', txt: '#0284c7', type: 'Projects' },
                            { title: 'Define Position', icon: <Briefcase />, color: '#ecfdf5', txt: '#10b981', type: 'Positions' },
                            { title: 'Add Department', icon: <LayoutGrid />, color: '#fef3c7', txt: '#d97706', type: 'Departments' },
                            { title: 'Job Family', icon: <Layers />, color: '#ffe4e6', txt: '#e11d48', type: 'Job Families' },
                            { title: 'New Role', icon: <ShieldCheck />, color: '#f0fdf4', txt: '#16a34a', type: 'Roles' },
                            { title: 'Assign Task', icon: <ClipboardList />, color: '#eef2ff', txt: '#4f46e5', type: 'Tasks' }
                        ].filter(action => canCreate(action.type)).map((action, i) => (
                            <div key={i} className="action-card" onClick={() => handleAdd(action.type)}>
                                <div className="action-icon" style={{ background: action.color, color: action.txt }}>
                                    {action.icon}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{action.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', fontWeight: 500 }}>Instant Action</div>
                                </div>
                                <ChevronRight className="action-arrow" size={16} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

