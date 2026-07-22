import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
    FolderKanban, Users, Building2, Search,
    Globe, Briefcase, Activity, Target, PieChart,
    ArrowUpRight, MapPin, ShieldCheck, Mail, Phone, BarChart3,
    Zap, Sparkles, Filter, ChevronRight, Layers, Layout, ChevronDown, ChevronUp, X,
    TrendingUp, AlertTriangle, CheckCircle2, Info, FileText, Download, Share2
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    Legend, ResponsiveContainer, Cell, ReferenceLine, AreaChart, Area,
    LineChart, Line
} from 'recharts';
import OrganizationMap from '../components/OrganizationMap';

const ProjectAnalyticsDashboard = () => {
    const { 
        projects, offices, departments, sections, positions, allEmployees, loading,
        loadEmployeesIfNeeded, loadPositionsIfNeeded, employeesLoading, positionsLoading
    } = useData();
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [internalLoading, setInternalLoading] = useState(true);

    useEffect(() => {
        if (loadEmployeesIfNeeded) loadEmployeesIfNeeded();
        if (loadPositionsIfNeeded) loadPositionsIfNeeded();
    }, [loadEmployeesIfNeeded, loadPositionsIfNeeded]);

    useEffect(() => {
        const timer = setTimeout(() => setInternalLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);
    const ITEMS_PER_PAGE = 10;

    // Helper component for visual search highlighting
    const HighlightText = ({ text, highlight }) => {
        if (!highlight || !highlight.trim()) return <span>{text}</span>;
        const parts = String(text).split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} style={{ 
                            background: `rgba(244, 114, 182, 0.2)`, 
                            color: '#f472b6',
                            padding: '0 2px',
                            borderRadius: '4px',
                            fontWeight: 900
                        }}>
                            {part}
                        </span>
                    ) : part
                )}
            </span>
        );
    };

    // Premium Tactical Color Palette
    const theme = {
        bg: '#020617',
        surface: 'rgba(15, 23, 42, 0.8)',
        glass: 'rgba(255, 255, 255, 0.03)',
        border: 'rgba(255, 255, 255, 0.1)',
        primary: '#f97316', // Orange
        secondary: '#00f2ff', // Electric Cyan (Neon Blue)
        tertiary: '#facc15', // Yellow
        success: '#10b981', // Emerald
        warning: '#facc15', // Yellow
        danger: '#ef4444', // Red
        textMain: '#f8fafc',
        textDim: '#94a3b8'
    };

    // Pre-calculate stats with high reliability
    const projectStats = useMemo(() => {
        if (!projects || !offices) return [];

        const activeOffices = offices.filter(o => String(o.status || '').toLowerCase() === 'active');
        const activePositions = (positions || []).filter(p => String(p.status || '').toLowerCase() === 'active');

        return projects.map(proj => {
            // Enhanced reliability: Check both explicit assignments and legacy links
            const projOffices = activeOffices.filter(o => {
                const isAssigned = (proj.assigned_offices || []).map(String).includes(String(o.id));
                const isDirectLink = String(o.project_id) === String(proj.id);
                const isClusterLink = proj.geo_scope === 'CLUSTER' && String(o.cluster_name).toLowerCase() === String(proj.cluster_name).toLowerCase();
                return isAssigned || isDirectLink || isClusterLink;
            });
            
            const officeIds = new Set(projOffices.map(o => String(o.id)));
            const projDepts = (departments || []).filter(d => officeIds.has(String(d.office_id)));
            const deptIds = new Set(projDepts.map(d => String(d.id)));
            const projSecs = (sections || []).filter(s => deptIds.has(String(s.department_id)));
            const sectionIds = new Set(projSecs.map(s => String(s.id)));

            const projPositions = activePositions.filter(p => 
                sectionIds.has(String(p.section_id)) || 
                deptIds.has(String(p.department_id)) || 
                officeIds.has(String(p.office_id))
            );
            
            const projPositionIds = new Set(projPositions.map(p => String(p.id)));
            const projEmployees = (allEmployees || []).filter(emp => {
                const empPosIds = Array.isArray(emp.positions) ? emp.positions : (emp.positions_details?.map(pd => pd.id) || []);
                return empPosIds.some(pid => projPositionIds.has(String(pid)));
            }).sort((a,b) => (a.name || '').localeCompare(b.name || ''));

            const fillRate = projPositions.length > 0 ? (projEmployees.length / projPositions.length * 100) : 0;
            
            return {
                ...proj,
                totalUnits: projOffices.length + projDepts.length + projSecs.length,
                totalOffices: projOffices.length,
                totalPositions: projPositions.length,
                totalEmployees: projEmployees.length,
                totalVacancies: Math.max(0, projPositions.length - projEmployees.length),
                fillRate: fillRate.toFixed(1),
                riskLevel: fillRate < 70 ? 'CRITICAL' : (fillRate < 85 ? 'MODERATE' : 'STABLE'),
                employees: projEmployees
            };
        }).sort((a, b) => b.totalEmployees - a.totalEmployees);
    }, [projects, offices, departments, sections, positions, allEmployees]);

    const summary = useMemo(() => {
        const totalPos = projectStats.reduce((acc, p) => acc + p.totalPositions, 0);
        const totalEmp = projectStats.reduce((acc, p) => acc + p.totalEmployees, 0);
        const criticalProjects = projectStats.filter(p => p.riskLevel === 'CRITICAL').length;
        
        return {
            totalProjects: projectStats.length,
            totalWorkforce: totalEmp,
            totalVacancies: Math.max(0, totalPos - totalEmp),
            utilization: totalPos > 0 ? (totalEmp / totalPos * 100).toFixed(1) : 0,
            criticalAlerts: criticalProjects
        };
    }, [projectStats]);

    const filteredProjects = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return projectStats;
        return projectStats.filter(p => 
            (p.name?.toLowerCase().includes(q)) || 
            (p.code?.toLowerCase().includes(q)) ||
            (p.cluster_name?.toLowerCase().includes(q))
        );
    }, [projectStats, searchQuery]);

    const selectedProject = projectStats.find(p => String(p.id) === String(selectedProjectId));

    const manifestEmployees = useMemo(() => {
        if (!selectedProject) return [];
        const q = employeeSearch.toLowerCase().trim();
        return selectedProject.employees.filter(e => 
            e.name?.toLowerCase().includes(q) || 
            e.employee_code?.toLowerCase().includes(q)
        );
    }, [selectedProject, employeeSearch]);

    const paginatedEmployees = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return manifestEmployees.slice(start, start + ITEMS_PER_PAGE);
    }, [manifestEmployees, currentPage]);

    const totalPages = Math.ceil(manifestEmployees.length / ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [employeeSearch, selectedProjectId]);

    if (internalLoading || loading || employeesLoading || positionsLoading) return (
        <div style={{ background: theme.bg, height: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            <div className="loader-ring"></div>
            <div style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.3em', color: theme.primary }} className="animate-pulse">INITIALIZING DOMAIN PROTOCOLS</div>
        </div>
    );

    return (
        <div style={{ 
            background: theme.bg,
            minHeight: '100vh',
            color: theme.textMain,
            padding: '2.5rem',
            fontFamily: "'Outfit', 'Inter', sans-serif",
            overflowX: 'hidden',
            position: 'relative'
        }}>
            {/* ─── TACTICAL BACKGROUND OVERLAY ─── */}
            <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0) 0%, rgba(2, 6, 23, 1) 100%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '60%', height: '60%', background: `${theme.primary}05`, filter: 'blur(180px)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '60%', height: '60%', background: `${theme.secondary}05`, filter: 'blur(180px)', pointerEvents: 'none' }} />

            <div style={{ maxWidth: '1700px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                
                {/* ─── COMMAND HEADER ─── */}
                <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="fade-in-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.success }} className="animate-pulse" />
                                <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em', color: theme.textDim }}>SYSTEM: OPERATIONAL</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: theme.textDim }}>v3.4.0-STABLE</div>
                        </div>
                        <h1 style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.85, marginBottom: '1rem' }}>
                            Workforce <br/>
                            <span style={{ 
                                background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                display: 'inline-block',
                                paddingBottom: '0.1em'
                            }}>Intelligence</span>
                        </h1>
                        <p style={{ color: theme.textDim, fontSize: '1.2rem', maxWidth: '550px', lineHeight: 1.6, fontWeight: 500 }}>
                            Aggregated multi-domain workforce data and resilience metrics for strategic organizational oversight.
                        </p>
                    </div>

                    <div className="fade-in-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="tactical-btn"><Download size={18} /> EXPORT REPORT</button>
                            <button className="tactical-btn"><Share2 size={18} /> BROADCAST</button>
                        </div>
                        <div style={{ position: 'relative', width: '450px' }}>
                            <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: theme.secondary }} size={24} />
                            <input 
                                type="text" 
                                placeholder="Locate Domain or Deployment Code..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '22px 25px 22px 65px',
                                    background: theme.surface,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '24px',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    outline: 'none',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* ─── CRITICAL METRICS ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
                    {[
                        { label: 'ACTIVE DOMAINS', value: summary.totalProjects, icon: <Layout />, color: theme.primary, trend: '+2' },
                        { label: 'TOTAL PERSONNEL', value: summary.totalWorkforce, icon: <Users />, color: theme.secondary, trend: '+12%' },
                        { label: 'OPEN VACANCIES', value: summary.totalVacancies, icon: <Target />, color: theme.warning, trend: '-4' },
                        { label: 'DOMAIN UPTIME', value: `${summary.utilization}%`, icon: <Activity />, color: theme.success, trend: 'OPTIMAL' },
                        { label: 'CRITICAL ALERTS', value: summary.criticalAlerts, icon: <AlertTriangle />, color: theme.danger, trend: 'ACTION REQ', isAlert: summary.criticalAlerts > 0 }
                    ].map((stat, i) => (
                        <div key={i} className="glass fade-in-up" style={{
                            padding: '2rem',
                            background: theme.surface,
                            borderRadius: '28px',
                            border: `1px solid ${stat.isAlert ? `${theme.danger}40` : theme.border}`,
                            position: 'relative',
                            overflow: 'hidden',
                            animationDelay: `${i * 0.1}s`,
                            boxShadow: stat.isAlert ? `0 0 30px ${theme.danger}20` : 'none'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ 
                                    width: '54px', height: '54px', borderRadius: '16px', 
                                    background: `${stat.color}15`, color: stat.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {React.cloneElement(stat.icon, { size: 26 })}
                                </div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: stat.color, padding: '4px 10px', background: `${stat.color}10`, borderRadius: '8px' }}>
                                    {stat.trend}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: theme.textDim, fontWeight: 800, letterSpacing: '0.1em', marginBottom: '4px' }}>{stat.label}</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{stat.value}</div>
                            </div>
                            {stat.isAlert && <div className="critical-pulse" />}
                        </div>
                    ))}
                </div>

                {/* ─── TAB NAVIGATION ─── */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', borderBottom: `1px solid ${theme.border}` }}>
                    {['overview', 'analytics', 'risk-map'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '1rem 2rem',
                                background: 'transparent',
                                border: 'none',
                                color: activeTab === tab ? theme.primary : theme.textDim,
                                fontSize: '0.9rem',
                                fontWeight: 900,
                                letterSpacing: '0.1em',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {tab.toUpperCase().replace('-', ' ')}
                            {activeTab === tab && (
                                <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '3px', background: theme.primary, borderRadius: '3px 3px 0 0', boxShadow: `0 0 10px ${theme.primary}` }} />
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '2rem' }}>
                        {filteredProjects.map((proj, i) => {
                            const isSelected = String(proj.id) === String(selectedProjectId);
                            const isHovered = hoveredCard === proj.id;
                            
                            return (
                                <div 
                                    key={proj.id}
                                    onMouseEnter={() => setHoveredCard(proj.id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    onClick={() => setSelectedProjectId(isSelected ? null : proj.id)}
                                    className="domain-card fade-in-up"
                                    style={{
                                        animationDelay: `${(i % 10) * 0.05}s`,
                                        padding: '2.5rem',
                                        background: isSelected ? 'rgba(255,255,255,0.06)' : theme.surface,
                                        borderRadius: '36px',
                                        border: `1px solid ${isSelected ? theme.secondary : theme.border}`,
                                        cursor: 'pointer',
                                        position: 'relative',
                                        backdropFilter: 'blur(30px)',
                                        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                        transform: isHovered ? 'translateY(-10px)' : 'none',
                                        boxShadow: isHovered ? `0 40px 70px rgba(0,0,0,0.5), 0 0 40px ${theme.secondary}20` : '0 10px 30px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                        <div style={{ 
                                            width: '60px', height: '60px', borderRadius: '20px',
                                            background: isSelected ? theme.secondary : 'rgba(255,255,255,0.05)',
                                            color: isSelected ? 'white' : theme.secondary,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <Globe size={32} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                            <div style={{ 
                                                fontSize: '0.65rem', fontWeight: 900, padding: '5px 12px', borderRadius: '10px',
                                                background: proj.riskLevel === 'CRITICAL' ? `${theme.danger}20` : (proj.riskLevel === 'MODERATE' ? `${theme.warning}20` : `${theme.success}20`),
                                                color: proj.riskLevel === 'CRITICAL' ? theme.danger : (proj.riskLevel === 'MODERATE' ? theme.warning : theme.success),
                                                letterSpacing: '0.1em'
                                            }}>
                                                {proj.riskLevel} RESILIENCE
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: theme.textDim, fontWeight: 700 }}>
                                                {proj.status?.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                                        <HighlightText text={proj.name} highlight={searchQuery} />
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textDim, fontSize: '0.9rem', marginBottom: '2.5rem' }}>
                                        <ShieldCheck size={16} color={theme.secondary} /> 
                                        <HighlightText text={proj.code} highlight={searchQuery} />
                                        <span style={{ margin: '0 8px', opacity: 0.2 }}>•</span>
                                        <MapPin size={16} /> {proj.totalOffices} Nodes
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                        <div className="stat-mini">
                                            <div className="label">ACTIVE DEPLOYMENT</div>
                                            <div className="value">{proj.totalEmployees} <span className="unit">EMP</span></div>
                                        </div>
                                        <div className="stat-mini">
                                            <div className="label">STRATEGIC CAPACITY</div>
                                            <div className="value">{proj.totalPositions} <span className="unit">SLOTS</span></div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <div style={{ fontSize: '0.7rem', color: theme.textDim, fontWeight: 900, letterSpacing: '0.05em' }}>UTILIZATION MATRIX</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 900, color: theme.primary }}>{proj.fillRate}%</div>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                width: `${proj.fillRate}%`, height: '100%', 
                                                background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
                                                borderRadius: '10px',
                                                boxShadow: `0 0 15px ${theme.primary}40`,
                                                transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="fade-in-up" style={{ 
                        background: 'rgba(15, 23, 42, 0.4)', 
                        padding: '3rem', 
                        borderRadius: '40px', 
                        border: `1px solid ${theme.secondary}20`,
                        boxShadow: `0 0 40px ${theme.secondary}05`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                            <div>
                                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: theme.secondary }}>Project Intelligence Vector</h2>
                                <p style={{ color: theme.textDim }}>Tactical workforce density and strategic capacity analysis.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: theme.secondary, boxShadow: `0 0 10px ${theme.secondary}` }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: theme.textDim }}>DEPLOYED UNITS</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: theme.textDim }}>VACANT NODES</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: 550 }}>
                            <ResponsiveContainer>
                                <AreaChart data={projectStats.slice(0, 15)} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="neonGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme.secondary} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={theme.secondary} stopOpacity={0}/>
                                        </linearGradient>
                                        <filter id="glow">
                                            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                                            <feMerge>
                                                <feMergeNode in="coloredBlur"/>
                                                <feMergeNode in="SourceGraphic"/>
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: theme.textDim, fontSize: 11, fontWeight: 700 }} 
                                        height={80} angle={-45} textAnchor="end" 
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.textDim, fontSize: 12, fontWeight: 700 }} />
                                    <Tooltip 
                                        contentStyle={{ background: '#020617', border: `1px solid ${theme.secondary}30`, borderRadius: '15px', color: 'white', fontWeight: 700, boxShadow: `0 0 20px ${theme.secondary}20` }} 
                                        itemStyle={{ color: theme.secondary }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="totalEmployees" 
                                        stroke={theme.secondary} 
                                        strokeWidth={4}
                                        fillOpacity={1} 
                                        fill="url(#neonGlow)" 
                                        filter="url(#glow)"
                                        animationDuration={2000}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="totalPositions" 
                                        stroke="rgba(255,255,255,0.1)" 
                                        strokeDasharray="5 5"
                                        fillOpacity={0} 
                                        strokeWidth={1}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'risk-map' && (
                    <div className="fade-in-up" style={{ 
                        height: '650px', 
                        background: 'rgba(15, 23, 42, 0.4)', 
                        borderRadius: '40px', 
                        border: `1px solid ${theme.secondary}20`,
                        boxShadow: `0 0 40px ${theme.secondary}05`,
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <OrganizationMap offices={offices} selectedOfficeId={selectedProjectId} />
                    </div>
                )}

                {/* ─── PERSONNEL DRILL-DOWN MODAL-LIKE DRAWER ─── */}
                {selectedProject && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '1rem' }}>
                        <div onClick={() => setSelectedProjectId(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }} />
                        <div className="drill-down-drawer" style={{ 
                            width: '900px', height: '100%', background: theme.surface, 
                            borderLeft: `1px solid ${theme.border}`, position: 'relative', zIndex: 101,
                            padding: '3.5rem', display: 'flex', flexDirection: 'column',
                            boxShadow: '-40px 0 100px rgba(0,0,0,0.5)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Personnel Manifest</h2>
                                    <p style={{ color: theme.textDim }}>Domain: <strong style={{ color: theme.secondary }}>{selectedProject.name}</strong> • {selectedProject.totalEmployees} active personnel detected</p>
                                </div>
                                <button onClick={() => setSelectedProjectId(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '15px', borderRadius: '15px', cursor: 'pointer' }}>
                                    <X size={28} />
                                </button>
                            </div>

                            <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                                <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: theme.secondary }} size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Filter by Name, ID or Protocol..." 
                                    value={employeeSearch}
                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '18px 20px 18px 50px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: '16px',
                                        color: 'white',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }} className="custom-scroll">
                                {paginatedEmployees.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {paginatedEmployees.map((emp, i) => (
                                            <div key={emp.id} className="manifest-item" style={{
                                                padding: '1.5rem',
                                                background: 'rgba(255,255,255,0.02)',
                                                borderRadius: '24px',
                                                border: `1px solid ${theme.border}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1.5rem',
                                                transition: 'all 0.3s ease'
                                            }}>
                                                <div style={{ 
                                                    width: '56px', height: '56px', borderRadius: '50%', 
                                                    background: `linear-gradient(45deg, ${theme.primary}, ${theme.tertiary})`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.2rem', fontWeight: 900, color: 'white',
                                                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                                                }}>
                                                    {emp.name?.charAt(0)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                                                        <HighlightText text={emp.name} highlight={employeeSearch} />
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: theme.textDim, fontWeight: 700 }}>
                                                        <HighlightText text={emp.employee_code} highlight={employeeSearch} />
                                                    </div>
                                                </div>
                                                <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900 }}>
                                                    ACTIVE DEPLOYMENT
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '8rem 2rem', textAlign: 'center', opacity: 0.5 }}>
                                        <Info size={64} style={{ marginBottom: '1.5rem' }} />
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>NO PERSONNEL MATCHES</h3>
                                    </div>
                                )}
                            </div>

                            {/* PAGINATION CONTROLS */}
                            {totalPages > 1 && (
                                <div style={{ 
                                    marginTop: '2rem', 
                                    padding: '1.5rem', 
                                    borderTop: `1px solid ${theme.border}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: theme.textDim, fontWeight: 700 }}>
                                        Showing {((currentPage-1)*ITEMS_PER_PAGE)+1}-{Math.min(currentPage*ITEMS_PER_PAGE, manifestEmployees.length)} of {manifestEmployees.length}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button 
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                            className="tactical-btn"
                                            style={{ opacity: currentPage === 1 ? 0.3 : 1, padding: '8px 15px' }}
                                        >
                                            PREV
                                        </button>
                                        <div style={{ padding: '8px 15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 900, minWidth: '40px', textAlign: 'center' }}>
                                            {currentPage}
                                        </div>
                                        <button 
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                            className="tactical-btn"
                                            style={{ opacity: currentPage === totalPages ? 0.3 : 1, padding: '8px 15px' }}
                                        >
                                            NEXT
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
                
                @keyframes fade-in-up {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fade-in-left {
                    from { transform: translateX(-40px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fade-in-right {
                    from { transform: translateX(40px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .fade-in-left { animation: fade-in-left 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .fade-in-right { animation: fade-in-right 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }

                .tactical-btn {
                    padding: 12px 24px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 14px;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 900;
                    letter-spacing: 0.1em;
                    cursor: pointer;
                    display: flex;
                    alignItems: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                }
                .tactical-btn:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: ${theme.primary};
                    box-shadow: 0 0 20px ${theme.primary}20;
                }

                .stat-mini .label { fontSize: 0.65rem; color: ${theme.textDim}; fontWeight: 900; letterSpacing: 0.05em; marginBottom: 6px; }
                .stat-mini .value { fontSize: 1.5rem; fontWeight: 900; letterSpacing: -0.02em; }
                .stat-mini .unit { fontSize: 0.7rem; color: ${theme.textDim}; fontWeight: 600; }

                .critical-pulse {
                    position: absolute; top: 0; right: 0; width: 100px; height: 100px;
                    background: ${theme.danger}; filter: blur(40px); opacity: 0.15;
                    animation: pulse-danger 2s infinite ease-in-out;
                }
                @keyframes pulse-danger {
                    0%, 100% { opacity: 0.05; transform: scale(1); }
                    50% { opacity: 0.2; transform: scale(1.5); }
                }

                .manifest-item:hover {
                    background: rgba(255,255,255,0.06) !important;
                    transform: translateX(10px);
                }

                .drill-down-drawer {
                    animation: slide-in-right 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                .loader-ring {
                    width: 80px; height: 80px; border: 4px solid rgba(255,255,255,0.05);
                    border-top: 4px solid ${theme.primary}; border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }

                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: ${theme.secondary}40; }
            `}</style>
        </div>
    );
};

export default ProjectAnalyticsDashboard;
