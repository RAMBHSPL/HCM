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
        'position-shift-rosters', 'shift-change-requests', 'shift-requests'
    ].includes(id);

    return (
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', overflow: 'hidden', padding: 0, background: 'transparent' }}>
                    <img src="/Bavya.png" alt="Bavya Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                </div>
                <div className="sidebar-logo-text">
                    <span style={{ color: 'white', fontWeight: 800 }}>BAVYA</span><br />
                    <span style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '0.2em', fontWeight: 700, color: '#94a3b8' }}>HRMS</span>
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
                            'Dashboard Overview': '#38bdf8', // Sky Blue
                            'Organization': '#d946ef',      // Fuchsia
                            'Job Structure': '#facc15',     // Yellow
                            'Workforce': '#4ade80',         // Green
                            'Geo Locations': '#818cf8',     // Indigo
                            'Security & Access': '#f87171'  // Red
                        };
                        return colors[name] || '#cbd5e1';
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
