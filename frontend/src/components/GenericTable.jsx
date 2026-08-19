import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Settings, X, Plus, Eye, Search, Filter, Download, Pencil, Trash2, RotateCcw, ChevronLeft, ChevronRight, RefreshCw, Upload } from 'lucide-react';
import { useData, SECTIONS } from '../context/DataContext';
import BavyaSpinner from './BavyaSpinner';
import BulkUploadModal from './BulkUploadModal';

const GenericTable = ({ renderTableData, customData = null }) => {
    const {
        loading,
        isSyncing,
        activeSection,
        data: contextData,
        handleEdit,
        handleDelete,
        handleAdd,
        handleViewOffice,
        handleViewProfile,
        canCreate,
        canEdit,
        canDelete,
        fetchPositionDetail,
        offices,
        departments,
        jobFamilies,
        roles,
        roleTypes,
        geoStatesData,
        geoDistrictsData,
        geoMandals,
        positions,
        orgLevels,
        positionLevels,
        jobs,
        tasks,
        sections,
        pagination,
        fetchData,
        navigationFilter,
        setNavigationFilter,
        user,
        projects,
        facilityMasters,
        allEmployees,
        setLoading,
        isBulkUploadOpen,
        setIsBulkUploadOpen,
        setIsSyncing,
        geoContinents,
        geoCountries
    } = useData();

    // DELAYED SPINNER STATE: Only show big spinner if loading takes > 400ms
    const [showSpinner, setShowSpinner] = useState(false);

    const currentSectionInfo = SECTIONS.find(s => s.id === activeSection);

    // Geo sections: find ASIA continent id and INDIA country id from context for default filters
    const getGeoDefaults = () => {
        const isGeoSection = [
            'geo-countries', 'geo-states', 'geo-districts', 'geo-mandals',
            'geo-clusters', 'visiting-locations', 'landmarks'
        ].includes(activeSection);
        if (!isGeoSection) return { continent: 'all', country: 'all' };
        const asiaContinent = geoContinents?.find(c => c.name?.toUpperCase() === 'ASIA');
        const indiaCountry = geoCountries?.find(c => c.name?.toUpperCase() === 'INDIA');
        return {
            continent: asiaContinent ? String(asiaContinent.id) : 'all',
            country: indiaCountry ? String(indiaCountry.id) : 'all',
        };
    };

    const getInitialFilters = (forceReset = false) => {
        if (!forceReset) {
            const saved = sessionStorage.getItem(`filters_${activeSection}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // HEAL STALE FILTERS: If string IDs (names) from older versions are found where integers are expected
                    const numericFields = ['office', 'department', 'section', 'officeLevel', 'positionLevel', 'jobFamily', 'roleType', 'role', 'job', 'task'];
                    numericFields.forEach(f => {
                        if (parsed[f] && isNaN(parsed[f]) && parsed[f] !== 'all') {
                            parsed[f] = 'all';
                        }
                    });
                    return parsed;
                } catch (e) {
                    console.error("Failed to parse saved filters", e);
                }
            }
        }
        const { continent: defaultContinent, country: defaultCountry } = getGeoDefaults();
        return {
            searchTerm: '',
            status: 'all',
            office: 'all',
            department: 'all',
            jobFamily: 'all',
            role: 'all',
            continent: defaultContinent,
            country: defaultCountry,
            state: 'all',
            district: 'all',
            mandal: 'all',
            officeLevel: 'all',
            roleType: 'all',
            job: 'all',
            task: 'all',
            section: 'all',
            positionLevel: 'all'
        };
    };

    const [filters, setFilters] = useState(() => getInitialFilters(false));
    const [searchError, setSearchError] = useState('');

    const updateFilter = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const {
        searchTerm, status: statusFilter, office: officeFilter, department: departmentFilter,
        jobFamily: jobFamilyFilter, role: roleFilter, clusterType: clusterTypeFilter,
        continent: continentFilter, country: countryFilter,
        state: stateFilter, district: districtFilter, mandal: mandalFilter,
        officeLevel: officeLevelFilter, roleType: roleTypeFilter, job: jobFilter,
        task: taskFilter, section: sectionFilter, positionLevel: positionLevelFilter
    } = filters;

    // Helper setters for backward compatibility with JSX but batched performance
    const setSearchTerm = (val) => updateFilter({ searchTerm: val });
    const setStatusFilter = (val) => updateFilter({ status: val });
    const setOfficeFilter = (val) => updateFilter({ office: val });
    const setDepartmentFilter = (val) => updateFilter({ department: val });
    const setJobFamilyFilter = (val) => updateFilter({ jobFamily: val });
    const setRoleFilter = (val) => updateFilter({ role: val });
    const setClusterTypeFilter = (val) => updateFilter({ clusterType: val });
    const setStateFilter = (val) => updateFilter({ state: val });
    const setDistrictFilter = (val) => updateFilter({ district: val });
    const setMandalFilter = (val) => updateFilter({ mandal: val });
    const setOfficeLevelFilter = (val) => updateFilter({ officeLevel: val });
    const setRoleTypeFilter = (val) => updateFilter({ roleType: val });
    const setJobFilter = (val) => updateFilter({ job: val });
    const setTaskFilter = (val) => updateFilter({ task: val });
    const setSectionFilter = (val) => updateFilter({ section: val });
    const setPositionLevelFilter = (val) => updateFilter({ positionLevel: val });

    const resetFilters = () => {
        setFilters(getInitialFilters(true));
        sessionStorage.removeItem(`filters_${activeSection}`);
        sessionStorage.removeItem(`last_fetch_${activeSection}`);
        // FORCE a visible fetch by setting loading manually before the effect triggers
        setLoading(true);
        fetchData(false, true, 1, getInitialFilters(true), true);
    };

    const prevSectionRef = useRef(activeSection);
    const isFirstRender = useRef(true);
    const lastFetchFilters = useRef(null);

    useEffect(() => {
        // 1. Handle cross-section navigation filters (Guided navigation)
        // This must run even if we are already in the target section
        if (navigationFilter) {
            const guideFilters = { ...getInitialFilters(true), ...navigationFilter };
            setFilters(guideFilters);
            sessionStorage.setItem(`filters_${activeSection}`, JSON.stringify(guideFilters));
            setNavigationFilter(null); // Consumed

            // If we are ALSO changing sections, update context trackers
            if (prevSectionRef.current !== activeSection) {
                // ... logic moved below ...
                prevSectionRef.current = activeSection;
                isFirstRender.current = true;
                lastFetchFilters.current = null;
            }
            // Trigger cleanup if we consume navigationFilter
            if (customData) {
                if (loading) setLoading(false);
                if (isSyncing === activeSection) setIsSyncing(null);
            }
            return;
        }

        // 2. Standard section change or Mount
        if (prevSectionRef.current !== activeSection) {
            setFilters(getInitialFilters(true));
            prevSectionRef.current = activeSection;

            // RESET FETCH STATE
            isFirstRender.current = true;
            lastFetchFilters.current = null;
        }

        // SMART FIX: If we have customData, we don't use fetchData,
        // so we must manually turn off any navigation loading spinners.
        // This must run on mount and every update where loading is stuck.
        if (customData) {
            if (loading) setLoading(false);
            if (isSyncing === activeSection) setIsSyncing(null);
        }
    }, [activeSection, navigationFilter, customData, loading, setLoading, isSyncing, setIsSyncing]);

    // Scroll to top when pagination page changes
    useEffect(() => {
        if (pagination?.current) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [pagination?.current]);

    // SAVE FILTERS TO SESSION STORAGE WHENEVER THEY CHANGE
    useEffect(() => {
        try {
            sessionStorage.setItem(`filters_${activeSection}`, JSON.stringify(filters));
        } catch (e) {
            // QuotaExceededError: sessionStorage is full — purge all filter keys and retry
            console.warn('[GenericTable] sessionStorage quota exceeded — clearing old filter keys.');
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.startsWith('filters_') || key.startsWith('last_fetch_'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => sessionStorage.removeItem(k));
            // Retry after clearing
            try {
                sessionStorage.setItem(`filters_${activeSection}`, JSON.stringify(filters));
            } catch (e2) {
                // Silent fail — filters simply won't be persisted this session
            }
        }
    }, [filters, activeSection]);

    // Track section changes explicitly to clear filter cache
    const activeSectionRef = useRef(activeSection);
    if (activeSectionRef.current !== activeSection) {
        activeSectionRef.current = activeSection;
        lastFetchFilters.current = null;
    }

    // Debounced Server-side Search & Filtering
    useEffect(() => {
        // PERF OPTIMIZATION: 
        // 1. Dropdowns/Filters (Status, Office, etc) should be INSTANT (0 delay)
        // 2. Search box should be DEBOUNCED (150ms) to prevent server spam while typing.

        const prevFiltersString = lastFetchFilters.current;
        const prevFilters = prevFiltersString ? JSON.parse(prevFiltersString) : null;
        const searchChanged = prevFilters && prevFilters.searchTerm !== filters.searchTerm;

        // REACTION: Dropdowns = 0ms, Search = 150ms (faster but safe)
        const delay = (isFirstRender.current || !searchChanged) ? 0 : 150;
        const currentFilterString = JSON.stringify(filters);

        // CRITICAL: Stop redundant fetches from re-renders or strict mode in the same section
        if (lastFetchFilters.current === currentFilterString) {
            isFirstRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            if (pagination && !customData) {
                // Check if we have valid cached data for THIS active section specifically
                const hasCurrentSectionCache = contextData && contextData.length > 0 && activeSectionRef.current === activeSection;
                const isSilentFetch = hasCurrentSectionCache && sessionStorage.getItem(`last_fetch_${activeSection}`) !== null;

                fetchData(isSilentFetch, true, 1, filters).then((res) => {
                    if (res === null) {
                        // Fetch failed (e.g. backend 500 error). Clear filter ref to allow auto-retry.
                        if (lastFetchFilters.current === currentFilterString) {
                            lastFetchFilters.current = null;
                        }
                    }
                }).catch(() => {
                    if (lastFetchFilters.current === currentFilterString) {
                        lastFetchFilters.current = null;
                    }
                }).finally(() => {
                    isFirstRender.current = false;
                });

                lastFetchFilters.current = currentFilterString;
                isFirstRender.current = false;
                sessionStorage.setItem(`last_fetch_${activeSection}`, currentFilterString);
            } else {
                isFirstRender.current = false;
            }
        }, delay);


        return () => clearTimeout(delayDebounceFn);
    }, [filters, activeSection]); // ONLY depend on filters and section change


    const handleExport = () => {
        if (!filteredData || filteredData.length === 0) return;

        // Prepare headers (flatten common fields)
        const headers = ['ID', 'Name', 'Status', 'Created'];
        if (activeSection === 'employees') {
            headers.push('Employee Code', 'Email', 'Phone', 'Positions', 'Offices', 'Departments');
        } else if (activeSection === 'positions') {
            headers.push('Code', 'Role', 'Office', 'Department', 'Section', 'Incumbent');
        } else if (activeSection === 'projects') {
            headers.push('Code', 'Level', 'Assigned Offices');
        }

        const csvRows = [headers.join(',')];

        filteredData.forEach(item => {
            const row = [
                item.id,
                `"${item.name || ''}"`,
                item.status || 'Active',
                item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'
            ];

            if (activeSection === 'employees') {
                row.push(
                    item.employee_code || '',
                    item.email || '',
                    item.phone || '',
                    `"${item.positions_details?.map(p => p.name).join('; ') || ''}"`,
                    `"${item.positions_details?.map(p => p.office_name).join('; ') || ''}"`,
                    `"${item.positions_details?.map(p => p.department_name).join('; ') || ''}"`
                );
            } else if (activeSection === 'positions') {
                row.push(
                    item.code || '',
                    item.role_name || '',
                    item.office_name || '',
                    item.department_name || '',
                    item.section_name || '',
                    item.assigned_employee?.name || 'Vacant'
                );
            } else if (activeSection === 'projects') {
                row.push(
                    item.code || '',
                    item.assigned_level_name || 'Global',
                    `"${item.assigned_offices_details?.map(o => o.name).join('; ') || ''}"`
                );
            }

            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${activeSection}_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getFallbackData = () => {
        const mapping = {
            'offices': offices,
            'departments': departments,
            'sections': sections,
            'job-families': jobFamilies,
            'role-types': roleTypes,
            'roles': roles,
            'jobs': jobs,
            'tasks': tasks,
            'positions': positions,
            'organization-levels': orgLevels,
            'position-levels': positionLevels,
            'employees': allEmployees,
            'projects': projects,
            'facility-masters': facilityMasters
        };
        return mapping[activeSection] || [];
    };

    // 1. Initial Load & Transition: Show spinner whenever loading, syncing, or section just changed
    const sectionChangedSinceLastFetch = !customData && lastFetchFilters.current === null;
    const isLoadingAny = loading || (isSyncing === activeSection) || sectionChangedSinceLastFetch || (!customData && (isFirstRender.current || contextData === null));


    // SMART DATA ENGINE: 
    // Prioritize contextData (the filtered set) if available (even if empty).
    // Fallback to getFallbackData() ONLY for the very first load or while the section is initializing.
    const rawData = customData || (
        (contextData && Array.isArray(contextData) && (contextData.length > 0 || !isLoadingAny))
            ? contextData
            : (isLoadingAny ? (getFallbackData() || []) : [])
    );

    const matchesId = (val, filterId) => {
        if (filterId === 'all' || !filterId) return true;
        if (val === undefined || val === null) return false;

        // Handle cases where val might be an object
        if (typeof val === 'object' && val !== null) {
            return String(val.id) === String(filterId) || String(val.name) === String(filterId);
        }
        return String(val) === String(filterId);
    };

    const matchesHierarchy = (item, jf, rt, r, j) => {
        if (!item) return false;

        const matchJF = !jf || jf === 'all' ||
            matchesId(item.job_family, jf) ||
            matchesId(item.job_family_id, jf) ||
            matchesId(item.job_family_name, jf) ||
            (item.role_type && matchesId(item.role_type.job_family, jf)) ||
            (item.role && (matchesId(item.role.job_family_id, jf) || (item.role.role_type && matchesId(item.role.role_type.job_family, jf)))) ||
            (item.job && (matchesId(item.job.job_family_id, jf) || matchesId(item.job.job_family_name, jf))) ||
            (item.task && (matchesId(item.task.job_family_id, jf) || (item.task.job && matchesId(item.task.job.job_family_id, jf)))) ||
            (activeSection === 'job-families' && matchesId(item.id, jf));

        const matchRT = !rt || rt === 'all' ||
            matchesId(item.role_type, rt) ||
            matchesId(item.role_type_id, rt) ||
            matchesId(item.role_type_name, rt) ||
            (item.role && matchesId(item.role.role_type, rt)) ||
            (item.job && (matchesId(item.job.role_type_id, rt) || matchesId(item.job.role_type_name, rt))) ||
            (item.task && (matchesId(item.task.role_type_id, rt) || (item.task.job && matchesId(item.task.job.role_type_id, rt)))) ||
            (activeSection === 'role-types' && matchesId(item.id, rt));

        const matchR = !r || r === 'all' ||
            matchesId(item.role, r) ||
            matchesId(item.role_id, r) ||
            matchesId(item.role_name, r) ||
            (item.job && (matchesId(item.job.role_id, r) || matchesId(item.job.role, r) || matchesId(item.job.role_name, r))) ||
            (item.task && (matchesId(item.task.role_id, r) || (item.task.job && matchesId(item.task.job.role_id, r)))) ||
            (activeSection === 'roles' && matchesId(item.id, r));

        const matchJ = !j || j === 'all' ||
            matchesId(item.job, j) ||
            matchesId(item.job_id, j) ||
            matchesId(item.job_name, j) ||
            (item.task && (matchesId(item.task.job_id, j) || matchesId(item.task.job, j))) ||
            (activeSection === 'jobs' && matchesId(item.id, j));

        return matchJF && matchRT && matchR && matchJ;
    };
    const HighlightTerm = ({ text, term }) => {
        if (!term || !text) return <>{text}</>;

        // Escape special regex characters in the term
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.toString().split(new RegExp(`(${escapedTerm})`, 'gi'));

        return (
            <>
                {parts.map((part, i) => (
                    part.toLowerCase() === term.toLowerCase() ?
                        <span key={i} style={{ backgroundColor: 'rgb(249 115 22 / 20%)', color: '#ea580c', fontWeight: 800, padding: '0 2px', borderRadius: '4px', borderBottom: '2px solid #f97316' }}>{part}</span> :
                        <span key={i}>{part}</span>
                ))}
            </>
        );
    };

    // Define filter configurations for each section
    const getFilterConfig = () => {
        const configs = {
            'offices': ['search', 'status', 'level'],
            'departments': ['search', 'status', 'level', 'office'],
            'sections': ['search', 'status', 'level', 'office', 'department'],
            'employees': ['search', 'status', 'level', 'office', 'department', 'section', 'positionLevel'],
            'positions': ['search', 'status', 'level', 'office', 'department', 'section', 'role', 'positionLevel'],
            'jobs': ['search', 'status', 'role'],
            'tasks': ['search', 'status', 'role', 'job'],
            'task-urls': ['search', 'status', 'role', 'job', 'task'],
            'projects': ['search', 'status', 'level', 'office'],
            'roles': ['search', 'status'],
            'geo-countries': ['search', 'continent'],
            'geo-states': ['search', 'continent', 'country'],
            'geo-districts': ['search', 'continent', 'country', 'state'],
            'geo-mandals': ['search', 'continent', 'country', 'state', 'district'],
            'geo-clusters': ['search', 'continent', 'country', 'clusterType', 'state', 'district', 'mandal'],
            'visiting-locations': ['search', 'continent', 'country', 'state', 'district', 'mandal'],
            'landmarks': ['search', 'continent', 'country', 'state', 'district', 'mandal'],
        };
        const isGeo = activeSection.startsWith('geo-');
        const config = configs[activeSection] || (isGeo ? ['search'] : ['search', 'status']);
        return config;
    };

    // Apply filters
    const filteredData = useMemo(() => {
        // List of sections where filtering is handled exclusively by the server
        const serverFilteredSections = [
            'employees', 'positions', 'offices', 'departments', 'sections', 'projects', 'locations',
            'geo-countries', 'geo-states', 'geo-districts', 'geo-mandals', 'geo-clusters', 'visiting-locations', 'landmarks'
        ];

        let result = [...rawData];
        const isServerSection = serverFilteredSections.includes(activeSection);

        // SEARCH FILTER: Apply to all sections for instant UI feedback
        if (searchTerm && searchTerm.trim()) {
            const lowerSearch = searchTerm.trim().toLowerCase();
            result = result.filter(item => {
                // Combine visible fields that the user might want to search
                // Local search across common fields
                let searchableFields = [
                    item.name,
                    item.employee_code,
                    item.code,
                    item.address,
                    item.district_name,
                    item.mandal_name,
                    item.state_name,
                    item.title
                ];

                // For Employees: Add position/role names to search
                if (activeSection === 'employees' && item.positions_details) {
                    item.positions_details.forEach(p => {
                        searchableFields.push(p.name, p.role_name, p.office_name);
                    });
                }

                return searchableFields.some(field => {
                    if (!field) return false;
                    const fieldVal = field.toString().toLowerCase().trim();
                    return fieldVal.includes(lowerSearch);
                });
            });
        }

        // For server-filtered sections, the server already did the heavy lifting.
        // Bypassing remaining local filters avoids reference resolution errors and freezes.
        if (isServerSection) {
            return result;
        }

        // Status filter: Proceed with local filtering as a second pass/fallback
        if (statusFilter === 'Unassigned') {
            result = result.filter(item => !item.positions || item.positions.length === 0 || (item.positions_details && item.positions_details.length === 0));
        } else if (statusFilter !== 'all') {
            result = result.filter(item => (item.status || 'Active') === statusFilter);
        }

        if (statusFilter !== 'Unassigned') {
            // Office filter
            if (officeFilter !== 'all') {
                result = result.filter(item => {
                    // For Employees: Look up via positions_details
                    if (activeSection === 'employees' && item.positions_details) {
                        return item.positions_details.some(p => matchesId(p.office_id, officeFilter));
                    }

                    // Direct match (Offices, Positions, etc.)
                    if (matchesId(item.office, officeFilter) || matchesId(item.office_id, officeFilter)) return true;

                    // For Sections: Resolve via Department -> Office
                    if (activeSection === 'sections' && (item.department || item.department_id)) {
                        const deptId = item.department_id || item.department;
                        const dept = departments.find(d => matchesId(d.id, deptId));
                        return dept && (matchesId(dept.office, officeFilter) || matchesId(dept.office_id, officeFilter));
                    }

                    // For Departments: Resolve via Office
                    if (activeSection === 'departments') {
                        // Departments usually have office_id directly, but if not:
                        return matchesId(item.office, officeFilter) || matchesId(item.office_id, officeFilter);
                    }

                    return false;
                });
            }

            // Department filter
            if (departmentFilter !== 'all') {
                result = result.filter(item => {
                    if (matchesId(item.department, departmentFilter) || matchesId(item.department_id, departmentFilter)) return true;

                    // For Employees: Look up via positions_details
                    if (activeSection === 'employees' && item.positions_details) {
                        return item.positions_details.some(p => matchesId(p.department_id, departmentFilter));
                    }

                    return false;
                });
            }

            // Section filter
            if (sectionFilter !== 'all') {
                result = result.filter(item => {
                    if (matchesId(item.section, sectionFilter) || matchesId(item.section_id, sectionFilter)) return true;

                    // For Employees: Look up via positions_details
                    if (activeSection === 'employees' && item.positions_details) {
                        return item.positions_details.some(p => matchesId(p.section_id, sectionFilter));
                    }

                    return false;
                });
            }

            // Apply Hierarchy filters using unified logic
            if (jobFamilyFilter !== 'all') {
                result = result.filter(item => matchesHierarchy(item, jobFamilyFilter, 'all', 'all', 'all'));
            }
            if (roleTypeFilter !== 'all') {
                result = result.filter(item => matchesHierarchy(item, 'all', roleTypeFilter, 'all', 'all'));
            }
            if (roleFilter !== 'all') {
                result = result.filter(item => matchesHierarchy(item, 'all', 'all', roleFilter, 'all'));
            }
            if (jobFilter !== 'all') {
                result = result.filter(item => matchesHierarchy(item, 'all', 'all', 'all', jobFilter));
            }

            // Office Level Filter
            if (officeLevelFilter !== 'all') {
                const selectedLevelObj = (orgLevels || []).find(l => matchesId(l.id, officeLevelFilter));
                const selectedLevelName = selectedLevelObj ? selectedLevelObj.name : '';

                result = result.filter(item => {
                    // Direct match
                    if (item && (
                        matchesId(item.level, officeLevelFilter) ||
                        matchesId(item.level_id, officeLevelFilter) ||
                        matchesId(item.office_level_id, officeLevelFilter) ||
                        matchesId(item.office_level, officeLevelFilter) ||
                        (selectedLevelName && (
                            (item.level_name && item.level_name.trim().toLowerCase() === selectedLevelName.trim().toLowerCase()) ||
                            (item.office_level && item.office_level.trim().toLowerCase() === selectedLevelName.trim().toLowerCase()) ||
                            (item.level && typeof item.level === 'string' && item.level.trim().toLowerCase() === selectedLevelName.trim().toLowerCase())
                        ))
                    )) return true;

                    // For Sections: Look up via Department -> Office -> Level
                    if (activeSection === 'sections' && (item.department || item.department_id)) {
                        const deptId = item.department_id || item.department;
                        const dept = departments.find(d => matchesId(d.id, deptId));
                        if (dept) {
                            const office = offices.find(o => matchesId(o.id, dept.office) || matchesId(o.id, dept.office_id));
                            return office && matchesId(office.level, officeLevelFilter);
                        }
                    }

                    // For Departments: Look up via Office -> Level
                    if (activeSection === 'departments' && (item.office || item.office_id)) {
                        const officeId = item.office_id || item.office;
                        const office = offices.find(o => matchesId(o.id, officeId));
                        return office && matchesId(office.level, officeLevelFilter);
                    }

                    // For Employees: Look up via positions_details -> Office -> Level
                    if (activeSection === 'employees' && item.positions_details) {
                        return item.positions_details.some(p => matchesId(p.office_level_id, officeLevelFilter));
                    }

                    // For Positions: Look up via Office -> Level
                    if (activeSection === 'positions' && item.office) {
                        const office = offices.find(o => matchesId(o.id, item.office) || matchesId(o.id, item.office_id));
                        return office && matchesId(office.level, officeLevelFilter);
                    }

                    return false;
                });
            }

            // Position Level Filter
            if (positionLevelFilter !== 'all') {
                result = result.filter(item => {
                    if (matchesId(item.level, positionLevelFilter) || matchesId(item.level_id, positionLevelFilter)) return true;

                    // For Employees: Look up via positions_details
                    if (activeSection === 'employees' && item.positions_details) {
                        return item.positions_details.some(p => matchesId(p.level_id, positionLevelFilter));
                    }
                    return false;
                });
            }
        }

        // Task filter
        if (taskFilter !== 'all') {
            result = result.filter(item =>
                matchesId(item.task, taskFilter) ||
                matchesId(item.task_id, taskFilter) ||
                matchesId(item.id, taskFilter)
            );
        }

        // Type / Classification filter (Unified)
        if (clusterTypeFilter !== 'all') {
            result = result.filter(item =>
                item && (
                    item.cluster_type === clusterTypeFilter ||
                    item.type === clusterTypeFilter ||
                    item.cluster_type_display === clusterTypeFilter
                )
            );
        }

        // Continent filter
        if (continentFilter !== 'all') {
            result = result.filter(item => {
                if (matchesId(item.continent, continentFilter) ||
                    matchesId(item.continent_id, continentFilter) ||
                    matchesId(item.continent_ref, continentFilter)) return true;
                if (activeSection === 'geo-continents' && matchesId(item.id, continentFilter)) return true;
                return false;
            });
        }

        // Country filter
        if (countryFilter !== 'all') {
            result = result.filter(item => {
                if (matchesId(item.country, countryFilter) ||
                    matchesId(item.country_id, countryFilter)) return true;
                if (activeSection === 'geo-countries' && matchesId(item.id, countryFilter)) return true;
                return false;
            });
        }

        // Geo Hierarchy filters
        if (stateFilter !== 'all') {
            result = result.filter(item =>
                item && (matchesId(item.state, stateFilter) || matchesId(item.state_id, stateFilter) || (activeSection === 'geo-states' && matchesId(item.id, stateFilter)))
            );
        }

        if (districtFilter !== 'all') {
            result = result.filter(item =>
                item && (matchesId(item.district, districtFilter) || matchesId(item.district_id, districtFilter) || (activeSection === 'geo-districts' && matchesId(item.id, districtFilter)))
            );
        }

        if (mandalFilter !== 'all') {
            result = result.filter(item =>
                item && (matchesId(item.mandal, mandalFilter) || matchesId(item.mandal_id, mandalFilter) || ((activeSection === 'geo-mandals' || activeSection === 'geo-clusters') && matchesId(item.id, mandalFilter)))
            );
        }

        // UNIVERSAL ALPHABETICAL & GROUPING SORT
        result.sort((a, b) => {
            // Stage 1: Primary Grouping Sorts
            if (activeSection === 'organization-levels' || activeSection === 'position-levels') {
                const rankA = parseFloat(a.rank) || 0;
                const rankB = parseFloat(b.rank) || 0;
                if (rankA !== rankB) return rankA - rankB;
                const codeA = (a.level_code || a.code || '').toString();
                const codeB = (b.level_code || b.code || '').toString();
                return codeA.localeCompare(codeB, undefined, { numeric: true });
            }

            if (activeSection === 'departments') {
                const officeCompare = (a.office_name || '').localeCompare(b.office_name || '');
                if (officeCompare !== 0) return officeCompare;
            } else if (activeSection === 'sections') {
                const projectCompare = (a.project_name || 'No Project').localeCompare(b.project_name || 'No Project');
                if (projectCompare !== 0) return projectCompare;
                const deptCompare = (a.department_name || '').localeCompare(b.department_name || '');
                if (deptCompare !== 0) return deptCompare;
            } else if (activeSection === 'task-urls') {
                const groupA = a.job_family_name || a.job_name || '';
                const groupB = b.job_family_name || b.job_name || '';
                const groupCompare = groupA.localeCompare(groupB);
                if (groupCompare !== 0) return groupCompare;
            }

            // Stage 2: Universal Name/Title Sort (Fallback for all sections)
            const nameA = (a.name || a.employee_name || a.full_name || a.title || '').toString();
            const nameB = (b.name || b.employee_name || b.full_name || b.title || '').toString();
            if (nameA && nameB) {
                return nameA.localeCompare(nameB);
            }

            // Stage 3: Code Sort (If names are missing/empty)
            const codeA = (a.code || a.employee_code || '').toString();
            const codeB = (b.code || b.employee_code || '').toString();
            return codeA.localeCompare(codeB);
        });

        // Position Level Filter
        if (positionLevelFilter !== 'all') {
            result = result.filter(item => {
                if (matchesId(item.level, positionLevelFilter) || matchesId(item.level_id, positionLevelFilter)) return true;

                // For Employees: Look up via positions_details
                if (activeSection === 'employees' && item.positions_details) {
                    return item.positions_details.some(p => matchesId(p.level_id, positionLevelFilter));
                }
                return false;
            });
        }

        return result;
    }, [rawData, searchTerm, statusFilter, officeFilter, departmentFilter, sectionFilter, jobFamilyFilter, roleFilter, clusterTypeFilter, stateFilter, districtFilter, mandalFilter, officeLevelFilter, roleTypeFilter, jobFilter, taskFilter, positionLevelFilter, activeSection, departments, offices, orgLevels]);

    const data = filteredData;
    const filterConfig = getFilterConfig();

    const containerMinHeight = (isLoadingAny && (!rawData || rawData.length === 0)) ? '75vh' : '400px';

    // DIRECT CALCULATION: Should we show the loading spinner?
    // Show spinner if loading/syncing or if section just changed and we don't have active data
    const shouldShowFullSpinner = isLoadingAny && (!rawData || rawData.length === 0 || sectionChangedSinceLastFetch);

    const [showUpdateOverlay, setShowUpdateOverlay] = useState(false);

    useEffect(() => {
        setShowUpdateOverlay(false); // Disable centered overlay per user request
    }, []);

    useEffect(() => {
        let timer;
        if (shouldShowFullSpinner) {
            // Show spinner immediately on section switch or first render, no 150ms delay to prevent "No records found" flash
            setShowSpinner(true);
        } else {
            setShowSpinner(false);
        }
        return () => clearTimeout(timer);
    }, [shouldShowFullSpinner]);


    useEffect(() => {
        console.log('🔵 [GenericTable] Mounted for section:', activeSection);
        return () => console.log('🔴 [GenericTable] Unmounted from section:', activeSection);
    }, [activeSection]);

    return (
        <div className="fade-in stagger-in"
            style={{ position: 'relative', minHeight: containerMinHeight }}
        >
            {/* Initial Load Spinner - Centered in table area */}
            {showSpinner && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.75)', zIndex: 99999, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BavyaSpinner label={`SYNCHRONIZING ${currentSectionInfo?.name?.toUpperCase() || 'DATA'}...`} minHeight="0" />
                </div>
            )}

            <header className="section-header">
                <div className="flex items-center gap-4">
                    <h2 className="section-title">
                        {currentSectionInfo ? currentSectionInfo.name : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                    </h2>
                    {isSyncing === activeSection && !loading && (
                        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--magenta)', fontSize: '0.85rem', fontWeight: 700, background: '#fff1f2', padding: '4px 12px', borderRadius: '20px', border: '1px solid #fecdd3' }}>
                            <RefreshCw size={14} className="animate-spin" />
                            SYNCHRONIZING...
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <p className="section-subtitle" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <>
                            Showing {data ? data.length : 0} of {pagination?.count || (rawData ? rawData.length : 0)} records
                            {loading && (
                                <span style={{ color: 'var(--magenta)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px', fontSize: '0.75rem' }}>
                                    <RefreshCw size={12} className="animate-spin" /> SYNCHRONIZING...
                                </span>
                            )}
                        </>
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {canCreate(activeSection) && (
                        <button
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 24px',
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const initialData = {};
                                if (continentFilter !== 'all') initialData.continent = continentFilter;
                                if (countryFilter !== 'all') initialData.country = countryFilter;
                                if (mandalFilter !== 'all') initialData.mandal = mandalFilter;
                                if (districtFilter !== 'all') initialData.district = districtFilter;
                                if (stateFilter !== 'all') initialData.state = stateFilter;
                                if (clusterTypeFilter !== 'all') {
                                    if (activeSection === 'geo-clusters') initialData.cluster_type = clusterTypeFilter;
                                    else initialData.type = clusterTypeFilter;
                                }
                                handleAdd(currentSectionInfo?.name || activeSection, initialData);
                            }}
                        >
                            <Plus size={18} /> Add New
                        </button>
                    )}
                    {['employees', 'positions', 'offices', 'departments', 'sections', 'geo-continents', 'geo-countries', 'geo-states', 'geo-districts', 'geo-mandals', 'geo-clusters'].includes(activeSection) && canCreate(activeSection) && (

                        <button
                            type="button"
                            className="btn-success"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 24px',
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap'
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🟢 [GenericTable] Bulk Import Button Clicked');
                                setIsBulkUploadOpen(true);
                            }}
                        >
                            <Upload size={18} /> Bulk Import
                        </button>
                    )}


                </div>
            </header>

            {/* Dynamic Filter Bar */}
            <div className="glass" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.25rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                    <Filter size={16} color="var(--magenta)" />
                    <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>FILTERS</h3>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '12px',
                    alignItems: 'end'
                }}>
                    {filterConfig.includes('search') && (
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={searchTerm}
                                maxLength={30}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    let errorMsg = '';
                                    if (raw.length >= 30) {
                                        errorMsg = 'Maximum limit of 30 characters reached';
                                    } else if (/[^a-zA-Z0-9\- ]/.test(raw)) {
                                        errorMsg = 'Special characters not allowed in filters';
                                    }
                                    setSearchError(errorMsg);

                                    const sanitized = raw.replace(/[^a-zA-Z0-9\- ]/g, '');
                                    setSearchTerm(sanitized);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 38px',
                                    border: searchError ? '2px solid #ef4444' : '2px solid #f1f5f9',
                                    borderRadius: '12px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#f8fafc'
                                }}
                            />
                            {searchError && (
                                <div style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 600, marginTop: '4px', position: 'absolute' }}>
                                    {searchError}
                                </div>
                            )}
                        </div>
                    )}

                    {filterConfig.includes('continent') && (
                        <select
                            value={continentFilter}
                            onChange={(e) => updateFilter({
                                continent: e.target.value,
                                country: 'all',
                                state: 'all',
                                district: 'all',
                                mandal: 'all'
                            })}
                            style={{ padding: '10px 12px', border: '2px solid #f1f5f9', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}
                        >
                            <option value="all">All Continents</option>
                            {(geoContinents || []).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}

                    {filterConfig.includes('country') && (
                        <select
                            value={countryFilter}
                            onChange={(e) => updateFilter({
                                country: e.target.value,
                                state: 'all',
                                district: 'all',
                                mandal: 'all'
                            })}
                            disabled={filterConfig.includes('continent') && continentFilter === 'all'}
                            style={{ padding: '10px 12px', border: '2px solid #f1f5f9', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, outline: 'none', opacity: (filterConfig.includes('continent') && continentFilter === 'all') ? 0.6 : 1 }}
                        >
                            <option value="all">All Countries</option>
                            {(geoCountries || []).filter(c => continentFilter === 'all' || matchesId(c.continent_ref, continentFilter)).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}

                    {filterConfig.includes('status') && (
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                outline: 'none'
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Blocked">Blocked</option>
                            {activeSection === 'employees' && <option value="Unassigned">Unassigned (No Position)</option>}
                            {activeSection === 'employees' && <option value="Suspicious">Suspicious</option>}
                            {activeSection === 'employees' && <option value="Terminated">Terminated</option>}
                        </select>
                    )}

                    {filterConfig.includes('level') && (
                        <select
                            value={officeLevelFilter}
                            onChange={(e) => {
                                updateFilter({
                                    officeLevel: e.target.value,
                                    office: 'all',
                                    department: 'all',
                                    section: 'all'
                                });
                            }}
                            style={{
                                padding: '8px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                outline: 'none'
                            }}
                        >
                            <option value="all">All Levels</option>
                            {(orgLevels || [])
                                .map(l => (
                                    <option key={l.id} value={l.id}>{l.level_code ? `${l.level_code} - ${l.name}` : l.name}</option>
                                ))}
                        </select>
                    )}

                    {filterConfig.includes('office') && (
                        <select
                            value={officeFilter}
                            onChange={(e) => {
                                updateFilter({
                                    office: e.target.value,
                                    department: 'all',
                                    section: 'all'
                                });
                            }}
                            disabled={filterConfig.includes('level') && officeLevelFilter === 'all'}
                            style={{
                                padding: '10px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                outline: 'none',
                                opacity: (filterConfig.includes('level') && officeLevelFilter === 'all') ? 0.6 : 1
                            }}
                        >
                            <option value="all">All Offices</option>
                            {(() => {
                                const filteredOffices = offices
                                    .filter(o =>
                                        officeLevelFilter === 'all' ||
                                        o.level == officeLevelFilter ||
                                        o.level_id == officeLevelFilter
                                    )
                                    .sort((a, b) => a.name.localeCompare(b.name));
                                return filteredOffices.length > 0 ? (
                                    filteredOffices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                                ) : (
                                    <option disabled>No data found</option>
                                );
                            })()}
                        </select>
                    )}

                    {filterConfig.includes('department') && (
                        <select
                            value={departmentFilter}
                            onChange={(e) => {
                                updateFilter({
                                    department: e.target.value,
                                    section: 'all'
                                });
                            }}
                            disabled={filterConfig.includes('office') && officeFilter === 'all'}
                            style={{
                                padding: '10px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                outline: 'none',
                                opacity: (filterConfig.includes('office') && officeFilter === 'all') ? 0.6 : 1
                            }}
                        >
                            <option value="all">All Departments</option>
                            {(() => {
                                const filteredDepts = (departments || [])
                                    .filter(d => {
                                        const matchOffice = officeFilter === 'all' || d.office == officeFilter || d.office_id == officeFilter;
                                        const matchLevel = officeLevelFilter === 'all' || d.office_level_id == officeLevelFilter ||
                                            (d.office_details && d.office_details.level_id == officeLevelFilter);
                                        return matchOffice && matchLevel;
                                    })
                                    .sort((a, b) => a.name.localeCompare(b.name));
                                return filteredDepts.length > 0 ? (
                                    filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                                ) : (
                                    <option disabled>No data found</option>
                                );
                            })()}
                        </select>
                    )}

                    {filterConfig.includes('section') && (
                        <select
                            value={sectionFilter}
                            onChange={(e) => {
                                updateFilter({
                                    section: e.target.value
                                });
                            }}
                            disabled={filterConfig.includes('department') && departmentFilter === 'all'}
                            style={{
                                padding: '10px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                outline: 'none',
                                opacity: (filterConfig.includes('department') && departmentFilter === 'all') ? 0.6 : 1
                            }}
                        >
                            <option value="all">All Sections</option>
                            {(() => {
                                const filteredSecs = (sections || [])
                                    .filter(s => {
                                        const sDeptId = (s.department && typeof s.department === 'object') ? s.department.id : s.department;
                                        const sDeptIdFinal = s.department_id || sDeptId;
                                        const matchDept = departmentFilter === 'all' ||
                                            String(sDeptIdFinal) === String(departmentFilter);

                                        // Improve office match by looking up department if needed
                                        let matchOffice = officeFilter === 'all';
                                        if (!matchOffice) {
                                            const deptId = s.department_id || s.department;
                                            const dept = (departments || []).find(d => String(d.id) === String(deptId));
                                            matchOffice = (s.office_id == officeFilter) ||
                                                (dept && (String(dept.office) === String(officeFilter) || String(dept.office_id) === String(officeFilter)));
                                        }

                                        return matchDept && matchOffice;
                                    })
                                    .sort((a, b) => a.name.localeCompare(b.name));
                                return filteredSecs.length > 0 ? (
                                    filteredSecs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                ) : (
                                    <option disabled>No data found</option>
                                );
                            })()}
                        </select>
                    )}

                    {filterConfig.includes('jobFamily') && (
                        <select
                            value={jobFamilyFilter}
                            onChange={(e) => {
                                updateFilter({
                                    jobFamily: e.target.value,
                                    roleType: 'all',
                                    role: 'all',
                                    job: 'all',
                                    task: 'all'
                                });
                            }}
                            style={{
                                padding: '8px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                outline: 'none'
                            }}
                        >
                            <option value="all">All Job Families</option>
                            {jobFamilies.length > 0 ? (
                                [...jobFamilies].sort((a, b) => a.name.localeCompare(b.name)).map(jf => <option key={jf.id} value={jf.id}>{jf.name}</option>)
                            ) : (
                                <option disabled>No data found</option>
                            )}
                        </select>
                    )}

                    {filterConfig.includes('roleType') && (
                        <select
                            value={roleTypeFilter}
                            onChange={(e) => {
                                updateFilter({
                                    roleType: e.target.value,
                                    role: 'all',
                                    job: 'all',
                                    task: 'all'
                                });
                            }}
                            disabled={filterConfig.includes('jobFamily') && jobFamilyFilter === 'all'}
                            style={{
                                padding: '10px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                outline: 'none',
                                opacity: (filterConfig.includes('jobFamily') && jobFamilyFilter === 'all') ? 0.6 : 1
                            }}
                        >
                            <option value="all">All Role Types</option>
                            {(() => {
                                const filteredRoleTypes = (roleTypes || [])
                                    .filter(rt =>
                                        jobFamilyFilter === 'all' ||
                                        matchesId(rt.job_family, jobFamilyFilter) ||
                                        matchesId(rt.job_family_id, jobFamilyFilter)
                                    )
                                    .sort((a, b) => a.name.localeCompare(b.name));
                                return filteredRoleTypes.length > 0 ? (
                                    filteredRoleTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)
                                ) : (
                                    <option disabled>No data found</option>
                                );
                            })()}
                        </select>
                    )}

                    {filterConfig.includes('role') && (
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setJobFilter('all');
                                setTaskFilter('all');
                            }}
                            disabled={filterConfig.includes('roleType') && roleTypeFilter === 'all'}
                            style={{
                                padding: '10px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                outline: 'none',
                                opacity: (filterConfig.includes('roleType') && roleTypeFilter === 'all') ? 0.6 : 1
                            }}
                        >
                            <option value="all">All Roles</option>
                            {(() => {
                                const filteredRoles = (roles || [])
                                    .filter(r =>
                                        (jobFamilyFilter === 'all' || matchesId(r.job_family_id, jobFamilyFilter) || (r.role_type && matchesId(r.role_type.job_family, jobFamilyFilter))) &&
                                        (roleTypeFilter === 'all' || matchesId(r.role_type, roleTypeFilter) || matchesId(r.role_type_id, roleTypeFilter))
                                    )
                                    .sort((a, b) => a.name.localeCompare(b.name));
                                return filteredRoles.length > 0 ? (
                                    filteredRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                                ) : (
                                    <option disabled>No data found</option>
                                );
                            })()}
                        </select>
                    )}

                    {filterConfig.includes('job') && (
                        <select
                            value={jobFilter}
                            onChange={(e) => {
                                setJobFilter(e.target.value);
                                setTaskFilter('all');
                            }}
                            disabled={filterConfig.includes('role') && roleFilter === 'all'}
                            style={{
                                padding: '10px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                outline: 'none',
                                opacity: (filterConfig.includes('role') && roleFilter === 'all') ? 0.6 : 1
                            }}
                        >
                            <option value="all">All Jobs</option>
                            {(() => {
                                const filteredJobs = (jobs || [])
                                    .filter(j =>
                                        matchesHierarchy(j, jobFamilyFilter, roleTypeFilter, roleFilter, 'all')
                                    )
                                    .sort((a, b) => a.name.localeCompare(b.name));

                                if (activeSection === 'tasks' && filterConfig.includes('job')) {
                                    console.log(`[GenericTable] Job Dropdown - JF:${jobFamilyFilter}, RT:${roleTypeFilter}, R:${roleFilter}. Found ${filteredJobs.length}/${jobs?.length || 0} jobs.`);
                                    if (jobs?.length > 0 && filteredJobs.length === 0) {
                                        console.log(`[GenericTable] First job sample for debug:`, jobs[0]);
                                    }
                                }

                                return filteredJobs.length > 0 ? (
                                    filteredJobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)
                                ) : (
                                    <option disabled>No data found</option>
                                );
                            })()}
                        </select>
                    )}

                    {filterConfig.includes('task') && (
                        <select
                            value={taskFilter}
                            onChange={(e) => setTaskFilter(e.target.value)}
                            disabled={filterConfig.includes('job') && jobFilter === 'all'}
                            style={{
                                padding: '10px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                outline: 'none',
                                opacity: (filterConfig.includes('job') && jobFilter === 'all') ? 0.6 : 1
                            }}
                        >
                            <option value="all">All Tasks</option>
                            {(() => {
                                const filteredTasks = (tasks || []).filter(t =>
                                    matchesHierarchy(t, jobFamilyFilter, roleTypeFilter, roleFilter, jobFilter)
                                );
                                return filteredTasks.length > 0 ? (
                                    filteredTasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                ) : (
                                    <option disabled>No data found</option>
                                );
                            })()}
                        </select>
                    )}

                    {filterConfig.includes('positionLevel') && (
                        <select
                            value={positionLevelFilter}
                            onChange={(e) => setPositionLevelFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                outline: 'none'
                            }}
                        >
                            <option value="all">All Position Levels</option>
                            {(positionLevels || []).map(lvl => (
                                <option key={lvl.id} value={lvl.id}>{lvl.level_code ? `${lvl.level_code} - ${lvl.name}` : lvl.name}</option>
                            ))}
                        </select>
                    )}

                    {/* Continent and Country moved to top */}

                    {filterConfig.includes('state') && (
                        <select
                            value={stateFilter}
                            onChange={(e) => {
                                updateFilter({
                                    state: e.target.value,
                                    district: 'all',
                                    mandal: 'all'
                                });
                            }}
                            disabled={filterConfig.includes('country') && countryFilter === 'all'}
                            style={{ padding: '10px 12px', border: '2px solid #f1f5f9', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, outline: 'none', opacity: (filterConfig.includes('country') && countryFilter === 'all') ? 0.6 : 1 }}
                        >
                            <option value="all">All States</option>
                            {(geoStatesData || []).filter(s => countryFilter === 'all' || matchesId(s.country, countryFilter)).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    )}

                    {filterConfig.includes('district') && (
                        <select
                            value={districtFilter}
                            onChange={(e) => {
                                updateFilter({
                                    district: e.target.value,
                                    mandal: 'all'
                                });
                            }}
                            style={{ padding: '10px 12px', border: '2px solid #f1f5f9', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, outline: 'none', opacity: (filterConfig.includes('state') && stateFilter === 'all') ? 0.6 : 1 }}
                            disabled={filterConfig.includes('state') && stateFilter === 'all'}
                        >
                            <option value="all">All Districts</option>
                            {(() => {
                                const filteredDistricts = (geoDistrictsData || []).filter(d => stateFilter === 'all' || matchesId(d.state, stateFilter) || matchesId(d.state_id, stateFilter));
                                return filteredDistricts.length > 0 ? (
                                    filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                                ) : (
                                    <option disabled>No data found</option>
                                );
                            })()}
                        </select>
                    )}

                    {filterConfig.includes('mandal') && (
                        <select
                            value={mandalFilter}
                            onChange={(e) => updateFilter({ mandal: e.target.value })}
                            style={{ padding: '10px 12px', border: '2px solid #f1f5f9', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, outline: 'none', opacity: districtFilter === 'all' ? 0.6 : 1 }}
                            disabled={districtFilter === 'all'}
                        >
                            <option value="all">All Mandals</option>
                            {(() => {
                                const filteredMandals = (geoMandals || []).filter(m => districtFilter === 'all' || matchesId(m.district, districtFilter) || matchesId(m.district_id, districtFilter));
                                return filteredMandals.length > 0 ? (
                                    filteredMandals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
                                ) : (
                                    <option disabled>No data found</option>
                                );
                            })()}
                        </select>
                    )}

                    {filterConfig.includes('clusterType') && (
                        <select
                            value={clusterTypeFilter}
                            onChange={(e) => setClusterTypeFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '2px solid #f1f5f9',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                outline: 'none'
                            }}
                        >
                            <option value="all">All Categories</option>
                            {activeSection === 'geo-clusters' && (
                                <>
                                    <option value="METROPOLITAN">Metropolitan</option>
                                    <option value="CITY">City</option>
                                    <option value="TOWN">Town</option>
                                    <option value="VILLAGE">Village</option>
                                </>
                            )}
                        </select>
                    )}

                    {/* Search moved to top */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gridColumn: '1 / -1', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', marginTop: '0.5rem', gap: '12px' }}>
                        <button
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}
                            onClick={resetFilters}
                        >
                            <RotateCcw size={18} /> Reset Filters
                        </button>
                        <button
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #fde6cd', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}
                            onClick={handleExport}
                        >
                            <Download size={18} /> Download List
                        </button>
                    </div>
                </div>
            </div >

            <div className="glass section-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-responsive-wrapper" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table className="data-table" style={{ minWidth: '600px', width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Details</th>
                            {!activeSection.startsWith('geo-') && <th>Status</th>}
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan="100%" style={{ textAlign: 'center', padding: '100px 20px', color: '#94a3b8' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        {isLoadingAny ? (
                                            <div style={{ padding: '80px 0', opacity: 0.5 }}>
                                                {/* Primary spinner is handled by the overlay above */}
                                                <RefreshCw size={40} className="animate-spin" style={{ color: 'var(--magenta)', opacity: 0.2 }} />
                                            </div>
                                        ) : (
                                            <>
                                                <Search size={40} style={{ opacity: 0.2, marginBottom: '8px' }} />
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#64748b' }}>No records found</div>
                                                <div style={{ fontSize: '0.85rem' }}>Try adjusting your filters or search term</div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            (() => {
                                let lastGroup = null;
                                let lastSubGroup = null;
                                return data.map((item, index) => {
                                    let groupHeader = null;
                                    let subGroupHeader = null;
                                    if (activeSection === 'sections') {
                                        // Check for project change (main group)
                                        const projectKey = item.project_name || 'No Project';
                                        if (projectKey !== lastGroup) {
                                            lastGroup = projectKey;
                                            lastSubGroup = null; // Reset subgroup when main group changes
                                        }

                                        // Check for department change (sub group)
                                        if (item.department_name !== lastSubGroup) {
                                            lastSubGroup = item.department_name;
                                            subGroupHeader = (
                                                <tr key={`header-dept-${item.department}`} style={{ background: 'rgba(249, 115, 22, 0.05)' }}>
                                                    <td colSpan="4" style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                                                        🏢 DEPARTMENT: {item.department_name}
                                                        {item.project_name && (
                                                            <span style={{ marginLeft: '8px', fontWeight: 500, color: '#64748b', fontSize: '0.8rem' }}>
                                                                ({item.project_name})
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    } else if (activeSection === 'departments' && item.office_name !== lastGroup) {
                                        lastGroup = item.office_name;
                                        groupHeader = (
                                            <tr key={`header-office-${item.office}`} style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                                                <td colSpan="4" style={{ padding: '12px 16px', fontWeight: 800, color: '#2563eb', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    🏢 OFFICE: {item.office_name}
                                                </td>
                                            </tr>
                                        );
                                    } else if (activeSection === 'task-urls' && item.job_family_name !== lastGroup) {
                                        lastGroup = item.job_family_name;
                                        groupHeader = (
                                            <tr key={`header-${item.job_family_name}`} style={{ background: 'rgba(136, 19, 55, 0.05)' }}>
                                                <td colSpan="4" style={{ padding: '8px 16px', fontWeight: 600, color: 'var(--magenta)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    📂 JOB FAMILY: {item.job_family_name || 'Global / Unassigned'}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <React.Fragment key={item.id || index}>
                                            {groupHeader}
                                            {subGroupHeader}
                                            <tr className="fade-in">
                                                {renderTableData(item, { clusterType: clusterTypeFilter, searchTerm, HighlightTerm })}
                                                {activeSection !== 'login-hits' && (
                                                    <>
                                                        {!activeSection.startsWith('geo-') && (
                                                            <td>
                                                                {(() => {
                                                                    // ROBUST CHECK: Mask 'Suspicious' status to 'Active' for the employee's own profile
                                                                    const isSelf = activeSection === 'employees' &&
                                                                        user?.employee_profile_id &&
                                                                        String(item.id) === String(user.employee_profile_id);

                                                                    const s = (item.status === 'Suspicious' && (isSelf || activeSection !== 'employees')) ? 'Active' : (item.status || 'Active');

                                                                    return (
                                                                        <span className={`badge ${s === 'Suspicious' ? 'badge-suspicious' :
                                                                            s === 'Inactive' ? 'badge-inactive' : 'badge-active'
                                                                            }`}>
                                                                            {s}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </td>
                                                        )}
                                                        <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
                                                        <td style={{ display: 'flex', gap: '8px' }}>
                                                            {activeSection === 'offices' && (
                                                                <button className="nav-link" style={{ padding: '6px', minWidth: 'auto', color: '#3b82f6' }} onClick={() => handleViewOffice(item)} title="View Details">
                                                                    <Eye size={16} />
                                                                </button>
                                                            )}
                                                            {activeSection === 'employees' && (
                                                                <button className="nav-link" style={{ padding: '6px', minWidth: 'auto', color: '#3b82f6' }} onClick={() => handleViewProfile(item.id)} title="View Profile">
                                                                    <Eye size={16} />
                                                                </button>
                                                            )}
                                                            {activeSection === 'positions' && (
                                                                <button className="nav-link" style={{ padding: '6px', minWidth: 'auto', color: '#3b82f6' }} onClick={() => fetchPositionDetail(item.id)} title="View Detail">
                                                                    <Eye size={16} />
                                                                </button>
                                                            )}
                                                            {item.is_office ? (
                                                                <button
                                                                    className="nav-link"
                                                                    style={{ padding: '6px', minWidth: 'auto', opacity: 0.4, cursor: 'not-allowed' }}
                                                                    disabled={true}
                                                                    title="Protected Office Location"
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="nav-link"
                                                                    style={{ padding: '6px', minWidth: 'auto', opacity: canEdit(activeSection) ? 1 : 0.4, cursor: canEdit(activeSection) ? 'pointer' : 'not-allowed' }}
                                                                    onClick={() => canEdit(activeSection) && handleEdit(currentSectionInfo?.name || activeSection, item)}
                                                                    title={canEdit(activeSection) ? "Edit" : "Access Denied"}
                                                                    disabled={!canEdit(activeSection)}
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                            )}
                                                            {item.is_office ? (
                                                                <div title="Protected Office Location" style={{ padding: '6px', opacity: 0.3 }}><Trash2 size={16} /></div>
                                                            ) : activeSection === 'offices' && item.has_sub_offices ? (
                                                                <div title="Cannot delete office with sub-offices" style={{ padding: '6px', opacity: 0.3 }}><Trash2 size={16} /></div>
                                                            ) : (
                                                                <button
                                                                    className="nav-link"
                                                                    style={{ padding: '6px', minWidth: 'auto', color: '#ef4444', opacity: canDelete(activeSection) ? 1 : 0.4, cursor: canDelete(activeSection) ? 'pointer' : 'not-allowed' }}
                                                                    onClick={() => canDelete(activeSection) && handleDelete(currentSectionInfo?.name || activeSection, item.id, item.name || item.title || item.username || 'this record')}
                                                                    title={canDelete(activeSection) ? "Delete" : "Access Denied"}
                                                                    disabled={!canDelete(activeSection)}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </>
                                                )}
                                                {activeSection === 'login-hits' && (
                                                    <td><span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>System Log</span></td>
                                                )}
                                            </tr>
                                        </React.Fragment>
                                    );
                                });
                            })()
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {
                !customData && pagination && pagination.count > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', padding: '0 0.5rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            Page <b>{pagination.current}</b> of <b>{Math.ceil(pagination.count / 100)}</b>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn-secondary"
                                disabled={!pagination.previous}
                                onClick={() => fetchData(false, true, pagination.current - 1, filters)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '0.5rem 1rem',
                                    opacity: !pagination.previous ? 0.5 : 1,
                                    cursor: !pagination.previous ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <button
                                className="btn-secondary"
                                disabled={!pagination.next}
                                onClick={() => fetchData(false, true, pagination.current + 1, filters)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '0.5rem 1rem',
                                    opacity: !pagination.next ? 0.5 : 1,
                                    cursor: !pagination.next ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )
            }

        </div>
    );
};

export default GenericTable;
