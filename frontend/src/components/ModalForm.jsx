import React, { useEffect, useState, useMemo } from 'react';
import {
    Layers,
    Edit,
    ChevronDown,
    Building,
    Building2,
    FileText,
    FileDigit,
    Users,
    Phone,
    Mail,
    Navigation,
    Globe,
    MapPin,
    Briefcase,
    Calendar,
    Map,
    Home,
    FolderKanban,
    Plus,
    Sparkles,
    ShieldCheck,
    History,
    Clock,
    Wallet,
    Banknote,
    Navigation2,
    ClipboardList,
    BarChart3,
    Settings,
    GraduationCap,
    TrendingUp,
    UserCircle,
    CheckSquare,
    UserSquare2,
    Network,
    LayoutGrid,
    Link,
    User,
    Upload,
    ShieldAlert,
    ArrowRightLeft,
    X,
    CreditCard,
    Shield,
    Car,
    Heart,
    Gift,
    UserPlus,
    Activity,
    Search
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { useData } from '../context/DataContext';
import api, { BACKEND_BASE_URL } from '../api';
import GeoMapPicker from './GeoMapPicker';

const MultiSearchableSelect = ({
    options = [],
    value = [],
    onChange,
    placeholder = 'Select options...',
    icon: Icon = null,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedIds = (value || []).map(String);

    const filteredOptions = options.filter(opt => {
        const label = (opt.name || opt.label || '').toLowerCase();
        const search = searchTerm.toLowerCase().trim();
        return !search || label.includes(search);
    });

    const handleToggle = (id) => {
        const strId = String(id);
        let newValue;
        if (selectedIds.includes(strId)) {
            newValue = selectedIds.filter(x => x !== strId);
        } else {
            newValue = [...selectedIds, strId];
        }
        onChange(newValue);
    };

    const displayLabel = (() => {
        if (selectedIds.length === 0) return placeholder;
        const selectedNames = options
            .filter(opt => selectedIds.includes(String(opt.id)))
            .map(opt => opt.name || opt.label);
        if (selectedNames.length === 0) return placeholder;
        if (selectedNames.length <= 3) return selectedNames.join(', ');
        return `${selectedNames.length} selected`;
    })();

    return (
        <div className="premium-select-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div
                className={`premium-input ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '3.5rem',
                    opacity: disabled ? 0.6 : 1,
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                    {Icon && <Icon className="premium-input-icon" size={18} style={{ position: 'static', transform: 'none', color: isOpen ? 'var(--primary)' : '#94a3b8' }} />}
                    <span style={{
                        color: selectedIds.length > 0 ? '#1e293b' : '#94a3b8',
                        fontWeight: selectedIds.length > 0 ? 600 : 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {displayLabel}
                    </span>
                </div>
                <ChevronDown size={18} color="#94a3b8" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
            </div>

            {isOpen && (
                <div className="glass" style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    zIndex: 2000,
                    padding: '8px',
                    maxHeight: '260px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff'
                }}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Type to search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 32px',
                                borderRadius: '8px',
                                border: '1px solid #f1f5f9',
                                background: '#f8fafc',
                                fontSize: '0.85rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => {
                                const isChecked = selectedIds.includes(String(opt.id));
                                return (
                                    <div
                                        key={opt.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggle(opt.id);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            background: isChecked ? 'var(--primary-light)' : 'transparent',
                                            color: isChecked ? 'var(--primary)' : '#1e293b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            userSelect: 'none'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            readOnly
                                            style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                                        />
                                        <span style={{ fontWeight: isChecked ? 600 : 500 }}>{opt.name || opt.label}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ModalForm = () => {
    const {
        data,
        modalType,
        formData,
        setFormData,
        orgLevels,
        offices,
        departments,
        sections,
        jobFamilies,
        roles,
        roleSubGroups,
        jobs,
        positions,
        allEmployees,
        selectedEmployee,
        projects,
        facilityMasters,
        officeTypes,
        roleTypes,
        tasks,
        documentTypes,
        geoContinents,
        geoCountries,
        geoStatesData,
        geoDistrictsData,
        geoMandals,
        geoClusters,
        handleAdd,
        positionLevels,
        user,
        validationErrors,
        setValidationErrors,
        shifts,
        positionTypes,
        loadPositionsIfNeeded,
        positionsLoading,
        loadEmployeesIfNeeded
    } = useData();

    const [officeSearchTerm, setOfficeSearchTerm] = useState('');
    const [hierarchySearchTerm, setHierarchySearchTerm] = useState('');

    const prevRoleGroupsRef = React.useRef([]);

    React.useEffect(() => {
        if (modalType === 'Positions') {
            const initialRoles = [formData.role, ...(formData.additional_roles || [])].filter(Boolean).map(String);
            prevRoleGroupsRef.current = initialRoles;
        }
    }, [modalType, formData.id]);

    React.useEffect(() => {
        if (modalType !== 'Positions') return;

        const currentRole = formData.role;
        const currentAdditional = formData.additional_roles || [];
        const currentRoles = [currentRole, ...currentAdditional].filter(Boolean).map(String);

        const prevRoles = prevRoleGroupsRef.current;

        // Detect if roles changed
        const addedRoles = currentRoles.filter(id => !prevRoles.includes(id));
        const removedRoles = prevRoles.filter(id => !currentRoles.includes(id));

        if (addedRoles.length > 0 || removedRoles.length > 0) {
            prevRoleGroupsRef.current = currentRoles;

            let newSubGroups = [formData.role_sub_group, ...(formData.additional_sub_groups || [])].filter(Boolean).map(String);
            let newJobs = [formData.job, ...(formData.additional_jobs || [])].filter(Boolean).map(String);

            // For any added role group: auto-tag all its sub-groups and jobs
            addedRoles.forEach(roleId => {
                const sgIds = roleSubGroups
                    .filter(sg => String(sg.role_group && typeof sg.role_group === 'object' ? sg.role_group.id : sg.role_group) === roleId)
                    .map(sg => String(sg.id));
                const jIds = jobs
                    .filter(j => String(j.role && typeof j.role === 'object' ? j.role.id : j.role) === roleId)
                    .map(j => String(j.id));

                sgIds.forEach(id => {
                    if (!newSubGroups.includes(id)) newSubGroups.push(id);
                });
                jIds.forEach(id => {
                    if (!newJobs.includes(id)) newJobs.push(id);
                });
            });

            // For any removed role group: remove all its sub-groups and jobs
            removedRoles.forEach(roleId => {
                const sgIds = roleSubGroups
                    .filter(sg => String(sg.role_group && typeof sg.role_group === 'object' ? sg.role_group.id : sg.role_group) === roleId)
                    .map(sg => String(sg.id));
                const jIds = jobs
                    .filter(j => String(j.role && typeof j.role === 'object' ? j.role.id : j.role) === roleId)
                    .map(j => String(j.id));

                newSubGroups = newSubGroups.filter(id => !sgIds.includes(id));
                newJobs = newJobs.filter(id => !jIds.includes(id));
            });

            setFormData(prev => ({
                ...prev,
                role_sub_group: newSubGroups[0] || '',
                additional_sub_groups: newSubGroups.slice(1),
                job: newJobs[0] || '',
                additional_jobs: newJobs.slice(1)
            }));
        }
    }, [formData.role, formData.additional_roles, modalType, roleSubGroups, jobs, setFormData]);

    React.useEffect(() => {
        if ((modalType === 'Positions' || modalType === 'Employees') && loadPositionsIfNeeded) {
            console.log(`⚡ [ModalForm] Triggering lazy-load of positions for modalType: ${modalType}`);
            loadPositionsIfNeeded();
        }
        if ((modalType === 'Employees' || modalType === 'Position Assignments') && loadEmployeesIfNeeded) {
            console.log(`⚡ [ModalForm] Triggering lazy-load of employees for modalType: ${modalType}`);
            loadEmployeesIfNeeded();
        }
    }, [modalType, loadPositionsIfNeeded, loadEmployeesIfNeeded]);

    // ── Facility Master: Dynamic Position Types by Project ──────────────────
    const [facilityPositionTypes, setFacilityPositionTypes] = useState([]);
    const [facilityPTLoading, setFacilityPTLoading] = useState(false);

    React.useEffect(() => {
        if (modalType !== 'Facility Master' && modalType !== 'FacilityMaster') return;
        if (!formData.project) {
            setFacilityPositionTypes([]);
            return;
        }
        let cancelled = false;
        setFacilityPTLoading(true);
        console.log(`[FacilityMaster] Fetching position types for project: ${formData.project}`);
        // api.get returns data directly (not res.data) — it uses fetch, not axios
        api.get(`position-types/?project=${formData.project}`)
            .then(res => {
                if (!cancelled) {
                    // res is the direct JSON response — array or paginated object
                    const results = Array.isArray(res) ? res : (res?.results || []);
                    console.log(`[FacilityMaster] Got ${results.length} position types`);
                    setFacilityPositionTypes(results.sort((a, b) => a.name.localeCompare(b.name)));
                }
            })
            .catch((err) => {
                console.error('[FacilityMaster] Failed to fetch position types:', err);
                if (!cancelled) setFacilityPositionTypes([]);
            })
            .finally(() => { if (!cancelled) setFacilityPTLoading(false); });
        return () => { cancelled = true; };
    }, [formData.project, modalType]);
    // ────────────────────────────────────────────────────────────────────────

    const filteredOffices = useMemo(() => {
        if (modalType !== 'Projects') return [];
        let filtered = (offices || []).filter(o => !formData.assigned_level || String(o.level) === String(formData.assigned_level));
        if (officeSearchTerm && formData.assigned_level) {
            const q = officeSearchTerm.toLowerCase().trim();
            filtered = filtered.filter(o => o.name?.toLowerCase().includes(q) || o.code?.toLowerCase().includes(q));
        }
        return filtered;
    }, [offices, formData.assigned_level, officeSearchTerm, modalType]);

    // Reset URL to reflect "Edit" with MASKED ID
    const selectedMaster = facilityMasters?.find(m => String(m.id) === String(formData.facility_master));
    const selectedProj = projects?.find(p => {
        if (formData.project) return String(p.id) === String(formData.project);
        if (selectedMaster) return String(p.id) === String(selectedMaster.project);
        return false;
    });
    const currentLevel = orgLevels?.find(l => String(l.id) === String(formData.level));

    const showValidationError = (fieldName, message) => {
        setValidationErrors(prev => ({ ...prev, [fieldName]: message }));
        setTimeout(() => {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }, 2000); // Clear after 2 seconds
    };

    // SECURITY: Hardened state updater that prevents tampered updates to locked/disabled fields
    const securedUpdate = (field, value, dependencies = []) => {
        // 1. Check if the field is explicitly locked by Project Scope
        if (isFieldLocked(field)) {
            console.warn(`Tamper Detection: Update to locked field '${field}' blocked.`);
            return;
        }

        // 2. Check if a mandatory dependency is missing (e.g. Mandal before District)
        const missingDependency = dependencies.find(dep => !formData[dep]);
        if (missingDependency) {
            console.warn(`Tamper Detection: Update to field '${field}' blocked due to missing dependency '${missingDependency}'.`);
            return;
        }

        // 3. Apply the update if all checks pass
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Helper to determine if a field is locked by Project Scope
    const isFieldLocked = (field) => {
        if (!selectedProj || currentLevel?.level_code !== 'L9') return false;
        const scope = selectedProj.geo_scope_level;
        // Hierarchy of scopes
        const levels = ['Territory', 'Country', 'State', 'District', 'Mandal', 'Local Body', 'Settlement'];

        // Map field names to their corresponding level index in the hierarchy
        const fieldLevelMap = {
            'country_name': 1, // Index of 'Country'
            'state_name': 2,   // Index of 'State'
            'district_name': 3, // Index of 'District'
            'mandal_name': 4   // Index of 'Mandal'
        };

        const scopeIndex = levels.indexOf(scope);
        const fieldIndex = fieldLevelMap[field];

        if (scopeIndex === -1 || fieldIndex === undefined) return false;

        // If scope is deeper or equal to the field level, it's locked
        // e.g. Scope='State'(2) locks 'country_name'(1) and 'state_name'(2)
        return scopeIndex >= fieldIndex;
    };

    // Reactivity: Auto-populate code prefix based on level for Offices
    React.useEffect(() => {
        if (modalType === 'Offices' && formData.level && !formData.id) {
            const lvl = orgLevels?.find(l => String(l.id) === String(formData.level));
            if (lvl && (!formData.code || formData.code === '')) {
                let projectPart = '';

                // For L9, pull from Facility Master project
                if (lvl.level_code === 'L9' && formData.facility_master) {
                    const master = facilityMasters?.find(m => String(m.id) === String(formData.facility_master));
                    if (master) {
                        // Use project_code from master if available (e.g. "108-OPS")
                        projectPart = master.project_code || '';
                    }
                }
                // For others, check parent's project association if possible
                else if (formData.parent) {
                    const parentOffice = offices?.find(o => String(o.id) === String(formData.parent));
                    if (parentOffice) {
                        // Use the project_code tagged to the parent office
                        projectPart = parentOffice.project_code || '';

                        // Fallback if project_code isn't directly available (legacy records)
                        if (!projectPart) {
                            const codeParts = (parentOffice.code || '').split('-');
                            if (codeParts.length >= 2) {
                                projectPart = `${codeParts[0]}-${codeParts[1]}`;
                            } else {
                                projectPart = codeParts[0] || '';
                            }
                        }
                    }
                }

                let levelPart = (lvl.level_code || '').toLowerCase();

                // Convert L-codes to meaningful abbreviations
                const levelNameLower = (lvl.name || '').toLowerCase();
                if (levelNameLower.includes('head office')) levelPart = 'ho';
                else if (levelNameLower.includes('zonal office')) levelPart = 'zo';
                else if (levelNameLower.includes('circle office')) levelPart = 'co';
                else if (levelNameLower.includes('regional office')) levelPart = 'ro';
                else if (levelNameLower.includes('divisional office')) levelPart = 'do';
                else if (levelNameLower.includes('sub divisional office')) levelPart = 'sdo';
                else if (levelNameLower.includes('section office')) levelPart = 'so';
                else if (levelNameLower.includes('facility')) levelPart = 'fa';
                else if (levelNameLower.includes('vertical')) levelPart = 've';
                else {
                    // Default to first letters if no specific match
                    levelPart = lvl.name.split(' ').map(n => n[0]).join('').toLowerCase();
                }

                // If we have a project part, the format is [Project]-[Level]-
                // If not, just use [Level]-
                const autoCode = projectPart ? `${projectPart}-${levelPart}-`.toUpperCase() : `${levelPart.toUpperCase()}-`;

                setFormData(prev => ({ ...prev, code: autoCode }));
            }
        }
    }, [formData.level, formData.parent, formData.facility_master, orgLevels, offices, facilityMasters, modalType]);


    React.useEffect(() => {
        if (selectedProj && currentLevel?.level_code === 'L9') {
            const scope = selectedProj.geo_scope_level;
            const updates = {};
            const shouldUpdate = (field, value) => formData[field] !== value && value;

            // Define hierarchy checks
            const isScopeAtLeast = (lvl) => {
                const levels = ['Territory', 'Country', 'State', 'District', 'Mandal', 'Local Body', 'Settlement'];
                return levels.indexOf(scope) >= levels.indexOf(lvl);
            };

            if (isScopeAtLeast('Country')) {
                if (shouldUpdate('country_name', selectedProj.country_name)) updates.country_name = selectedProj.country_name;
            }
            if (isScopeAtLeast('State')) {
                if (shouldUpdate('state_name', selectedProj.state_name)) updates.state_name = selectedProj.state_name;
            }
            if (isScopeAtLeast('District')) {
                if (shouldUpdate('district_name', selectedProj.district_name)) updates.district_name = selectedProj.district_name;
            }
            if (isScopeAtLeast('Mandal')) {
                if (shouldUpdate('mandal_name', selectedProj.mandal_name)) updates.mandal_name = selectedProj.mandal_name;
            }

            if (Object.keys(updates).length > 0) {
                setFormData(prev => ({ ...prev, ...updates }));

            }
        }
    }, [selectedProj, currentLevel, formData.country_name, formData.state_name, formData.district_name, formData.mandal_name, geoDistrictsData.length, geoMandals.length]);




    const capitalize = (str) => {
        if (typeof str !== 'string' || !str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const validateCode = (value, maxLength = 50, fieldName = '') => {
        // Allow alphabets, numbers, hyphen, @, underscore, and slash
        const filtered = value.replace(/[^A-Za-z0-9\-@_/]/g, '');
        if (filtered !== value && fieldName) {
            showValidationError(fieldName, 'Only letters, numbers, -, @, _, and / allowed');
        }
        return filtered.toUpperCase().slice(0, maxLength); // Codes are usually all caps
    };

    const validateNumbers = (value, maxLength = 20, fieldName = '') => {
        // Allow only numbers
        const filtered = value.replace(/[^0-9]/g, '');
        if (filtered !== value && fieldName) {
            showValidationError(fieldName, 'Only numbers (0-9) allowed');
        }
        if (filtered.length >= maxLength && value.length > maxLength && fieldName) {
            showValidationError(fieldName, `Maximum ${maxLength} digits allowed`);
        }
        return filtered.slice(0, maxLength);
    };

    const validatePhone = (value, fieldName = '') => {
        // Allow only numbers, max 10 digits (Indian standard)
        const filtered = value.replace(/[^0-9]/g, '');
        if (filtered !== value && fieldName) {
            showValidationError(fieldName, 'Only numbers allowed');
        }

        // BLOCK: Dummy values like 0000000000 or invalid start digits
        if (filtered.length === 10) {
            if (/^0+$/.test(filtered)) {
                showValidationError(fieldName, 'Invalid number (cannot be all zeros)');
            } else if (!/^[6-9]/.test(filtered)) {
                showValidationError(fieldName, 'Mobile number MUST start with 6, 7, 8 or 9');
            }
        }

        if (filtered.length >= 10 && value.length > 10 && fieldName) {
            showValidationError(fieldName, 'Maximum 10 digits allowed');
        }
        return filtered.slice(0, 10);
    };

    const validateEmail = (value, maxLength = 50, fieldName = '') => {
        // Combined logic: Max length + Suffix protection
        let cleaned = value.replace(/[^A-Za-z0-9@._-]/g, '');
        const originalLengthBeforeSuffix = cleaned.length;

        // Domain suffix protection (prevent junk after .com/in)
        cleaned = cleaned.replace(/\.com[^.]*$/i, '.com').replace(/\.in[^.]*$/i, '.in');

        if (cleaned.length < originalLengthBeforeSuffix && fieldName) {
            showValidationError(fieldName, 'Cannot add characters after .com or .in');
        } else if (cleaned !== value && cleaned.length === originalLengthBeforeSuffix && fieldName) {
            showValidationError(fieldName, 'Invalid characters in email');
        }

        if (cleaned.length > maxLength && fieldName) {
            showValidationError(fieldName, `Email limit reached (${maxLength} chars)`);
        }

        return cleaned.slice(0, maxLength);
    };

    const generateNextCode = (prefix, collection, parentIdField = null, parentId = null) => {
        let count = 0;
        if (collection && Array.isArray(collection)) {
            if (parentIdField && parentId) {
                count = collection.filter(item => String(item[parentIdField]) === String(parentId)).length;
            } else {
                count = collection.length;
            }
        }
        return `${prefix}-${String(count + 1).padStart(2, '0')}`;
    };

    const validateAlpha = (value, maxLength = 50, fieldName = '') => {
        // Allow only alphabets and spaces
        const filtered = value.replace(/[^A-Za-z\s]/g, '');
        if (filtered !== value && fieldName) {
            showValidationError(fieldName, 'Only letters and spaces allowed');
        }
        return capitalize(filtered).slice(0, maxLength);
    };

    const validateRank = (value, fieldName = 'rank') => {
        // Allow only numbers and one decimal point
        let filtered = value.replace(/[^0-9.]/g, '');

        // Handle multiple decimal points
        const points = filtered.split('.');
        if (points.length > 2) {
            filtered = points[0] + '.' + points.slice(1).join('');
        }

        if (filtered !== value && fieldName) {
            showValidationError(fieldName, 'Only positive numbers allowed');
        }

        const numVal = parseFloat(filtered);

        if (numVal > 15) {
            showValidationError(fieldName, 'Maximum rank allowed is 15');
            return '15';
        }

        return filtered;
    };

    const validateAlphaNumeric = (value, maxLength = 50, fieldName = '') => {
        // Allow alphabets, numbers, spaces, hyphens, and @
        const filtered = value.replace(/[^A-Za-z0-9\s\-@]/g, '');
        if (filtered !== value && fieldName) {
            showValidationError(fieldName, 'Only letters, numbers, spaces, hyphens, and @ allowed');
        }
        return capitalize(filtered).slice(0, maxLength);
    };

    const validateName = (value, maxLength = 50, fieldName = '') => {
        // Allow letters, numbers, spaces, hyphens, and @
        let filtered = value.replace(/[^A-Za-z0-9\s\-@]/g, '');

        // No spaces at front
        if (filtered.startsWith(' ')) {
            filtered = filtered.trimStart();
        }

        if (filtered !== value && fieldName) {
            showValidationError(fieldName, 'Only letters, numbers, spaces, hyphens, and @ allowed');
        }
        return capitalize(filtered).slice(0, maxLength);
    };

    const validateAddress = (value, maxLength = 500, fieldName = '') => {
        // Allow letters, numbers, spaces, and hyphens
        let filtered = value.replace(/[^A-Za-z0-9\s\-]/g, '');

        if (filtered !== value && fieldName) {
            showValidationError(fieldName, 'Only letters, numbers, spaces, and hyphens allowed in address');
        }
        return capitalize(filtered).slice(0, maxLength);
    };

    const isEmailValid = (email) => {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/;
        return re.test(String(email).toLowerCase());
    };


    const renderCharacterCounter = (currentValue, maxLength) => {
        if (!maxLength) return null;
        const currentLength = String(currentValue || '').length;
        const remaining = maxLength - currentLength;
        const isLimitReached = remaining <= 0;
        const isNearLimit = remaining <= (maxLength * 0.1) || remaining <= 5;

        return (
            <div style={{
                textAlign: 'right',
                fontSize: '0.65rem',
                color: isLimitReached ? '#be185d' : (isNearLimit ? '#db2777' : '#94a3b8'),
                marginTop: '2px',
                fontWeight: 600,
                opacity: currentLength > 0 ? 1 : 0.4,
                transition: 'all 0.2s ease'
            }}>
                {currentLength} / {maxLength}
            </div>
        );
    };

    const handleClusterNameChange = (val) => {
        const newName = validateName(val, 50, 'geo_name');
        setFormData(prev => ({ ...prev, name: newName }));
    };


    // Reload task URL mappings when editing to get latest permissions
    React.useEffect(() => {
        const loadTaskUrlMappings = async () => {
            if ((modalType === 'Task URLs' || modalType === 'Task URL Mapping') && formData.task && formData.id) {
                try {
                    const response = await api.get('task-urls');
                    const allMappings = response.results || response;
                    const relatedMappings = allMappings.filter(m => String(m.task) === String(formData.task));
                    setFormData(prev => ({
                        ...prev,
                        _bulk_items: relatedMappings
                    }));
                } catch (err) {
                    console.error('Failed to reload task URL mappings:', err);
                }
            }
        };
        loadTaskUrlMappings();
    }, [modalType, formData.id, formData.task]);





    // Global Hydration for Edit Mode
    React.useEffect(() => {
        // Hydrate Positions Filter (Job Structure & Office Context)
        if (modalType === 'Positions' && formData.id && !formData._pos_hydrated) {
            const safeStr = (val) => (val === null || val === undefined) ? '' : String(val);

            const officeId = safeStr(formData.office_id || formData.office || (typeof formData.office === 'object' ? formData.office?.id : ''));
            const targetOffice = (offices || []).find(o => String(o.id) === officeId);
            const levelId = safeStr(formData.office_level_id || formData.office_level || targetOffice?.level_id || (typeof targetOffice?.level === 'object' ? targetOffice?.level?.id : targetOffice?.level) || '');

            const deptId = safeStr(formData.department_id || formData.department || (typeof formData.department === 'object' ? formData.department?.id : ''));
            const targetDept = (departments || []).find(d => String(d.id) === deptId);

            const sectId = safeStr(formData.section_id || formData.section || (typeof formData.section === 'object' ? formData.section?.id : ''));
            const targetSect = (sections || []).find(s => String(s.id) === sectId);

            const roleId = safeStr(formData.role_id || formData.role || (typeof formData.role === 'object' ? formData.role?.id : ''));
            const targetRole = (roles || []).find(r => String(r.id) === roleId);
            const rtId = safeStr(formData.role_type_id || formData.role_type || targetRole?.role_type || (typeof targetRole?.role_type === 'object' ? targetRole?.role_type?.id : ''));
            const targetRoleType = (roleTypes || []).find(rt => String(rt.id) === rtId);
            const jfId = safeStr(formData.job_family_id || formData.job_family || targetRoleType?.job_family || (typeof targetRoleType?.job_family === 'object' ? targetRoleType?.job_family?.id : ''));

            const jobId = safeStr(formData.job_id || formData.job || (typeof formData.job === 'object' ? formData.job?.id : ''));
            const posLevelId = safeStr(formData.level_id || formData.level || (typeof formData.level === 'object' ? formData.level?.id : ''));
            const posTypeId = safeStr(formData.position_type_id || formData.position_type || (typeof formData.position_type === 'object' ? formData.position_type?.id : ''));

            // Auto-derive project and segment if missing
            let projId = safeStr(formData._pos_project || formData.project_id || formData.project);
            if (!projId) {
                projId = safeStr(
                    targetSect?.project_id || targetSect?.project ||
                    targetDept?.project_id || targetDept?.project ||
                    targetRole?.project_id || targetRole?.project ||
                    targetOffice?.project_id || (facilityMasters?.find(m => String(m.id) === String(targetOffice?.facility_master))?.project) ||
                    (projects?.length > 0 ? projects[0].id : '')
                );
            }
            let segId = safeStr(formData._pos_segment || formData.segment_id || formData.segment || targetRole?.segment);

            setFormData(prev => ({
                ...prev,
                _pos_hydrated: true,
                _pos_level_filter: levelId || prev._pos_level_filter || '',
                office: officeId || prev.office || '',
                _pos_office_filter: officeId || prev._pos_office_filter || '',
                department: deptId || prev.department || '',
                section: sectId || prev.section || '',
                _pos_job_family_filter: jfId || prev._pos_job_family_filter || '',
                _pos_role_type_filter: rtId || prev._pos_role_type_filter || '',
                role: roleId || prev.role || '',
                job: jobId || prev.job || '',
                level: posLevelId || prev.level || '',
                position_type: posTypeId || prev.position_type || '',
                _pos_project: projId || prev._pos_project || '',
                _pos_segment: segId || prev._pos_segment || ''
            }));
        }

        // Hydrate Departments - Auto-tag project from office if missing
        if (modalType === 'Departments' && formData.office && !formData.project && !formData._dept_hydrated && offices?.length > 0) {
            const off = offices.find(o => String(o.id) === String(formData.office));
            if (off) {
                const master = facilityMasters?.find(m => String(m.id) === String(off.facility_master));
                const projId = off.project_id || master?.project || off.project_ids?.[0];
                if (projId) {
                    setFormData(prev => ({ ...prev, project: projId, _dept_hydrated: true }));
                }
            }
        }

        // Hydrate Employees - Identity & Status
        if (modalType === 'Employees' && formData.id && !formData._emp_identity_hydrated) {
            const today = new Date().toISOString().split('T')[0];
            const p0 = (formData.positions_details && formData.positions_details.length > 0) ? formData.positions_details[0] : null;

            setFormData(prev => ({
                ...prev,
                _emp_identity_hydrated: true,
                pan_number: prev.pan_number || (prev.bank_details ? prev.bank_details.pan_number : ''),
                aadhaar_number: prev.aadhaar_number || (prev.bank_details ? prev.bank_details.aadhaar_number : ''),
                _inactivation_type: prev.status === 'Inactive' ? (prev.status_date === today ? 'Immediate' : 'Not Immediate') : '',
                // Also hydrate assignment filters based on first current position
                _emp_level_filter: prev._emp_level_filter || (p0 ? (p0.office_level_id || (p0.office_details?.level_id)) : ''),
                _emp_office_filter: prev._emp_office_filter || (p0 ? (p0.office_id || p0.office) : ''),
                _emp_dept_filter: prev._emp_dept_filter || (p0 ? (p0.department_id || p0.department) : ''),
                _emp_section_filter: prev._emp_section_filter || (p0 ? (p0.section_id || p0.section) : '')
            }));
        }

        // Hydrate Departments Filter
        if (modalType === 'Departments' && formData.id && formData.office && !formData._dept_hydrated) {
            const officeObj = (offices || []).find(o => o.id == formData.office);
            if (officeObj) {
                setFormData(prev => ({
                    ...prev,
                    _dept_hydrated: true,
                    _dept_office_level_filter: officeObj.level || ''
                }));
            }
        }

        // Hydrate Sections Filter
        if (modalType === 'Sections' && formData.id && formData.office && !formData._sec_hydrated) {
            const officeObj = (offices || []).find(o => o.id == formData.office);
            if (officeObj) {
                setFormData(prev => ({
                    ...prev,
                    _sec_hydrated: true,
                    _sec_office_level_filter: officeObj.level || ''
                }));
            }
        }

        // Hydrate Offices Filter (Parent Level)
        // Hydrate Offices Filter (Parent Level)
        if (modalType === 'Offices' && formData.id) {
            let updates = {};
            if (formData.parent && !formData._off_hydrated) {
                const parentOffice = (offices || []).find(o => o.id == formData.parent);
                if (parentOffice) {
                    updates._off_hydrated = true;
                    updates._parent_level_filter = parentOffice.level || '';
                }
            }

            // Hydrate Facility Fields if they exist in the record but not in form state (for Edit)
            if (formData.level) {
                const lvl = (orgLevels || []).find(l => l.id == formData.level);
                if (lvl && lvl.level_code === 'L9') {
                    // Check if we need to set facility defaults based on existing data
                    if (!formData.facility_type && (formData.camp_type || formData.mobile_type)) {
                        if (formData.mobile_type) updates.facility_type = 'MOBILE';
                        else if (formData.camp_type) updates.facility_type = 'CAMP';
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                setFormData(prev => ({ ...prev, ...updates }));
            }
        }

        // Hydrate Jobs Filter
        if (modalType === 'Jobs' && formData.id && formData.role && !formData._jobs_hydrated) {
            const roleObj = (roles || []).find(r => r.id == formData.role);
            if (roleObj) {
                const rtObj = (roleTypes || []).find(rt => rt.id == roleObj.role_type);
                setFormData(prev => ({
                    ...prev,
                    _jobs_hydrated: true,
                    role_type: roleObj.role_type || '',
                    job_family: rtObj ? rtObj.job_family : ''
                }));
            }
        }

        // Hydrate Tasks Filter
        if (modalType === 'Tasks' && formData.id && formData.job && !formData._tasks_hydrated) {
            const jobObj = (jobs || []).find(j => j.id == formData.job);
            if (jobObj) {
                const roleObj = (roles || []).find(r => r.id == jobObj.role);
                const rtObj = roleObj ? (roleTypes || []).find(rt => rt.id == roleObj.role_type) : null;
                setFormData(prev => ({
                    ...prev,
                    _tasks_hydrated: true,
                    role: jobObj.role || '',
                    role_type: roleObj ? roleObj.role_type : '',
                    job_family: rtObj ? rtObj.job_family : ''
                }));
            }
        }

        // Hydrate Geo Filters (Robust Chain Hydration)
        // Fixed: Allow hydration for new records (!formData.id) if context seed (mandal, panchayat etc) is present
        if (!formData._geo_hydrated && (formData.id || formData.mandal || formData.cluster || formData.district || formData.state || formData.country)) {
            let updates = {};
            let found = false;

            if (modalType === 'States' && (formData.country || formData.continent_id)) {
                if (formData.continent_id) { updates._territory_filter = formData.continent_id; found = true; }
                else {
                    const country = (geoCountries || []).find(c => c.id == formData.country);
                    if (country) { updates._territory_filter = country.continent_ref || ''; found = true; }
                }
            } else if (modalType === 'Districts' && (formData.state || formData.country_id)) {
                if (formData.country_id) {
                    updates._country_filter = formData.country_id || '';
                    updates._territory_filter = formData.continent_id || '';
                    found = true;
                } else {
                    const state = (geoStatesData || []).find(s => s.id == formData.state);
                    const country = state ? (geoCountries || []).find(c => c.id == state.country) : null;
                    if (state) { updates._country_filter = state.country || ''; updates._territory_filter = country ? country.continent_ref : ''; found = true; }
                }
            } else if (modalType === 'Mandals' && (formData.district || formData.state_id)) {
                if (formData.state_id) {
                    updates._state_filter = formData.state_id || '';
                    updates._country_filter = formData.country_id || '';
                    updates._territory_filter = formData.continent_id || '';
                    found = true;
                } else {
                    const district = (geoDistrictsData || []).find(d => d.id == formData.district);
                    const state = district ? (geoStatesData || []).find(s => s.id == district.state) : null;
                    const country = state ? (geoCountries || []).find(c => c.id == state.country) : null;
                    if (district) {
                        updates._state_filter = district.state || '';
                        updates._country_filter = state ? state.country : '';
                        updates._territory_filter = country ? country.continent_ref : '';
                        found = true;
                    }
                }
            } else if (modalType === 'Clusters' && (formData.mandal || formData.district_id)) {
                let updates = {};
                let fullyHydrated = false;

                if (formData.district_id) {
                    updates._district_filter = String(formData.district_id || '');
                    updates._state_filter = String(formData.state_id || '');
                    updates._country_filter = String(formData.country_id || '');
                    updates._territory_filter = String(formData.continent_id || '');
                    fullyHydrated = !!formData.continent_id;
                } else {
                    const mandal = (geoMandals || []).find(m => m.id == formData.mandal);
                    const district = mandal ? (geoDistrictsData || []).find(d => d.id == mandal.district) : null;
                    const state = district ? (geoStatesData || []).find(s => s.id == district.state) : null;
                    const country = state ? (geoCountries || []).find(c => c.id == state.country) : null;

                    if (mandal) {
                        updates._district_filter = String(mandal.district || '');
                        if (district) updates._state_filter = String(district.state || '');
                        if (state) updates._country_filter = String(state.country || '');
                        if (country) {
                            updates._territory_filter = String(country.continent_ref || '');
                            fullyHydrated = true;
                        }
                    }
                }

                if (Object.keys(updates).length > 0) {
                    setFormData(prev => ({ ...prev, ...updates, _geo_hydrated: (fullyHydrated || prev._geo_hydrated) }));
                }
            }

            if (found) {
                updates._geo_hydrated = true;
                setFormData(prev => ({ ...prev, ...updates }));
            }
        }

        // Hydrate Visiting Locations & Landmarks - Resolve Geo Chain for Filters
        if ((modalType === 'Visiting Locations' || modalType === 'Hotspots' || modalType === 'Landmarks') && formData.id && !formData._visiting_geo_hydrated) {
            const mandalId = formData.mandal_id || (formData.cluster_details?.mandal_id);
            const districtId = formData.district_id || (formData.cluster_details?.district_id);
            const stateId = formData.state_id || (formData.cluster_details?.state_id);
            const countryId = formData.country_id || (formData.cluster_details?.country_id);
            const continentId = formData.continent_id || (formData.cluster_details?.continent_id);

            let updates = {};
            let fullyHydrated = false;

            if (mandalId) updates._mandal_filter = String(mandalId);
            if (districtId) updates._district_filter = String(districtId);
            if (stateId) updates._state_filter = String(stateId);

            // Try to use direct IDs from record first
            if (countryId) updates._country_filter = String(countryId);
            if (continentId) {
                updates._territory_filter = String(continentId);
                fullyHydrated = true;
            }

            // Fallback for missing territory/country in older records format
            if (!fullyHydrated && stateId) {
                const stateObj = (geoStatesData || []).find(s => s.id == stateId);
                if (stateObj) {
                    updates._country_filter = String(stateObj.country || '');
                    const countryObj = (geoCountries || []).find(c => c.id == stateObj.country);
                    if (countryObj) {
                        updates._territory_filter = String(countryObj.continent_ref || '');
                        fullyHydrated = true;
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                setFormData(prev => ({
                    ...prev,
                    ...updates,
                    _visiting_geo_hydrated: (fullyHydrated || prev._visiting_geo_hydrated)
                }));
            }
        }

        // Hydrate Projects Geo Scope Filters
        if (modalType === 'Projects' && formData.id && formData.geo_scope_level && !formData._proj_geo_hydrated) {
            setFormData(prev => ({ ...prev, _proj_geo_hydrated: true }));
        }

        // Trigger Geo Chain Fetches for Edit Mode (Offices, Projects, etc.)
        if (formData.id && !formData._geo_chain_fetched) {
            const hasState = !!formData.state_name;
            const hasDistrict = !!formData.district_name;
            const hasMandal = !!formData.mandal_name;

            // Geo Chain Check removed due to reference errors and performance considerations


            setFormData(prev => ({ ...prev, _geo_chain_fetched: true }));
        }

        // Hydrate Employment History (Auto-populate Position/Dept from current employee data)
        if (modalType === 'Employment History' && !formData.id) {
            const empId = formData.employee || (selectedEmployee ? selectedEmployee.id : null);
            if (empId && !formData._emp_hist_hydrated) {
                const emp = (allEmployees || []).find(e => e.id == empId) || selectedEmployee;
                if (emp) {
                    const latestPos = (emp.positions_details || [])[0];
                    setFormData(prev => ({
                        ...prev,
                        _emp_hist_hydrated: true,
                        employee: empId,
                        position_name: prev.position_name || (latestPos ? latestPos.name : ''),
                        department_name: prev.department_name || (latestPos ? latestPos.department_name : ''),
                        reporting_to_name: prev.reporting_to_name || emp.reporting_to_name || '',
                        date_of_join: prev.date_of_join || emp.hire_date || emp.employment_start_date || '',
                        employee_type: prev.employee_type || emp.employment_type || 'Permanent',
                        status: prev.status || emp.status || 'Active'
                    }));
                }
            }
        }
    }, [modalType, formData.id, formData.office_level, formData.office_level_id, formData.office_id, formData.department_id, formData.section_id, formData.employee, formData._emp_hist_hydrated, formData.office, formData.parent, formData.role, formData.job, formData.country, formData.state, formData.district, formData.mandal, formData.cluster, selectedEmployee, allEmployees, offices, roles, roleTypes, jobs, geoContinents, geoCountries, geoStatesData, geoDistrictsData, geoMandals]);



    // Ensure we trigger the switch normally below

    // Helper for Employee Config Grid - Robust Filtering
    const getFilteredPositions = () => {
        if (!positions) return [];

        const levelFilterId = formData._emp_level_filter ? String(formData._emp_level_filter) : null;
        const sectionFilterId = formData._emp_section_filter ? String(formData._emp_section_filter) : null;
        const deptFilterId = formData._emp_dept_filter ? String(formData._emp_dept_filter) : null;
        const officeFilterId = formData._emp_office_filter ? String(formData._emp_office_filter) : null;
        const assignedPositionIds = (formData.positions || []).map(id => Number(id));

        const hasFilter = levelFilterId || sectionFilterId || deptFilterId || officeFilterId;

        // Start with filtered positions from global list
        const filtered = (positions || []).filter(p => {
            if (!p) return false;

            // Always include currently assigned positions (for edit mode)
            if (assignedPositionIds.includes(Number(p.id))) {
                return true;
            }

            // Guard: If no filter is active, exclude other positions to prevent main thread freezing
            if (!hasFilter) {
                return false;
            }

            // 1. Strict Section Filter
            if (sectionFilterId) {
                const sid = p.section_id || p.section;
                if (String(sid) !== String(sectionFilterId)) return false;
            }

            // 2. Strict Department Filter
            if (deptFilterId) {
                const did = p.department_id || p.department;
                if (String(did) !== String(deptFilterId)) return false;
            }

            // 3. Office Filter
            if (officeFilterId) {
                const pid = p.office_id || p.office;
                const did = p.department_id || p.department;

                const matchOffice = String(pid) === String(officeFilterId);
                const dept = (departments || []).find(d => d && String(d.id) === String(did));
                const matchViaDept = dept && String(dept.office || dept.office_id) === String(officeFilterId);

                if (!matchOffice && !matchViaDept) return false;
            }

            // 4. Level Filter
            if (levelFilterId) {
                const pid = p.office_id || p.office;
                const office = (offices || []).find(o => o && String(o.id) === String(pid));
                const oLevel = office ? (office.level_id || (office.level && (typeof office.level === 'object' ? office.level.id : office.level))) : (p.office_level_id || (p.office_details?.level_id));

                if (String(oLevel) !== String(levelFilterId)) return false;
            }

            return true;
        });

        // Add assigned positions from positions_details that aren't in the global positions list
        if (formData.positions_details && formData.positions_details.length > 0) {
            const filteredIds = filtered.map(p => Number(p.id));
            const assignedPositionIds = (formData.positions || []).map(id => Number(id));

            formData.positions_details.forEach(assignedPos => {
                // If this assigned position isn't in the filtered list and is in formData.positions
                if (!filteredIds.includes(Number(assignedPos.id)) && assignedPositionIds.includes(Number(assignedPos.id))) {
                    console.log(`✅ Adding assigned position not in global list: ${assignedPos.name} (ID: ${assignedPos.id})`);
                    filtered.push(assignedPos);
                }
            });
        }

        return filtered;
    };

    // Helper for Position Reporting - Include assigned reporting positions
    const getFilteredReportingPositions = () => {
        if (!positions) return [];

        const currentPosId = Number(formData.id);
        const assignedReportingIds = (formData.reporting_to || []).map(id => Number(id));

        const hasFilter = formData._rep_level_filter || formData._rep_office_filter || formData._rep_pos_level_filter || (hierarchySearchTerm && hierarchySearchTerm.trim());

        // Start with filtered positions
        let filtered = positions
            .filter(p => !currentPosId || Number(p.id) !== currentPosId) // Exclude self
            .filter(p => {
                if (assignedReportingIds.includes(Number(p.id))) {
                    return true;
                }
                if (!hasFilter) {
                    return false;
                }
                if (formData._rep_level_filter && Number(p.office_level_id) !== Number(formData._rep_level_filter)) return false;
                if (formData._rep_office_filter && Number(p.office_id) !== Number(formData._rep_office_filter)) return false;
                if (formData._rep_pos_level_filter && Number(p.level_id) !== Number(formData._rep_pos_level_filter)) return false;
                return true;
            });

        // Apply hierarchy search filter
        if (hasFilter && hierarchySearchTerm) {
            const query = hierarchySearchTerm.toLowerCase().trim();
            filtered = filtered.filter(p =>
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.code && p.code.toLowerCase().includes(query)) ||
                (p.office_name && p.office_name.toLowerCase().includes(query)) ||
                (p.role_name && p.role_name.toLowerCase().includes(query))
            );
        }

        // CRITICAL FIX: Ensure currently assigned reporting positions ALWAYS appear in the list,
        // even if they don't match the active Level/Office/Rank filters or the search query.
        if (assignedReportingIds.length > 0) {
            const filteredIds = new Set(filtered.map(p => Number(p.id)));

            assignedReportingIds.forEach(id => {
                if (!filteredIds.has(id)) {
                    // Find the position in the full list to get its details
                    const fullPosDoc = positions.find(p => Number(p.id) === id);
                    if (fullPosDoc) {
                        filtered.push(fullPosDoc);
                        filteredIds.add(id);
                    } else if (formData.reporting_to_details && Array.isArray(formData.reporting_to_details)) {
                        // FALLBACK: If the position is not in the global 'positions' list yet (due to pagination or cache delay),
                        // but it IS in the 'reporting_to_details' that came with the record, use that.
                        const detailPos = formData.reporting_to_details.find(p => Number(p.id) === id);
                        if (detailPos) {
                            filtered.push(detailPos);
                            filteredIds.add(id);
                        }
                    }
                }
            });
        }

        // Sort: Selected positions first, then by name
        filtered.sort((a, b) => {
            const aSelected = assignedReportingIds.includes(Number(a.id));
            const bSelected = assignedReportingIds.includes(Number(b.id));
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });

        // DEBUG: Final check for visibility
        if (assignedReportingIds.length > 0) {
            const visibleIds = filtered.map(p => Number(p.id));
            const missing = assignedReportingIds.filter(id => !visibleIds.includes(id));
            if (missing.length > 0) {
                console.warn("⚠️ [HierarchyVisibility] Assigned reporting IDs exist but none found in results!", {
                    missingCount: missing.length,
                    totalPositions: positions.length,
                    detailsAvailable: !!formData.reporting_to_details
                });
            }
        }

        return filtered;
    };

    // Consolidated Master Auto-Generation & Auto-Population
    React.useEffect(() => {
        if (!modalType) return;

        const updates = {};
        let shouldUpdate = false;

        // 1. Facility Master Auto-population
        if (modalType === 'Facility Master' || modalType === 'FacilityMaster') {
            if (selectedProj && formData.project) {
                const pType = selectedProj.project_type;

                // 1. Auto-set project type based on Project's own type
                if (pType && formData.project_type !== pType) {
                    updates.project_type = pType;
                    shouldUpdate = true;
                }

                // Build location name from geo hierarchy
                const locationParts = [
                    selectedProj.cluster_name,
                    selectedProj.mandal_name,
                    selectedProj.district_name,
                    selectedProj.state_name,
                    selectedProj.country_name,
                    selectedProj.continent_name
                ].filter(Boolean);

                if (locationParts.length > 0) {
                    const nextLoc = locationParts.join(', ');
                    if (formData.location_code !== nextLoc) {
                        updates.location_code = nextLoc;
                        shouldUpdate = true;
                    }
                }
            }
        }
        // 2. Job Families Code Generation
        else if ((modalType === 'Job Families' || modalType === 'JobFamilies') && !formData.id && !formData.code) {
            const nextCode = generateNextCode('JF', jobFamilies);
            updates.code = nextCode;
            shouldUpdate = true;
        }
        // 3. Role Types Code Generation
        else if ((modalType === 'Role Types' || modalType === 'RoleTypes') && !formData.id && !formData.code && formData.job_family) {
            const jf = (jobFamilies || []).find(f => f.id == formData.job_family);
            if (jf && jf.prefix) {
                const nextCode = generateNextCode(jf.prefix, roleTypes, 'job_family', formData.job_family);
                updates.code = nextCode;
                shouldUpdate = true;
            }
        }
        // 4. Roles Code Generation
        else if (modalType === 'Roles' && !formData.id && !formData.code && formData.role_type) {
            const rt = (roleTypes || []).find(t => t.id == formData.role_type);
            if (rt && rt.code) {
                const nextCode = generateNextCode(rt.code, roles, 'role_type', formData.role_type);
                updates.code = nextCode;
                shouldUpdate = true;
            }
        }
        // 5. Jobs Code Generation
        else if ((modalType === 'Jobs ' || modalType === 'Jobs') && !formData.id && !formData.code && formData.role) {
            const r = (roles || []).find(role => role.id == formData.role);
            if (r && r.code) {
                const nextCode = generateNextCode(r.code, jobs, 'role', formData.role);
                updates.code = nextCode;
                shouldUpdate = true;
            }
        }

        if (shouldUpdate) {
            setFormData(prev => ({ ...prev, ...updates }));
        }
    }, [modalType, formData.id, formData.project, selectedProj, formData.job_family, formData.role_type, formData.role, jobFamilies, roleTypes, roles, jobs]);

    switch (modalType) {
        case 'User Management':
            return (
                <div className="form-grid">
                    <div className="form-section-title"><User size={16} /> User Account Details</div>
                    <div className="form-group full-width">
                        <label className="premium-label"><Users size={14} /> Link to Employee Profile (Optional)</label>
                        <div className="premium-input-wrapper">
                            <SearchableSelect
                                endpoint="employees/all_data"
                                value={formData.employee_id || ''}
                                onChange={(e, emp) => {
                                    const empId = e.target.value;
                                    const resolvedEmp = emp || (allEmployees || []).find(ep => ep && ep.id == empId);
                                    setFormData({
                                        ...formData,
                                        employee_id: empId,
                                        first_name: resolvedEmp ? resolvedEmp.name.split(' ')[0] : formData.first_name,
                                        last_name: resolvedEmp ? (resolvedEmp.name.split(' ').slice(1).join(' ') || '') : formData.last_name,
                                        email: resolvedEmp ? resolvedEmp.email : formData.email
                                    });
                                }}
                                placeholder="Search for employee to auto-fill..."
                                icon={Users}
                            />
                        </div>
                    </div>
                    <div className="form-group full-width">
                        <label>Username</label>
                        <input type="text" className="form-input" value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                    </div>
                    <div className="form-group full-width">
                        <label>Password</label>
                        <input type="password" className="form-input" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!formData.id} placeholder={formData.id ? "Leave blank to keep unchanged" : ""} />
                    </div>
                    <div className="form-group full-width">
                        <label>Email Address</label>
                        <input type="email" className="form-input" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>

                    <div className="form-section-title"><UserSquare2 size={16} /> Personal Info</div>
                    <div className="form-group">
                        <label>First Name</label>
                        <input type="text" className="form-input" value={formData.first_name || ''} onChange={(e) => setFormData({ ...formData, first_name: validateAlpha(e.target.value) })} />
                    </div>
                    <div className="form-group">
                        <label>Last Name</label>
                        <input type="text" className="form-input" value={formData.last_name || ''} onChange={(e) => setFormData({ ...formData, last_name: validateAlpha(e.target.value) })} />
                    </div>

                    <div className="form-section-title"><ShieldCheck size={16} /> Permissions</div>
                    <div className="form-group full-width" style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.is_staff || false} onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })} />
                            Staff (Admin Access)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.is_superuser || false} onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })} />
                            Superuser (Full Control)
                        </label>
                    </div>
                </div>
            );

        case 'Levels':
            const selectedParent = (orgLevels || []).find(l => l && l.id == formData.parent);
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}>
                            <Layers size={18} /> Hierarchy Architecture
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Edit size={14} /> Level Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Level Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateAlphaNumeric(e.target.value, 50, 'level_name') })} required />
                                </div>
                                {validationErrors.level_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.level_name}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><FileDigit size={14} /> Level Code (Manual)</label>
                                <div className="premium-input-wrapper">
                                    <FileDigit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Level Code" value={formData.level_code || ''} onChange={(e) => setFormData({ ...formData, level_code: validateCode(e.target.value, 50, 'level_code') })} required />
                                </div>
                                {validationErrors.level_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.level_code}
                                    </div>
                                )}
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Building2 size={14} /> Structural Placement / Parent Level</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(orgLevels || []).map(level => {
                                            const depth = (level.rank.toString().split('.').length - 1);
                                            return {
                                                id: level.id,
                                                name: `${"\u00A0\u00A0".repeat(depth * 2)} Child of: ${level.level_code ? `${level.level_code} - ` : `Level ${parseFloat(level.rank)} - `}${level.name}`
                                            };
                                        })}
                                        value={formData.parent || ''}
                                        onChange={(e) => {
                                            const parentId = e.target.value;
                                            const parent = (orgLevels || []).find(l => l.id == parentId);
                                            let suggestedRank = formData.rank;

                                            if (parent) {
                                                const children = (orgLevels || []).filter(l => l.parent == parentId);
                                                if (children.length > 0) {
                                                    const maxChildRank = Math.max(...children.map(c => parseFloat(c.rank)));
                                                    suggestedRank = (maxChildRank + 0.01).toFixed(2);
                                                } else {
                                                    suggestedRank = (parseFloat(parent.rank) + 0.10).toFixed(2);
                                                }
                                            } else if (!parentId) {
                                                const primaries = (orgLevels || []).filter(l => !l.parent);
                                                const maxPrimaryRank = primaries.length > 0 ? Math.max(...primaries.map(p => parseFloat(p.rank))) : 0;
                                                suggestedRank = (Math.floor(maxPrimaryRank) + 1).toFixed(2);
                                            }

                                            setFormData({ ...formData, parent: parentId || null, rank: suggestedRank });
                                        }}
                                        placeholder="Select Parent (Optional for Top Level)..."
                                        icon={Building2}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><TrendingUp size={14} /> Level Number / Rank (Manual)</label>
                                <div className="premium-input-wrapper">
                                    <TrendingUp className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Rank (1.0, 2.1, etc.)" value={formData.rank || ''} onChange={(e) => setFormData({ ...formData, rank: validateRank(e.target.value, 'rank') || null })} required />
                                </div>
                                {validationErrors.rank && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.rank}
                                    </div>
                                )}
                                <span className="form-help-text">Used for vertical ordering. Lower is higher in hierarchy. Max Rank: 15.</span>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Calendar size={14} /> Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input type="date" className="premium-input" value={formData.start_date || ''} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required max="2099-12-31" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}>
                            <FileText size={18} /> Details
                        </div>
                        <div className="form-group full-width">
                            <label className="premium-label"><FileText size={14} /> Description & Guidelines</label>
                            <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                <textarea
                                    className="premium-input"
                                    style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }}
                                    rows="3"
                                    placeholder="Describe the operational scope..."
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Position Levels':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}>
                            <Layers size={18} /> Position Level Architecture
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Edit size={14} /> Level Name</label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Enter Level Name (e.g. Senior Manager)"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: validateAlphaNumeric(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><TrendingUp size={14} /> Rank / Seniority Index</label>
                                <div className="premium-input-wrapper">
                                    <TrendingUp className="premium-input-icon" size={18} />
                                    <input
                                        type="number"
                                        className="premium-input"
                                        placeholder="Enter Rank (1, 2, 3...)"
                                        value={formData.rank || ''}
                                        onChange={(e) => setFormData({ ...formData, rank: validateRank(e.target.value, 'pos_rank') })}
                                        required
                                    />
                                </div>
                                {validationErrors.pos_rank && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.pos_rank}
                                    </div>
                                )}
                                <span className="form-help-text">Numerical hierarchy. Lower numbers (like 1) typically indicate the highest seniority. Max Rank: 15.</span>
                            </div>
                        </div>
                    </div>

                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}>
                            <FileText size={18} /> Scope & Responsibilities
                        </div>
                        <div className="form-group full-width">
                            <label className="premium-label"><FileText size={14} /> Description</label>
                            <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                <textarea
                                    className="premium-input"
                                    style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }}
                                    rows="3"
                                    placeholder="Describe the typical scope and authority level for this rank..."
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Shifts':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Clock size={18} /> Shift Identity</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><FolderKanban size={14} /> Project <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={projects?.map(p => ({ id: String(p.id), name: p.name })) || []}
                                        value={formData.project || ''}
                                        onChange={(e) => {
                                            const projId = e.target.value;
                                            setFormData({ ...formData, project: projId, segment: '' });
                                        }}
                                        placeholder="Select Project..."
                                        icon={FolderKanban}
                                        required
                                    />
                                </div>
                            </div>

                            {(() => {
                                const selectedProj = projects?.find(p => String(p.id) === String(formData.project));
                                const hasSegments = selectedProj?.has_segments || (selectedProj?.segments && selectedProj.segments.length > 0);
                                if (!hasSegments) return null;
                                return (
                                    <div className="form-group full-width">
                                        <label className="premium-label"><Layers size={14} /> Segment <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={selectedProj?.segments?.map(s => ({ id: String(s.id), name: `${s.name} (${s.code})` })) || []}
                                                value={formData.segment || ''}
                                                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                                                placeholder="Select Segment..."
                                                icon={Layers}
                                                required
                                            />
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> Shift Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="e.g. Morning Shift" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Clock size={14} /> Start Time <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Clock className="premium-input-icon" size={18} />
                                    <input type="time" className="premium-input" value={formData.start_time || ''} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Clock size={14} /> End Time <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Clock className="premium-input-icon" size={18} />
                                    <input type="time" className="premium-input" value={formData.end_time || ''} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Description</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea className="premium-input" style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }} rows="2" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Position Types':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Settings size={18} /> Position Type Identity</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><FolderKanban size={14} /> Project <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={projects?.map(p => ({ id: String(p.id), name: p.name })) || []}
                                        value={formData.project || ''}
                                        onChange={(e) => {
                                            const projId = e.target.value;
                                            setFormData({ ...formData, project: projId, segment: '', shifts: [], role: '', job: '' });
                                        }}
                                        placeholder="Select Project..."
                                        icon={FolderKanban}
                                        required
                                    />
                                </div>
                            </div>

                            {(() => {
                                const selectedProj = projects?.find(p => String(p.id) === String(formData.project));
                                const hasSegments = selectedProj?.has_segments || (selectedProj?.segments && selectedProj.segments.length > 0);
                                if (!hasSegments) return null;
                                return (
                                    <div className="form-group full-width">
                                        <label className="premium-label"><Layers size={14} /> Segment <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={selectedProj?.segments?.map(s => ({ id: String(s.id), name: `${s.name} (${s.code})` })) || []}
                                                value={formData.segment || ''}
                                        onChange={(e) => setFormData({ ...formData, segment: e.target.value, shifts: [], role: '', job: '' })}
                                                placeholder="Select Segment..."
                                                icon={Layers}
                                                required
                                            />
                                        </div>
                                    </div>
                                );
                            })()}


                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> Position Type Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="e.g. Lead Engineer" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Description</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea className="premium-input" style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }} rows="2" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '1.5rem' }}><Clock size={18} /> Map Project Shifts</div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            {(() => {
                                if (!formData.project) {
                                    return <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontStyle: 'italic' }}>Please select a project first to see available shifts.</p>;
                                }
                                const selectedProj = projects?.find(p => String(p.id) === String(formData.project));
                                const hasSegments = selectedProj?.has_segments || (selectedProj?.segments && selectedProj.segments.length > 0);
                                const projectShifts = (shifts || []).filter(s => {
                                    const matchProj = String(s.project) === String(formData.project);
                                    const matchSeg = !hasSegments || String(s.segment) === String(formData.segment);
                                    return matchProj && matchSeg;
                                });

                                if (projectShifts.length === 0) {
                                    return <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: 0 }}>No shifts found for this project/segment selection. Create shifts in the Shift Master first.</p>;
                                }

                                return (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                                        {projectShifts.map((shiftItem) => {
                                            const currentShifts = formData.shifts || [];
                                            const isChecked = currentShifts.some(sid => String(sid) === String(shiftItem.id));
                                            return (
                                                <label
                                                    key={shiftItem.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        padding: '0.75rem 1rem',
                                                        background: isChecked ? '#eff6ff' : '#ffffff',
                                                        border: isChecked ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                                                        borderRadius: '12px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            let nextShifts = [...currentShifts];
                                                            if (e.target.checked) {
                                                                nextShifts.push(shiftItem.id);
                                                            } else {
                                                                nextShifts = nextShifts.filter(sid => String(sid) !== String(shiftItem.id));
                                                            }
                                                            setFormData({ ...formData, shifts: nextShifts });
                                                        }}
                                                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                                                    />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{shiftItem.name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{shiftItem.start_time} - {shiftItem.end_time}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            );

        case 'Office Types':
        case 'OfficeType':
        case 'Facility Types':
        case 'FacilityType':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Settings size={18} /> Facility Type Details</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="e.g. Warehouse, Branch Office"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Settings size={14} /> Code</label>
                                <div className="premium-input-wrapper">
                                    <Settings className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="e.g. WH, BO"
                                        value={formData.code || ''}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Layers size={14} /> Status</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'Active', name: 'Active' },
                                            { id: 'Inactive', name: 'Inactive' }
                                        ]}
                                        value={formData.status || 'Active'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        icon={Layers}
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Description</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea
                                        className="premium-input"
                                        style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }}
                                        rows="2"
                                        placeholder="Enter description..."
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Offices':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Primary Identity Section */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Building2 size={18} /> Structural Identity & Contact</div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Layers size={14} /> Structural Tier <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={orgLevels?.map(level => ({
                                            id: String(level.id),
                                            name: level.level_code ? `${level.level_code} - ${level.name}` : level.name
                                        })) || []}
                                        value={formData.level || ''}
                                        onChange={(e) => {
                                            const lvlId = e.target.value;
                                            setFormData({
                                                ...formData,
                                                level: lvlId,
                                                code: '', // Reset code to let useEffect re-generate
                                                cluster: '',
                                                location: ''
                                            });
                                        }}
                                        placeholder="Select Level..."
                                        icon={Layers}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Building size={14} /> Facility Type</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={officeTypes?.map(ot => ({ id: ot.name, name: ot.name })) || []}
                                        value={formData.office_type || ''}
                                        onChange={(e) => setFormData({ ...formData, office_type: e.target.value })}
                                        placeholder="Select Facility Type..."
                                        icon={Building}
                                    />
                                </div>
                            </div>

                            {/* Facility Configuration (Start of L9 specifics) */}
                            {currentLevel?.level_code === 'L9' && (
                                <>
                                    <div className="form-group full-width" style={{ marginBottom: '2rem', gridColumn: '1 / -1' }}>
                                        <label className="premium-label"><Map size={14} /> Facility Template Architecture <span style={{ color: 'var(--primary)' }}>*</span></label>
                                        <div className="premium-input-wrapper" style={{ border: '2px solid var(--primary)' }}>
                                            <SearchableSelect
                                                options={facilityMasters?.map(m => ({
                                                    id: String(m.id),
                                                    name: `${m.name} (${m.project_name})`
                                                })) || []}
                                                value={formData.facility_master || ''}
                                                onChange={(e) => {
                                                    const masterId = e.target.value;
                                                    const master = facilityMasters.find(m => String(m.id) === String(masterId));
                                                    setFormData({
                                                        ...formData,
                                                        facility_master: masterId,
                                                        name: formData.name || master?.name || '',
                                                        facility_type: master?.mode === 'MOBILE' ? 'MOBILE' : (master?.life === 'TEMPORARY' ? 'CAMP' : 'PERMANENT'),
                                                        code: master?.project_code || formData.code || '',
                                                        start_date: master?.project_start_date || formData.start_date || '',
                                                        end_date: master?.project_end_date || formData.end_date || ''
                                                    });
                                                }}
                                                placeholder="Select Template..."
                                                icon={FolderKanban}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {formData.facility_master ? (
                                        <div className="form-group full-width" style={{
                                            background: 'var(--primary-light)',
                                            padding: '1.5rem',
                                            borderRadius: '24px',
                                            border: '1px solid var(--primary)',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                            gap: '1.25rem',
                                            marginBottom: '2rem',
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                            gridColumn: '1 / -1'
                                        }}>
                                            {(() => {
                                                const master = facilityMasters.find(m => m.id == formData.facility_master);
                                                return master ? (
                                                    <>
                                                        <div style={{ gridColumn: '1/-1', borderBottom: '1px solid rgba(var(--primary-rgb), 0.2)', paddingBottom: '0.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)', fontWeight: 800 }}>
                                                            <LayoutGrid size={16} /> Technical Specification Overview
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Anchor Project</label>
                                                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>{master.project_name}</div>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Longevity</label>
                                                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{master.life_display}</div>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Service Mode</label>
                                                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{master.mode_display || master.mode}</div>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Geo Scope</label>
                                                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{master.project_type_display || 'Standard'}</div>
                                                        </div>
                                                        <div style={{ gridColumn: 'span 2' }}>
                                                            <label style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Jurisdiction Code(s)</label>
                                                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{master.location_code}</div>
                                                        </div>
                                                    </>
                                                ) : null;
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="form-group full-width" style={{ marginBottom: '2rem', gridColumn: '1 / -1' }}>
                                            <div style={{ padding: '1.25rem', background: '#fef3c7', border: '1px dashed #f59e0b', borderRadius: '16px', color: '#92400e', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600 }}>
                                                <GraduationCap size={20} /> Select a template to auto-populate facility technical parameters.
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-grid" style={{ gridColumn: '1 / -1', marginBottom: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="premium-label"><Calendar size={14} /> Operational Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                                            <div className="premium-input-wrapper">
                                                <Calendar className="premium-input-icon" size={18} />
                                                <input type="date" className="premium-input" value={formData.start_date || ''} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                                            </div>
                                        </div>

                                        {(formData.facility_type === 'CAMP' || formData.facility_type === 'MOBILE') && (
                                            <div className="form-group fade-in">
                                                <label className="premium-label"><Calendar size={14} /> Estimated Retirement Date</label>
                                                <div className="premium-input-wrapper">
                                                    <Calendar className="premium-input-icon" size={18} />
                                                    <input type="date" className="premium-input" value={formData.end_date || ''} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {selectedMaster?.mode === 'MOBILE' && (
                                        <div className="form-group full-width fade-in" style={{ gridColumn: '1 / -1' }}>
                                            <label className="premium-label"><MapPin size={14} /> Base Location </label>
                                            <div className="premium-input-wrapper">
                                                <MapPin className="premium-input-icon" size={18} />
                                                <input
                                                    type="text"
                                                    className="premium-input"
                                                    placeholder="Enter operational base point"
                                                    value={formData.location || ''}
                                                    onChange={(e) => setFormData({ ...formData, location: capitalize(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedMaster?.mode === 'FIXED' && (
                                        <div className="form-grid" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                                            {/* Geospatial Coordinates & Map */}
                                            <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                                                <label className="premium-label"><MapPin size={14} /> Facility Location Map</label>
                                                <div style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                                    <GeoMapPicker
                                                        latitude={formData.latitude}
                                                        longitude={formData.longitude}
                                                        onLocationSelect={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                                                        searchQuery={[
                                                            formData.location, // This would be village/ward name
                                                            formData.panchayat_ward, // This would be panchayat/municipality name
                                                            formData.mandal_name,
                                                            formData.district_name,
                                                            formData.state_name,
                                                            formData.country_name
                                                        ].filter(Boolean).join(', ')}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="premium-label"><Navigation2 size={14} /> Latitude Coordinate</label>
                                                <div className="premium-input-wrapper">
                                                    <Navigation2 className="premium-input-icon" size={18} />
                                                    <input
                                                        type="number"
                                                        step="0.000000001"
                                                        className="premium-input"
                                                        placeholder="e.g. 17.385044"
                                                        value={formData.latitude || ''}
                                                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="premium-label"><Navigation2 size={14} /> Longitude Coordinate</label>
                                                <div className="premium-input-wrapper">
                                                    <Navigation2 className="premium-input-icon" size={18} />
                                                    <input
                                                        type="number"
                                                        step="0.000000001"
                                                        className="premium-input"
                                                        placeholder="e.g. 78.486671"
                                                        value={formData.longitude || ''}
                                                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="form-group">

                                <label className="premium-label"><Network size={14} /> Unique Identification Code (Manual)</label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Unique Code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: validateCode(e.target.value, 50, 'office_code') })} required />
                                </div>
                                {validationErrors.office_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.office_code}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="premium-label">
                                    <Edit size={14} /> {
                                        currentLevel?.level_code === 'L2' ? 'Vertical Name' :
                                            currentLevel?.name?.toLowerCase().includes('facility') ? 'Facility Name' :
                                                'Office Name'
                                    } <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div className="premium-input-wrapper">
                                    <Building2 className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder={`Enter ${currentLevel?.level_code === 'L2' ? 'Vertical' : currentLevel?.name?.toLowerCase().includes('facility') ? 'Facility' : 'Office'} Name`}
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: validateAlphaNumeric(e.target.value, 50, 'office_name') })}
                                        required
                                    />
                                </div>
                                {validationErrors.office_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.office_name}
                                    </div>
                                )}
                            </div>

                            {currentLevel?.level_code !== 'L2' && (
                                <>
                                    <div className="form-group">
                                        <label className="premium-label"><Edit size={14} /> Registered Name {currentLevel?.level_code === 'L3' && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                        <div className="premium-input-wrapper">
                                            <FileText className="premium-input-icon" size={18} />
                                            <input type="text" className="premium-input" placeholder="Legal Registered Name" value={formData.registered_name || ''} onChange={(e) => setFormData({ ...formData, registered_name: validateAlphaNumeric(e.target.value, 50, 'registered_name') })} required={currentLevel?.level_code === 'L3'} />
                                        </div>
                                        {validationErrors.registered_name && (
                                            <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                                ⚠ {validationErrors.registered_name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="premium-label"><FileDigit size={14} /> Register ID {currentLevel?.level_code === 'L3' && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                        <div className="premium-input-wrapper">
                                            <FileDigit className="premium-input-icon" size={18} />
                                            <input type="text" className="premium-input" placeholder="Official Registration ID" value={formData.register_id || ''} onChange={(e) => setFormData({ ...formData, register_id: e.target.value })} required={currentLevel?.level_code === 'L3'} />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="premium-label"><Users size={14} /> DIN No / Directors {currentLevel?.level_code === 'L3' && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                        <div className="premium-input-wrapper">
                                            <Users className="premium-input-icon" size={18} />
                                            <input type="text" className="premium-input" placeholder={currentLevel?.level_code === 'L3' ? "Required for Head Office" : "Optional for this level"} value={formData.din_no || ''} onChange={(e) => setFormData({ ...formData, din_no: validateNumbers(e.target.value, 20, 'din_no') })} required={currentLevel?.level_code === 'L3'} />
                                        </div>
                                        {validationErrors.din_no && (
                                            <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                                ⚠ {validationErrors.din_no}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label className="premium-label"><Phone size={14} /> Contact Number</label>
                                <div className="premium-input-wrapper">
                                    <Phone className="premium-input-icon" size={18} />
                                    <input type="tel" className="premium-input" placeholder="10-digit primary contact" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: validatePhone(e.target.value, 'contact_number') })} />
                                </div>
                                {validationErrors.contact_number && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.contact_number}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Mail size={14} /> Official Email</label>
                                <div className="premium-input-wrapper">
                                    <Mail className="premium-input-icon" size={18} />
                                    <input type="email" className="premium-input" placeholder="corporate@organization.com" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: validateEmail(e.target.value, 100, 'office_email') })} />
                                </div>
                                {validationErrors.office_email && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.office_email}
                                    </div>
                                )}
                            </div>

                            {currentLevel?.level_code !== 'L2' && (
                                <>
                                    <div className="form-group">
                                        <label className="premium-label"><Network size={14} /> SAC Code</label>
                                        <div className="premium-input-wrapper">
                                            <Network className="premium-input-icon" size={18} />
                                            <input
                                                type="text"
                                                className="premium-input"
                                                placeholder="Enter SAC Code"
                                                value={formData.sac || ''}
                                                onChange={(e) => setFormData({ ...formData, sac: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="premium-label"><Car size={14} /> Vehicle Code</label>
                                        <div className="premium-input-wrapper">
                                            <Car className="premium-input-icon" size={18} />
                                            <input
                                                type="text"
                                                className="premium-input"
                                                placeholder="Enter Vehicle Code"
                                                value={formData.vehicle_code || ''}
                                                onChange={(e) => setFormData({ ...formData, vehicle_code: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="premium-label"><Car size={14} /> Vehicle Number</label>
                                        <div className="premium-input-wrapper">
                                            <Car className="premium-input-icon" size={18} />
                                            <input
                                                type="text"
                                                className="premium-input"
                                                placeholder="Enter Vehicle Number"
                                                value={formData.vehicle_no || ''}
                                                onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentLevel?.level_code !== 'L2' && currentLevel?.level_code !== 'L9' && (
                                <div className="form-group">
                                    <label className="premium-label"><Calendar size={14} /> Operational Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div className="premium-input-wrapper">
                                        <Calendar className="premium-input-icon" size={18} />
                                        <input
                                            type="date"
                                            className="premium-input"
                                            value={formData.start_date || ''}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            min={formData.parent ? (offices || []).find(o => String(o.id) === String(formData.parent))?.start_date : ''}
                                            required
                                            max="2099-12-31"
                                        />
                                    </div>
                                    {formData.parent && (offices || []).find(o => String(o.id) === String(formData.parent))?.start_date && (
                                        <span className="form-help-text" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                            Must be on or after parent office start date: {(offices || []).find(o => String(o.id) === String(formData.parent))?.start_date}
                                        </span>
                                    )}
                                </div>
                            )}

                            {currentLevel?.level_code !== 'L2' && (
                                <div className="form-group">
                                    <label className="premium-label"><ShieldCheck size={14} /> Office Operational Status</label>
                                    <div className="location-type-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                        <div
                                            className={`type-card ${(formData.status === 'Active' || !formData.status) ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, status: 'Active', status_date: null })}
                                        >
                                            <div style={{ fontWeight: 800 }}>ACTIVE</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Fully Operational</div>
                                        </div>
                                        <div
                                            className={`type-card ${formData.status === 'Inactive' ? 'active' : ''}`}
                                            style={{ borderColor: formData.status === 'Inactive' ? '#ef4444' : '', color: formData.status === 'Inactive' ? '#ef4444' : '' }}
                                            onClick={() => setFormData({ ...formData, status: 'Inactive' })}
                                        >
                                            <div style={{ fontWeight: 800 }}>INACTIVE</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Deactivated / Closed</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formData.status === 'Inactive' && (
                                <div className="form-group full-width fade-in">
                                    <label className="premium-label" style={{ color: '#ef4444' }}><Calendar size={14} /> Inactivation Effective Date</label>
                                    <div className="premium-input-wrapper" style={{ borderColor: '#ef4444' }}>
                                        <Calendar className="premium-input-icon" size={18} style={{ color: '#ef4444' }} />
                                        <input
                                            type="date"
                                            className="premium-input"
                                            value={formData.status_date || ''}
                                            onChange={(e) => setFormData({ ...formData, status_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem', display: 'block' }}>Specify the date from which this office is de-commissioned.</span>
                                </div>
                            )}
                        </div>
                    </div>



                    {/* Reporting & Alignment Section */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}>
                            <Navigation size={18} /> Reporting Structure {(!['L1', 'L2'].includes(currentLevel?.level_code)) && '& Geography'}
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Layers size={14} /> Structural Level Filter</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(orgLevels || [])
                                            .filter(lvl => parseFloat(lvl.rank) < parseFloat(currentLevel?.rank || 999))
                                            .filter(lvl => !lvl.name.toLowerCase().includes('facility'))
                                            .sort((a, b) => a.rank - b.rank)
                                            .map(lvl => ({ id: String(lvl.id), name: `${lvl.name} (${lvl.level_code})` }))}
                                        value={formData._parent_level_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _parent_level_filter: e.target.value, parent: null })}
                                        placeholder="Filter ancestors..."
                                        icon={Layers}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Building2 size={14} /> Parent Office (Reporting Line)</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: '', name: 'None (Top Level Organization)' },
                                            ...(offices || [])
                                                .filter(office => {
                                                    const officeLevel = orgLevels.find(l => l.id == office.level);
                                                    if (!officeLevel) return false;

                                                    // 1. Must be a reporting level (not a facility)
                                                    if (officeLevel.name.toLowerCase().includes('facility')) return false;

                                                    // 2. Must be an ancestor level (lower rank number means higher in hierarchy)
                                                    const currentLevel = orgLevels.find(l => l.id == formData.level);
                                                    if (currentLevel && parseFloat(officeLevel.rank) >= parseFloat(currentLevel.rank)) return false;

                                                    // 3. Apply the Parent Level Filter if selected
                                                    if (formData._parent_level_filter) return office.level == formData._parent_level_filter;

                                                    return true;
                                                })
                                                .map(o => ({ id: String(o.id), name: `${o.name} (${o.level_display || o.level_name})` }))
                                        ]}
                                        value={formData.parent || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const parentId = val ? parseInt(val) : null;
                                            const parentOffice = offices.find(o => o.id === parentId);

                                            if (parentOffice) {
                                                setFormData({
                                                    ...formData,
                                                    parent: parentId,
                                                    code: '', // Reset to trigger auto-generation with parent context
                                                    country_name: parentOffice.country_name || 'INDIA',
                                                    state_name: parentOffice.state_name || '',
                                                    district_name: parentOffice.district_name || '',
                                                    mandal_name: parentOffice.mandal_name || '',
                                                });
                                            } else {
                                                setFormData({ ...formData, parent: null, code: '' });
                                            }
                                        }}
                                        placeholder="Select Parent..."
                                        icon={Building2}
                                    />
                                </div>
                            </div>

                            {(!['L1', 'L2'].includes(currentLevel?.level_code)) && (
                                <>
                                    <div className="form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                            <label className="premium-label" style={{ margin: 0 }}><Globe size={14} /> Country Scope</label>
                                            <button type="button" className="sidebar-sub-link" style={{ padding: '2px 8px', background: 'var(--primary-light)', minWidth: 'auto', gap: '4px', fontSize: '0.7rem' }} onClick={() => handleAdd('Countries')}><Plus size={10} /> Add</button>
                                        </div>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={[{ id: 'INDIA', name: 'INDIA' }, ...(geoCountries?.filter(c => c.name && c.name.toUpperCase() !== 'INDIA').map(c => ({ id: c.name, name: c.name })) || [])]}
                                                value={formData.country_name || 'INDIA'}
                                                onChange={(e) => setFormData({ ...formData, country_name: e.target.value, state_name: '', district_name: '', mandal_name: '', location: '' })}
                                                placeholder="Select Country..."
                                                icon={Globe}
                                                disabled={isFieldLocked('country_name')}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                            <label className="premium-label" style={{ margin: 0 }}><Navigation size={14} /> State Scope</label>
                                            <button type="button" className="sidebar-sub-link" style={{ padding: '2px 8px', background: 'var(--primary-light)', minWidth: 'auto', gap: '4px', fontSize: '0.7rem' }} onClick={() => {
                                                const selectedCountry = geoCountries.find(c => c.name.toUpperCase() === (formData.country_name || 'INDIA').toUpperCase());
                                                handleAdd('States', { country_context: selectedCountry?.id });
                                            }}><Plus size={10} /> Add</button>
                                        </div>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={(() => {
                                                    const selectedCountryName = formData.country_name || 'INDIA';
                                                    const selectedCountryId = (geoCountries || []).find(c => c && c.name.toLowerCase() === selectedCountryName.toLowerCase())?.id;
                                                    return (geoStatesData || []).filter(s => s && s.country == selectedCountryId).map(s => ({ id: s.name, name: s.name }));
                                                })()}
                                                value={formData.state_name || ''}
                                                onChange={(e) => setFormData({ ...formData, state_name: e.target.value, district_name: '', mandal_name: '', location: '' })}
                                                placeholder="Select State..."
                                                icon={Navigation}
                                                required={!['L1', 'L2'].includes(currentLevel?.level_code)}
                                                disabled={isFieldLocked('state_name')}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                            <label className="premium-label" style={{ margin: 0 }}><MapPin size={14} /> District Hierarchy</label>
                                            <button type="button" className="sidebar-sub-link" style={{ padding: '2px 8px', background: 'var(--primary-light)', minWidth: 'auto', gap: '4px', fontSize: '0.7rem' }} onClick={() => {
                                                const stateObj = geoStatesData.find(s => s.name === formData.state_name);
                                                handleAdd('Districts', { state: stateObj?.id, state_name: formData.state_name });
                                            }}><Plus size={10} /> Add</button>
                                        </div>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={(() => {
                                                    const selectedStateName = formData.state_name;
                                                    const selectedStateId = (geoStatesData || []).find(s => s && s.name.toLowerCase() === (selectedStateName || '').toLowerCase())?.id;
                                                    return (geoDistrictsData || []).filter(d => d && d.state == selectedStateId).map(d => ({ id: d.name, name: d.name }));
                                                })()}
                                                value={formData.district_name || ''}
                                                onChange={(e) => {
                                                    securedUpdate('district_name', e.target.value, ['state_name']);
                                                    setFormData(prev => ({ ...prev, mandal_name: '', location: '' }));
                                                }}
                                                placeholder="Select District..."
                                                icon={MapPin}
                                                required={!['L1', 'L2'].includes(currentLevel?.level_code)}
                                                disabled={!formData.state_name || isFieldLocked('district_name')}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                            <label className="premium-label" style={{ margin: 0 }}><Map size={14} /> Mandal / Administrative Hub</label>
                                            <button type="button" className="sidebar-sub-link" style={{ padding: '2px 8px', background: 'var(--primary-light)', minWidth: 'auto', gap: '4px', fontSize: '0.7rem' }} onClick={() => handleAdd('Mandals', { temp_state: formData.state_name, district: formData.district_name })}><Plus size={10} /> Add</button>
                                        </div>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={(() => {
                                                    const selectedDistrictName = formData.district_name;
                                                    const stateObj = (geoStatesData || []).find(s => s && s.name.toLowerCase() === (formData.state_name || '').toLowerCase());
                                                    const selectedDistrictId = (geoDistrictsData || []).find(d => d && d.name.toLowerCase() === (selectedDistrictName || '').toLowerCase() && d.state == stateObj?.id)?.id;
                                                    return (geoMandals || []).filter(m => m && m.district == selectedDistrictId).map(m => ({ id: m.name, name: m.name }));
                                                })()}
                                                value={formData.mandal_name || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    securedUpdate('mandal_name', val, ['district_name']);
                                                    setFormData(prev => ({ ...prev, cluster: '', location: '' }));
                                                    if (val && formData.district_name) checkGeoMandal(val, formData.district_name, formData.state_name);
                                                }}
                                                placeholder="Select Mandal..."
                                                icon={Navigation}
                                                required={!['L1', 'L2'].includes(currentLevel?.level_code)}
                                                disabled={!formData.district_name || isFieldLocked('mandal_name')}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Cluster Selection Section */}
                    {formData.mandal_name && (!['L1', 'L2'].includes(currentLevel?.level_code)) && (
                        <div className="premium-form-section">
                            <div className="form-section-title" style={{ marginBottom: '2rem' }}><Layers size={18} /> Administrative Cluster</div>

                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                        <label className="premium-label" style={{ margin: 0 }}><Layers size={14} /> Cluster / Settlement</label>
                                        <button type="button" className="sidebar-sub-link" style={{ padding: '2px 8px', background: 'var(--primary-light)', minWidth: 'auto', gap: '4px', fontSize: '0.7rem' }} onClick={() => handleAdd('Clusters', { mandal: (geoMandals || []).find(m => m.name === formData.mandal_name)?.id })}><Plus size={10} /> Add</button>
                                    </div>
                                    <div className="premium-input-wrapper">
                                        <SearchableSelect
                                            options={(() => {
                                                const mandalId = (geoMandals || []).find(m => m.name === formData.mandal_name)?.id;
                                                return (geoClusters || []).filter(c => c.mandal == mandalId).map(c => ({ id: c.id, name: `${c.name} (${c.cluster_type_display})` }));
                                            })()}
                                            value={formData.cluster || ''}
                                            onChange={(e) => {
                                                const clusterId = e.target.value;
                                                const clusterObj = (geoClusters || []).find(c => String(c.id) === String(clusterId));
                                                setFormData({
                                                    ...formData,
                                                    cluster: clusterId,
                                                    location: currentLevel?.level_code === 'L9' ? (clusterObj?.name || formData.location || '') : formData.location
                                                });
                                            }}
                                            placeholder="Select Administrative Cluster..."
                                            icon={Layers}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Geospatial Data Section for all offices */}
                    {(!['L9'].includes(currentLevel?.level_code)) && (
                        <div className="premium-form-section">
                            <div className="form-section-title" style={{ marginBottom: '2rem' }}><Navigation size={18} /> Geospatial Coordinates</div>
                            <div className="form-grid">
                                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                                    <label className="premium-label"><MapPin size={14} /> Office Geo-Location Map</label>
                                    <div style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                        <GeoMapPicker
                                            latitude={formData.latitude}
                                            longitude={formData.longitude}
                                            onLocationSelect={(lat, lng) => setFormData({
                                                ...formData,
                                                latitude: parseFloat(lat.toFixed(4)),
                                                longitude: parseFloat(lng.toFixed(4))
                                            })}
                                            searchQuery={[
                                                formData.location,
                                                formData.mandal_name,
                                                formData.district_name,
                                                formData.state_name,
                                                formData.country_name
                                            ].filter(Boolean).join(', ')}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="premium-label"><Navigation2 size={14} /> Latitude</label>
                                    <div className="premium-input-wrapper">
                                        <Navigation2 className="premium-input-icon" size={18} />
                                        <input
                                            type="number"
                                            step="0.000000001"
                                            className="premium-input"
                                            placeholder="e.g. 17.3850"
                                            value={formData.latitude || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, latitude: val ? parseFloat(parseFloat(val).toFixed(4)) : null });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="premium-label"><Navigation2 size={14} /> Longitude</label>
                                    <div className="premium-input-wrapper">
                                        <Navigation2 className="premium-input-icon" size={18} />
                                        <input
                                            type="number"
                                            step="0.000000001"
                                            className="premium-input"
                                            placeholder="e.g. 78.4867"
                                            value={formData.longitude || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, longitude: val ? parseFloat(parseFloat(val).toFixed(4)) : null });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Final Physical Address Section */}
                    {(!['L1', 'L2'].includes(currentLevel?.level_code)) && (
                        <div className="premium-form-section">
                            <div className="form-section-title" style={{ marginBottom: '2rem' }}><FileText size={18} /> Physical Establishment Address</div>
                            <div className="form-group full-width">
                                <label className="premium-label"><MapPin size={14} /> Full Mailing & Postal Address</label>
                                <div className="premium-input-wrapper">
                                    <MapPin className="premium-input-icon" size={18} style={{ top: '1.5rem', transform: 'none' }} />
                                    <textarea
                                        className="premium-input"
                                        rows="3"
                                        placeholder="House No, Street Name, Floor, Landmark, and PIN Code..."
                                        value={formData.address || ''}
                                        onChange={(e) => setFormData({ ...formData, address: validateAddress(e.target.value, 500, 'office_address') })}
                                        style={{ paddingLeft: '3rem', paddingTop: '1rem' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );

        case 'Departments':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Briefcase size={18} /> Departmental Context</div>

                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Building2 size={14} /> Parent Office / Location</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '1rem' }}>
                                    <div className="premium-input-wrapper">
                                        <Layers className="premium-input-icon" size={18} />
                                        <select className="premium-input" style={{ borderColor: 'var(--primary-light)' }} value={formData._dept_office_level_filter || ''} onChange={(e) => setFormData({ ...formData, _dept_office_level_filter: e.target.value, office: '', project: '' })}>
                                            <option value="">Filter by Level (Optional)</option>
                                            {orgLevels?.length > 0 ? orgLevels.map(lvl => (<option key={lvl.id} value={lvl.id}>{lvl.name}</option>)) : <option disabled>No data found</option>}
                                        </select>
                                    </div>
                                    <div className="premium-input-wrapper">
                                        <SearchableSelect
                                            options={(() => {
                                                const filteredOffices = (offices || []).filter(o => {
                                                    if (!formData._dept_office_level_filter) return true;
                                                    const officeLevelId = o.level_id || (typeof o.level === 'object' ? o.level?.id : o.level);
                                                    return String(officeLevelId) === String(formData._dept_office_level_filter);
                                                });
                                                return filteredOffices.map(o => ({ id: o.id, name: o.name }));
                                            })()}
                                            value={formData.office || ''}
                                            onChange={(e) => {
                                                const offId = e.target.value;
                                                const off = offices.find(o => String(o.id) === String(offId));
                                                const master = facilityMasters?.find(m => String(m.id) === String(off?.facility_master));
                                                setFormData({
                                                    ...formData,
                                                    office: offId,
                                                    project: off?.project_id || master?.project || (off?.project_ids?.[0]) || formData.project || ''
                                                });
                                            }}
                                            placeholder="Select Establishment..."
                                            icon={Building2}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><FolderKanban size={14} /> Link to Project (Optional)</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: '', name: 'None / Corporate (General Organization)' },
                                            ...projects.filter(p => {
                                                if (!formData.office) return true;
                                                const off = offices.find(o => String(o.id) === String(formData.office));
                                                const master = facilityMasters?.find(m => String(m.id) === String(off?.facility_master));
                                                if (master?.project && String(p.id) === String(master.project)) return true;
                                                if (off?.project_id && String(p.id) === String(off.project_id)) return true;
                                                // Check for Many-to-Many project assignments
                                                if (off?.project_ids && off.project_ids.some(pid => String(pid) === String(p.id))) return true;
                                                return false;
                                            }).map(p => ({ id: p.id, name: p.name }))
                                        ]}
                                        value={formData.project || ''}
                                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                        placeholder="Select Project Scope..."
                                        icon={FolderKanban}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Edit size={18} /> Department Details</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Network size={14} /> Department Code (Manual)</label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Department Code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: validateCode(e.target.value, 50, 'dept_code') })} required />
                                </div>
                                {validationErrors.dept_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.dept_code}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Edit size={14} /> Department Name</label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value, 50, 'dept_name') })} required />
                                </div>
                                {validationErrors.dept_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.dept_name}
                                    </div>
                                )}
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Calendar size={14} /> Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input
                                        type="date"
                                        className="premium-input"
                                        value={formData.start_date || ''}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        min={formData.office ? (offices || []).find(o => String(o.id) === String(formData.office))?.start_date : ''}
                                        required
                                        max="2099-12-31"
                                    />
                                </div>
                                {formData.office && (offices || []).find(o => String(o.id) === String(formData.office))?.start_date && (
                                    <span className="form-help-text" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                        Must be on or after parent office start date: {(offices || []).find(o => String(o.id) === String(formData.office))?.start_date}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><ShieldCheck size={18} /> Operational Status</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><ShieldCheck size={14} /> Department Status</label>
                                <div className="location-type-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                    <div
                                        className={`type-card ${(formData.status === 'Active' || !formData.status) ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, status: 'Active' })}
                                    >
                                        <div style={{ fontWeight: 800 }}>ACTIVE</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Fully Operational</div>
                                    </div>
                                    <div
                                        className={`type-card ${formData.status === 'Inactive' ? 'active' : ''}`}
                                        style={{ borderColor: formData.status === 'Inactive' ? '#ef4444' : '', color: formData.status === 'Inactive' ? '#ef4444' : '' }}
                                        onClick={() => setFormData({ ...formData, status: 'Inactive' })}
                                    >
                                        <div style={{ fontWeight: 800 }}>INACTIVE</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Deactivated / Closed</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Sections':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><LayoutGrid size={18} /> Section Context</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Building2 size={14} /> Parent Office / Location</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '1rem' }}>
                                    <div className="premium-input-wrapper">
                                        <SearchableSelect
                                            options={(orgLevels || []).map(lvl => ({ id: lvl.id, name: lvl.name }))}
                                            value={formData._sec_office_level_filter || ''}
                                            onChange={(e) => setFormData({ ...formData, _sec_office_level_filter: e.target.value, office: '', department: '' })}
                                            placeholder="Level Filter..."
                                            icon={Layers}
                                        />
                                    </div>
                                    <div className="premium-input-wrapper">
                                        <SearchableSelect
                                            options={(() => {
                                                const filteredOffices = (offices || []).filter(o => {
                                                    if (!formData._sec_office_level_filter) return true;
                                                    const officeLevelId = o.level_id || (typeof o.level === 'object' ? o.level?.id : o.level);
                                                    return String(officeLevelId) === String(formData._sec_office_level_filter);
                                                });
                                                return filteredOffices.map(o => ({ id: o.id, name: o.name }));
                                            })()}
                                            value={formData.office || ''}
                                            onChange={(e) => setFormData({ ...formData, office: e.target.value, department: '' })}
                                            placeholder="Select Establishment..."
                                            icon={Building2}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><Briefcase size={14} /> Parent Department</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={departments.filter(d => d.office == formData.office).map(d => ({ id: d.id, name: d.name }))}
                                        value={formData.department || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const dept = departments.find(d => d.id == val);
                                            securedUpdate('department', val, ['office']);
                                            if (formData.office) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    project: dept?.project || null
                                                }));
                                            }
                                        }}
                                        placeholder="Select Department..."
                                        icon={Briefcase}
                                        required
                                        disabled={!formData.office}
                                    />
                                </div>
                                <span className="form-help-text">Section will inherit Project association from the selected Department.</span>
                            </div>
                        </div>
                    </div>

                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Edit size={18} /> Section Details</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Network size={14} /> Section Code (Manual)</label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Enter Section Code"
                                        value={formData.code || ''}
                                        onChange={(e) => setFormData({ ...formData, code: validateCode(e.target.value, 50, 'sec_code') })}
                                        maxLength={50}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <div>
                                        {validationErrors.sec_code && (
                                            <div style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <X size={12} /> {validationErrors.sec_code}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: (formData.code?.length || 0) >= 45 ? 'var(--primary)' : '#94a3b8', fontWeight: 600 }}>
                                        {formData.code?.length || 0} / 50
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Edit size={14} /> Section Name</label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Enter Section Name"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value, 50, 'sec_name') })}
                                        maxLength={50}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <div>
                                        {validationErrors.sec_name && (
                                            <div style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <X size={12} /> {validationErrors.sec_name}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: (formData.name?.length || 0) >= 45 ? 'var(--primary)' : '#94a3b8', fontWeight: 600 }}>
                                        {formData.name?.length || 0} / 50
                                    </div>
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Calendar size={14} /> Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input
                                        type="date"
                                        className="premium-input"
                                        value={formData.start_date || ''}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        min={formData.department ? (departments || []).find(d => String(d.id) === String(formData.department))?.start_date : ''}
                                        required
                                        max="2099-12-31"
                                    />
                                </div>
                                {formData.department && (departments || []).find(d => String(d.id) === String(formData.department))?.start_date && (
                                    <span className="form-help-text" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                        Must be on or after parent department start date: {(departments || []).find(d => String(d.id) === String(formData.department))?.start_date}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Facility Master':
        case 'FacilityMaster':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Map size={18} /> Facility Master Configuration</div>

                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><FolderKanban size={14} /> Project Attachment <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={projects?.map(p => ({ id: p.id, name: p.name })) || []}
                                        value={formData.project || ''}
                                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                        placeholder="Select parent project..."
                                        icon={FolderKanban}
                                        required
                                    />
                                </div>
                            </div>

                            {selectedProj && (
                                <div className="form-group full-width" style={{
                                    background: 'var(--primary-light)',
                                    padding: '1.25rem',
                                    borderRadius: '16px',
                                    border: '1px solid var(--primary)',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '1rem',
                                    marginBottom: '1rem',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ gridColumn: '1/-1', borderBottom: '1px solid var(--primary)', paddingBottom: '0.6rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)', fontWeight: 800 }}>
                                        <Sparkles size={14} /> Integrated Project Data
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Project Code</label>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>{selectedProj.code}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Registry Status</label>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>{selectedProj.status}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Geo Scope</label>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb' }}>{selectedProj.geo_scope_level || 'Not Set'}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Location</label>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                                            {[
                                                selectedProj.cluster_name,
                                                selectedProj.mandal_name,
                                                selectedProj.district_name,
                                                selectedProj.state_name,
                                                selectedProj.country_name
                                            ].filter(Boolean).join(', ') || 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{ gridColumn: '1/-1' }}>
                                        <label style={{ fontSize: '0.65rem', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Project Description</label>
                                        <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginTop: '2px' }}>{selectedProj.description || 'No description available for this project.'}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Start Date</label>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{selectedProj.start_date}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>End Date</label>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{selectedProj.end_date || 'N/A'}</div>
                                    </div>
                                </div>
                            )}

                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> Facility (Master) Name <span style={{ color: 'var(--primary)' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="e.g. Regional Health Center A"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: validateAlphaNumeric(e.target.value, 50, 'facility_name') })}
                                        required
                                    />
                                </div>
                                {validationErrors.facility_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.facility_name}
                                    </div>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><LayoutGrid size={14} /> Structural Project Type <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'SINGLE', name: 'Single Location' },
                                            { id: 'MULTIPLE', name: 'Multiple Location' }
                                        ]}
                                        value={formData.project_type || 'SINGLE'}
                                        onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                                        placeholder="Select Type..."
                                        icon={LayoutGrid}
                                        disabled={!!selectedProj?.project_type}
                                        required
                                    />
                                </div>
                                {selectedProj?.project_type && (
                                    <span className="form-help-text" style={{ color: '#2563eb', fontWeight: 600 }}>
                                        <ShieldCheck size={12} /> Fixed based on Project Type: {selectedProj.project_type === 'SINGLE' ? 'Single Location' : 'Multiple Location'}
                                    </span>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><MapPin size={14} /> Location Name(s) <span style={{ color: 'var(--primary)' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <MapPin className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Location name will be auto-populated from project geo scope"
                                        value={formData.location_code || ''}
                                        onChange={(e) => setFormData({ ...formData, location_code: e.target.value })}
                                        required
                                    />
                                </div>
                                <span className="form-help-text">Location name from project's geographic scope. You can modify if needed.</span>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Clock size={14} /> Lifecycle Status</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'PERMANENT', name: 'Permanent' },
                                            { id: 'TEMPORARY', name: 'Temporary' }
                                        ]}
                                        value={formData.life || 'PERMANENT'}
                                        onChange={(e) => setFormData({ ...formData, life: e.target.value })}
                                        icon={Clock}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Navigation size={14} /> Service Mode</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'FIXED', name: 'Fixed / Static' },
                                            { id: 'MOBILE', name: 'Mobile / Outbound' }
                                        ]}
                                        value={formData.mode || 'FIXED'}
                                        onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                                        icon={Navigation}
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Strategic Description</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea
                                        className="premium-input"
                                        style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }}
                                        rows="2"
                                        placeholder="Operational description and purpose..."
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: capitalize(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Users size={18} /> Position Type Mapping & Resource Tagging</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><ShieldCheck size={14} /> Tagged Position Types for this Template</label>
                                <div style={{
                                    maxHeight: '250px',
                                    overflowY: 'auto',
                                    border: `2px solid ${!formData.project ? '#e2e8f0' : 'var(--primary-light)'}`,
                                    borderRadius: '16px',
                                    padding: '1rem',
                                    background: '#f8fafc',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '0.75rem',
                                    position: 'relative'
                                }}>
                                    {/* No project selected */}
                                    {!formData.project && (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                                            <ShieldCheck size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3, display: 'block' }} />
                                            Select a Project above to see available Position Types
                                        </div>
                                    )}
                                    {/* Loading */}
                                    {formData.project && facilityPTLoading && (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>
                                            <div style={{ width: '24px', height: '24px', border: '3px solid var(--primary-light)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem' }} />
                                            Loading position types for this project...
                                        </div>
                                    )}
                                    {/* No position types found for this project */}
                                    {formData.project && !facilityPTLoading && facilityPositionTypes.length === 0 && (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#f59e0b', fontSize: '0.875rem' }}>
                                            <ShieldAlert size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
                                            No Position Types found for this Project.<br />
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Go to <b>Position Type Mapping</b> and create types under this project first.</span>
                                        </div>
                                    )}
                                    {/* Position type checkboxes */}
                                    {!facilityPTLoading && facilityPositionTypes.map(pt => (
                                        <label key={pt.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            padding: '10px 12px',
                                            background: (formData.position_types || []).includes(pt.id) ? 'var(--primary-light)' : 'white',
                                            border: `1px solid ${(formData.position_types || []).includes(pt.id) ? 'var(--primary)' : '#f1f5f9'}`,
                                            borderRadius: '10px',
                                            transition: 'all 0.15s ease',
                                            boxShadow: (formData.position_types || []).includes(pt.id) ? '0 0 0 2px var(--primary-light)' : 'none'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={(formData.position_types || []).includes(pt.id)}
                                                onChange={(e) => {
                                                    const currentPTs = formData.position_types || [];
                                                    const newPTs = e.target.checked
                                                        ? [...currentPTs, pt.id]
                                                        : currentPTs.filter(id => id !== pt.id);
                                                    setFormData({ ...formData, position_types: newPTs });
                                                }}
                                                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                            />
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>{pt.name}</div>
                                                {pt.role_name && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Role: {pt.role_name}</div>}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <span className="form-help-text">Select the position types required for this Facility Template. Options are filtered by the selected Project.</span>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Job Families':
        case 'JobFamilies':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><BarChart3 size={18} /> Job Family Identity</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Network size={14} /> Family Code (Manual) <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Family Code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: validateCode(e.target.value, 50, 'fam_code') })} required />
                                </div>
                                {validationErrors.fam_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.fam_code}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Edit size={14} /> Job Family Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Enter Job Family Name"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value, 50, 'jf_name') })}
                                        required
                                    />
                                </div>
                                {validationErrors.jf_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.jf_name}
                                    </div>
                                )}
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Calendar size={14} /> Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input type="date" className="premium-input" value={formData.start_date || ''} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><ShieldCheck size={14} /> Account Status</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: true, name: 'Active' },
                                            { id: false, name: 'Inactive' }
                                        ]}
                                        value={formData.is_active !== undefined ? formData.is_active : true}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' || e.target.value === true })}
                                        placeholder="Select Status..."
                                        icon={ShieldCheck}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Description</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea className="premium-input" style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }} rows="3" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: capitalize(e.target.value) })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Role Types':
        case 'RoleTypes':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Settings size={18} /> Role Type Identity</div>

                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><BarChart3 size={14} /> Structural Job Family <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={jobFamilies?.map(jf => ({ id: jf.id, name: jf.name })) || []}
                                        value={formData.job_family || ''}
                                        onChange={(e) => {
                                            const jfId = e.target.value;
                                            const nextCode = generateNextCode('RT', roleTypes, 'job_family', jfId);
                                            setFormData({ ...formData, job_family: jfId, code: nextCode });
                                        }}
                                        placeholder="Select Parent Job Family..."
                                        icon={BarChart3}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Network size={14} /> Role Type Code (Manual) <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Role Type Code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: validateCode(e.target.value, 50, 'rt_code') })} required />
                                </div>
                                {validationErrors.rt_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.rt_code}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Edit size={14} /> Role Type Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Role Type Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value, 50, 'rt_name') })} required />
                                </div>
                                {validationErrors.rt_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.rt_name}
                                    </div>
                                )}
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Calendar size={14} /> Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input
                                        type="date"
                                        className="premium-input"
                                        value={formData.start_date || ''}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                        min={formData.job_family ? (jobFamilies || []).find(jf => String(jf.id) === String(formData.job_family))?.start_date : ''}
                                    />
                                </div>
                                {formData.job_family && (jobFamilies || []).find(jf => String(jf.id) === String(formData.job_family))?.start_date && (
                                    <span className="form-help-text" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                        Must be on or after job family start date: {(jobFamilies || []).find(jf => String(jf.id) === String(formData.job_family))?.start_date}
                                    </span>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Description</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea className="premium-input" style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }} rows="2" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Role Names':
        case 'Roles':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Settings size={18} /> Role Group Identity</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><FolderKanban size={14} /> Project <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={projects?.map(p => ({ id: String(p.id), name: p.name })) || []}
                                        value={formData.project || ''}
                                        onChange={(e) => {
                                            const projId = e.target.value;
                                            setFormData({ ...formData, project: projId, segment: '' });
                                        }}
                                        placeholder="Select Project..."
                                        icon={FolderKanban}
                                        required
                                    />
                                </div>
                            </div>

                            {(() => {
                                const selectedProj = projects?.find(p => String(p.id) === String(formData.project));
                                const hasSegments = selectedProj?.has_segments || (selectedProj?.segments && selectedProj.segments.length > 0);
                                if (!hasSegments) return null;
                                return (
                                    <div className="form-group full-width">
                                        <label className="premium-label"><Layers size={14} /> Segment <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={selectedProj?.segments?.map(s => ({ id: String(s.id), name: `${s.name} (${s.code})` })) || []}
                                                value={formData.segment || ''}
                                                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                                                placeholder="Select Segment..."
                                                icon={Layers}
                                                required
                                            />
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="form-group full-width">
                                <label className="premium-label"><Network size={14} /> Role Group Code <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Role Group Code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: validateCode(e.target.value, 50, 'role_code') })} required />
                                </div>
                                {validationErrors.role_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.role_code}
                                    </div>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> Role Group Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Role Group Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value, 50, 'role_name') })} required />
                                </div>
                                {validationErrors.role_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.role_name}
                                    </div>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Description</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea className="premium-input" style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }} rows="2" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Layers size={18} /> Define Role Sub Groups</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            {(formData.sub_groups || []).map((sg, sgIdx) => (
                                <div key={sgIdx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <input
                                            type="text"
                                            placeholder="Sub Group Name (e.g. Hyderabad Executive)"
                                            value={sg.name || ''}
                                            onChange={(e) => {
                                                const newSgs = [...(formData.sub_groups || [])];
                                                newSgs[sgIdx].name = validateAlphaNumeric(e.target.value, 100, `sg_name_${sgIdx}`);
                                                setFormData({ ...formData, sub_groups: newSgs });
                                            }}
                                            className="premium-input"
                                            style={{ paddingLeft: '1rem', height: '40px' }}
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <input
                                            type="text"
                                            placeholder="Code (e.g. HYD-EXE)"
                                            value={sg.code || ''}
                                            onChange={(e) => {
                                                const newSgs = [...(formData.sub_groups || [])];
                                                newSgs[sgIdx].code = validateCode(e.target.value, 20, `sg_code_${sgIdx}`);
                                                setFormData({ ...formData, sub_groups: newSgs });
                                            }}
                                            className="premium-input"
                                            style={{ paddingLeft: '1rem', height: '40px' }}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newSgs = (formData.sub_groups || []).filter((_, idx) => idx !== sgIdx);
                                            setFormData({ ...formData, sub_groups: newSgs });
                                        }}
                                        style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    const newSgs = [...(formData.sub_groups || []), { name: '', code: '' }];
                                    setFormData({ ...formData, sub_groups: newSgs });
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                            >
                                <Plus size={14} /> Add Role Sub Group
                            </button>
                        </div>
                    </div>
                </div>
            );

        case 'Role Sub Groups':
        case 'RoleSubGroups':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Layers size={18} /> Role Sub Group Identity</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><FolderKanban size={14} /> Project (Filter)</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={projects?.map(p => ({ id: String(p.id), name: p.name })) || []}
                                        value={formData._sg_project || ''}
                                        onChange={(e) => {
                                            const projId = e.target.value;
                                            setFormData({ ...formData, _sg_project: projId, _sg_segment: '', role_group: '' });
                                        }}
                                        placeholder="All Projects..."
                                        icon={FolderKanban}
                                    />
                                </div>
                            </div>

                            {(() => {
                                const selectedProj = projects?.find(p => String(p.id) === String(formData._sg_project));
                                const hasSegments = selectedProj?.has_segments || (selectedProj?.segments && selectedProj.segments.length > 0);
                                if (!hasSegments) return null;
                                return (
                                    <div className="form-group">
                                        <label className="premium-label"><Layers size={14} /> Segment (Filter)</label>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={selectedProj?.segments?.map(s => ({ id: String(s.id), name: `${s.name} (${s.code})` })) || []}
                                                value={formData._sg_segment || ''}
                                                onChange={(e) => setFormData({ ...formData, _sg_segment: e.target.value, role_group: '' })}
                                                placeholder="All Segments..."
                                                icon={Layers}
                                            />
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="form-group full-width">
                                <label className="premium-label"><Users size={14} /> Role Group <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(() => {
                                            let filteredRoles = roles || [];
                                            if (formData._sg_project) {
                                                filteredRoles = filteredRoles.filter(r => {
                                                    const rProjId = r.project_id || (r.project && typeof r.project === 'object' ? r.project.id : r.project);
                                                    const matchesProj = String(rProjId) === String(formData._sg_project);
                                                    if (formData._sg_segment) {
                                                        const rSegId = r.segment_id || (r.segment && typeof r.segment === 'object' ? r.segment.id : r.segment);
                                                        return matchesProj && String(rSegId) === String(formData._sg_segment);
                                                    }
                                                    return matchesProj;
                                                });
                                            }
                                            return filteredRoles.map(r => ({ id: r.id, name: r.name }));
                                        })()}
                                        value={formData.role_group || ''}
                                        onChange={(e) => {
                                            const roleId = e.target.value;
                                            const selectedRole = roles?.find(r => String(r.id) === String(roleId));
                                            if (selectedRole) {
                                                const rProjId = selectedRole.project_id || (selectedRole.project && typeof selectedRole.project === 'object' ? selectedRole.project.id : selectedRole.project) || '';
                                                const rSegId = selectedRole.segment_id || (selectedRole.segment && typeof selectedRole.segment === 'object' ? selectedRole.segment.id : selectedRole.segment) || '';
                                                setFormData({
                                                    ...formData,
                                                    role_group: roleId,
                                                    _sg_project: String(rProjId),
                                                    _sg_segment: String(rSegId)
                                                });
                                            } else {
                                                setFormData({ ...formData, role_group: roleId });
                                            }
                                        }}
                                        placeholder="Select Role Group..."
                                        icon={Users}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Edit size={14} /> Sub Group Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Sub Group Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value, 100, 'sg_name') })} required />
                                </div>
                                {validationErrors.sg_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.sg_name}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Network size={14} /> Sub Group Code <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Sub Group Code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: validateCode(e.target.value, 20, 'sg_code') })} required />
                                </div>
                                {validationErrors.sg_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.sg_code}
                                    </div>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Description</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea className="premium-input" style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }} rows="3" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Jobs':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><ClipboardList size={18} /> Job Identity</div>

                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><FolderKanban size={14} /> Project <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={projects?.map(p => ({ id: String(p.id), name: p.name })) || []}
                                        value={formData._job_project || ''}
                                        onChange={(e) => {
                                            const projId = e.target.value;
                                            setFormData({ ...formData, _job_project: projId, _job_segment: '', role: '' });
                                        }}
                                        placeholder="Select Project..."
                                        icon={FolderKanban}
                                        required
                                    />
                                </div>
                            </div>

                            {(() => {
                                const selectedProj = projects?.find(p => String(p.id) === String(formData._job_project));
                                const hasSegments = selectedProj?.has_segments || (selectedProj?.segments && selectedProj.segments.length > 0);
                                if (!hasSegments) return null;
                                return (
                                    <div className="form-group full-width">
                                        <label className="premium-label"><Layers size={14} /> Segment <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={selectedProj?.segments?.map(s => ({ id: String(s.id), name: `${s.name} (${s.code})` })) || []}
                                                value={formData._job_segment || ''}
                                                onChange={(e) => setFormData({ ...formData, _job_segment: e.target.value, role: '' })}
                                                placeholder="Select Segment..."
                                                icon={Layers}
                                                required
                                            />
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="form-group full-width">
                                <label className="premium-label"><Settings size={14} /> Associated Role Group <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(() => {
                                            if (!formData._job_project) return [];
                                            const filteredRoles = (roles || []).filter(r => {
                                                const rProjId = r.project_id || (r.project && typeof r.project === 'object' ? r.project.id : r.project);
                                                const matchesProj = String(rProjId) === String(formData._job_project);
                                                const selectedProj = projects?.find(p => String(p.id) === String(formData._job_project));
                                                const hasSegments = selectedProj?.has_segments || (selectedProj?.segments && selectedProj.segments.length > 0);
                                                if (hasSegments) {
                                                    const rSegId = r.segment_id || (r.segment && typeof r.segment === 'object' ? r.segment.id : r.segment);
                                                    return matchesProj && String(rSegId) === String(formData._job_segment);
                                                }
                                                return matchesProj;
                                            });
                                            return filteredRoles.map(r => ({ id: String(r.id), name: r.name }));
                                        })()}
                                        value={formData.role || ''}
                                        onChange={(e) => {
                                            const rId = e.target.value;
                                            const nextCode = generateNextCode('JB', jobs, 'role', rId);
                                            setFormData({ ...formData, role: rId, code: nextCode });
                                        }}
                                        placeholder="Select Role Group..."
                                        icon={Settings}
                                        required
                                        disabled={!formData._job_project || (() => {
                                            const selectedProj = projects?.find(p => String(p.id) === String(formData._job_project));
                                            const hasSegments = selectedProj?.has_segments || (selectedProj?.segments && selectedProj.segments.length > 0);
                                            return hasSegments && !formData._job_segment;
                                        })()}
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><Network size={14} /> Job Code (Manual) <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Job Code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: validateCode(e.target.value, 50, 'job_code') })} required />
                                </div>
                                {validationErrors.job_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.job_code}
                                    </div>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> Job Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Job Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value, 50, 'job_name') })} required />
                                </div>
                                {validationErrors.job_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.job_name}
                                    </div>
                                )}
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Calendar size={14} /> Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input
                                        type="date"
                                        className="premium-input"
                                        value={formData.start_date || ''}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                        min={formData.role ? (roles || []).find(r => String(r.id) === String(formData.role))?.start_date : ''}
                                    />
                                </div>
                                {formData.role && (roles || []).find(r => String(r.id) === String(formData.role))?.start_date && (
                                    <span className="form-help-text" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                        Must be on or after role start date: {(roles || []).find(r => String(r.id) === String(formData.role))?.start_date}
                                    </span>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Description</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea className="premium-input" style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }} rows="2" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Tasks':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Layers size={18} /> Task Context</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Briefcase size={14} /> Job Family <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={jobFamilies?.map(jf => ({ id: jf.id, name: jf.name })) || []}
                                        value={formData.job_family || ''}
                                        onChange={(e) => setFormData({ ...formData, job_family: e.target.value, role_type: '', role: '', job: '' })}
                                        placeholder="Select Job Family..."
                                        icon={Briefcase}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Layers size={14} /> Role Type <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(roleTypes || []).filter(rt => rt.job_family == formData.job_family).map(rt => ({ id: rt.id, name: rt.name }))}
                                        value={formData.role_type || ''}
                                        disabled={!formData.job_family}
                                        onChange={(e) => {
                                            securedUpdate('role_type', e.target.value, ['job_family']);
                                            setFormData(prev => ({ ...prev, role: '', job: '' }));
                                        }}
                                        placeholder="Select Role Type..."
                                        icon={Layers}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><UserSquare2 size={14} /> Role Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(roles || []).filter(r => r.role_type == formData.role_type).map(r => ({ id: r.id, name: r.name }))}
                                        value={formData.role || ''}
                                        disabled={!formData.role_type}
                                        onChange={(e) => {
                                            securedUpdate('role', e.target.value, ['role_type']);
                                            setFormData(prev => ({ ...prev, job: '' }));
                                        }}
                                        placeholder="Select Role..."
                                        icon={UserSquare2}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><ClipboardList size={14} /> Associated Job <span style={{ color: 'var(--primary)' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(jobs || []).filter(j => j.role == formData.role).map(j => ({ id: j.id, name: j.name }))}
                                        value={formData.job || ''}
                                        disabled={!formData.role}
                                        onChange={(e) => {
                                            const jId = e.target.value;
                                            if (formData.role) {
                                                const nextCode = generateNextCode('TK', tasks, 'job', jId);
                                                securedUpdate('job', jId, ['role']);
                                                setFormData(prev => ({ ...prev, code: nextCode }));
                                            }
                                        }}
                                        placeholder="Select Job..."
                                        icon={ClipboardList}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><ClipboardList size={18} /> Task Details</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span><Network size={14} /> Task Code (Manual) <span style={{ color: '#ef4444' }}>*</span></span>
                                    <span style={{ fontSize: '0.7rem', color: (formData.code?.length || 0) >= 40 ? 'var(--magenta)' : '#94a3b8' }}>
                                        {formData.code?.length || 0}/50
                                    </span>
                                </label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Enter Task Code"
                                        value={formData.code || ''}
                                        maxLength={50}
                                        onChange={(e) => setFormData({ ...formData, code: validateCode(e.target.value, 50, 'task_code') })}
                                        required
                                    />
                                </div>
                                {validationErrors.task_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.task_code}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><TrendingUp size={14} /> Priority</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'HIGH', name: 'High' },
                                            { id: 'MEDIUM', name: 'Medium' },
                                            { id: 'LOW', name: 'Low' }
                                        ]}
                                        value={formData.priority || 'MEDIUM'}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        placeholder="Select Priority..."
                                        icon={TrendingUp}
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span><Edit size={14} /> Task Name <span style={{ color: '#ef4444' }}>*</span></span>
                                    <span style={{ fontSize: '0.7rem', color: (formData.name?.length || 0) >= 40 ? 'var(--magenta)' : '#94a3b8' }}>
                                        {formData.name?.length || 0}/50
                                    </span>
                                </label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Enter Task Name"
                                        value={formData.name || ''}
                                        maxLength={50}
                                        onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value, 50, 'task_name') })}
                                        required
                                    />
                                </div>
                                {validationErrors.task_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.task_name}
                                    </div>
                                )}
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Calendar size={14} /> Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input
                                        type="date"
                                        className="premium-input"
                                        value={formData.start_date || ''}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                        min={formData.job ? (jobs || []).find(j => String(j.id) === String(formData.job))?.start_date : ''}
                                    />
                                </div>
                                {formData.job && (jobs || []).find(j => String(j.id) === String(formData.job))?.start_date && (
                                    <span className="form-help-text" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                        Must be on or after job start date: {(jobs || []).find(j => String(j.id) === String(formData.job))?.start_date}
                                    </span>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><Link size={14} /> Allowed URL Patterns (One per line)</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <Link className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea
                                        className="premium-input"
                                        style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }}
                                        rows="4"
                                        placeholder="/employees\n/reports/*\n/settings"
                                        value={formData.urls_text !== undefined ? formData.urls_text : (formData.urls || []).map(u => u.url_pattern).join('\n')}
                                        onChange={(e) => {
                                            const text = e.target.value;
                                            setFormData({
                                                ...formData,
                                                urls_text: text,
                                                urls_list: text.split('\n').filter(line => line.trim() !== '')
                                            });
                                        }}
                                    />
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ShieldCheck size={12} /> Users with this task will have permission to access these routes. Use * for wildcards.
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Description</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea className="premium-input" style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', minHeight: '100px', resize: 'vertical' }} rows="2" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );


        case 'Employees':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Identity Section */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Users size={18} /> Personal Identity</div>

                        {/* Profile Photo Upload Header */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div className="premium-label"><UserCircle size={14} /> Profile Representation</div>
                            <div className="photo-upload-card">
                                <div className="photo-preview-box">
                                    {formData.photo ? (
                                        <img
                                            src={
                                                formData.photo instanceof File
                                                    ? URL.createObjectURL(formData.photo)
                                                    : (formData.photo.startsWith('http') || formData.photo.startsWith('data:image'))
                                                        ? formData.photo
                                                        : `${BACKEND_BASE_URL}${formData.photo.startsWith('/') ? '' : '/'}${formData.photo}`
                                            }
                                            alt="Preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <User size={64} color="#e2e8f0" />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>Global Profile Photo</h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                                            High-quality professional headshots are recommended. <br />
                                            Supports PNG, JPG (Max 5MB).
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <label className="premium-file-btn">
                                            <Upload size={16} /> Choose New Image
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                        {formData.photo && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, photo: null })}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <X size={14} /> Remove Photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Network size={14} /> Employee Code (Manual) <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Enter Employee Code"
                                        value={formData.employee_code || ''}
                                        onChange={(e) => {
                                            const code = validateCode(e.target.value, 50, 'employee_code');
                                            setFormData({ ...formData, employee_code: code });

                                            // Immediate duplicate check against pre-loaded list
                                            if (code && allEmployees.some(emp => String(emp.employee_code).toUpperCase() === code.toUpperCase() && String(emp.id) !== String(formData.id))) {
                                                showValidationError('employee_code', 'This Employee Code already exists');
                                            }
                                        }}
                                        required
                                    />
                                </div>
                                {validationErrors.employee_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.employee_code}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Edit size={14} /> Full Legal Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <User className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Enter Full Legal Name"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value, 50, 'employee_name') })}
                                        required
                                    />
                                </div>
                                {validationErrors.employee_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.employee_name}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><User size={14} /> Father's Name</label>
                                <div className="premium-input-wrapper">
                                    <User className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Enter Father's Name"
                                        value={formData.father_name || ''}
                                        onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><User size={14} /> Mother's Name</label>
                                <div className="premium-input-wrapper">
                                    <User className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Enter Mother's Name"
                                        value={formData.mother_name || ''}
                                        onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Phone size={14} /> Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Phone className="premium-input-icon" size={18} />
                                    <input
                                        type="tel"
                                        className="premium-input"
                                        placeholder="10-digit number"
                                        value={formData.phone || ''}
                                        onChange={(e) => {
                                            const ph = validatePhone(e.target.value, 'employee_phone');
                                            setFormData(prev => ({ ...prev, phone: ph }));
                                            if (ph && ph.length === 10 && allEmployees.some(emp => String(emp.phone) === String(ph) && String(emp.id) !== String(formData.id))) {
                                                showValidationError('employee_phone', 'This phone number is already registered');
                                            }
                                        }}
                                        required
                                    />
                                </div>
                                {validationErrors.employee_phone && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.employee_phone}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Mail size={14} /> Login Email / Primary <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Mail className="premium-input-icon" size={18} />
                                    <input
                                        type="email"
                                        className="premium-input"
                                        placeholder="Enter Login Email (e.g. user@gmail.com)"
                                        value={formData.email || ''}
                                        onChange={(e) => {
                                            const emailVal = validateEmail(e.target.value, 50, 'email');
                                            setFormData(prev => ({ ...prev, email: emailVal }));
                                            if (emailVal && allEmployees.some(emp => String(emp.email).toLowerCase() === emailVal.toLowerCase() && String(emp.id) !== String(formData.id))) {
                                                showValidationError('email', 'This email already belongs to another account');
                                            }
                                        }}
                                        required
                                    />
                                </div>
                                {validationErrors.email && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.email}
                                    </div>
                                )}
                                <div style={{ textAlign: 'right', fontSize: '0.65rem', color: (formData.email?.length >= 50) ? '#be185d' : '#94a3b8', marginTop: '4px', fontWeight: 600 }}>
                                    {formData.email?.length || 0} / 50 characters used
                                </div>
                                {formData.email && !isEmailValid(formData.email) && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ Email must end with @.com or .in
                                    </div>
                                )}
                            </div>


                            {!formData._is_profile_edit && (
                                <>
                                    <div className="form-group">
                                        <label className="premium-label"><Calendar size={14} /> Joining Date <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div className="premium-input-wrapper">
                                            <Calendar className="premium-input-icon" size={18} />
                                            <input
                                                type="date"
                                                className="premium-input"
                                                value={formData.hire_date || ''}
                                                max={formData.employment_end_date || "2099-12-31"}
                                                onChange={(e) => {
                                                    const val = e.target.value || null;
                                                    const newData = { ...formData, hire_date: val };
                                                    if (formData.employment_end_date && val && val > formData.employment_end_date) {
                                                        newData.employment_end_date = '';
                                                    }
                                                    setFormData(newData);
                                                }}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="premium-label"><Briefcase size={14} /> Employment Type <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={[
                                                    { id: 'Permanent', name: 'Permanent' },
                                                    { id: 'Temporary', name: 'Temporary / Contract' }
                                                ]}
                                                value={formData.employment_type || 'Permanent'}
                                                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                                                placeholder="Select Employment Type"
                                                icon={Briefcase}
                                            />
                                        </div>
                                    </div>
                                    {formData.employment_type === 'Temporary' && (
                                        <div className="form-group fade-in">
                                            <label className="premium-label"><Calendar size={14} /> Contract End Date <span style={{ color: '#ef4444' }}>*</span></label>
                                            <div className="premium-input-wrapper">
                                                <Calendar className="premium-input-icon" size={18} />
                                                <input
                                                    type="date"
                                                    className="premium-input"
                                                    value={formData.employment_end_date || ''}
                                                    min={formData.hire_date || undefined}
                                                    onChange={(e) => setFormData({ ...formData, employment_end_date: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Records Section */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><UserCircle size={18} /> Employee Identity & Records</div>
                        <div className="form-grid">

                            <div className="form-group">
                                <label className="premium-label"><Calendar size={14} /> Date of Birth <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input type="date" className="premium-input" value={formData.date_of_birth || ''} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Users size={14} /> Gender <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'Male', name: 'Male' },
                                            { id: 'Female', name: 'Female' },
                                            { id: 'Other', name: 'Other' },
                                            { id: 'Hidden', name: 'Prefer not to say' }
                                        ]}
                                        value={formData.gender || ''}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        placeholder="Select Gender..."
                                        icon={Users}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><ShieldCheck size={14} /> Blood Group</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ id: bg, name: bg }))}
                                        value={formData.blood_group || ''}
                                        onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                                        placeholder="Select Blood Group..."
                                        icon={ShieldCheck}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><FileDigit size={14} /> Aadhaar Number</label>
                                <div className="premium-input-wrapper">
                                    <FileDigit className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="12-digit Aadhaar Number"
                                        value={formData.aadhaar_number || ''}
                                        onChange={(e) => setFormData({ ...formData, aadhaar_number: validateNumbers(e.target.value, 12, 'aadhaar_number') })}
                                    />
                                </div>
                                {validationErrors.aadhaar_number && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.aadhaar_number}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><FileText size={14} /> PAN Number</label>
                                <div className="premium-input-wrapper">
                                    <FileText className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="10-char PAN Number"
                                        value={formData.pan_number || ''}
                                        onChange={(e) => setFormData({ ...formData, pan_number: validateAlphaNumeric(e.target.value, 10, 'pan_number').toUpperCase() })}
                                    />
                                </div>
                                {validationErrors.pan_number && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.pan_number}
                                    </div>
                                )}
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><MapPin size={14} /> Primary Residential Address</label>
                                <div className="premium-input-wrapper">
                                    <MapPin className="premium-input-icon" style={{ top: '1.5rem', transform: 'none' }} size={18} />
                                    <textarea
                                        className="premium-input"
                                        rows="3"
                                        placeholder="Full permanent address details..."
                                        value={formData.address || ''}
                                        onChange={(e) => setFormData({ ...formData, address: validateAddress(e.target.value, 500, 'employee_address') })}
                                        style={{ paddingLeft: '3rem', paddingTop: '1rem' }}
                                    />
                                </div>
                                {validationErrors.employee_address && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.employee_address}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Account & Operational Status */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}>
                            <ShieldCheck size={18} /> {formData.id ? 'Account Status' : 'New Account Initialization'}
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><ShieldCheck size={14} /> Employment Status</label>
                                <div className="location-type-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    <div className={`type-card ${formData.status === 'Active' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, status: 'Active', status_date: null, _inactivation_type: '' })}>
                                        <div style={{ fontWeight: 800 }}>ACTIVE</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>In Service</div>
                                    </div>
                                    <div className={`type-card ${formData.status === 'Suspicious' || formData.status === 'Suspended' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, status: 'Suspended', status_date: null, _inactivation_type: '' })}
                                        style={(formData.status === 'Suspicious' || formData.status === 'Suspended') ? { borderColor: '#f59e0b', background: '#fffbeb' } : {}}
                                    >
                                        <div style={{ fontWeight: 800, color: (formData.status === 'Suspicious' || formData.status === 'Suspended') ? '#d97706' : 'inherit' }}>SUSPENDED</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Under Review</div>
                                    </div>
                                    <div className={`type-card ${formData.status === 'Inactive' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, status: 'Inactive', _inactivation_type: 'Immediate', status_date: new Date().toISOString().split('T')[0] })}>
                                        <div style={{ fontWeight: 800 }}>INACTIVE</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Terminated / Left</div>
                                    </div>
                                </div>
                            </div>

                            {formData.status === 'Inactive' && (
                                <div className="form-group fade-in">
                                    <label className="premium-label"><Clock size={14} /> Inactivation Timing</label>
                                    <div className="location-type-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                        <div className={`type-card ${formData._inactivation_type === 'Immediate' ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, _inactivation_type: 'Immediate', status_date: new Date().toISOString().split('T')[0] })}>
                                            <div style={{ fontWeight: 800 }}>IMMEDIATE</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Effective Today</div>
                                        </div>
                                        <div className={`type-card ${formData._inactivation_type === 'Not Immediate' ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, _inactivation_type: 'Not Immediate' })}>
                                            <div style={{ fontWeight: 800 }}>SCHEDULED</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Future Date</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formData.status === 'Inactive' && formData._inactivation_type === 'Not Immediate' && (
                                <div className="form-group full-width fade-in">
                                    <label className="premium-label" style={{ color: '#ef4444' }}><Calendar size={14} /> Separation Effective Date <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div className="premium-input-wrapper" style={{ borderColor: '#ef4444' }}>
                                        <Calendar className="premium-input-icon" size={18} style={{ color: '#ef4444' }} />
                                        <input
                                            type="date"
                                            className="premium-input"
                                            value={formData.status_date || ''}
                                            onChange={(e) => setFormData({ ...formData, status_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Assignment Section (Conditional) */}
                    {!formData._is_profile_edit && (
                        <div className="premium-form-section">
                            <div className="form-section-title" style={{ marginBottom: '2rem' }}><Navigation size={18} /> Current Assignment</div>
                            <div className="form-group full-width">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="premium-label"><LayoutGrid size={14} /> Level</label>
                                        <SearchableSelect
                                            options={orgLevels || []}
                                            value={formData._emp_level_filter || ''}
                                            onChange={(e) => setFormData({ ...formData, _emp_level_filter: e.target.value, _emp_office_filter: '', _emp_dept_filter: '', _emp_section_filter: '' })}
                                            placeholder="All Levels"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="premium-label"><Building2 size={14} /> Office</label>
                                        <SearchableSelect
                                            options={(offices || []).filter(o => !formData._emp_level_filter || String(o.level_id || (typeof o.level === 'object' ? o.level?.id : o.level)) === String(formData._emp_level_filter))}
                                            value={formData._emp_office_filter || ''}
                                            onChange={(e) => setFormData({ ...formData, _emp_office_filter: e.target.value, _emp_dept_filter: '', _emp_section_filter: '' })}
                                            placeholder="All Offices"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="premium-label"><Briefcase size={14} /> Department</label>
                                        <SearchableSelect
                                            options={(departments || []).filter(d => String(d.office || d.office_id) === String(formData._emp_office_filter))}
                                            value={formData._emp_dept_filter || ''}
                                            onChange={(e) => setFormData({ ...formData, _emp_dept_filter: e.target.value, _emp_section_filter: '' })}
                                            disabled={!formData._emp_office_filter}
                                            placeholder="All Departments"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="premium-label"><Layers size={14} /> Section</label>
                                        <SearchableSelect
                                            options={(sections || []).filter(s => String(s.department || s.department_id) === String(formData._emp_dept_filter))}
                                            value={formData._emp_section_filter || ''}
                                            onChange={(e) => setFormData({ ...formData, _emp_section_filter: e.target.value })}
                                            disabled={!formData._emp_dept_filter}
                                            placeholder={formData._emp_dept_filter ? "All Sections" : "Select Dept First"}
                                            icon={Layers}
                                        />
                                    </div>
                                </div>

                                <label className="premium-label"><Briefcase size={14} /> Assigned Position(s)</label>
                                <div style={{
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    padding: '1.5rem',
                                    background: '#f8fafc',
                                    borderRadius: '20px',
                                    border: '1px solid #e2e8f0',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    {positionsLoading ? (
                                        <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: '#fb923c', fontWeight: 600 }}>
                                            Loading positions from server...
                                        </div>
                                    ) : (getFilteredPositions() || []).length > 0 ? (getFilteredPositions() || []).map(p => (
                                        <label key={p.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            background: 'white',
                                            border: (formData.positions || []).includes(Number(p.id)) ? '2px solid #fb923c' : '2px solid #f1f5f9',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: (formData.positions || []).includes(Number(p.id)) ? '0 4px 6px -1px rgba(251, 146, 60, 0.1)' : 'none'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={(formData.positions || []).includes(Number(p.id))}
                                                onChange={(e) => {
                                                    const currentIds = (formData.positions || []).map(id => Number(id));
                                                    const pid = Number(p.id);
                                                    const newIds = e.target.checked ? [...currentIds, pid] : currentIds.filter(id => id !== pid);
                                                    setFormData({ ...formData, positions: newIds });
                                                }}
                                                style={{ accentColor: '#fb923c', width: '18px', height: '18px' }}
                                            />
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{p.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.office_display || p.office_name} • {p.department_display || p.department_name}</div>
                                            </div>
                                        </label>
                                    )) : (
                                        <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                                            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.1 }} />
                                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>No positions found matching your selection.</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ShieldCheck size={14} /> Administrative oversight required for position changes.
                                </div>
                            </div>
                        </div>
                    )
                    }
                </div >
            );



        case 'Projects':
            const filteredOffices = (offices || []).filter(o => {
                // Search Term Filter
                if (officeSearchTerm && !o.name.toLowerCase().includes(officeSearchTerm.toLowerCase()) && !o.code.toLowerCase().includes(officeSearchTerm.toLowerCase())) {
                    return false;
                }

                // Level Filter
                if (!formData.assigned_level) return true; // Show ALL if no level filter is active
                return String(o.level) === String(formData.assigned_level) ||
                    (o.level && typeof o.level === 'object' && String(o.level.id) === String(formData.assigned_level));
            });

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Project Core Identity */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><FolderKanban size={18} /> Project Core Identity</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Network size={14} /> Project Code (Manual) <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Project Code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: validateCode(e.target.value, 50, 'proj_code') })} required />
                                </div>
                                {validationErrors.proj_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.proj_code}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Edit size={14} /> Project Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Project Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateAlphaNumeric(e.target.value, 50, 'proj_name') })} required />
                                </div>
                                {validationErrors.proj_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.proj_name}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><TrendingUp size={14} /> Status</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'Active', name: 'Active' },
                                            { id: 'Planning', name: 'Planning' },
                                            { id: 'On Hold', name: 'On Hold' },
                                            { id: 'Completed', name: 'Completed' },
                                            { id: 'Archived', name: 'Archived' }
                                        ]}
                                        value={formData.status || 'Active'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        placeholder="Select Status..."
                                        icon={TrendingUp}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Briefcase size={14} /> Client Type</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'Private', name: 'Private' },
                                            { id: 'Government', name: 'Government / Public Sector' }
                                        ]}
                                        value={formData.client_type || 'Private'}
                                        onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}
                                        placeholder="Select Client Type..."
                                        icon={Briefcase}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><LayoutGrid size={14} /> Project Type <span style={{ color: 'var(--primary)' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'SINGLE', name: 'Single Location' },
                                            { id: 'MULTIPLE', name: 'Multiple Location' }
                                        ]}
                                        value={formData.project_type || 'SINGLE'}
                                        onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                                        placeholder="Select Project Type..."
                                        icon={LayoutGrid}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Layers size={14} /> Segment Creation Option <span style={{ color: 'var(--primary)' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'false', name: 'No' },
                                            { id: 'true', name: 'Yes' }
                                        ]}
                                        value={String(formData.has_segments || false)}
                                        onChange={(e) => {
                                            const val = e.target.value === 'true';
                                            setFormData({
                                                ...formData,
                                                has_segments: val,
                                                segments: val ? (formData.segments?.length > 0 ? formData.segments : [{ name: '', code: '' }]) : []
                                            });
                                        }}
                                        placeholder="Enable segments?"
                                        icon={Layers}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline & Details */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><History size={18} /> Implementation Period & Scope</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Calendar size={14} /> Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input
                                        type="date"
                                        className="premium-input"
                                        value={formData.start_date || ''}
                                        max={formData.end_date || undefined}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const newData = { ...formData, start_date: val };
                                            if (formData.end_date && val > formData.end_date) {
                                                newData.end_date = '';
                                            }
                                            setFormData(newData);
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Calendar size={14} /> End Date (Planned)</label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input
                                        type="date"
                                        className="premium-input"
                                        value={formData.end_date || ''}
                                        min={formData.start_date || undefined}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Project Description / Scope</label>
                                <div className="premium-input-wrapper">
                                    <FileText className="premium-input-icon" style={{ top: '1.5rem', transform: 'none' }} size={18} />
                                    <textarea className="premium-input" rows="3" placeholder="Define the core objectives and scope of this project..." value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: capitalize(e.target.value) })} style={{ paddingLeft: '3rem', paddingTop: '1rem' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project Segments Builder */}
                    {formData.has_segments && (
                        <div className="premium-form-section fade-in">
                            <div className="form-section-title" style={{ marginBottom: '2rem' }}>
                                <Layers size={18} /> Define Project Segments
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                {(formData.segments || []).map((seg, segIdx) => (
                                    <div key={segIdx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label className="premium-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Segment Name <span style={{ color: '#ef4444' }}>*</span></label>
                                            <input
                                                type="text"
                                                placeholder="Segment Name (e.g. Phase 1)"
                                                value={seg.name || ''}
                                                onChange={(e) => {
                                                    const newSegs = [...(formData.segments || [])];
                                                    newSegs[segIdx].name = validateAlphaNumeric(e.target.value, 100, `seg_name_${segIdx}`);
                                                    setFormData({ ...formData, segments: newSegs });
                                                }}
                                                className="premium-input"
                                                style={{ paddingLeft: '1rem', height: '40px' }}
                                                required
                                            />
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label className="premium-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Code <span style={{ color: '#ef4444' }}>*</span></label>
                                            <input
                                                type="text"
                                                placeholder="Code (e.g. PH1)"
                                                value={seg.code || ''}
                                                onChange={(e) => {
                                                    const newSegs = [...(formData.segments || [])];
                                                    newSegs[segIdx].code = validateCode(e.target.value, 50, `seg_code_${segIdx}`);
                                                    setFormData({ ...formData, segments: newSegs });
                                                }}
                                                className="premium-input"
                                                style={{ paddingLeft: '1rem', height: '40px' }}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newSegs = (formData.segments || []).filter((_, idx) => idx !== segIdx);
                                                setFormData({ ...formData, segments: newSegs });
                                            }}
                                            style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 600, marginTop: '20px' }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newSegs = [...(formData.segments || []), { name: '', code: '' }];
                                        setFormData({ ...formData, segments: newSegs });
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                                >
                                    <Plus size={14} /> Add Segment
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Geo Scope Jurisdiction */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Globe size={18} /> Geo Scope & Operational Jurisdiction</div>
                        <div className="form-grid">
                            <div className="form-group full-width" style={{ marginBottom: '1.5rem' }}>
                                <label className="premium-label"><Layers size={14} /> Targeted Geographic Level (Geo Scope) <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'Territory', name: 'Territory (Global/Continent)' },
                                            { id: 'Country', name: 'Country' },
                                            { id: 'State', name: 'State / Province' },
                                            { id: 'District', name: 'District' },
                                            { id: 'Mandal', name: 'Mandal / Taluk' },
                                            { id: 'Cluster', name: 'Cluster (Metropolitan/City/Town/Village)' }
                                        ]}
                                        value={formData.geo_scope_level || ''}
                                        onChange={(e) => {
                                            const newLevel = e.target.value;
                                            setFormData({
                                                ...formData,
                                                geo_scope_level: newLevel,
                                                continent_name: '', country_name: '', state_name: '', district_name: '', mandal_name: '',
                                                cluster: '', cluster_name: '', location: '',
                                                latitude: '', longitude: ''
                                            });
                                        }}
                                        placeholder="Select Target Level..."
                                        icon={Layers}
                                        required
                                    />
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px' }}>
                                    Select the granularity of this project's geographic scope. Higher levels automatically include all child jurisdictions.
                                </div>
                            </div>

                            {/* Dynamic Dropdowns based on Level */}
                            {formData.geo_scope_level && (
                                <>
                                    <div className="form-group">
                                        <label className="premium-label"><Globe size={14} /> Territory</label>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={geoContinents?.map(c => ({ id: c.name, name: c.name })) || []}
                                                value={formData.continent_name || ''}
                                                onChange={(e) => setFormData({ ...formData, continent_name: e.target.value, country_name: '', state_name: '', district_name: '', mandal_name: '', location: '', hamlet_name: '', latitude: '', longitude: '' })}
                                                placeholder="Select Territory..."
                                                icon={Globe}
                                            />
                                        </div>
                                    </div>

                                    {(['Country', 'State', 'District', 'Mandal', 'Cluster'].includes(formData.geo_scope_level)) && (
                                        <div className="form-group">
                                            <label className="premium-label"><Globe size={14} /> Country</label>
                                            <div className="premium-input-wrapper">
                                                <SearchableSelect
                                                    options={(() => {
                                                        const continentObj = (geoContinents || []).find(c => c.name === formData.continent_name);
                                                        return (geoCountries || []).filter(c => !formData.continent_name || c.continent_ref == continentObj?.id).map(c => ({ id: c.name, name: c.name }));
                                                    })()}
                                                    value={formData.country_name || ''}
                                                    onChange={(e) => setFormData({ ...formData, country_name: e.target.value, state_name: '', district_name: '', mandal_name: '', location: '', hamlet_name: '', latitude: '', longitude: '' })}
                                                    disabled={!formData.continent_name}
                                                    placeholder="Select Country..."
                                                    icon={Globe}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(['State', 'District', 'Mandal', 'Cluster'].includes(formData.geo_scope_level)) && (
                                        <div className="form-group">
                                            <label className="premium-label"><Navigation size={14} /> State / Province</label>
                                            <div className="premium-input-wrapper">
                                                <SearchableSelect
                                                    options={(() => {
                                                        const countryObj = (geoCountries || []).find(c => c.name === formData.country_name);
                                                        return (geoStatesData || []).filter(s => !formData.country_name || s.country == countryObj?.id).map(s => ({ id: s.name, name: s.name }));
                                                    })()}
                                                    value={formData.state_name || ''}
                                                    onChange={(e) => setFormData({ ...formData, state_name: e.target.value, district_name: '', mandal_name: '', location: '', hamlet_name: '', latitude: '', longitude: '' })}
                                                    disabled={!formData.country_name}
                                                    placeholder="Select State..."
                                                    icon={Navigation}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(['District', 'Mandal', 'Cluster'].includes(formData.geo_scope_level)) && (
                                        <div className="form-group">
                                            <label className="premium-label"><MapPin size={14} /> District</label>
                                            <div className="premium-input-wrapper">
                                                <SearchableSelect
                                                    options={(() => {
                                                        const stateObj = (geoStatesData || []).find(s => s.name === formData.state_name);
                                                        return (geoDistrictsData || []).filter(d => !formData.state_name || d.state == stateObj?.id).map(d => ({ id: d.name, name: d.name }));
                                                    })()}
                                                    value={formData.district_name || ''}
                                                    onChange={(e) => setFormData({ ...formData, district_name: e.target.value, mandal_name: '', location: '', hamlet_name: '', latitude: '', longitude: '' })}
                                                    disabled={!formData.state_name}
                                                    placeholder="Select District..."
                                                    icon={MapPin}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(['Mandal', 'Cluster'].includes(formData.geo_scope_level)) && (
                                        <div className="form-group">
                                            <label className="premium-label"><Map size={14} /> Mandal / Taluk</label>
                                            <div className="premium-input-wrapper">
                                                <SearchableSelect
                                                    options={(() => {
                                                        const districtObj = (geoDistrictsData || []).find(d => d.name === formData.district_name);
                                                        return (geoMandals || []).filter(m => !formData.district_name || m.district == districtObj?.id).map(m => ({ id: m.name, name: m.name }));
                                                    })()}
                                                    value={formData.mandal_name || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData({ ...formData, mandal_name: val, cluster: '', cluster_name: '', location: '', latitude: '', longitude: '' });
                                                        if (val) checkGeoMandal(val, formData.district_name, formData.state_name);
                                                    }}
                                                    disabled={!formData.district_name}
                                                    placeholder="Select Mandal..."
                                                    icon={Map}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            {/* Geospatial Coordinates & Map */}
                            <div className="form-group full-width">
                                <label className="premium-label"><MapPin size={14} /> Project Location Map</label>
                                <div style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                    <GeoMapPicker
                                        latitude={formData.latitude}
                                        longitude={formData.longitude}
                                        onLocationSelect={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                                        searchQuery={[
                                            formData.cluster_name,
                                            formData.mandal_name,
                                            formData.district_name,
                                            formData.state_name,
                                            formData.country_name
                                        ].filter(Boolean).join(', ')}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><MapPin size={14} /> Latitude</label>
                                <div className="premium-input-wrapper">
                                    <MapPin className="premium-input-icon" size={18} />
                                    <input type="number" step="0.000000001" className="premium-input" placeholder="Latitude (e.g. 17.38)" value={formData.latitude || ''} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><MapPin size={14} /> Longitude</label>
                                <div className="premium-input-wrapper">
                                    <MapPin className="premium-input-icon" size={18} />
                                    <input type="number" step="0.000000001" className="premium-input" placeholder="Longitude (e.g. 78.48)" value={formData.longitude || ''} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {(formData.geo_scope_level === 'Cluster') && formData.mandal_name && (
                            <div className="fade-in" style={{ marginTop: '2rem' }}>
                                <div className="form-group full-width">
                                    <label className="premium-label"><Layers size={14} /> Settlement Cluster <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div className="premium-input-wrapper">
                                        <SearchableSelect
                                            options={(() => {
                                                const mandalId = (geoMandals || []).find(m => m.name === formData.mandal_name)?.id;
                                                return (geoClusters || []).filter(c => c.mandal == mandalId).map(c => ({ id: c.id, name: `${c.name} (${c.cluster_type_display})` }));
                                            })()}
                                            value={formData.cluster || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const clusterObj = (geoClusters || []).find(c => String(c.id) === String(val));
                                                setFormData({ ...formData, cluster: val, cluster_name: clusterObj ? clusterObj.name : '' });
                                            }}
                                            placeholder="Select Cluster..."
                                            icon={Layers}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Organizational Alignment */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Briefcase size={18} /> Organizational Assignment & Alignment</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Layers size={14} /> Targeted Organizational Level</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={orgLevels?.map(lvl => ({ id: lvl.id, name: `${lvl.name} (${lvl.level_code})` })) || []}
                                        value={formData.assigned_level || ''}
                                        onChange={(e) => {
                                            const newVal = e.target.value || null;
                                            if (String(newVal) !== String(formData.assigned_level || null)) {
                                                setFormData({ ...formData, assigned_level: newVal });
                                                setOfficeSearchTerm('');
                                            }
                                        }}
                                        placeholder="Corporate / Global Scope"
                                        icon={Layers}
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span><Building2 size={14} /> Assigned Offices (Checklist)</span>
                                        {(formData.assigned_offices || []).length > 0 && (
                                            <span style={{
                                                background: '#fb923c',
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                boxShadow: '0 4px 6px -1px rgba(251, 146, 60, 0.2)'
                                            }}>
                                                {(formData.assigned_offices || []).length} Total Selected
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const allFilteredIds = filteredOffices.map(o => String(o.id));
                                                    const current = (formData.assigned_offices || []).map(String);
                                                    const next = Array.from(new Set([...current, ...allFilteredIds]));
                                                    setFormData({ ...formData, assigned_offices: next });
                                                }}
                                                style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '8px', background: '#fb923c', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const allFilteredIds = filteredOffices.map(o => String(o.id));
                                                    const current = (formData.assigned_offices || []).map(String);
                                                    const next = current.filter(id => !allFilteredIds.includes(id));
                                                    setFormData({ ...formData, assigned_offices: next });
                                                }}
                                                style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        <div style={{ position: 'relative', width: '250px' }}>
                                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#fb923c' }} />
                                            <input
                                                type="text"
                                                placeholder="Quick search offices..."
                                                value={officeSearchTerm}
                                                onChange={(e) => setOfficeSearchTerm(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 10px 8px 34px',
                                                    fontSize: '0.8rem',
                                                    borderRadius: '12px',
                                                    border: '1px solid #fb923c40',
                                                    outline: 'none',
                                                    background: 'white',
                                                    fontWeight: 500
                                                }}
                                            />
                                        </div>
                                    </div>
                                </label>
                                <div className="glass" style={{
                                    maxHeight: '350px',
                                    overflowY: 'auto',
                                    padding: '1.5rem',
                                    background: 'rgba(248, 250, 252, 0.5)',
                                    borderRadius: '24px',
                                    border: '1px solid #e2e8f0',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    {filteredOffices.length > 0 ? filteredOffices.map(off => {
                                        const isExplicit = (formData.assigned_offices || []).map(String).includes(String(off.id));
                                        const master = facilityMasters?.find(m => String(m.id) === String(off.facility_master));
                                        const isImplicit = master && String(master.project) === String(formData.id);
                                        const isChecked = isExplicit || isImplicit;

                                        return (
                                            <label key={off.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '14px',
                                                background: isChecked ? '#fff7ed' : 'white',
                                                border: isChecked ? '2px solid #fb923c' : '2px solid #f1f5f9',
                                                borderRadius: '18px',
                                                cursor: isImplicit ? 'default' : 'pointer',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: isChecked ? '0 10px 15px -3px rgba(251, 146, 60, 0.1)' : 'none',
                                                position: 'relative',
                                                opacity: isImplicit ? 0.9 : 1
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    disabled={isImplicit}
                                                    onChange={(e) => {
                                                        if (isImplicit) return;
                                                        const current = (formData.assigned_offices || []).map(String);
                                                        const oid = String(off.id);
                                                        let next;
                                                        if (e.target.checked) {
                                                            if (!current.includes(oid)) next = [...current, oid];
                                                            else next = current;
                                                        } else {
                                                            next = current.filter(id => id !== oid);
                                                        }
                                                        setFormData({ ...formData, assigned_offices: next });
                                                    }}
                                                    style={{ accentColor: '#fb923c', width: '20px', height: '20px', cursor: isImplicit ? 'default' : 'pointer' }}
                                                />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isChecked ? '#9a3412' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {off.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: isChecked ? '#ea580c' : '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Layers size={10} /> {off.level_display || off.level_name} • {off.code}
                                                    </div>
                                                </div>
                                                {isImplicit && (
                                                    <div title="Inherited from Facility Master" style={{ position: 'absolute', top: '8px', right: '8px' }}>
                                                        <Link size={12} color="#fb923c" />
                                                    </div>
                                                )}
                                            </label>
                                        );
                                    }) : (
                                        <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                            <Building2 size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.1, color: '#fb923c' }} />
                                            <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>No offices matching your criteria.</p>
                                            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Adjust filters or select a different organizational level.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Positions':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Section 1: Core Identity & Designation */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><UserSquare2 size={18} /> Core Identity & Designation</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Edit size={14} /> Position Title (Display Name)</label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value, 50, 'pos_name') })} placeholder="e.g. Senior Project Manager" required />
                                </div>
                                {validationErrors.pos_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.pos_name}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Network size={14} /> Position Code</label>
                                <div className="premium-input-wrapper">
                                    <Network className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="e.g. SPM-104-AP" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: validateCode(e.target.value, 50, 'pos_code') })} required />
                                </div>
                                {validationErrors.pos_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.pos_code}
                                    </div>
                                )}
                                {formData._pos_project_code && formData.code && (
                                    <div style={{ marginTop: '8px', padding: '6px 12px', background: 'rgba(136, 19, 55, 0.06)', borderRadius: '8px', border: '1px dashed rgba(136,19,55,0.25)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                                        <Network size={12} />
                                        Final saved code: <strong style={{ letterSpacing: '0.5px' }}>{formData.code}-{formData._pos_project_code}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><FolderKanban size={14} /> Project <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={projects?.map(p => ({ id: String(p.id), name: p.name })) || []}
                                        value={formData._pos_project || ''}
                                        onChange={(e) => {
                                            const projId = e.target.value;
                                            const selectedProj = projects?.find(p => String(p.id) === String(projId));
                                            setFormData({
                                                ...formData,
                                                _pos_project: projId,
                                                _pos_segment: '',
                                                position_type: '',
                                                shifts: [],
                                                _pos_project_code: selectedProj?.code || ''
                                            });
                                        }}
                                        placeholder="Select Project..."
                                        icon={FolderKanban}
                                        required
                                    />
                                </div>
                            </div>

                            {(() => {
                                const selectedProj = projects?.find(p => String(p.id) === String(formData._pos_project));
                                const hasSegments = selectedProj?.has_segments || (selectedProj?.segments && selectedProj.segments.length > 0);
                                if (!hasSegments) return null;
                                return (
                                    <div className="form-group">
                                        <label className="premium-label"><Layers size={14} /> Segment <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                options={selectedProj?.segments?.map(s => ({ id: String(s.id), name: `${s.name} (${s.code})` })) || []}
                                                value={formData._pos_segment || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    _pos_segment: e.target.value,
                                                    position_type: '',
                                                    shifts: []
                                                })}
                                                placeholder="Select Segment..."
                                                icon={Layers}
                                                required
                                            />
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="form-group">
                                <label className="premium-label"><LayoutGrid size={14} /> Designation Rank / Level</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(() => {
                                            const sorted = [...(positionLevels || [])].sort((a, b) => (a.rank || 0) - (b.rank || 0));
                                            return sorted.map(lvl => ({ id: lvl.id, name: `${lvl.name} (Rank: ${lvl.rank})` }));
                                        })()}
                                        value={formData.level || ''}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        placeholder="Select Level..."
                                        icon={LayoutGrid}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Settings size={14} /> Position Type</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(() => {
                                            let filteredPt = positionTypes || [];
                                            const selectedOff = offices.find(o => String(o.id) === String(formData.office));
                                            const masterPtIds = selectedOff?.facility_master_details?.position_types || [];
                                            if (masterPtIds.length > 0) {
                                                filteredPt = filteredPt.filter(pt => masterPtIds.map(String).includes(String(pt.id)));
                                            } else if (formData._pos_project) {
                                                filteredPt = filteredPt.filter(pt => {
                                                    const ptProjId = pt.project_id || (pt.project && typeof pt.project === 'object' ? pt.project.id : pt.project);
                                                    if (!ptProjId) return true; // Global position types apply everywhere
                                                    const matchesProj = String(ptProjId) === String(formData._pos_project);
                                                    if (formData._pos_segment) {
                                                        const ptSegId = pt.segment_id || (pt.segment && typeof pt.segment === 'object' ? pt.segment.id : pt.segment);
                                                        if (!ptSegId) return matchesProj;
                                                        return matchesProj && String(ptSegId) === String(formData._pos_segment);
                                                    }
                                                    return matchesProj;
                                                });
                                            }
                                            return filteredPt.map(pt => ({ id: String(pt.id), name: pt.name }));
                                        })()}
                                        value={formData.position_type || ''}
                                        onChange={(e) => {
                                            const ptId = e.target.value;
                                            console.log('⚡ [PositionType Select] ptId:', ptId);
                                            const ptObj = positionTypes.find(pt => String(pt.id) === String(ptId));
                                            console.log('⚡ [PositionType Select] ptObj found:', ptObj);
                                            const mappedShiftIds = ptObj?.shifts || [];
                                            const autoRole = ptObj?.role ? String(ptObj.role) : '';
                                            const autoJob = ptObj?.job ? String(ptObj.job) : '';
                                            console.log('⚡ [PositionType Select] autoRole:', autoRole, 'autoJob:', autoJob);
                                            const selectedRoleObj = roles.find(r => String(r.id) === autoRole);
                                            const autoName = selectedRoleObj ? selectedRoleObj.name : (ptObj ? ptObj.name : '');
                                            
                                            // Auto-determine designation level based on Position Type name
                                            let autoLevelId = formData.level || '';
                                            const ptNameUpper = ptObj?.name?.toUpperCase() || '';
                                            let targetLevelName = '';
                                            if (ptNameUpper === 'COO' || ptNameUpper === 'SPH') {
                                                targetLevelName = 'Level-1';
                                            } else if (ptNameUpper === 'REGIONAL MANAGER') {
                                                targetLevelName = 'Level-2';
                                            } else if (ptNameUpper === 'DISTRICT MANAGER') {
                                                targetLevelName = 'Level-3';
                                            } else if (ptNameUpper.includes('OPERATIONS EXECUTIVES') || ptNameUpper === 'OE') {
                                                targetLevelName = 'Level-4';
                                            } else if (ptNameUpper === 'DRIVERS' || ptNameUpper === 'DEO') {
                                                targetLevelName = 'Level-5';
                                            }
                                            
                                            if (targetLevelName) {
                                                const lvlObj = positionLevels?.find(l => l.name === targetLevelName);
                                                if (lvlObj) autoLevelId = String(lvlObj.id);
                                            }

                                            setFormData({
                                                ...formData,
                                                position_type: ptId,
                                                shifts: mappedShiftIds,
                                                role: autoRole,
                                                additional_roles: [],
                                                job: autoJob,
                                                additional_jobs: [],
                                                name: autoName,
                                                level: autoLevelId
                                            });
                                        }}
                                        placeholder="Select Position Type..."
                                        icon={Settings}
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><Clock size={14} /> Mapped Shifts</label>
                                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                                    {(() => {
                                        const ptObj = positionTypes?.find(pt => String(pt.id) === String(formData.position_type));
                                        const projId = formData._pos_project || ptObj?.project || formData._pos_project_id;
                                        const segId = formData._pos_segment || ptObj?.segment || formData._pos_segment_id;

                                        let filteredShifts = shifts || [];
                                        if (projId) {
                                            filteredShifts = filteredShifts.filter(s => {
                                                const sProjId = s.project_id || (s.project && typeof s.project === 'object' ? s.project.id : s.project);
                                                if (!sProjId) return true; // Global shifts apply everywhere
                                                return String(sProjId) === String(projId);
                                            });
                                            if (segId) {
                                                filteredShifts = filteredShifts.filter(s => {
                                                    const sSegId = s.segment_id || (s.segment && typeof s.segment === 'object' ? s.segment.id : s.segment);
                                                    if (!sSegId) return true;
                                                    return String(sSegId) === String(segId);
                                                });
                                            }
                                        }

                                        if (filteredShifts.length === 0) {
                                            return <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>No available shifts. Please select a Project or configure Shifts in Shift Master.</p>;
                                        }

                                        return (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                                {filteredShifts.map((shiftItem) => {
                                                    const currentShifts = formData.shifts || [];
                                                    const isChecked = currentShifts.some(sid => String(sid) === String(shiftItem.id));
                                                    return (
                                                        <label
                                                            key={shiftItem.id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.75rem',
                                                                padding: '0.6rem 0.85rem',
                                                                background: isChecked ? '#eff6ff' : '#ffffff',
                                                                border: isChecked ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                                                                borderRadius: '12px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    let nextShifts = [...currentShifts];
                                                                    if (e.target.checked) {
                                                                        nextShifts.push(shiftItem.id);
                                                                    } else {
                                                                        nextShifts = nextShifts.filter(sid => String(sid) !== String(shiftItem.id));
                                                                    }
                                                                    setFormData({ ...formData, shifts: nextShifts });
                                                                }}
                                                                style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                                                            />
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>{shiftItem.name}</span>
                                                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{shiftItem.start_time} - {shiftItem.end_time}</span>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><Calendar size={14} /> Activation Date</label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input type="date" className="premium-input" value={formData.start_date || ''} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Organizational Context */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Building2 size={18} /> Organizational Placement</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Layers size={14} /> Structural Tier (Office Level)</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={orgLevels?.map(l => ({ id: l.id, name: l.level_code ? `${l.level_code} - ${l.name}` : l.name })) || []}
                                        value={formData._pos_level_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _pos_level_filter: e.target.value, office: '', department: '', section: '' })}
                                        placeholder="All Tiers (State/Circle/Dist)"
                                        icon={Layers}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Building2 size={14} /> Assign to Office / Unit</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(() => {
                                            const filteredOffices = (offices || []).filter(o => {
                                                if (formData._pos_level_filter) {
                                                    const officeLevelId = o.level_id || (typeof o.level === 'object' ? o.level?.id : o.level);
                                                    if (String(officeLevelId) !== String(formData._pos_level_filter)) return false;
                                                }
                                                if (formData._pos_project) {
                                                    const projIds = o.project_ids?.map(String) || [];
                                                    if (!projIds.includes(String(formData._pos_project))) return false;
                                                }
                                                return true;
                                            });
                                            return filteredOffices.map(o => ({ id: o.id, name: o.name }));
                                        })()}
                                        value={formData.office || ''}
                                        onChange={(e) => {
                                            const officeId = e.target.value;
                                            const selectedOff = offices.find(o => String(o.id) === String(officeId));
                                            const masterPTs = selectedOff?.facility_master_details?.position_types || [];
                                            const autoPTId = masterPTs.length === 1 ? String(masterPTs[0]) : '';
                                            let autoShifts = [];
                                            let autoRole = '';
                                            let autoJob = '';
                                            let autoName = formData.name;
                                            let autoLevelId = formData.level || '';
                                            if (autoPTId) {
                                                console.log('⚡ [Office Select] autoPTId found from facility master:', autoPTId);
                                                const ptObj = positionTypes.find(pt => String(pt.id) === autoPTId);
                                                console.log('⚡ [Office Select] ptObj found:', ptObj);
                                                autoShifts = ptObj?.shifts || [];
                                                autoRole = ptObj?.role ? String(ptObj.role) : '';
                                                autoJob = ptObj?.job ? String(ptObj.job) : '';
                                                console.log('⚡ [Office Select] autoRole:', autoRole, 'autoJob:', autoJob);
                                                const selectedRoleObj = roles.find(r => String(r.id) === autoRole);
                                                autoName = selectedRoleObj ? selectedRoleObj.name : (ptObj ? ptObj.name : '');
                                                
                                                // Auto-determine designation level based on Position Type name
                                                const ptNameUpper = ptObj?.name?.toUpperCase() || '';
                                                let targetLevelName = '';
                                                if (ptNameUpper === 'COO' || ptNameUpper === 'SPH') {
                                                    targetLevelName = 'Level-1';
                                                } else if (ptNameUpper === 'REGIONAL MANAGER') {
                                                    targetLevelName = 'Level-2';
                                                } else if (ptNameUpper === 'DISTRICT MANAGER') {
                                                    targetLevelName = 'Level-3';
                                                } else if (ptNameUpper.includes('OPERATIONS EXECUTIVES') || ptNameUpper === 'OE') {
                                                    targetLevelName = 'Level-4';
                                                } else if (ptNameUpper === 'DRIVERS' || ptNameUpper === 'DEO') {
                                                    targetLevelName = 'Level-5';
                                                }
                                                
                                                if (targetLevelName) {
                                                    const lvlObj = positionLevels?.find(l => l.name === targetLevelName);
                                                    if (lvlObj) autoLevelId = String(lvlObj.id);
                                                }
                                            }

                                            // Get first project code linked to this office
                                            let projCode = '';
                                            if (selectedOff?.project_ids?.length > 0) {
                                                const firstProjId = selectedOff.project_ids[0];
                                                projCode = projects?.find(p => String(p.id) === String(firstProjId))?.code || '';
                                            }

                                            setFormData({
                                                ...formData,
                                                office: officeId,
                                                _pos_office_filter: officeId, // Sync filter
                                                department: '',
                                                section: '',
                                                position_type: autoPTId,
                                                shifts: autoShifts,
                                                role: autoRole,
                                                additional_roles: [],
                                                job: autoJob,
                                                additional_jobs: [],
                                                name: autoName,
                                                _pos_project_code: projCode,
                                                level: autoLevelId
                                            });
                                        }}
                                        disabled={!formData._pos_level_filter && !formData._pos_project && !formData.id}
                                        placeholder="Select Office..."
                                        icon={Building2}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Briefcase size={14} /> Department</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={departments.filter(d => 
                                            !formData._pos_project || String(d.project) === String(formData._pos_project) || !d.project || String(d.office) === String(formData.office)
                                        ).map(d => ({ id: d.id, name: `${d.name} (${d.project_name || 'General'})` }))}
                                        value={formData.department || ''}
                                        onChange={(e) => {
                                            const deptId = e.target.value;
                                            const dept = departments.find(d => String(d.id) === String(deptId));
                                            const projCode = dept?.project
                                                ? (projects?.find(p => String(p.id) === String(dept.project))?.code || '')
                                                : '';
                                            setFormData({ ...formData, department: deptId, section: '', _pos_project_code: projCode });
                                        }}
                                        disabled={!formData.office}
                                        placeholder="Select Department..."
                                        icon={Briefcase}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Layers size={14} /> Section / Team</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={sections.filter(s => {
                                            const sDeptId = (s.department && typeof s.department === 'object') ? s.department.id : s.department;
                                            const sDeptIdFinal = s.department_id || sDeptId;
                                            const formDeptId = (formData.department && typeof formData.department === 'object') ? formData.department.id : formData.department;
                                            return String(sDeptIdFinal) === String(formDeptId);
                                        }).map(s => ({ id: s.id, name: s.name }))}
                                        value={formData.section || ''}
                                        onChange={(e) => {
                                            const sectId = e.target.value;
                                            const sect = sections.find(s => String(s.id) === String(sectId));
                                            const projCode = sect?.project
                                                ? (projects?.find(p => String(p.id) === String(sect.project))?.code || formData._pos_project_code)
                                                : formData._pos_project_code;
                                            setFormData({ ...formData, section: sectId, _pos_project_code: projCode || formData._pos_project_code });
                                        }}
                                        disabled={!formData.department}
                                        placeholder="None / General"
                                        icon={Layers}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Job Specification (Functional Mapping) */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><ClipboardList size={18} /> Functional Mapping</div>
                        <div className="form-grid">
                            {(() => {
                                // Filter available Role Groups based on Position's Project and Segment
                                let filteredRolesList = roles || [];
                                if (formData._pos_project) {
                                    filteredRolesList = filteredRolesList.filter(r => {
                                        const rProjId = r.project_id || (r.project && typeof r.project === 'object' ? r.project.id : r.project);
                                        if (!rProjId) return true; // Global roles apply everywhere
                                        const matchesProj = String(rProjId) === String(formData._pos_project);
                                        if (formData._pos_segment) {
                                            const rSegId = r.segment_id || (r.segment && typeof r.segment === 'object' ? r.segment.id : r.segment);
                                            // Project-wide roles (no segment ID) should match any segment
                                            if (!rSegId) return matchesProj;
                                            return matchesProj && String(rSegId) === String(formData._pos_segment);
                                        }
                                        return matchesProj;
                                    });
                                } else {
                                    const selectedOffId = formData.office || formData._pos_office_filter;
                                    const selectedOff = offices.find(o => String(o.id) === String(selectedOffId));
                                    const officeProjIds = selectedOff?.project_ids?.map(id => String(id)) || [];
                                    if (officeProjIds.length > 0) {
                                        filteredRolesList = filteredRolesList.filter(r => {
                                            const rProjId = r.project_id || (r.project && typeof r.project === 'object' ? r.project.id : r.project);
                                            if (!rProjId) return true; // Global roles apply everywhere
                                            return officeProjIds.includes(String(rProjId));
                                        });
                                    }
                                }

                                const selectedRoleIds = [formData.role, ...(formData.additional_roles || [])].filter(Boolean).map(String);

                                const activeSubGroups = roleSubGroups?.filter(sg => {
                                    const sgRoleId = sg.role_group && typeof sg.role_group === 'object' ? sg.role_group.id : sg.role_group;
                                    return selectedRoleIds.includes(String(sgRoleId));
                                }) || [];

                                const activeJobs = jobs?.filter(j => {
                                    const jRoleId = j.role && typeof j.role === 'object' ? j.role.id : j.role;
                                    return selectedRoleIds.includes(String(jRoleId));
                                }) || [];

                                return (
                                    <>
                                        {/* Combined Role Group */}
                                        <div className="form-group full-width">
                                            <label className="premium-label"><Users size={14} /> Role Group <span style={{ color: '#ef4444' }}>*</span></label>
                                            <div className="premium-input-wrapper">
                                                <MultiSearchableSelect
                                                    options={filteredRolesList.map(r => ({ id: r.id, name: r.name }))}
                                                    value={selectedRoleIds}
                                                    onChange={(val) => {
                                                        const primaryRole = val[0] || '';
                                                        const additionalRoles = val.slice(1);
                                                        const selectedRoleObj = roles.find(r => String(r.id) === String(primaryRole));
                                                        
                                                        // Auto-populate Job for this primary role
                                                        const firstJobObj = jobs?.find(j => {
                                                            const jRoleId = j.role && typeof j.role === 'object' ? j.role.id : j.role;
                                                            return String(jRoleId) === String(primaryRole);
                                                        });
                                                        const autoJob = firstJobObj ? String(firstJobObj.id) : '';

                                                        setFormData({
                                                            ...formData,
                                                            role: primaryRole,
                                                            additional_roles: additionalRoles,
                                                            name: selectedRoleObj ? selectedRoleObj.name : formData.name,
                                                            job: autoJob
                                                        });
                                                    }}
                                                    placeholder="Select Role Groups..."
                                                    icon={Users}
                                                />
                                            </div>
                                        </div>

                                        {/* Combined Role Sub Group */}
                                        <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                                            <label className="premium-label"><Layers size={14} /> Role Sub Group</label>
                                            <div className="premium-input-wrapper">
                                                <MultiSearchableSelect
                                                    options={activeSubGroups.map(sg => ({ id: sg.id, name: sg.name }))}
                                                    value={[formData.role_sub_group, ...(formData.additional_sub_groups || [])].filter(Boolean).map(String)}
                                                    onChange={(val) => {
                                                        const primarySub = val[0] || '';
                                                        const additionalSubs = val.slice(1);
                                                        setFormData({
                                                            ...formData,
                                                            role_sub_group: primarySub,
                                                            additional_sub_groups: additionalSubs
                                                        });
                                                    }}
                                                    placeholder={selectedRoleIds.length === 0 ? "Please select a Role Group first" : activeSubGroups.length === 0 ? "No Sub Groups found for selected Role Group(s)" : "Select Role Sub Groups..."}
                                                    icon={Layers}
                                                    disabled={selectedRoleIds.length === 0 || activeSubGroups.length === 0}
                                                />
                                            </div>
                                        </div>

                                        {/* Combined Jobs */}
                                        <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                                            <label className="premium-label"><Briefcase size={14} /> Jobs</label>
                                            <div className="premium-input-wrapper">
                                                <MultiSearchableSelect
                                                    options={activeJobs.map(j => ({ id: j.id, name: j.name }))}
                                                    value={[formData.job, ...(formData.additional_jobs || [])].filter(Boolean).map(String)}
                                                    onChange={(val) => {
                                                        const primaryJob = val[0] || '';
                                                        const additionalJobs = val.slice(1);
                                                        setFormData({
                                                            ...formData,
                                                            job: primaryJob,
                                                            additional_jobs: additionalJobs
                                                        });
                                                    }}
                                                    placeholder={selectedRoleIds.length === 0 ? "Please select a Role Group first" : activeJobs.length === 0 ? "No Jobs found for selected Role Group(s)" : "Select Jobs..."}
                                                    icon={Briefcase}
                                                    disabled={selectedRoleIds.length === 0 || activeJobs.length === 0}
                                                />
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>




                    {/* Reporting Hierarchy */}
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Network size={18} /> Reporting Hierarchy</div>

                        <div className="form-group full-width">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label className="premium-label" style={{ margin: 0 }}><Users size={14} /> Multi-Reporting Lines (Reporting To)</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <SearchableSelect
                                        options={orgLevels?.map(l => ({ id: l.id, name: l.level_code ? `${l.level_code} - ${l.name}` : l.name })) || []}
                                        value={formData._rep_level_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _rep_level_filter: e.target.value, _rep_office_filter: '', _rep_pos_level_filter: '' })}
                                        placeholder="Office Level"
                                        style={{ padding: '4px 10px', fontSize: '0.75rem', height: '32px', width: '140px', borderRadius: '8px' }}
                                    />
                                    <SearchableSelect
                                        options={offices.filter(o => formData._rep_level_filter && o.level == formData._rep_level_filter).map(o => ({ id: o.id, name: o.name }))}
                                        value={formData._rep_office_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _rep_office_filter: e.target.value })}
                                        disabled={!formData._rep_level_filter}
                                        placeholder="Specific Office"
                                        style={{ padding: '4px 10px', fontSize: '0.75rem', height: '32px', width: '150px', borderRadius: '8px' }}
                                    />
                                    <SearchableSelect
                                        options={positionLevels?.map(l => ({ id: l.id, name: l.name })) || []}
                                        value={formData._rep_pos_level_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _rep_pos_level_filter: e.target.value })}
                                        placeholder="Rank Filter"
                                        style={{ padding: '4px 10px', fontSize: '0.75rem', height: '32px', width: '130px', borderRadius: '8px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginBottom: '1.25rem' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    className="premium-input"
                                    placeholder="Quick Search: Type position title, code, office, or role to search directly..."
                                    value={hierarchySearchTerm}
                                    onChange={(e) => setHierarchySearchTerm(e.target.value)}
                                    style={{
                                        paddingLeft: '36px',
                                        height: '40px',
                                        fontSize: '0.85rem',
                                        borderRadius: '10px',
                                        border: '1px solid #cbd5e1',
                                        width: '100%',
                                        background: '#ffffff',
                                        transition: 'all 0.2s',
                                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                />
                                {hierarchySearchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setHierarchySearchTerm('')}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            color: '#64748b',
                                            background: '#f1f5f9',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '2px 8px',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            fontWeight: 500
                                        }}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div style={{
                                maxHeight: '300px',
                                overflowY: 'auto',
                                padding: '1.5rem',
                                background: '#f8fafc',
                                borderRadius: '20px',
                                border: '1px solid #e2e8f0',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '1rem'
                            }}>
                                {getFilteredReportingPositions()
                                    .map(p => (
                                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                            <input
                                                type="checkbox"
                                                value={p.id}
                                                checked={(formData.reporting_to || []).map(id => Number(id)).includes(Number(p.id))}
                                                onChange={(e) => {
                                                    const currentIds = (formData.reporting_to || []).map(id => Number(id));
                                                    const pid = Number(p.id);
                                                    const newIds = e.target.checked
                                                        ? [...currentIds, pid]
                                                        : currentIds.filter(id => id !== pid);
                                                    setFormData({ ...formData, reporting_to: newIds });
                                                }}
                                                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>{p.name}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.office_name} • {p.role_name}</span>
                                            </div>
                                        </label>
                                    ))
                                }
                                {positionsLoading ? (
                                    <div style={{ color: '#881337', fontStyle: 'italic', fontSize: '0.85rem', padding: '1.5rem', gridColumn: '1/-1', textAlign: 'center', fontWeight: 600 }}>
                                        Loading positions from server...
                                    </div>
                                ) : getFilteredReportingPositions().length === 0 ? (
                                    <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem', padding: '1rem', gridColumn: '1/-1', textAlign: 'center' }}>
                                        No reporting positions available for the selected filters.
                                    </div>
                                ) : null}
                            </div>
                            <p className="form-help-text" style={{ marginTop: '0.75rem' }}>Select one or more positions that this position reports to (Matrix Reporting Support).</p>
                        </div>
                    </div>
                </div>
            );

        case 'Position Assignments':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><ArrowRightLeft size={18} /> Assignment Details</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Briefcase size={14} /> Which Position Are You Delegating?</label>
                                <div className="premium-input-wrapper">
                                    {(() => {
                                        const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
                                        const myPositions = currentUser?.positions_details || [];
                                        const isDisabled = myPositions.length === 1;

                                        return (
                                            <SearchableSelect
                                                options={myPositions.map(p => ({ id: String(p.id), name: `${p.name} (${p.office_name})` }))}
                                                value={formData.position || ''}
                                                onChange={(e) => {
                                                    const selectedPos = myPositions.find(p => p.id == e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        position: e.target.value,
                                                        assignee: '',
                                                        _assignee_level_filter: 'SAME', // Default to same level
                                                        _assignee_office_filter: selectedPos?.office_id ? String(selectedPos.office_id) : '',
                                                        _selected_position_name: selectedPos?.name || '',
                                                        _selected_position_office: selectedPos?.office_name || '',
                                                        _selected_position_dept: selectedPos?.department_name || ''
                                                    });
                                                }}
                                                placeholder="Select one of your positions"
                                                icon={Briefcase}
                                                disabled={isDisabled}
                                            />
                                        );
                                    })()}
                                </div>
                                <p className="form-help-text">You can only delegate positions that you currently hold.</p>

                                {formData.position && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '12px 16px',
                                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                        borderRadius: '12px',
                                        border: '1px solid #bae6fd',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'center'
                                    }}>
                                        <Briefcase size={16} color="#0284c7" />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 700, marginBottom: '4px' }}>
                                                DELEGATING POSITION
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#0c4a6e', fontWeight: 600 }}>
                                                {formData._selected_position_name}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '2px' }}>
                                                {formData._selected_position_office} • {formData._selected_position_dept}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <label className="premium-label" style={{ margin: 0 }}><Users size={14} /> Assignee (Employee)</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Filtered by Position:</span>

                                        <SearchableSelect
                                            options={[
                                                { id: '', name: 'All Levels' },
                                                { id: 'ABOVE', name: 'One Level Above (Reporting Officers)' },
                                                { id: 'SAME', name: 'Same Level (Colleagues)' },
                                                { id: 'BELOW', name: 'One Level Below (Subordinates)' }
                                            ]}
                                            value={formData._assignee_level_filter || ''}
                                            onChange={(e) => setFormData({ ...formData, _assignee_level_filter: e.target.value, assignee: '' })}
                                            placeholder="All Levels"
                                            style={{ padding: '4px 10px', fontSize: '0.75rem', height: '32px', width: '180px', borderRadius: '8px' }}
                                        />

                                        <SearchableSelect
                                            options={offices?.map(o => ({ id: o.id, name: o.name })) || []}
                                            value={formData._assignee_office_filter || ''}
                                            onChange={(e) => setFormData({ ...formData, _assignee_office_filter: e.target.value, assignee: '' })}
                                            placeholder="All Offices"
                                            style={{ padding: '4px 10px', fontSize: '0.75rem', height: '32px', width: '120px', borderRadius: '8px' }}
                                        />
                                    </div>
                                </div>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(() => {
                                            const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
                                            const myEmpId = currentUser?.employee_profile_id;

                                            // 1. Initial filter: exclude self
                                            let filtered = (allEmployees || []).filter(emp => String(emp.id) !== String(myEmpId));

                                            // 2. Get the selected position detail to know our current level/office
                                            const positions = currentUser?.positions_details || [];
                                            const selectedPosition = positions.find(p => String(p.id) === String(formData.position));

                                            if (!selectedPosition) {
                                                return []; // Return empty array if no position selected
                                            }

                                            const selectedLevelId = selectedPosition.level;
                                            const currentLevelObj = positionLevels?.find(l => l.id == selectedLevelId);
                                            const currentLevelRank = currentLevelObj?.rank || 0;

                                            // 3. Apply Office filter
                                            if (formData._assignee_office_filter) {
                                                filtered = filtered.filter(emp =>
                                                    emp.positions_details?.some(p => String(p.office_id || p.office) === String(formData._assignee_office_filter))
                                                );
                                            }

                                            // 4. Apply Level filter: Hierarchical (Above/Same/Below)
                                            if (formData._assignee_level_filter) {
                                                filtered = filtered.filter(emp => {
                                                    return (emp.positions_details || []).some(p => {
                                                        const empLevelObj = positionLevels?.find(l => l.id == p.level);
                                                        const empLevelRank = empLevelObj?.rank || 0;

                                                        if (formData._assignee_level_filter === 'ABOVE') {
                                                            return empLevelRank < currentLevelRank; // Lower rank number means higher position
                                                        } else if (formData._assignee_level_filter === 'SAME') {
                                                            return empLevelRank === currentLevelRank;
                                                        } else if (formData._assignee_level_filter === 'BELOW') {
                                                            return empLevelRank > currentLevelRank;
                                                        }
                                                        return false;
                                                    });
                                                });
                                            }

                                            return filtered.map(emp => ({ id: emp.id, name: `${emp.name} - ${emp.employee_code}` }));
                                        })()}
                                        value={formData.assignee || ''}
                                        onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                                        placeholder="Select Assignee..."
                                        icon={Users}
                                        required
                                    />
                                </div>
                                <p className="form-help-text">Select the person you want to assign this position to. Use filters above to narrow down the list.</p>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><ShieldAlert size={14} /> Assignment Type</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'NORMAL', name: 'Normal Assignment' },
                                            { id: 'FORCED', name: 'Forced Assignment' }
                                        ]}
                                        value={formData.assignment_type || 'NORMAL'}
                                        onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                                        placeholder="Select Type..."
                                        icon={ShieldAlert}
                                        required
                                    />
                                </div>
                                <p className="form-help-text">Forced: Approvals required, but you lose reporting visibility.</p>
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><Calendar size={14} /> Expiry Date (Optional)</label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input type="date" className="premium-input" value={formData.expires_at || ''} onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><FileText size={14} /> Notes / Instructions</label>
                                <div className="premium-input-wrapper">
                                    <textarea
                                        className="premium-input"
                                        style={{ height: '80px', padding: '12px' }}
                                        placeholder="Enter any instructions or reason for assignment..."
                                        value={formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Geo Territory':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Globe size={18} /> Territory Definition</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> Territory / Continent Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Globe className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Territory Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value.toUpperCase(), 100, 'geo_name') })} required />
                                </div>
                                {validationErrors.geo_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.geo_name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Countries':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Globe size={18} /> Country Definition</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Map size={14} /> Territory / Continent <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoContinents?.map(c => ({ id: c.id, name: c.name })) || []}
                                        value={formData.continent_ref || ''}
                                        onChange={(e) => setFormData({ ...formData, continent_ref: e.target.value })}
                                        placeholder="Select Territory..."
                                        icon={Map}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> Country Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Globe className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Country Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value.toUpperCase(), 100, 'geo_name') })} required />
                                </div>
                                {validationErrors.geo_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.geo_name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'States':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Map size={18} /> State Definition</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Map size={14} /> Filter by Territory</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoContinents?.map(c => ({ id: c.id, name: c.name })) || []}
                                        value={formData._territory_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _territory_filter: e.target.value, country: '' })}
                                        placeholder="All Territories"
                                        icon={Map}
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Globe size={14} /> Country <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoCountries?.filter(c => !formData._territory_filter || c.continent_ref == formData._territory_filter).map(c => ({ id: c.id, name: c.name })) || []}
                                        value={formData.country || ''}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        placeholder="Select Country..."
                                        icon={Globe}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> State Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <MapPin className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter State Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value.toUpperCase(), 100, 'geo_name') })} required />
                                </div>
                                {validationErrors.geo_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.geo_name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Districts':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><MapPin size={18} /> District Definition</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Map size={14} /> Filter by Territory</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoContinents?.map(c => ({ id: c.id, name: c.name })) || []}
                                        value={formData._territory_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _territory_filter: e.target.value, _country_filter: '', state: '' })}
                                        placeholder="All Territories"
                                        icon={Map}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Globe size={14} /> Filter by Country</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoCountries?.filter(c => !formData._territory_filter || c.continent_ref == formData._territory_filter).map(c => ({ id: c.id, name: c.name })) || []}
                                        value={formData._country_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _country_filter: e.target.value, state: '' })}
                                        placeholder="All Countries"
                                        icon={Globe}
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Map size={14} /> State</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoStatesData?.filter(s => !formData._country_filter || s.country == formData._country_filter).map(s => ({ id: s.id, name: s.name })) || []}
                                        value={formData.state || ''}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        placeholder="Select State..."
                                        icon={Map}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> District Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <MapPin className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter District Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value.toUpperCase(), 100, 'geo_name') })} required />
                                </div>
                                {validationErrors.geo_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.geo_name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Mandals':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Navigation size={18} /> Mandal Definition</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Map size={14} /> Filter by Territory</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoContinents?.map(c => ({ id: c.id, name: c.name })) || []}
                                        value={formData._territory_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _territory_filter: e.target.value, _country_filter: '', _state_filter: '', district: '' })}
                                        placeholder="All Territories"
                                        icon={Map}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Globe size={14} /> Filter by Country</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoCountries?.filter(c => !formData._territory_filter || c.continent_ref == formData._territory_filter).map(c => ({ id: c.id, name: c.name })) || []}
                                        value={formData._country_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _country_filter: e.target.value, _state_filter: '', district: '' })}
                                        placeholder="All Countries"
                                        icon={Globe}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Map size={14} /> Filter by State</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoStatesData?.filter(s => !formData._country_filter || s.country == formData._country_filter).map(s => ({ id: s.id, name: s.name })) || []}
                                        value={formData._state_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _state_filter: e.target.value, _district_filter: '', district: '' })}
                                        placeholder="All States"
                                        icon={Map}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><MapPin size={14} /> District</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoDistrictsData?.filter(d => !formData._state_filter || d.state == formData._state_filter).map(d => ({ id: d.id, name: d.name })) || []}
                                        value={formData.district || ''}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        placeholder="Select District..."
                                        icon={MapPin}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> Mandal Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Navigation className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Mandal Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value.toUpperCase(), 100, 'geo_name') })} required />
                                </div>
                                {validationErrors.geo_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.geo_name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );



        case 'Visiting Locations':
        case 'Hotspots':
        case 'Landmarks':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><MapPin size={18} /> Location Definition</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Map size={14} /> Filter by Territory</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoContinents?.map(c => ({ id: c.id, name: c.name })) || []}
                                        value={formData._territory_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _territory_filter: e.target.value, _country_filter: '', _state_filter: '', _district_filter: '', _mandal_filter: '', cluster: '' })}
                                        placeholder="All Territories"
                                        icon={Map}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Globe size={14} /> Filter by Country</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(geoCountries || []).filter(c => c.continent_ref == formData._territory_filter).map(c => ({ id: c.id, name: c.name })) || []}
                                        value={formData._country_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _country_filter: e.target.value, _state_filter: '', _district_filter: '', _mandal_filter: '', cluster: '' })}
                                        disabled={!formData._territory_filter}
                                        placeholder={formData._territory_filter ? "All Countries" : "Select Territory First"}
                                        icon={Globe}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Map size={14} /> Filter by State</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={(geoStatesData || []).filter(s => s.country == formData._country_filter).map(s => ({ id: s.id, name: s.name })) || []}
                                        value={formData._state_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _state_filter: e.target.value, _district_filter: '', _mandal_filter: '', cluster: '' })}
                                        disabled={!formData._country_filter}
                                        placeholder={formData._country_filter ? "All States" : "Select Country First"}
                                        icon={Map}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><MapPin size={14} /> Filter by District</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoDistrictsData?.filter(d => String(d.state) === String(formData._state_filter))?.map(d => ({ id: d.id, name: d.name })) || []}
                                        value={formData._district_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _district_filter: e.target.value, _mandal_filter: '', cluster: '' })}
                                        disabled={!formData._state_filter}
                                        placeholder={formData._state_filter ? "All Districts" : "Select State First"}
                                        icon={MapPin}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Navigation size={14} /> Filter by Mandal</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoMandals?.filter(m => String(m.district) === String(formData._district_filter))?.map(m => ({ id: m.id, name: m.name })) || []}
                                        value={formData._mandal_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _mandal_filter: e.target.value, cluster: '' })}
                                        disabled={!formData._district_filter}
                                        placeholder={formData._district_filter ? "All Mandals" : "Select District First"}
                                        icon={Navigation}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Layers size={14} /> Cluster <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoClusters?.filter(c => String(c.mandal) === String(formData._mandal_filter))?.map(c => ({
                                            id: String(c.id),
                                            name: `${c.name} (${c.cluster_type_display})`
                                        })) || []}
                                        value={formData.cluster || ''}
                                        onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
                                        disabled={!formData._mandal_filter}
                                        placeholder={formData._mandal_filter ? "Select Cluster" : "Select Mandal First"}
                                        icon={Layers}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> Location Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Location Name (e.g. South Gate)" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value.toUpperCase(), 50, 'geo_name') })} required />
                                </div>
                                {validationErrors.geo_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.geo_name}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><MapPin size={14} /> Latitude <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <MapPin className="premium-input-icon" size={18} />
                                    <input type="number" step="0.00000001" className="premium-input" placeholder="e.g. 17.3850" value={formData.latitude || ''} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><MapPin size={14} /> Longitude <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <MapPin className="premium-input-icon" size={18} />
                                    <input type="number" step="0.00000001" className="premium-input" placeholder="e.g. 78.4867" value={formData.longitude || ''} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><User size={14} /> Contact Person</label>
                                <div className="premium-input-wrapper">
                                    <User className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Person Name" value={formData.contact_person || ''} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Phone size={14} /> Contact Number</label>
                                <div className="premium-input-wrapper">
                                    <Phone className="premium-input-icon" size={18} />
                                    <input
                                        type="tel"
                                        className="premium-input"
                                        placeholder="Enter Contact Number"
                                        value={formData.contact_number || ''}
                                        onChange={(e) => setFormData({ ...formData, contact_number: validatePhone(e.target.value, 'geo_phone') })}
                                    />
                                </div>
                                {validationErrors.geo_phone && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.geo_phone}
                                    </div>
                                )}
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><MapPin size={14} /> Detailed Address</label>
                                <div className="premium-input-wrapper">
                                    <MapPin className="premium-input-icon" style={{ top: '1.5rem', transform: 'none' }} size={18} />
                                    <textarea
                                        className="premium-input"
                                        rows="3"
                                        placeholder="Street, Building, landmark details..."
                                        value={formData.address || ''}
                                        onChange={(e) => setFormData({ ...formData, address: validateAddress(e.target.value, 500, 'geo_address') })}
                                        style={{ paddingLeft: '3rem', paddingTop: '1rem' }}
                                    />
                                </div>
                                {validationErrors.geo_address && (
                                    <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px', marginLeft: '3rem' }}>
                                        ⚠ {validationErrors.geo_address}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Clusters':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Layers size={18} /> Cluster Definition</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="premium-label"><Map size={14} /> Filter by Territory</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoContinents?.map(c => ({ id: c.id, name: c.name })) || []}
                                        value={formData._territory_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _territory_filter: e.target.value, _country_filter: '', _state_filter: '', _district_filter: '', mandal: '' })}
                                        placeholder="All Territories"
                                        icon={Map}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Globe size={14} /> Filter by Country</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoCountries?.filter(c => String(c.continent_ref) === String(formData._territory_filter))?.map(c => ({ id: c.id, name: c.name })) || []}
                                        value={formData._country_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _country_filter: e.target.value, _state_filter: '', _district_filter: '', mandal: '' })}
                                        disabled={!formData._territory_filter}
                                        placeholder={formData._territory_filter ? "All Countries" : "Select Territory First"}
                                        icon={Globe}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Map size={14} /> Filter by State</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoStatesData?.filter(s => String(s.country) === String(formData._country_filter))?.map(s => ({ id: s.id, name: s.name })) || []}
                                        value={formData._state_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _state_filter: e.target.value, _district_filter: '', mandal: '' })}
                                        disabled={!formData._country_filter}
                                        placeholder={formData._country_filter ? "All States" : "Select Country First"}
                                        icon={Map}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><MapPin size={14} /> Filter by District</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoDistrictsData?.filter(d => String(d.state) === String(formData._state_filter))?.map(d => ({ id: d.id, name: d.name })) || []}
                                        value={formData._district_filter || ''}
                                        onChange={(e) => setFormData({ ...formData, _district_filter: e.target.value, mandal: '' })}
                                        disabled={!formData._state_filter}
                                        placeholder={formData._state_filter ? "All Districts" : "Select State First"}
                                        icon={MapPin}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Navigation size={14} /> Mandal <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={geoMandals?.filter(m => String(m.district) === String(formData._district_filter))?.map(m => ({ id: m.id, name: m.name })) || []}
                                        value={formData.mandal || ''}
                                        onChange={(e) => setFormData({ ...formData, mandal: e.target.value })}
                                        disabled={!formData._district_filter}
                                        placeholder={formData._district_filter ? "Select Mandal" : "Select District First"}
                                        icon={Navigation}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Settings size={14} /> Cluster Category <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'METROPOLITAN', name: 'Metropolitan' },
                                            { id: 'CITY', name: 'City' },
                                            { id: 'TOWN', name: 'Town' },
                                            { id: 'VILLAGE', name: 'Village' }
                                        ]}
                                        value={formData.cluster_type || ''}
                                        onChange={(e) => setFormData({ ...formData, cluster_type: e.target.value })}
                                        placeholder="Select Category..."
                                        icon={Settings}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="premium-label"><Edit size={14} /> Cluster Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Edit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Cluster Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: validateName(e.target.value.toUpperCase(), 50, 'geo_name') })} required />
                                </div>
                                {validationErrors.geo_name && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.geo_name}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="premium-label"><FileDigit size={14} /> Cluster Code (Short Code)</label>
                                <div className="premium-input-wrapper">
                                    <FileDigit className="premium-input-icon" size={18} />
                                    <input
                                        type="text"
                                        className="premium-input"
                                        placeholder="Enter 3-5 letter Code (e.g. HYD, VIJAY)"
                                        value={formData.code || ''}
                                        onChange={(e) => {
                                            const alpha = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 5);
                                            setFormData({ ...formData, code: alpha });
                                        }}
                                    />
                                </div>
                                {validationErrors.geo_code && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <X size={12} /> {validationErrors.geo_code}
                                    </div>
                                )}
                                <p className="form-help-text">3 to 5 letters only (e.g. HYD, VIJAY). No numbers or special characters.</p>
                            </div>
                        </div>
                    </div>
                </div>
            );



        case 'Payslips':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Banknote size={18} /> Payroll Processing</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Users size={14} /> Employee</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        endpoint="employees/all_data"
                                        value={formData.employee || ''}
                                        onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                        placeholder="Select Employee..."
                                        icon={Users}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Calendar size={14} /> Month</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => ({ id: m, name: m }))}
                                        value={formData.month || ''}
                                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                        placeholder="Select Month..."
                                        icon={Calendar}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Calendar size={14} /> Year</label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input
                                        type="number"
                                        className="premium-input"
                                        value={formData.year || new Date().getFullYear()}
                                        onChange={(e) => {
                                            const val = e.target.value.slice(0, 4);
                                            if (val.length <= 4) setFormData({ ...formData, year: val });
                                        }}
                                        min={1900}
                                        max={2099}
                                        placeholder="YYYY"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Wallet size={14} /> Net Salary</label>
                                <div className="premium-input-wrapper">
                                    <Wallet className="premium-input-icon" size={18} />
                                    <input type="number" className="premium-input" value={formData.net_salary || ''} onChange={(e) => setFormData({ ...formData, net_salary: e.target.value })} required />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'Education': {
            const targetEmployee = (allEmployees || []).find(e => e.id == formData?.employee) || selectedEmployee;

            const academicTiers = [
                { id: 'SSC', label: 'Secondary', sub: '10th / Foundation', icon: '10' },
                { id: 'INTER', label: 'Sr. Secondary', sub: '12th / Inter', icon: '12' },
                { id: 'ITI', label: 'Vocational', sub: 'ITI / Trade', icon: 'V' },
                { id: 'DIPLOMA', label: 'Diploma', sub: 'Technical', icon: 'D' },
                { id: 'UG', label: 'Undergraduate', sub: 'Bachelors', icon: 'UG' },
                { id: 'PG', label: 'Postgraduate', sub: 'Masters', icon: 'PG' },
                { id: 'PHD', label: 'Doctorate', sub: 'PhD / Research', icon: 'Dr' },
                { id: 'OTHER', label: 'Other', sub: 'Certifications', icon: 'C' }
            ];

            const activeTierId = formData.level_type || 'UG';
            const activeTier = academicTiers.find(t => t.id === activeTierId) || academicTiers[4];

            const handleTierSelect = (tier) => {
                setFormData({
                    ...formData,
                    level_type: tier.id,
                    specialization: (tier.id === 'SSC' || tier.id === 'INTER') ? '' : formData.specialization
                });
            };

            const getPh = (id) => {
                if (id === 'SSC') return { q: 'Secondary School Certificate', i: 'School Name', b: 'Board', s: 'N/A' };
                if (id === 'INTER') return { q: 'Intermediate / HSC', i: 'Junior College', b: 'Board', s: 'Stream' };
                if (id === 'ITI') return { q: 'Trade Certificate', i: 'Industrial Training Inst.', b: 'NCVT / SCVT', s: 'Trade' };
                if (id === 'DIPLOMA') return { q: 'Diploma in Engineering', i: 'Polytechnic', b: 'SBTET / Univ', s: 'Branch' };
                if (id === 'UG') return { q: 'Degree', i: 'College Name', b: 'University', s: 'Major' };
                if (id === 'PG') return { q: 'Master Degree', i: 'College / Dept', b: 'University', s: 'Specialization' };
                if (id === 'PHD') return { q: 'Doctorate', i: 'University', b: 'University', s: 'Research Area' };
                return { q: 'Qualification Name', i: 'Institution', b: 'Issuing Body', s: 'Specialization' };
            };
            const ph = getPh(activeTierId);

            return (
                <div className="education-form-container fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '1rem', borderBottom: '1px solid #f8fafc' }}>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#be185d', letterSpacing: '-1px', margin: 0 }}>Add New Education</h2>
                        </div>
                        {targetEmployee && (
                            <div className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', textAlign: 'right' }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Employee Context</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{targetEmployee.name}</div>
                                <div style={{ fontSize: '0.7rem', color: '#be185d', fontWeight: 700 }}>{targetEmployee.employee_code}</div>
                            </div>
                        )}
                    </div>

                    {/* Tier Selector */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 1rem 0', overflowX: 'auto', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', position: 'relative', padding: '0 20px' }}>
                            {/* Connector Line */}
                            <div style={{ position: 'absolute', top: '25px', left: '40px', right: '40px', height: '2px', background: '#e2e8f0', zIndex: 0 }}></div>

                            {academicTiers.map((tier) => {
                                const isActive = activeTierId === tier.id;
                                return (
                                    <div key={tier.id} onClick={() => handleTierSelect(tier)} style={{ cursor: 'pointer', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s ease', transform: isActive ? 'scale(1.05)' : 'scale(1)', minWidth: 80 }}>
                                        <div style={{
                                            width: '50px', height: '50px',
                                            borderRadius: '16px',
                                            background: isActive ? '#fff' : '#f8fafc',
                                            border: isActive ? '2px solid #be185d' : '1px solid #e2e8f0',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isActive ? '#be185d' : '#94a3b8',
                                            fontWeight: 800, fontSize: '0.9rem',
                                            boxShadow: isActive ? '0 10px 20px rgba(190, 24, 93, 0.15)' : 'none',
                                            marginBottom: '8px',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {tier.icon}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#1e293b' : '#94a3b8', textAlign: 'center', lineHeight: '1.2' }}>{tier.label}</div>
                                        <div style={{ fontSize: '0.6rem', color: isActive ? '#be185d' : '#cbd5e1', fontWeight: 600, marginTop: 2 }}>{tier.sub}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '-1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <History size={12} />
                        Sequential entry (SSC → Sr. Sec → Graduation) ensures full historical integrity.
                    </div>

                    {/* Form Layout */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem' }}>
                        <div className="glass" style={{ padding: '2rem', border: '1px solid #fff7ed', background: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.5rem', color: '#475569', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <Sparkles size={16} color="#be185d" /> 2. Level-Specific Details
                            </div>

                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                                <div className="form-group full-width">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Employee</label>
                                    <SearchableSelect
                                        endpoint="employees/all_data"
                                        value={formData.employee || ''}
                                        onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                        placeholder="Select Employee..."
                                        disabled={!!targetEmployee}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', gap: '6px', alignItems: 'center' }}><GraduationCap size={14} /> Qualification Name / Degree</label>
                                    <input type="text" className="form-input" style={{ fontSize: '1rem', fontWeight: 600, padding: '12px' }} value={formData.qualification || ''} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} placeholder={ph.q} required />
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', gap: '6px', alignItems: 'center' }}><Building2 size={14} /> Board / Body</label>
                                    <input type="text" className="form-input" style={{ fontSize: '0.9rem', padding: '12px' }} value={formData.board_university || ''} onChange={(e) => setFormData({ ...formData, board_university: e.target.value })} placeholder={ph.b} />
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', gap: '6px', alignItems: 'center' }}><MapPin size={14} /> Institution / Institute</label>
                                    <input type="text" className="form-input" style={{ fontSize: '0.9rem', padding: '12px' }} value={formData.institution || ''} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} placeholder={ph.i} required />
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', gap: '6px', alignItems: 'center' }}><Calendar size={14} /> Year of Passing</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        style={{ fontSize: '0.9rem', padding: '12px' }}
                                        value={formData.year_of_passing || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.slice(0, 4);
                                            if (val.length <= 4) setFormData({ ...formData, year_of_passing: val });
                                        }}
                                        placeholder="YYYY"
                                        min={1950}
                                        max={2099}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', gap: '6px', alignItems: 'center' }}><BarChart3 size={14} /> Score / CGPA / %</label>
                                    <input type="text" className="form-input" style={{ fontSize: '0.9rem', padding: '12px' }} value={formData.percentage || ''} onChange={(e) => setFormData({ ...formData, percentage: e.target.value })} placeholder="Final Result" />
                                </div>

                                {(activeTierId !== 'SSC' && activeTierId !== 'INTER') && (
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', gap: '6px', alignItems: 'center' }}><TrendingUp size={14} /> Stream / Major / Specialization</label>
                                        <input type="text" className="form-input" style={{ fontSize: '0.9rem', padding: '12px' }} value={formData.specialization || ''} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder={ph.s} />
                                    </div>
                                )}

                                <div className="form-group full-width">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', gap: '6px', alignItems: 'center' }}><Map size={14} /> Location</label>
                                    <input type="text" className="form-input" style={{ fontSize: '0.9rem', padding: '12px' }} value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Enter Location" />
                                </div>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '2rem', border: '1px solid #fff7ed', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#be185d', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', gap: '8px', alignItems: 'center' }}><FileText size={16} /> {activeTier.label} Certificate</label>
                            <div className="file-upload-zone" style={{ flex: 1, minHeight: '300px', border: '2px dashed #cbd5e1', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', position: 'relative' }}>
                                <input type="file" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={(e) => setFormData({ ...formData, certificate: e.target.files[0] })} />
                                <div style={{ textAlign: 'center' }}>
                                    {formData.certificate ? (
                                        <div className="fade-in">
                                            <ShieldCheck size={40} color="#22c55e" style={{ marginBottom: 10 }} />
                                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>{formData.certificate.name}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#166534' }}>Ready to Upload</div>
                                        </div>
                                    ) : (
                                        <div className="fade-in">
                                            <div style={{ width: 50, height: 50, background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#64748b' }}><Plus size={24} /></div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Drag or Click to Upload</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>Supports PDF, JPG (Max 5MB)</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'Experience': {
            const targetEmployee = (allEmployees || []).find(e => e.id == formData?.employee) || selectedEmployee;
            return (
                <div className="experience-form-container fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Premium Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px', margin: 0 }}>Professional Tenure</h2>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Document historical work experience and credentials</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem' }}>
                        {/* Information Details Area */}
                        <div className="glass" style={{ padding: '2rem', border: '1px solid #fde6cd', background: 'rgba(255, 255, 255, 0.5)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', borderBottom: '1px solid #fde6cd', paddingBottom: '1rem' }}>
                                <Sparkles size={18} color="var(--primary)" />
                                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 800, color: '#475569' }}>
                                    Experience Metadata
                                </h3>
                            </div>

                            <div className="form-grid" style={{ gap: '1.25rem' }}>
                                <div className="form-group full-width">
                                    <label className="premium-label"><Users size={14} /> Employee Context</label>
                                    {targetEmployee ? (
                                        <div className="premium-input-wrapper" style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
                                            <Users className="premium-input-icon" size={18} />
                                            <div style={{ padding: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
                                                {targetEmployee.name} <span style={{ color: '#64748b', fontWeight: 500 }}>({targetEmployee.employee_code})</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="premium-input-wrapper">
                                            <SearchableSelect
                                                endpoint="employees/all_data"
                                                value={formData.employee || ''}
                                                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                                placeholder="Select Employee..."
                                                icon={Users}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="form-group full-width">
                                    <label className="premium-label"><Building2 size={14} /> Organization Name</label>
                                    <div className="premium-input-wrapper">
                                        <Building2 className="premium-input-icon" size={18} />
                                        <input type="text" className="premium-input" placeholder="Enter Organization Name" value={formData.company || ''} onChange={(e) => setFormData({ ...formData, company: e.target.value })} required />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label className="premium-label"><Briefcase size={14} /> Designation / Role</label>
                                    <div className="premium-input-wrapper">
                                        <Briefcase className="premium-input-icon" size={18} />
                                        <input type="text" className="premium-input" placeholder="Enter Designation" value={formData.job_title || ''} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="premium-label"><Calendar size={14} /> Start Date</label>
                                    <div className="premium-input-wrapper">
                                        <Calendar className="premium-input-icon" size={18} />
                                        <input type="date" className="premium-input" value={formData.from_date || ''} onChange={(e) => setFormData({ ...formData, from_date: e.target.value })} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="premium-label"><Calendar size={14} /> End Date</label>
                                    <div className="premium-input-wrapper">
                                        <Calendar className="premium-input-icon" size={18} />
                                        <input type="date" className="premium-input" value={formData.to_date || ''} onChange={(e) => setFormData({ ...formData, to_date: e.target.value })} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="premium-label"><MapPin size={14} /> Work Location</label>
                                    <div className="premium-input-wrapper">
                                        <MapPin className="premium-input-icon" size={18} />
                                        <input type="text" className="premium-input" placeholder="Enter Work Location" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="premium-label"><Wallet size={14} /> Last Annual CTC</label>
                                    <div className="premium-input-wrapper">
                                        <Wallet className="premium-input-icon" size={18} />
                                        <input type="text" className="premium-input" placeholder="Enter Last Annual CTC" value={formData.last_ctc || ''} onChange={(e) => setFormData({ ...formData, last_ctc: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label className="premium-label"><FileText size={14} /> Core Responsibilities</label>
                                    <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                        <FileText className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                        <textarea className="premium-input" rows="3" placeholder="Summarize key projects and achievements..." value={formData.responsibilities || ''} onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })} style={{ paddingLeft: '3rem', paddingTop: '1rem' }} />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label className="premium-label"><Navigation size={14} /> Reason for Exit</label>
                                    <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                        <Navigation className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                        <textarea className="premium-input" rows="2" placeholder="Brief reason for leaving..." value={formData.reason_for_leaving || ''} onChange={(e) => setFormData({ ...formData, reason_for_leaving: e.target.value })} style={{ paddingLeft: '3rem', paddingTop: '1rem' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upload Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="glass" style={{ padding: '2rem', border: '1px solid #fde6cd', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={16} /> Relieving / Exp. Letter
                                </label>

                                <div
                                    className="file-upload-zone"
                                    style={{
                                        flex: 1,
                                        position: 'relative',
                                        minHeight: '200px',
                                        border: '2px dashed #cbd5e1',
                                        borderRadius: '20px',
                                        background: formData.experience_letter ? '#f0fdf4' : '#f8fafc',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <input
                                        type="file"
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                                        onChange={(e) => setFormData({ ...formData, experience_letter: e.target.files[0] })}
                                    />
                                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                                        {formData.experience_letter ? (
                                            <div className="fade-in">
                                                <div style={{ width: '60px', height: '60px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                                    <ShieldCheck size={32} color="#22c55e" />
                                                </div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#166534', marginBottom: '4px' }}>{formData.experience_letter.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>Certificate uploaded</div>
                                            </div>
                                        ) : (
                                            <div style={{ color: '#94a3b8' }}>
                                                <div style={{ width: '60px', height: '60px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                                    <Plus size={32} />
                                                </div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>Drag or Click to Upload</div>
                                                <div style={{ fontSize: '0.7rem', marginTop: '8px' }}>Official letter or service certificate</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff9f0', borderRadius: '12px', border: '1px solid #fde6cd' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#854d0e', fontSize: '0.7rem', fontWeight: 700 }}>
                                        <ShieldCheck size={14} /> VERIFICATION NOTICE
                                    </div>
                                    <p style={{ fontSize: '0.65rem', color: '#a16207', marginTop: '4px', lineHeight: '1.4' }}>
                                        Uploaded documents will be cross-verified by our compliance team. Ensure the file is clear and readable.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'Employment History': {
            const targetEmployee = (allEmployees || []).find(e => e.id == formData?.employee) || selectedEmployee;
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><History size={18} /> Internal Assignment Record</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Users size={14} /> Employee</label>
                                {targetEmployee ? (
                                    <div className="premium-input-wrapper" style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
                                        <Users className="premium-input-icon" size={18} />
                                        <div style={{ padding: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
                                            {targetEmployee.name} <span style={{ color: '#64748b', fontWeight: 500 }}>({targetEmployee.employee_code})</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="premium-input-wrapper">
                                        <SearchableSelect
                                            endpoint="employees/all_data"
                                            value={formData.employee || ''}
                                            onChange={(e) => setFormData({ ...formData, employee: e.target.value, _emp_hist_hydrated: false })}
                                            placeholder="Select Employee..."
                                            icon={Users}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label">Position / Role</label>
                                <div className="premium-input-wrapper">
                                    <Briefcase className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" value={formData.position_name || ''} onChange={(e) => setFormData({ ...formData, position_name: capitalize(e.target.value) })} required />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label">Department</label>
                                <div className="premium-input-wrapper">
                                    <Building2 className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" value={formData.department_name || ''} onChange={(e) => setFormData({ ...formData, department_name: capitalize(e.target.value) })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label">Date of Journey (Join)</label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input type="date" className="premium-input" value={formData.date_of_join || ''} onChange={(e) => setFormData({ ...formData, date_of_join: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label">Relieving Date (If applicable)</label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input type="date" className="premium-input" value={formData.date_of_relieving || ''} onChange={(e) => setFormData({ ...formData, date_of_relieving: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label">Employee Type</label>
                                <div className="premium-input-wrapper">
                                    <Briefcase className="premium-input-icon" size={18} />
                                    <SearchableSelect
                                        options={[
                                            { id: 'Permanent', name: 'Permanent' },
                                            { id: 'Contract', name: 'Contract' },
                                            { id: 'Probation', name: 'Probation' },
                                            { id: 'Intern', name: 'Intern' }
                                        ]}
                                        value={formData.employee_type || 'Permanent'}
                                        onChange={(e) => setFormData({ ...formData, employee_type: e.target.value })}
                                        placeholder="Select Type..."
                                        icon={Briefcase}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label">Employment Type</label>
                                <div className="premium-input-wrapper">
                                    <Briefcase className="premium-input-icon" size={18} />
                                    <SearchableSelect
                                        options={[
                                            { id: 'Full-time', name: 'Full-time' },
                                            { id: 'Part-time', name: 'Part-time' }
                                        ]}
                                        value={formData.employment_type || 'Full-time'}
                                        onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                                        placeholder="Select Type..."
                                        icon={Briefcase}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label">Status</label>
                                <div className="premium-input-wrapper">
                                    <TrendingUp className="premium-input-icon" size={18} />
                                    <SearchableSelect
                                        options={[
                                            { id: 'Active', name: 'Active' },
                                            { id: 'Transferred', name: 'Transferred' },
                                            { id: 'Promoted', name: 'Promoted' },
                                            { id: 'Resigned', name: 'Resigned' }
                                        ]}
                                        value={formData.status || 'Active'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        placeholder="Select Status..."
                                        icon={TrendingUp}
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label">Reporting Manager Name</label>
                                <div className="premium-input-wrapper">
                                    <User className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" value={formData.reporting_to_name || ''} onChange={(e) => setFormData({ ...formData, reporting_to_name: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'Bank Details': {
            const targetEmployee = (allEmployees || []).find(e => e.id == formData?.employee) || selectedEmployee;
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Wallet size={18} /> Financial Identity & Payments</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Users size={14} /> Linked Employee Profile <span style={{ color: '#ef4444' }}>*</span></label>
                                {targetEmployee ? (
                                    <div className="premium-input-wrapper" style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
                                        <Users className="premium-input-icon" size={18} />
                                        <div style={{ padding: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
                                            {targetEmployee.name} <span style={{ color: '#64748b', fontWeight: 500 }}>({targetEmployee.employee_code})</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="premium-input-wrapper">
                                        <SearchableSelect
                                            endpoint="employees/all_data"
                                            value={formData.employee || ''}
                                            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                            placeholder="Select Employee..."
                                            icon={Users}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Building size={14} /> Bank Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Building className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="e.g. HDFC Bank" value={formData.bank_name || ''} onChange={(e) => setFormData({ ...formData, bank_name: validateAlphaNumeric(e.target.value, 50, 'bank_name') })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><User size={14} /> Account Holder Name</label>
                                <div className="premium-input-wrapper">
                                    <User className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Name as per Passbook" value={formData.account_holder_name || ''} onChange={(e) => setFormData({ ...formData, account_holder_name: validateAlpha(e.target.value, 50, 'acc_holder') })} />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><CreditCard size={14} /> Account Number <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <CreditCard className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Full Account Number" value={formData.account_number || ''} onChange={(e) => setFormData({ ...formData, account_number: validateNumbers(e.target.value, 20, 'acc_no') })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><FileDigit size={14} /> IFSC Code <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <FileDigit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="11-char IFSC" value={formData.ifsc_code || ''} onChange={(e) => setFormData({ ...formData, ifsc_code: validateCode(e.target.value, 11, 'ifsc').toUpperCase() })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><MapPin size={14} /> Branch Name</label>
                                <div className="premium-input-wrapper">
                                    <MapPin className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Branch location" value={formData.branch_name || ''} onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Shield size={14} /> Account Type</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'Savings', name: 'Savings Account' },
                                            { id: 'Current', name: 'Current Account' },
                                            { id: 'Salary', name: 'Salary Account' }
                                        ]}
                                        value={formData.account_type || 'Savings'}
                                        onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                                        icon={Shield}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><FileText size={14} /> PAN Number <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <FileText className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="10-char PAN" value={formData.pan_number || ''} onChange={(e) => setFormData({ ...formData, pan_number: validateAlphaNumeric(e.target.value, 10, 'pan').toUpperCase() })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><FileDigit size={14} /> Aadhaar Number <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <FileDigit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="12-digit Aadhaar" value={formData.aadhaar_number || ''} onChange={(e) => setFormData({ ...formData, aadhaar_number: validateNumbers(e.target.value, 12, 'aadhaar') })} required />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'Salary Details': {
            const targetEmployee = (allEmployees || []).find(e => e.id == formData?.employee) || selectedEmployee;
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><Banknote size={18} /> Compensation & Payroll Structure</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Users size={14} /> Employee Context <span style={{ color: '#ef4444' }}>*</span></label>
                                {targetEmployee ? (
                                    <div className="premium-input-wrapper" style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
                                        <Users className="premium-input-icon" size={18} />
                                        <div style={{ padding: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
                                            {targetEmployee.name} <span style={{ color: '#64748b', fontWeight: 500 }}>({targetEmployee.employee_code})</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="premium-input-wrapper">
                                        <SearchableSelect
                                            endpoint="employees/all_data"
                                            value={formData.employee || ''}
                                            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                            placeholder="Select Employee..."
                                            icon={Users}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Wallet size={14} /> Basic Salary <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Wallet className="premium-input-icon" size={18} />
                                    <input type="number" className="premium-input" placeholder="Monthly Basic" value={formData.basic_salary || ''} onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Home size={14} /> House Rent Allowance (HRA)</label>
                                <div className="premium-input-wrapper">
                                    <Home className="premium-input-icon" size={18} />
                                    <input type="number" className="premium-input" placeholder="Monthly HRA" value={formData.hra || ''} onChange={(e) => setFormData({ ...formData, hra: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Car size={14} /> Conveyance Allowance</label>
                                <div className="premium-input-wrapper">
                                    <Car className="premium-input-icon" size={18} />
                                    <input type="number" className="premium-input" placeholder="Travel Allowance" value={formData.conveyance_allowance || ''} onChange={(e) => setFormData({ ...formData, conveyance_allowance: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Heart size={14} /> Medical Allowance</label>
                                <div className="premium-input-wrapper">
                                    <Heart className="premium-input-icon" size={18} />
                                    <input type="number" className="premium-input" placeholder="Health Allowance" value={formData.medical_allowance || ''} onChange={(e) => setFormData({ ...formData, medical_allowance: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Gift size={14} /> Special Allowance</label>
                                <div className="premium-input-wrapper">
                                    <Gift className="premium-input-icon" size={18} />
                                    <input type="number" className="premium-input" placeholder="Special Pay" value={formData.special_allowance || ''} onChange={(e) => setFormData({ ...formData, special_allowance: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Layers size={14} /> Other Allowances</label>
                                <div className="premium-input-wrapper">
                                    <Layers className="premium-input-icon" size={18} />
                                    <input type="number" className="premium-input" placeholder="Misc Allowances" value={formData.other_allowances || ''} onChange={(e) => setFormData({ ...formData, other_allowances: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'EPFO Details': {
            const targetEmployee = (allEmployees || []).find(e => e.id == formData?.employee) || selectedEmployee;
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><FileDigit size={18} /> Statutory & Social Security Identity</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Users size={14} /> Employee Profile <span style={{ color: '#ef4444' }}>*</span></label>
                                {targetEmployee ? (
                                    <div className="premium-input-wrapper" style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
                                        <Users className="premium-input-icon" size={18} />
                                        <div style={{ padding: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
                                            {targetEmployee.name} <span style={{ color: '#64748b', fontWeight: 500 }}>({targetEmployee.employee_code})</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="premium-input-wrapper">
                                        <SearchableSelect
                                            endpoint="employees/all_data"
                                            value={formData.employee || ''}
                                            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                            placeholder="Select Employee..."
                                            icon={Users}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><FileDigit size={14} /> Universal Account Number (UAN) <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <FileDigit className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="12-digit UAN" value={formData.uan_number || ''} onChange={(e) => setFormData({ ...formData, uan_number: validateNumbers(e.target.value, 12, 'uan') })} required />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Briefcase size={14} /> EPFO Member ID</label>
                                <div className="premium-input-wrapper">
                                    <Briefcase className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Enter Member ID" value={formData.epfo_member_id || ''} onChange={(e) => setFormData({ ...formData, epfo_member_id: validateCode(e.target.value, 22, 'epfo').toUpperCase() })} />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Shield size={14} /> ESIC Number</label>
                                <div className="premium-input-wrapper">
                                    <Shield className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="17-digit ESIC" value={formData.esic_number || ''} onChange={(e) => setFormData({ ...formData, esic_number: validateNumbers(e.target.value, 17, 'esic') })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Calendar size={14} /> PF Joining Date</label>
                                <div className="premium-input-wrapper">
                                    <Calendar className="premium-input-icon" size={18} />
                                    <input type="date" className="premium-input" value={formData.pf_joining_date || ''} onChange={(e) => setFormData({ ...formData, pf_joining_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><UserPlus size={14} /> Primary Nominee Name</label>
                                <div className="premium-input-wrapper">
                                    <UserPlus className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="Nominee full name" value={formData.nominee_name || ''} onChange={(e) => setFormData({ ...formData, nominee_name: validateAlpha(e.target.value, 50, 'nominee') })} />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Heart size={14} /> Nominee Relationship</label>
                                <div className="premium-input-wrapper">
                                    <Heart className="premium-input-icon" size={18} />
                                    <input type="text" className="premium-input" placeholder="e.g. Spouse, Father, Mother" value={formData.nominee_relationship || ''} onChange={(e) => setFormData({ ...formData, nominee_relationship: validateAlpha(e.target.value, 50, 'relation') })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'Health Details': {
            const targetEmployee = (allEmployees || []).find(e => e.id == formData?.employee) || selectedEmployee;
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-form-section">
                        <div className="form-section-title" style={{ marginBottom: '2rem' }}><ShieldCheck size={18} /> Employee Health & Emergency Context</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="premium-label"><Users size={14} /> Employee Context <span style={{ color: '#ef4444' }}>*</span></label>
                                {targetEmployee ? (
                                    <div className="premium-input-wrapper" style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
                                        <Users className="premium-input-icon" size={18} />
                                        <div style={{ padding: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
                                            {targetEmployee.name} <span style={{ color: '#64748b', fontWeight: 500 }}>({targetEmployee.employee_code})</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="premium-input-wrapper">
                                        <SearchableSelect
                                            endpoint="employees/all_data"
                                            value={formData.employee || ''}
                                            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                            placeholder="Select Employee..."
                                            icon={Users}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Activity size={14} /> Blood Group</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ id: bg, name: bg }))}
                                        value={formData.blood_group || ''}
                                        onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                                        placeholder="Select Group..."
                                        icon={Activity}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Activity size={14} /> Physical Disability (if any)</label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'None', name: 'No Disability' },
                                            { id: 'Visual', name: 'Visual Impairment' },
                                            { id: 'Hearing', name: 'Hearing Impairment' },
                                            { id: 'Locomotor', name: 'Locomotor Disability' },
                                            { id: 'Other', name: 'Other' }
                                        ]}
                                        value={formData.physical_disability || 'None'}
                                        onChange={(e) => setFormData({ ...formData, physical_disability: e.target.value })}
                                        icon={ShieldCheck}
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Shield size={14} /> Allergies & Medical Conditions</label>
                                <div className="premium-input-wrapper" style={{ height: 'auto' }}>
                                    <Shield className="premium-input-icon" size={18} style={{ marginTop: '0.75rem' }} />
                                    <textarea className="premium-input" rows="2" placeholder="List any chronic conditions or allergies..." value={formData.allergies || ''} onChange={(e) => setFormData({ ...formData, allergies: e.target.value })} style={{ paddingLeft: '3rem', paddingTop: '1rem' }} />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label className="premium-label"><Phone size={14} /> Emergency Contact Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <User size={18} className="premium-input-icon" />
                                    <input type="text" className="premium-input" placeholder="Full name of emergency contact" value={formData.emergency_contact_name || ''} onChange={(e) => setFormData({ ...formData, emergency_contact_name: validateAlpha(e.target.value, 50, 'emer_name') })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Briefcase size={14} /> Relation <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <SearchableSelect
                                        options={[
                                            { id: 'Spouse', name: 'Spouse' },
                                            { id: 'Father', name: 'Father' },
                                            { id: 'Mother', name: 'Mother' },
                                            { id: 'Sibling', name: 'Sibling' },
                                            { id: 'Friend', name: 'Friend' },
                                            { id: 'Other', name: 'Other' }
                                        ]}
                                        value={formData.emergency_contact_relation || ''}
                                        onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                                        placeholder="Select Relation..."
                                        icon={Briefcase}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="premium-label"><Phone size={14} /> Emergency Phone <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="premium-input-wrapper">
                                    <Phone className="premium-input-icon" size={18} />
                                    <input type="tel" className="premium-input" placeholder="10-digit phone number" value={formData.emergency_contact_phone || ''} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: validatePhone(e.target.value, 10, 'emer_phone') })} required />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'Task URLs':
        case 'Task URL Mapping':
            return (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    Configuring <strong>Task Access</strong> for {formData.task}
                </div>
            );

        default:
            return (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    Form for <strong>{modalType}</strong> is coming soon.
                </div>
            );
    }
};

export default ModalForm;
