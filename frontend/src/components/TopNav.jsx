import React from 'react';
import { Search, User, Menu, HeartPulse } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

const TopNav = () => {
    const {
        user, handleViewProfile, toggleSidebar, showNotification,
        refreshPermissions, getPhotoUrl, activePositionContext, switchPositionContext,
        logout
    } = useData();
    const navigate = useNavigate();

    const [showSwitcher, setShowSwitcher] = React.useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);

    const profileRef = React.useRef(null);
    const switcherRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileMenuOpen(false);
            }
            if (switcherRef.current && !switcherRef.current.contains(event.target)) {
                setShowSwitcher(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    // Determine Display Name
    const displayName = user?.employee_name || user?.username || "Guest User";
    const actingAs = user?.acting_as;

    // Determine Display Role
    let displayRole = "SYSTEM CONTROLLER";
    if (user?.is_superuser) displayRole = "SYSTEM ADMINISTRATOR";
    else if (actingAs) displayRole = `ACTING: ${actingAs.position_name.toUpperCase()}`;
    else if (user?.position_name) displayRole = user.position_name.toUpperCase();
    else if (user?.employee_name) displayRole = "AUTHORIZED EMPLOYEE";

    // Combined Name for UI
    const finalDisplayName = actingAs ? `${displayName} (as ${actingAs.assignor_name})` : displayName;

    const [imgError, setImgError] = React.useState(false);

    return (
        <header className="top-header">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
                <Menu size={24} />
            </button>
            <div className="tech-ticker-container" style={{ width: '320px', gap: '16px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                {/* 1. Equalizer Spectrum HUD */}
                <div className="tech-hud-equalizer">
                    <div className="bar bar1"></div>
                    <div className="bar bar2"></div>
                    <div className="bar bar3"></div>
                    <div className="bar bar4"></div>
                    <div className="bar bar5"></div>
                </div>

                {/* 2. Scrolling Telemetry data streams */}
                <div className="tech-ticker-inner">
                    <span>SYS_LOAD: 42% • NETWORK: SECURE • PKT_LOSS: 0% • TELEMETRY: ACTIVE &nbsp;&nbsp;&nbsp;</span>
                    <span>SYS_LOAD: 42% • NETWORK: SECURE • PKT_LOSS: 0% • TELEMETRY: ACTIVE &nbsp;&nbsp;&nbsp;</span>
                </div>

                {/* 3. Pulsing signal wave */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="pulse-dot"></div>
                    <span style={{ color: '#10b981', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.5px' }}>LIVE</span>
                </div>
            </div>

            <div className="shining-logo-container" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="logo-3d-effect" style={{ borderRadius: '50%', padding: '4px', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 100 100" width="56" height="56" style={{ display: 'block' }}>
                        <defs>
                            {/* Curved circular paths for text */}
                            <path id="text-arc-top" d="M 15 50 A 35 35 0 0 1 85 50" fill="none" />
                            <path id="text-arc-bottom" d="M 85 50 A 35 35 0 0 1 15 50" fill="none" />
                            <linearGradient id="tech-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00f0ff" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                            <linearGradient id="health-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f43f5e" />
                                <stop offset="100%" stopColor="#e11d48" />
                            </linearGradient>
                            <linearGradient id="core-shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="rgba(6, 182, 212, 0.3)" />
                                <stop offset="100%" stopColor="rgba(124, 58, 237, 0.3)" />
                            </linearGradient>
                        </defs>

                        {/* Tech outer rotating rings (behind the circular text) */}
                        <g className="rotating-tech-ring">
                            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#tech-grad)" strokeWidth="1.5" strokeDasharray="8, 6" />
                            <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(0, 240, 255, 0.1)" strokeWidth="1" />
                            <circle cx="50" cy="50" r="28" fill="none" stroke="url(#tech-grad)" strokeWidth="1" strokeDasharray="3, 4" />
                        </g>

                        {/* Circuit board traces radiating from center */}
                        <g opacity="0.5">
                            <line x1="50" y1="36" x2="50" y2="30" stroke="#00f0ff" strokeWidth="1.2" />
                            <circle cx="50" cy="30" r="1.5" fill="#00f0ff" />
                            <line x1="50" y1="64" x2="50" y2="70" stroke="#00f0ff" strokeWidth="1.2" />
                            <circle cx="50" cy="70" r="1.5" fill="#00f0ff" />
                            <line x1="36" y1="50" x2="30" y2="50" stroke="#a855f7" strokeWidth="1.2" />
                            <circle cx="30" cy="50" r="1.5" fill="#a855f7" />
                            <line x1="64" y1="50" x2="70" y2="50" stroke="#a855f7" strokeWidth="1.2" />
                            <circle cx="70" cy="50" r="1.5" fill="#a855f7" />
                        </g>

                        {/* Curved circular texts */}
                        {/* Top: BAVYA IT */}
                        <text fill="#ffffff" fontSize="9" fontWeight="900" letterSpacing="1.8" style={{ textAnchor: 'middle' }}>
                            <textPath href="#text-arc-top" startOffset="50%">
                                BAVYA IT
                            </textPath>
                        </text>

                        {/* Bottom: DIGITAL CORE */}
                        <text fill="url(#tech-grad)" fontSize="6.5" fontWeight="800" letterSpacing="1.2" style={{ textAnchor: 'middle' }}>
                            <textPath href="#text-arc-bottom" startOffset="50%">
                                • DIGITAL CORE •
                            </textPath>
                        </text>

                        {/* Health Core: Cyber Heart Shield Fusion in the center */}
                        <g className="beating-health-core">
                            <path d="M50 34 L63 39 L63 53 C63 62 50 68 50 68 C50 68 37 62 37 53 L37 39 Z" fill="url(#core-shield-grad)" stroke="#00f0ff" strokeWidth="1" opacity="0.6" />
                            <path d="M46 42 h8 v6 h6 v8 h-6 v6 h-8 v-6 h-6 v-8 h6 z" fill="url(#health-grad)" filter="drop-shadow(0 0 4px #f43f5e)" />
                            <rect x="48" y="48" width="4" height="4" rx="1" fill="#00f0ff" />
                        </g>
                    </svg>
                </div>
            </div>
            <div style={{ flex: 1 }}></div>

            <div className="top-nav-actions">
                {user?.active_assignments?.length > 0 && (
                    <div ref={switcherRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowSwitcher(!showSwitcher)}
                            className="premium-tag"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 14px',
                                borderRadius: '12px',
                                background: activePositionContext ? 'rgba(79, 70, 229, 0.1)' : '#eef2ff',
                                color: activePositionContext ? '#4f46e5' : '#64748b',
                                border: activePositionContext ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid #e0e7ff',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                            }}
                        >
                            <Search size={14} />
                            {activePositionContext ? 'Acting Mode' : 'Standard Mode'}
                        </button>

                        {showSwitcher && (
                                <div style={{
                                    position: 'absolute',
                                    top: '45px',
                                    right: 0,
                                    width: '280px',
                                    background: 'white',
                                    borderRadius: '16px',
                                    boxShadow: 'var(--shadow-lg)',
                                    border: '1px solid #e0e7ff',
                                    padding: '0.75rem',
                                    zIndex: 100
                                }}>
                                    <div style={{ padding: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                                        Switch Position Context
                                    </div>

                                    <button
                                        onClick={() => { switchPositionContext(null); setShowSwitcher(false); }}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '0.75rem',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: !activePositionContext ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                                            cursor: 'pointer',
                                            marginBottom: '4px'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: !activePositionContext ? '#4f46e5' : '#1e293b' }}>Primary Position</div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{user.position_name}</div>
                                    </button>

                                    <div style={{ height: '1px', background: '#e0e7ff', margin: '4px 0' }} />

                                    {user.active_assignments.map(a => (
                                        <button
                                            key={a.id}
                                            onClick={() => { switchPositionContext(a.id); setShowSwitcher(false); }}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '0.75rem',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: String(activePositionContext) === String(a.id) ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: String(activePositionContext) === String(a.id) ? '#4f46e5' : '#1e293b' }}>
                                                {a.position_name}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{a.office_name} • Delegated</div>
                                        </button>
                                    ))}
                                </div>
                        )}
                    </div>
                )}

                <div ref={profileRef} style={{ position: 'relative' }}>
                    <div
                        className="user-profile"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    >
                    <div className="user-avatar" style={{
                        width: '30px',
                        height: '30px',
                        flexShrink: 0,
                        background: user?.is_superuser ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--primary)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%'
                    }}>
                        {(user?.employee_photo && !imgError) ? (
                            <img
                                src={getPhotoUrl(user.employee_photo)}
                                alt=""
                                onError={() => setImgError(true)}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <User size={14} color="white" />
                        )}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{finalDisplayName}</div>
                        <div className="user-role">{displayRole}</div>
                    </div>
                </div>

                    {profileMenuOpen && (
                            <div className="fade-in" style={{
                                position: 'absolute',
                                top: '55px',
                                right: 0,
                                width: '320px',
                                background: 'white',
                                borderRadius: '16px',
                                boxShadow: 'var(--premium-shadow)',
                                border: '1px solid #f1f5f9',
                                padding: '1.5rem',
                                zIndex: 100,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                {/* Profile Header in Popup */}
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: 'var(--primary)', overflow: 'hidden', marginBottom: '0.5rem',
                                    border: '4px solid #f8fafc'
                                }}>
                                    {user?.employee_photo && !imgError ? (
                                        <img
                                            src={getPhotoUrl(user.employee_photo)}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={() => setImgError(true)}
                                        />
                                    ) : <User size={40} color="white" style={{ margin: '20px' }} />}
                                </div>

                                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', textAlign: 'center' }}>{finalDisplayName}</h3>
                                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>{displayRole}</div>

                                {/* Quick Stats / Info */}
                                <div style={{ width: '100%', margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#94a3b8' }}>Employee ID</span>
                                        <span style={{ fontWeight: 700, color: '#475569' }}>{user?.username}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#94a3b8' }}>Email</span>
                                        <span style={{ fontWeight: 700, color: '#475569' }}>{user?.email || 'N/A'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProfileMenuOpen(false);
                                            navigate('/profile');
                                        }}
                                        style={{
                                            flex: 1, padding: '0.75rem', borderRadius: '10px',
                                            background: 'var(--primary)', color: 'white', border: 'none',
                                            fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
                                        My Profile
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            logout();
                                        }}
                                        style={{
                                            flex: 1, padding: '0.75rem', borderRadius: '10px',
                                            background: '#fee2e2', color: '#991b1b', border: 'none',
                                            fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopNav;
