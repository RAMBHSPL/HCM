import React, { useEffect, useState } from 'react';
import {
    X,
    Building2,
    MapPin,
    Calendar,
    Hash,
    FileText,
    ChevronRight,
    Layout,
    ShieldCheck,
    Globe,
    Navigation,
    UserCircle,
    Edit,
    ArrowLeft,
    Sparkles,
    Briefcase,
    ShieldAlert,
    Home,
    FolderKanban,
    Navigation2,
    ExternalLink,
    Car
} from 'lucide-react';
import { useData } from '../context/DataContext';

const OfficeDetailModal = () => {
    const {
        showOfficeDetail,
        setShowOfficeDetail,
        selectedOffice,
        handleEdit,
        projects
    } = useData();

    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (showOfficeDetail) {
            const timer = setTimeout(() => setAnimate(true), 50);
            return () => clearTimeout(timer);
        } else {
            setAnimate(false);
        }
    }, [showOfficeDetail]);

    if (!showOfficeDetail || !selectedOffice) return null;

    const data = selectedOffice;

    const SectionCard = ({ title, icon: Icon, children, delay }) => (
        <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '28px',
            border: '1px solid rgba(253, 230, 205, 0.6)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            transform: animate ? 'translateY(0)' : 'translateY(20px)',
            opacity: animate ? 1 : 0,
            transition: `all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--magenta)', fontWeight: 800, marginBottom: '2rem', fontSize: '1.1rem', letterSpacing: '0.02em' }}>
                <div style={{ padding: '8px', background: 'var(--primary-light)', borderRadius: '12px' }}>
                    <Icon size={20} />
                </div>
                {title}
            </div>
            {children}
        </div>
    );

    const ProfileDetailItem = ({ icon: Icon, label, value, color = 'var(--magenta)' }) => (
        <div 
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.5rem', 
                padding: '1.5rem', 
                background: 'rgba(255, 255, 255, 0.4)', 
                backdropFilter: 'blur(10px)',
                borderRadius: '24px', 
                border: '1px solid rgba(255, 255, 255, 0.6)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
            }} 
            className="hover-lift-premium"
        >
            {/* Glossy Accent */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: color, opacity: 0.7 }}></div>
            
            <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                background: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: color, 
                boxShadow: `0 8px 16px ${color}15`,
                border: '1px solid rgba(0,0,0,0.03)'
            }}>
                <Icon size={22} strokeWidth={1.5} />
            </div>
            
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 800, letterSpacing: '-0.01em' }}>{value || 'Not Specified'}</div>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay active" style={{ display: 'block', backgroundColor: 'rgba(15, 23, 42, 0.98)', zIndex: 9999 }}>
            <div className="modal-content fade-in" style={{
                height: '100vh',
                width: '100vw',
                background: 'var(--bg-primary)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                borderRadius: 0,
                maxWidth: 'none',
                position: 'fixed',
                top: 0,
                left: 0
            }}>
                {/* Premium Glass Header */}
                <div style={{ 
                    padding: '1.5rem 3rem', 
                    background: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(253, 230, 205, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 100
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <div className="pulse" style={{ position: 'absolute', inset: '-8px', background: 'var(--magenta)', borderRadius: '18px', opacity: 0.15 }}></div>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '18px',
                                background: 'var(--sunset)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                position: 'relative',
                                boxShadow: '0 8px 16px rgba(190, 24, 93, 0.3)'
                            }}>
                                <Building2 size={30} />
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{data.name}</h1>
                                <span style={{ padding: '4px 12px', background: '#ecfdf5', color: '#059669', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>{data.status || 'Active'}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>{data.sac || data.code}</span>
                                <span style={{ opacity: 0.5 }}>•</span>
                                <span>{data.level_name} UNIT</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setShowOfficeDetail(false)}
                            className="btn-secondary"
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', fontWeight: 700, fontSize: '0.85rem' }}
                        >
                            <X size={18} style={{ marginRight: '8px' }} /> EXIT VIEW
                        </button>
                        <button
                            onClick={() => {
                                setShowOfficeDetail(false);
                                handleEdit('Offices', data);
                            }}
                            className="btn-primary"
                            style={{ 
                                padding: '0.75rem 2rem', 
                                borderRadius: '14px', 
                                fontWeight: 800, 
                                fontSize: '0.85rem',
                                background: 'var(--sunset)',
                                boxShadow: '0 10px 20px rgba(190, 24, 93, 0.2)'
                            }}
                        >
                            <Edit size={18} style={{ marginRight: '8px' }} /> MANAGE OFFICE
                        </button>
                    </div>
                </div>

                <div className="modal-form-container" style={{ flex: 1, overflowY: 'auto', padding: '3rem' }}>
                    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

                        {/* Top Hero Layout */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
                            {/* Visual Identity Profile */}
                            <div style={{ 
                                background: 'white', 
                                borderRadius: '32px', 
                                padding: '3rem', 
                                border: '1px solid rgba(253, 230, 205, 0.6)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '3rem',
                                transform: animate ? 'translateX(0)' : 'translateX(-40px)',
                                opacity: animate ? 1 : 0,
                                transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
                            }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div className="pulse" style={{ position: 'absolute', inset: '-20px', background: 'var(--magenta)', borderRadius: '44px', opacity: 0.1 }}></div>
                                    <div style={{ width: '160px', height: '160px', borderRadius: '44px', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#be185d', border: '1px solid #fce7f3' }}>
                                        <Building2 size={80} strokeWidth={1} />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1.25rem' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '6px 14px', borderRadius: '20px', textTransform: 'uppercase' }}>{data.level_name}</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#f3e8ff', color: '#6b21a8', padding: '6px 14px', borderRadius: '20px', textTransform: 'uppercase' }}>{data.facility_type || 'Standard Nature'}</span>
                                    </div>
                                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e1b4b', marginBottom: '1rem', letterSpacing: '-0.04em' }}>{data.name}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', color: '#64748b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                            <MapPin size={16} style={{ color: 'var(--magenta)' }} /> {data.state_name || 'All India'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                            <ShieldCheck size={16} style={{ color: 'var(--orange)' }} /> Verified Entity
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Relationship Info Panel */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '1.5rem',
                                transform: animate ? 'translateX(0)' : 'translateX(40px)',
                                opacity: animate ? 1 : 0,
                                transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
                            }}>
                                <div style={{ background: '#fefaf5', padding: '2rem', borderRadius: '28px', border: '1px solid #fde6cd' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>Parent Jurisdiction</div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{data.parent_name || 'Primary Root'}</h4>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Level {data.level} of Hierarchy</p>
                                </div>
                                <div style={{ background: '#f0fdfa', padding: '2rem', borderRadius: '28px', border: '1px solid #ccfbf1' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '1rem' }}>Operational Status</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="pulse" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065f46' }}>Operational</h4>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#059669', marginTop: '4px' }}>Active since {data.created_at?.split('T')[0]}</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Functional Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.5rem' }}>
                            <SectionCard title="INTERNAL CONFIG" icon={Layout} delay={0.1}>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <ProfileDetailItem icon={Hash} label="SAC Code" value={data.sac || data.code} />
                                    {data.vehicle_code && (
                                        <ProfileDetailItem icon={Car} label="Vehicle Code" value={data.vehicle_code} color="var(--orange)" />
                                    )}
                                    {data.vehicle_no && (
                                        <ProfileDetailItem icon={Car} label="Vehicle No" value={data.vehicle_no} color="var(--orange)" />
                                    )}
                                    <ProfileDetailItem icon={Calendar} label="Date Registered" value={data.created_at?.split('T')[0]} />
                                    <ProfileDetailItem icon={ShieldCheck} label="Regulatory ID" value={data.register_id} />
                                    <ProfileDetailItem icon={UserCircle} label="Authorized DIN" value={data.din_no} />
                                </div>
                            </SectionCard>

                            <SectionCard title="GEOSPATIAL ANCHOR" icon={MapPin} delay={0.2}>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <ProfileDetailItem icon={Globe} label="State / Province" value={data.state_name} />
                                    <ProfileDetailItem icon={Navigation} label="District Administrative Unit" value={data.district_name} />
                                    <ProfileDetailItem icon={Navigation} label="Local Block / Mandal" value={data.mandal_name} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <ProfileDetailItem icon={Navigation2} label="Latitude" value={data.latitude ? parseFloat(data.latitude).toFixed(6) : 'N/A'} />
                                        <ProfileDetailItem icon={Navigation2} label="Longitude" value={data.longitude ? parseFloat(data.longitude).toFixed(6) : 'N/A'} />
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="UNIT SPECIFICATIONS" icon={Sparkles} delay={0.3}>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <ProfileDetailItem icon={Layout} label="Facility Nature" value={data.facility_type} />
                                    <ProfileDetailItem icon={Briefcase} label="Deployment Category" value={data.level_name} />
                                    <ProfileDetailItem icon={Home} label="Cluster Context" value={data.cluster_name ? `${data.cluster_name} - ${data.cluster_type || 'N/A'}` : 'Not Specified'} />
                                    {data.start_date && <ProfileDetailItem icon={Calendar} label="Operational Start" value={data.start_date} />}
                                </div>
                            </SectionCard>

                            {/* Wide Section: Projects */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <SectionCard title="PROJECT JURISDICTIONS" icon={FolderKanban} delay={0.4}>
                                    {(() => {
                                        const officeProjects = projects.filter(p =>
                                            p.assigned_offices?.includes(data.id) ||
                                            (p.assigned_level && p.assigned_level == data.level)
                                        );

                                        if (officeProjects.length === 0) {
                                            return (
                                                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontStyle: 'italic', border: '2px dashed rgba(253, 230, 205, 0.8)', borderRadius: '24px' }}>
                                                    This unit is currently not linked to any active project contracts.
                                                </div>
                                            );
                                        }

                                        return (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                                                {officeProjects.map(project => (
                                                    <div key={project.id} style={{
                                                        padding: '2rem',
                                                        borderRadius: '24px',
                                                        background: 'linear-gradient(135deg, #ffffff 0%, #fffbf2 100%)',
                                                        border: '1px solid rgba(253, 230, 205, 0.6)',
                                                        boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '1.5rem',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }} className="hover-lift">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                                <FolderKanban size={24} />
                                                            </div>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '6px 14px', borderRadius: '20px', background: '#dcfce7', color: '#166534', letterSpacing: '0.05em' }}>
                                                                ACTIVE
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e1b4b', marginBottom: '0.5rem' }}>{project.name}</h4>
                                                            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>{project.description || 'Enterprise-level project deployment and data management jurisdiction.'}</p>
                                                        </div>
                                                        <div style={{ paddingTop: '1.25rem', borderTop: '1px solid #fcf8f1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <Hash size={14} /> {project.code || 'SYS-PROJECT'}
                                                            </div>
                                                            <div style={{ color: 'var(--magenta)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                                DETAILS <ChevronRight size={14} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </SectionCard>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfficeDetailModal;
