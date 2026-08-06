import React from 'react';
import { Layers, ChevronDown, LogOut } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useData, SECTION_GROUPS, SECTIONS } from '../context/DataContext';

const Sidebar = () => {
    const {
        activeSection,
        expandedGroups,
        toggleGroup,
        selectSection: originalSelectSection,
        fetchData,
        logout,
        canView,
        isSidebarOpen,
        toggleSidebar
    } = useData();

    const selectSection = (id) => {
        originalSelectSection(id);
        if (window.innerWidth <= 1024) {
            toggleSidebar();
        }
    };

    const isInternalSection = (id) => [
        'permission-matrix', 'position-assignments', 'shifts', 
        'position-shift-rosters', 'shift-change-requests', 'shift-requests',
        'position-role-mappings'
    ].includes(id);

    return (
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo-icon" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: '12px', 
                    width: '42px',
                    height: '42px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 8px 20px rgba(79, 70, 229, 0.45)'
                }}>
                    <Layers size={22} color="white" />
                </div>
                <div className="sidebar-logo-text">
                    <span style={{ color: 'white', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>ONE<span style={{ color: '#818cf8', fontWeight: 900 }}> HCM</span></span><br />
                    <span style={{ fontSize: '0.62rem', letterSpacing: '0.15em', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>Enterprise Platform</span>
                </div>
                <button
                    className="mobile-close-btn"
                    onClick={toggleSidebar}
                    style={{ display: 'none', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: 'auto' }}
                >
                    <Layers size={24} style={{ transform: 'rotate(45deg)' }} />
                </button>
            </div>

            <nav className="sidebar-nav">
                {SECTION_GROUPS.map(group => {
                    // Semantic Color Palette based on Group Name
                    const getGroupColor = (name) => {
                        const colors = {
                            'Dashboard Overview': '#818cf8', // Indigo Accent
                            'Organization':       '#a78bfa', // Violet Accent
                            'Job Structure':      '#38bdf8', // Cyan Accent
                            'Workforce':          '#34d399', // Emerald Accent
                            'Geo Locations':      '#fb7185', // Rose Accent
                            'Security & Access':  '#f43f5e'  // Coral Accent
                        };
                        return colors[name] || '#94a3b8';
                    };

                    const groupColor = getGroupColor(group.name);

                    if (group.standalone) {
                        return group.items.map(itemId => {
                            const section = SECTIONS.find(s => s.id === itemId);
                            if (!section) return null;

                            // Check permission
                            if (itemId !== 'dashboard' && !canView(itemId) && !isInternalSection(itemId)) return null;

                            const isActive = activeSection === section.id;

                            return (
                                <NavLink
                                    key={section.id}
                                    to={section.id === 'dashboard' ? '/' : `/${section.id}`}
                                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                    onClick={() => selectSection(section.id)}
                                    onMouseEnter={() => {
                                        // PRE-FETCH REMOVED to prevent accidental refreshes of CURRENT section
                                    }}
                                    style={{ marginBottom: '1rem', textDecoration: 'none' }}
                                >
                                    <div style={{
                                        color: activeSection === section.id ? 'white' : groupColor,
                                        filter: activeSection === section.id ? 'none' : 'drop-shadow(0 0 8px rgba(0,0,0,0.2))',
                                        display: 'flex', alignItems: 'center'
                                    }}>
                                        {React.cloneElement(section.icon, { size: 20 })}
                                    </div>
                                    <span style={{ color: activeSection === section.id ? 'white' : '#cbd5e1', fontWeight: activeSection === section.id ? 700 : 500 }}>{section.name}</span>
                                </NavLink>
                            );
                        });
                    }

                    const visibleItems = group.items.filter(id => canView(id) || isInternalSection(id));
                    if (visibleItems.length === 0) return null;

                    const isExpanded = expandedGroups.includes(group.name);
                    const hasActiveChild = group.items.includes(activeSection);

                    return (
                        <div key={group.name} style={{ marginBottom: '0.5rem' }}>
                            <div
                                className={`sidebar-group-header ${hasActiveChild ? 'active-group' : ''}`}
                                onClick={() => toggleGroup(group.name)}
                            >
                                <div className="group-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        color: hasActiveChild ? 'white' : groupColor,
                                        transition: 'color 0.3s ease'
                                    }}>
                                        {React.cloneElement(group.icon, { size: 20 })}
                                    </div>
                                    <span style={{
                                        color: hasActiveChild ? 'white' : '#94a3b8',
                                        fontWeight: hasActiveChild ? 800 : 600
                                    }}>
                                        {group.name}
                                    </span>
                                </div>
                                <ChevronDown
                                    size={16}
                                    style={{
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease',
                                        color: hasActiveChild ? 'white' : '#64748b'
                                    }}
                                />
                            </div>

                            {isExpanded && (
                                <div className="sidebar-group-content">
                                    {visibleItems.map(sectionId => {
                                        const section = SECTIONS.find(s => s.id === sectionId);
                                        if (!section) return null;
                                        const isActive = activeSection === sectionId;

                                        return (
                                            <NavLink
                                                key={sectionId}
                                                to={`/${sectionId}`}
                                                className={({ isActive }) => `sidebar-sub-link ${isActive ? 'active' : ''}`}
                                                onClick={() => selectSection(sectionId)}
                                                onMouseEnter={() => {
                                                    // PRE-FETCH REMOVED to prevent accidental refreshes of CURRENT section
                                                }}
                                                style={{ paddingLeft: '2.5rem', textDecoration: 'none' }}
                                            >
                                                <div style={{
                                                    color: activeSection === sectionId ? 'white' : groupColor,
                                                    opacity: activeSection === sectionId ? 1 : 0.7,
                                                    display: 'flex', alignItems: 'center'
                                                }}>
                                                    {React.cloneElement(section.icon, { size: 18 })}
                                                </div>
                                                <span style={{
                                                    color: activeSection === sectionId ? 'white' : '#94a3b8',
                                                    fontWeight: activeSection === sectionId ? 600 : 500
                                                }}>
                                                    {section.name}
                                                </span>
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Logout Button Removed as per User Request (Moved to TopNav Profile Menu) */}


        </aside>
    );
};

export default Sidebar;
