import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    Plus,
    Trash2,
    User,
    Clock,
    Building2,
    FolderKanban,
    Search,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    Tag
} from 'lucide-react';
import { useData } from '../context/DataContext';
import BavyaSpinner from '../components/BavyaSpinner';
import api from '../api';

const PositionShiftRoster = () => {
    const {
        user,
        offices,
        projects,
        positions: allPositions,
        showNotification
    } = useData();

    // Roster States
    const [employeesList, setEmployeesList] = useState([]);
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [durationDays, setDurationDays] = useState(7);
    const [selectedOffice, setSelectedOffice] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');

    // Premium Concept States
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [myOfficesOnly, setMyOfficesOnly] = useState(false);

    const [positions, setPositions] = useState([]);
    const [rosters, setRosters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tableSearch, setTableSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPagesCount, setTotalPagesCount] = useState(0);
    const [totalPositionsCount, setTotalPositionsCount] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const userOfficeIds = useMemo(() => {
        const ids = new Set();
        if (user?.positions_details && Array.isArray(user.positions_details)) {
            user.positions_details.forEach(p => {
                if (p.office_id) ids.add(p.office_id);
            });
        }
        if (user?.office_ids && Array.isArray(user.office_ids)) {
            user.office_ids.forEach(id => ids.add(id));
        }
        if (user?.office_id) {
            ids.add(user.office_id);
        }
        // Also include offices of subordinates
        if (employeesList && Array.isArray(employeesList)) {
            employeesList.forEach(emp => {
                if (emp.positions_details && Array.isArray(emp.positions_details)) {
                    emp.positions_details.forEach(p => {
                        if (p.office_id) ids.add(p.office_id);
                    });
                }
            });
        }
        return Array.from(ids).map(String);
    }, [user, employeesList]);

    // Helper to calculate hours difference
    const calculateHoursDifference = (startStr, endStr) => {
        if (!startStr || !endStr) return '';
        try {
            const [startH, startM] = startStr.split(':').map(Number);
            const [endH, endM] = endStr.split(':').map(Number);
            
            let startMinutes = startH * 60 + startM;
            let endMinutes = endH * 60 + endM;
            
            // Handle overnight shifts
            if (endMinutes < startMinutes) {
                endMinutes += 24 * 60;
            }
            
            const diffMinutes = endMinutes - startMinutes;
            return (diffMinutes / 60).toFixed(2);
        } catch (e) {
            return '';
        }
    };

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        position: null,
        shift: null,
        date: '',
        employeeId: '',
        rosterId: null, // If editing/re-assigning
        actual_start_time: '',
        actual_end_time: '',
        attendance_status: 'PENDING',
        hours_worked: '',
        remarks: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [positionSearch, setPositionSearch] = useState('');
    const [isChangingEmployee, setIsChangingEmployee] = useState(false);
    const [isRequestWorkflow, setIsRequestWorkflow] = useState(false);

    // Bulk Roster States
    const [assignmentMode, setAssignmentMode] = useState('single'); // 'single', 'weekly', 'monthly', 'custom'
    const [bulkActionType, setBulkActionType] = useState('assign'); // 'assign', 'unassign'
    const [recurrenceDays, setRecurrenceDays] = useState([1, 2, 3, 4, 5, 6, 0]); // 0=Sun, 1=Mon, ..., 6=Sat
    const [monthSelect, setMonthSelect] = useState(() => {
        const today = new Date();
        return today.toISOString().substring(0, 7);
    });
    const [weekSelect, setWeekSelect] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [customStartDate, setCustomStartDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [customEndDate, setCustomEndDate] = useState(() => {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
    });
    const [overwriteExisting, setOverwriteExisting] = useState(false);
    const [bulkReport, setBulkReport] = useState(null); // { successCount, skippedList, errorList }

    // ─── Memoized dates array: recomputes only when startDate or durationDays changes ───
    const dates = useMemo(() => {
        const result = [];
        if (!startDate) return result;
        try {
            const start = new Date(startDate + 'T00:00:00'); // Force local time parse
            if (isNaN(start.getTime())) return result;
            for (let i = 0; i < durationDays; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                result.push(d.toISOString().split('T')[0]);
            }
        } catch (e) {
            console.error("Invalid start date:", e);
        }
        return result;
    }, [startDate, durationDays]);

    // ─── O(1) roster lookup Map: key = "positionId|shiftId|date" ───────────────────────
    // Replaces rosters.find() inside a triple nested loop (was O(n) × positions × shifts × dates)
    const rosterMap = useMemo(() => {
        const map = new Map();
        rosters.forEach(r => {
            const key = `${r.position}|${r.shift}|${r.date}`;
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key).push(r);
        });
        return map;
    }, [rosters]);

    // Debounce search query to prevent excessive API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(tableSearch);
        }, 350);
        return () => clearTimeout(timer);
    }, [tableSearch]);

    // Reset pagination and selected position on filter or search changes
    useEffect(() => {
        setCurrentPage(1);
        setSelectedPosition(null);
    }, [debouncedSearch, selectedOffice, selectedProject, myOfficesOnly]);

    const paginatedPositions = positions;

    const getDatesToAssign = () => {
        if (assignmentMode === 'single') {
            return [modalData.date];
        }

        let datesList = [];
        let start, end;

        if (assignmentMode === 'weekly') {
            const baseDate = new Date(weekSelect + 'T00:00:00');
            const dayOfWeek = baseDate.getDay();
            const diff = baseDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const monday = new Date(new Date(baseDate).setDate(diff));
            const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
            
            // If the selected week contains the clicked date, start from the clicked date (remaining days only)
            if (modalData.date) {
                const clickDate = new Date(modalData.date + 'T00:00:00');
                if (clickDate >= monday && clickDate <= sunday) {
                    start = clickDate;
                } else {
                    start = monday;
                }
            } else {
                start = monday;
            }
            end = sunday;
        } else if (assignmentMode === 'monthly') {
            const [year, month] = monthSelect.split('-').map(Number);
            const monthStart = new Date(year, month - 1, 1);
            
            // If the selected month is the same month as the clicked date, start from the clicked date (remaining days only)
            if (modalData.date) {
                const clickDate = new Date(modalData.date + 'T00:00:00');
                if (clickDate.getFullYear() === year && (clickDate.getMonth() + 1) === month) {
                    start = clickDate;
                } else {
                    start = monthStart;
                }
            } else {
                start = monthStart;
            }
            end = new Date(year, month, 0);
        } else if (assignmentMode === 'custom') {
            start = new Date(customStartDate + 'T00:00:00');
            end = new Date(customEndDate + 'T00:00:00');
        }

        if (start && end) {
            let current = new Date(start);
            while (current <= end) {
                const dayNum = current.getDay();
                const yyyy = current.getFullYear();
                const mm = String(current.getMonth() + 1).padStart(2, '0');
                const dd = String(current.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;

                if (recurrenceDays.includes(dayNum)) {
                    datesList.push(dateStr);
                }
                current.setDate(current.getDate() + 1);
            }
        }
        return datesList;
    };

    const isToday = (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    };

    // Fetch data


    const fetchRosterData = async () => {
        setLoading(true);
        try {
            // Fetch positions with server-side pagination and search
            const params = [
                'has_shifts=true',
                `page=${currentPage}`,
                `page_size=50`
            ];
            if (debouncedSearch.trim()) {
                params.push(`search=${encodeURIComponent(debouncedSearch)}`);
            }
            if (user && !user.is_superuser) {
                params.push('reports_to_me=true');
            }
            if (myOfficesOnly) {
                if (userOfficeIds.length > 0) {
                    params.push(`office=${userOfficeIds.join(',')}`);
                } else {
                    params.push('office=0');
                }
            } else if (selectedOffice !== 'all') {
                params.push(`office=${selectedOffice}`);
            }
            if (selectedProject !== 'all') {
                params.push(`project=${selectedProject}`);
            }

            const positionsUrl = 'positions/all_data/?' + params.join('&');
            const posRes = await api.get(positionsUrl);

            const posData = posRes.results || [];
            setPositions(posData);
            setTotalPositionsCount(posRes.count || 0);
            setTotalPagesCount(posRes.num_pages || 0);

            // Fetch rosters only for the positions on the current page
            const positionIds = posData.map(p => p.id);
            if (positionIds.length > 0) {
                const endD = dates[dates.length - 1];
                const rostersUrl = `position-shift-rosters/?start_date=${startDate}&end_date=${endD}&position_ids=${positionIds.join(',')}`;
                const rosterRes = await api.get(rostersUrl);
                const rosterData = rosterRes.results || rosterRes;
                setRosters(Array.isArray(rosterData) ? rosterData : []);
            } else {
                setRosters([]);
            }

        } catch (err) {
            console.error('Error fetching roster data:', err);
            showNotification('Failed to load roster data. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };


    // Fetch employees lazily — only when modal opens (avoids heavy startup query)
    const fetchEmployees = useCallback(async () => {
        if (employeesList.length > 0) return; // Already loaded, skip
        try {
            let employeesUrl = 'employees/all_data/?pagination=false';
            if (user && !user.is_superuser) {
                employeesUrl += '&reports_to_me=true';
            }
            const empRes = await api.get(employeesUrl);
            const list = Array.isArray(empRes) ? empRes : (empRes.results || []);
            setEmployeesList(list);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    }, [user, employeesList.length]);

    useEffect(() => {
        fetchRosterData();
    }, [startDate, durationDays, selectedOffice, selectedProject, user, currentPage, debouncedSearch, myOfficesOnly]);

    // Navigate dates
    const handlePrevWeek = () => {
        const prev = new Date(startDate);
        prev.setDate(prev.getDate() - durationDays);
        setStartDate(prev.toISOString().split('T')[0]);
    };

    const handleNextWeek = () => {
        const next = new Date(startDate);
        next.setDate(next.getDate() + durationDays);
        setStartDate(next.toISOString().split('T')[0]);
    };

    const handleToday = () => {
        setStartDate(new Date().toISOString().split('T')[0]);
    };

    // Open Assign Modal
    const handleOpenAssignModal = (position, shift, dateStr, existingRoster = null) => {
        setModalError('');
        setEmployeeSearch('');
        setBulkReport(null);
        setAssignmentMode('single');
        setBulkActionType('assign');
        setRecurrenceDays([1, 2, 3, 4, 5, 6, 0]);
        setOverwriteExisting(false);
        setIsChangingEmployee(false);
        setIsRequestWorkflow(user && !user.is_superuser ? true : false);
        let schedStart = shift && shift.start_time ? shift.start_time.substring(0, 5) : '';
        let schedEnd = shift && shift.end_time ? shift.end_time.substring(0, 5) : '';

        // If this is a cover/additional assignment (existingRoster is null but there are already assignments in the cell)
        if (!existingRoster && position && shift) {
            const cellRosters = rosterMap.get(`${position.id}|${shift.id}|${dateStr}`) || [];
            if (cellRosters.length > 0) {
                // Find the latest actual end time logged among existing rosters in this cell
                const lastRosterWithEnd = [...cellRosters].reverse().find(r => r.actual_end_time);
                if (lastRosterWithEnd && lastRosterWithEnd.actual_end_time) {
                    schedStart = lastRosterWithEnd.actual_end_time.substring(0, 5);
                }
            }
        }

        const defaultHours = (schedStart && schedEnd) ? calculateHoursDifference(schedStart, schedEnd) : '';

        setModalData({
            position,
            shift,
            date: dateStr,
            employeeId: existingRoster ? String(existingRoster.employee) : '',
            employeeName: existingRoster ? existingRoster.employee_name : '',
            employeeCode: existingRoster ? existingRoster.employee_code : '',
            originalEmployeeId: existingRoster ? String(existingRoster.employee) : '',
            originalEmployeeName: existingRoster ? existingRoster.employee_name : '',
            originalEmployeeCode: existingRoster ? existingRoster.employee_code : '',
            rosterId: existingRoster ? existingRoster.id : null,
            actual_start_time: existingRoster && existingRoster.actual_start_time ? existingRoster.actual_start_time.substring(0, 5) : schedStart,
            actual_end_time: existingRoster && existingRoster.actual_end_time ? existingRoster.actual_end_time.substring(0, 5) : schedEnd,
            attendance_status: existingRoster && existingRoster.attendance_status ? existingRoster.attendance_status : 'PRESENT',
            hours_worked: existingRoster && existingRoster.hours_worked !== null && existingRoster.hours_worked !== '' ? existingRoster.hours_worked : defaultHours,
            remarks: existingRoster ? existingRoster.remarks || '' : ''
        });

        // Pre-fill date fields
        setWeekSelect(dateStr);
        setCustomStartDate(dateStr);
        const nextWeek = new Date(dateStr);
        nextWeek.setDate(nextWeek.getDate() + 7);
        setCustomEndDate(nextWeek.toISOString().split('T')[0]);
        setMonthSelect(dateStr.substring(0, 7));

        setShowModal(true);
        fetchEmployees(); // Lazy-load employees only when needed
    };

    const handleOpenHeaderBulkModal = () => {
        setModalError('');
        setEmployeeSearch('');
        setBulkReport(null);
        setAssignmentMode('weekly');
        setBulkActionType('assign');
        setRecurrenceDays([1, 2, 3, 4, 5, 6, 0]);
        setOverwriteExisting(false);

        const todayStr = new Date().toISOString().split('T')[0];
        setModalData({
            position: null,
            shift: null,
            date: '',
            employeeId: '',
            employeeName: '',
            employeeCode: '',
            rosterId: null
        });

        setWeekSelect(todayStr);
        setCustomStartDate(todayStr);
        const nextWeek = new Date(todayStr);
        nextWeek.setDate(nextWeek.getDate() + 7);
        setCustomEndDate(nextWeek.toISOString().split('T')[0]);
        setMonthSelect(todayStr.substring(0, 7));

        setShowModal(true);
        fetchEmployees(); // Lazy-load employees only when needed
    };

    // Save allocation
    const handleSaveAllocation = async (e) => {
        e.preventDefault();

        if (!modalData.position) {
            setModalError('Please select a position.');
            return;
        }
        if (!modalData.shift) {
            setModalError('Please select a shift.');
            return;
        }
        if ((assignmentMode === 'single' || bulkActionType === 'assign') && !modalData.employeeId) {
            setModalError('Please select an employee.');
            return;
        }

        setSubmitting(true);
        setModalError('');

        // 1. Single assignment
        if (assignmentMode === 'single') {
            if (isRequestWorkflow) {
                const requestPayload = {
                    employee: parseInt(modalData.employeeId),
                    position: modalData.position.id,
                    to_shift: modalData.shift.id,
                    date: modalData.date,
                    reason: modalData.remarks || 'Shift assignment change requested by manager.'
                };
                try {
                    await api.post('shift-change-requests/', requestPayload);
                    showNotification('Shift Change Request submitted successfully! Awaiting consent/approval.', 'success');
                    setShowModal(false);
                    fetchRosterData();
                } catch (err) {
                    console.error('Failed to submit shift request:', err);
                    setModalError(err.response?.data?.error || err.message || 'Failed to submit shift request.');
                } finally {
                    setSubmitting(false);
                }
                return;
            }

            const payload = {
                position: modalData.position.id,
                shift: modalData.shift.id,
                date: modalData.date,
                employee: parseInt(modalData.employeeId),
                actual_start_time: modalData.actual_start_time || null,
                actual_end_time: modalData.actual_end_time || null,
                attendance_status: modalData.attendance_status || 'PENDING',
                hours_worked: modalData.hours_worked ? parseFloat(modalData.hours_worked) : null,
                remarks: modalData.remarks || ''
            };

            try {
                if (modalData.rosterId) {
                    await api.put(`position-shift-rosters/${modalData.rosterId}/`, payload);
                    showNotification('Shift assignment updated successfully', 'success');
                } else {
                    await api.post('position-shift-rosters/', payload);
                    showNotification('Shift assigned successfully', 'success');
                }
                setShowModal(false);
                fetchRosterData();
            } catch (err) {
                console.error('Failed to save allocation:', err);
                let msg = 'Failed to assign shift. Please check for overlap conflicts.';
                if (err.non_field_errors) {
                    msg = Array.isArray(err.non_field_errors) ? err.non_field_errors[0] : err.non_field_errors;
                } else if (err.shift) {
                    msg = Array.isArray(err.shift) ? err.shift[0] : err.shift;
                } else if (err.detail) {
                    msg = err.detail;
                }
                setModalError(msg);
            } finally {
                setSubmitting(false);
            }
        } else {
            // 2. Bulk Action
            const datesToAssign = getDatesToAssign();
            if (datesToAssign.length === 0) {
                setModalError('No dates generated for the current selection and days of the week.');
                setSubmitting(false);
                return;
            }

            if (bulkActionType === 'assign') {
                // Bulk Assign
                const payload = {
                    employee: parseInt(modalData.employeeId),
                    position: modalData.position.id,
                    shift: modalData.shift.id,
                    dates: datesToAssign,
                    overwrite: overwriteExisting
                };

                try {
                    const res = await api.post('position-shift-rosters/bulk-assign/', payload);
                    const { success_dates, skipped_dates, error_dates } = res;

                    setBulkReport({
                        successCount: success_dates.length,
                        skippedList: skipped_dates,
                        errorList: error_dates
                    });

                    if (success_dates.length > 0) {
                        showNotification(`Successfully allocated ${success_dates.length} shifts.`, 'success');
                    } else {
                        showNotification('No shifts were allocated due to conflicts.', 'warning');
                    }
                    fetchRosterData();
                } catch (err) {
                    console.error('Failed to save bulk allocation:', err);
                    setModalError(err.error || err.detail || 'Failed to complete bulk assignment. Please try again.');
                } finally {
                    setSubmitting(false);
                }
            } else {
                // Bulk Delete (Unassign)
                const payload = {
                    position: modalData.position.id,
                    shift: modalData.shift.id,
                    dates: datesToAssign
                };

                try {
                    const res = await api.post('position-shift-rosters/bulk-delete/', payload);
                    showNotification(`Successfully unassigned ${res.deleted_count} shifts.`, 'success');
                    setShowModal(false);
                    fetchRosterData();
                } catch (err) {
                    console.error('Failed to clear bulk allocation:', err);
                    setModalError(err.error || err.detail || 'Failed to complete bulk unassignment. Please try again.');
                } finally {
                    setSubmitting(false);
                }
            }
        }
    };


    // Remove allocation
    const handleRemoveAllocation = async (rosterId) => {
        if (!window.confirm('Are you sure you want to remove this shift assignment?')) return;

        try {
            await api.delete(`position-shift-rosters/${rosterId}/`);
            showNotification('Shift assignment removed successfully', 'success');
            fetchRosterData();
        } catch (err) {
            console.error('Failed to delete roster entry:', err);
            showNotification('Failed to remove shift assignment', 'error');
        }
    };

    // Filter employees for the dropdown
    const getFilteredEmployees = () => {
        if (!employeesList) return [];

        // Filter out inactive employees
        let list = employeesList.filter(emp => emp.status !== 'INACTIVE');

        // Filter based on search input
        if (employeeSearch.trim()) {
            const query = employeeSearch.toLowerCase();
            list = list.filter(emp =>
                (emp.name && emp.name.toLowerCase().includes(query)) ||
                (emp.employee_code && emp.employee_code.toLowerCase().includes(query))
            );
        }

        // STRICT: Only allow employees tagged/assigned to this specific position
        if (modalData.position) {
            const targetPosId = String(modalData.position.id);
            list = list.filter(emp => {
                const posArray = emp.positions || [];
                const posDetails = emp.positions_details || [];

                const matchPos = posArray.some(p => String(typeof p === 'object' ? (p.id || p.position_id) : p) === targetPosId);
                const matchDetails = posDetails.some(p => String(p.id || p.position_id) === targetPosId);

                return matchPos || matchDetails;
            });
        }

        return list;
    };

    // Filter positions for the bulk scheduler modal search list
    const getFilteredPositions = () => {
        if (!allPositions) return [];
        let list = allPositions;

        // Filter based on search input in bulk modal
        if (positionSearch.trim()) {
            const query = positionSearch.toLowerCase();
            list = list.filter(pos =>
                pos.name.toLowerCase().includes(query) ||
                (pos.code && pos.code.toLowerCase().includes(query))
            );
        }

        // Only show positions that have shifts
        list = list.filter(pos => pos.shifts_details && pos.shifts_details.length > 0);

        return list;
    };

    const sortedRecommendedEmployees = getFilteredEmployees();

    // Helper: format date nicely
    const formatHeaderDate = (dateStr) => {
        const dateObj = new Date(dateStr);
        const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const date = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        return { day, date };
    };

    return (
        <div className="roster-wrapper">
            {/* Custom stylesheet to guarantee gorgeous glassmorphism aesthetics */}
            <style>{`
                .roster-wrapper {
                    padding: 0;
                    background: transparent;
                    color: #0f172a;
                    font-family: 'Outfit', sans-serif;
                }
                .roster-header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .roster-title h1 {
                    font-size: 1.75rem;
                    font-weight: 900;
                    margin: 0;
                    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.04em;
                }
                .roster-title p {
                    color: #64748b;
                    margin: 0.25rem 0 0 0;
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                .filters-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 0.85rem;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    padding: 1rem;
                    border-radius: 16px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    margin-bottom: 1.5rem;
                    box-shadow: 0 4px 20px -10px rgba(15, 23, 42, 0.04);
                }
                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                }
                .filter-group label {
                    font-size: 0.68rem;
                    font-weight: 850;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .filter-select, .filter-input {
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    color: #0f172a;
                    padding: 0.5rem 0.75rem;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    outline: none;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .filter-select:focus, .filter-input:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
                    background: #ffffff;
                }
                .nav-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                }
                .btn-nav {
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    color: #475569;
                    padding: 0.5rem;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                }
                .btn-nav:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: #0f172a;
                    transform: translateY(-1px);
                }
                .btn-today {
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    color: #475569;
                    padding: 0.5rem 1.1rem;
                    border-radius: 10px;
                    font-weight: 800;
                    font-size: 0.82rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                }
                .btn-today:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: #0f172a;
                    transform: translateY(-1px);
                }
                .grid-container {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    overflow-x: auto;
                    box-shadow: 0 8px 30px -15px rgba(15, 23, 42, 0.05);
                    margin-bottom: 1.5rem;
                }
                .roster-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    text-align: left;
                    min-width: 900px;
                }
                .roster-table th, .roster-table td {
                    border-right: 1px solid #f1f5f9;
                    border-bottom: 1px solid #f1f5f9;
                    padding: 0.85rem 0.65rem;
                    vertical-align: top;
                }
                .roster-table th:last-child, .roster-table td:last-child {
                    border-right: none;
                }
                .roster-table th {
                    background: #f8fafc;
                    font-weight: 850;
                    color: #475569;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    border-bottom: 2px solid #e2e8f0;
                    padding: 0.75rem 0.65rem;
                }
                .pos-col-header {
                    width: 230px;
                    min-width: 230px;
                    position: sticky;
                    left: 0;
                    background: #f8fafc !important;
                    z-index: 12;
                    border-right: 2px solid #e2e8f0 !important;
                }
                .position-info-cell {
                    position: sticky;
                    left: 0;
                    background: #ffffff !important;
                    z-index: 8;
                    border-right: 2px solid #f1f5f9 !important;
                }
                tr:hover .position-info-cell {
                    background: #f8fafc !important;
                }
                .date-col-header {
                    text-align: center;
                    width: calc((100% - 230px) / ${durationDays});
                }
                .date-header-day {
                    font-size: 0.68rem;
                    color: #6366f1;
                    text-transform: uppercase;
                    font-weight: 900;
                    letter-spacing: 0.08em;
                }
                .date-header-val {
                    font-size: 0.95rem;
                    margin-top: 0.15rem;
                    font-weight: 900;
                    color: #0f172a;
                }
                .position-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .position-name {
                    font-weight: 850;
                    color: #0f172a;
                    font-size: 0.95rem;
                    letter-spacing: -0.015em;
                    line-height: 1.3;
                }
                .position-code {
                    font-family: monospace;
                    font-size: 0.8rem;
                    color: #64748b;
                    font-weight: 700;
                }
                .position-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.45rem;
                    margin-top: 0.3rem;
                }
                .meta-badge {
                    font-size: 0.7rem;
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-weight: 800;
                }
                .office-badge {
                    background: #eff6ff;
                    color: #2563eb;
                    border: 1px solid #dbeafe;
                }
                .project-badge {
                    background: #faf5ff;
                    color: #9333ea;
                    border: 1px solid #f3e8ff;
                }
                .shifts-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .shift-cell-block {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 0.6rem;
                    min-height: 75px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .shift-cell-block:hover {
                    background: #ffffff;
                    border-color: #cbd5e1;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 18px -10px rgba(0, 0, 0, 0.06);
                }
                .shift-title-info {
                    font-size: 0.72rem;
                    color: #475569;
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.45rem;
                    font-weight: 800;
                    border-bottom: 1px dashed #e2e8f0;
                    padding-bottom: 0.35rem;
                }
                .btn-add-assignment {
                    border: 1.5px dashed #cbd5e1;
                    background: #ffffff;
                    color: #64748b;
                    border-radius: 10px;
                    padding: 0.45rem;
                    font-size: 0.78rem;
                    font-weight: 750;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.3rem;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .btn-add-assignment:hover {
                    background: #eff6ff;
                    border-color: #3b82f6;
                    color: #2563eb;
                    border-style: solid;
                }
                .assigned-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 0.6rem;
                    position: relative;
                    box-shadow: 0 3px 8px rgba(15, 23, 42, 0.02);
                    transition: all 0.25s ease;
                    margin-bottom: 0.4rem;
                }
                .assigned-card:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 15px rgba(15, 23, 42, 0.05);
                }
                
                /* Dynamic Status Card Colors */
                .assigned-card.present {
                    border: 1.5px solid #a7f3d0;
                    border-left: 5px solid #10b981;
                    background: #f0fdf4;
                }
                .assigned-card.left_early {
                    border: 1.5px solid #fed7aa;
                    border-left: 5px solid #f97316;
                    background: #fff7ed;
                }
                .assigned-card.late {
                    border: 1.5px solid #fde68a;
                    border-left: 5px solid #f59e0b;
                    background: #fffbeb;
                }
                .assigned-card.absent {
                    border: 1.5px solid #fecaca;
                    border-left: 5px solid #ef4444;
                    background: #fef2f2;
                }
                .assigned-card.partial {
                    border: 1.5px solid #bfdbfe;
                    border-left: 5px solid #3b82f6;
                    background: #eff6ff;
                }
                .assigned-card.pending {
                    border: 1.5px solid #e2e8f0;
                    border-left: 5px solid #94a3b8;
                    background: #f8fafc;
                }

                .employee-info-block {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .emp-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 850;
                    box-shadow: 0 2px 6px rgba(79, 70, 229, 0.12);
                }
                .emp-name {
                    font-size: 0.8rem;
                    font-weight: 850;
                    color: #0f172a;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 110px;
                }
                .emp-code {
                    font-size: 0.7rem;
                    color: #64748b;
                    font-family: monospace;
                    font-weight: 650;
                    margin-top: 0.1rem;
                }
                .card-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.45rem;
                    margin-top: 0.6rem;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 0.5rem;
                }
                .btn-card-action {
                    background: transparent;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 0.3rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .btn-card-action.edit:hover {
                    color: #4f46e5;
                    background: #eff6ff;
                }
                .btn-card-action.delete:hover {
                    color: #ef4444;
                    background: #fef2f2;
                }
                
                /* Modal Styling */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.5);
                    backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    overflow-y: auto;
                    padding: 1.5rem;
                }
                .modal-content {
                    background: #ffffff;
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    border-radius: 28px;
                    width: 100%;
                    max-width: 580px;
                    max-height: 92vh;
                    display: flex;
                    flex-direction: column;
                    color: #0f172a;
                    box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.2);
                    overflow: hidden;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #f1f5f9;
                    padding: 1.5rem 2rem;
                }
                .modal-header h3 {
                    margin: 0;
                    font-size: 1.4rem;
                    font-weight: 900;
                    color: #1e293b;
                    letter-spacing: -0.025em;
                }
                .modal-body {
                    padding: 1.75rem 2rem;
                    overflow-y: auto;
                    flex: 1;
                }
                .modal-form-group {
                    margin-bottom: 1.5rem;
                }
                .modal-form-group label {
                    display: block;
                    font-size: 0.72rem;
                    font-weight: 850;
                    color: #475569;
                    margin-bottom: 0.6rem;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .modal-form-group input[readonly], .modal-form-group select[disabled] {
                    background: #f8fafc;
                    color: #64748b;
                    border-color: #e2e8f0;
                }
                .search-box {
                    position: relative;
                    margin-bottom: 0.75rem;
                }
                .search-icon-inside {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }
                .search-input-inside {
                    padding-left: 2.75rem;
                    width: 100%;
                    box-sizing: border-box;
                }
                .employee-select-list {
                    max-height: 180px;
                    overflow-y: auto;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 14px;
                    background: #ffffff;
                }
                .employee-select-option {
                    padding: 0.75rem 1.1rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-bottom: 1px solid #f1f5f9;
                }
                .employee-select-option:hover {
                    background: #f5f3ff;
                    padding-left: 1.4rem;
                }
                .employee-select-option.selected {
                    background: #e0e7ff;
                    border-color: #6366f1;
                }
                .badge-recommended {
                    font-size: 0.65rem;
                    background: #d1fae5;
                    color: #065f46;
                    padding: 3px 8px;
                    border-radius: 8px;
                    font-weight: 850;
                    text-transform: uppercase;
                }
                .modal-error-alert {
                    background: #fee2e2;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #b91c1c;
                    padding: 1rem;
                    border-radius: 14px;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.65rem;
                    margin-bottom: 1.5rem;
                    font-weight: 650;
                }
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.85rem;
                    border-top: 1px solid #f1f5f9;
                    padding: 1.25rem 2rem 1.5rem 2rem;
                    background: #f8fafc;
                }
                .btn-modal-cancel {
                    background: #ffffff;
                    border: 1.5px solid #cbd5e1;
                    color: #475569;
                    padding: 0.75rem 1.5rem;
                    border-radius: 14px;
                    cursor: pointer;
                    font-weight: 800;
                    font-size: 0.88rem;
                    transition: all 0.2s;
                }
                .btn-modal-cancel:hover {
                    background: #f8fafc;
                    border-color: #94a3b8;
                }
                .btn-modal-save {
                    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.75rem;
                    border-radius: 14px;
                    cursor: pointer;
                    font-weight: 850;
                    font-size: 0.88rem;
                    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
                    transition: all 0.2s ease;
                }
                .btn-modal-save:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
                }
                .btn-modal-save:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
                .empty-roster-msg {
                    text-align: center;
                    padding: 6rem 2rem;
                    color: #64748b;
                }
                
                /* New Bulk Scheduler Styles */
                .btn-bulk-trigger {
                    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                    color: #ffffff;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 14px;
                    font-weight: 850;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.2);
                    font-size: 0.88rem;
                }
                .btn-bulk-trigger:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.3);
                }
                .segment-control {
                    display: flex;
                    background: #f1f5f9;
                    border-radius: 16px;
                    padding: 0.35rem;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 1.5rem;
                }
                .segment-btn {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #475569;
                    padding: 0.65rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .segment-btn.active {
                    background: #ffffff;
                    color: #4f46e5;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }
                .action-type-selector {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .action-type-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.8rem;
                    border-radius: 14px;
                    border: 1.5px solid #cbd5e1;
                    background: #ffffff;
                    color: #475569;
                    font-weight: 800;
                    font-size: 0.88rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-type-btn.active.assign {
                    background: #ecfdf5;
                    color: #047857;
                    border-color: #10b981;
                }
                .action-type-btn.active.unassign {
                    background: #fef2f2;
                    color: #b91c1c;
                    border-color: #ef4444;
                }
                .weekday-checkboxes {
                    display: flex;
                    justify-content: space-between;
                    gap: 0.4rem;
                    margin-top: 0.75rem;
                }
                .weekday-btn {
                    flex: 1;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    border: 1.5px solid #cbd5e1;
                    background: #ffffff;
                    color: #475569;
                    font-size: 0.85rem;
                    font-weight: 850;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .weekday-btn.active {
                    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                    color: #ffffff;
                    border-color: #4f46e5;
                    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
                }
                .weekday-btn:hover:not(.active) {
                    background: #f8fafc;
                    border-color: #94a3b8;
                }
                .bulk-report-view {
                    padding: 0.5rem 0;
                }
                .bulk-report-container {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .bulk-report-item {
                    font-size: 0.85rem;
                    padding: 0.6rem 0.9rem;
                    border-radius: 10px;
                    margin-bottom: 0.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .bulk-report-item.success {
                    background: #d1fae5;
                    color: #065f46;
                    font-weight: 800;
                }
                .bulk-report-item.conflict {
                    background: #fffbeb;
                    color: #b45309;
                    border: 1px solid rgba(180, 83, 9, 0.15);
                }
                .bulk-report-item.error {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid rgba(239, 68, 68, 0.15);
                }
                .today-cell {
                    background: rgba(99, 102, 241, 0.015) !important;
                }
                .today-header {
                    background: rgba(99, 102, 241, 0.035) !important;
                }
                .today-header .date-header-val {
                    background: #4f46e5;
                    color: #ffffff;
                    padding: 3px 10px;
                    border-radius: 8px;
                    display: inline-block;
                    font-weight: 900;
                    box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
                }

                /* ────────────────────────────────────────────────────────
                   PREMIUM PREMIUM CARDS DESIGN & TIMELINE VIEW
                   ──────────────────────────────────────────────────────── */
                .position-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1rem;
                    margin-bottom: 2rem;
                }
                .premium-position-card {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-left: 6px solid #881337;
                    border-radius: 20px;
                    padding: 1.25rem;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 4px 15px -5px rgba(15, 23, 42, 0.03);
                    position: relative;
                    overflow: hidden;
                }
                .premium-position-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 100px;
                    height: 100px;
                    background: radial-gradient(circle, rgba(136, 19, 55, 0.02) 0%, transparent 70%);
                    pointer-events: none;
                }
                .premium-position-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 36px -12px rgba(136, 19, 55, 0.12);
                    border-color: rgba(136, 19, 55, 0.3);
                    background: #ffffff;
                }
                .premium-position-card .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .card-office-badge {
                    font-size: 0.68rem;
                    font-weight: 850;
                    background: #eff6ff;
                    color: #1e40af;
                    border: 1px solid #dbeafe;
                    padding: 3px 8px;
                    border-radius: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    max-width: 170px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .card-shifts-badge {
                    font-size: 0.68rem;
                    font-weight: 800;
                    background: rgba(136, 19, 55, 0.06);
                    color: #881337;
                    padding: 3px 8px;
                    border-radius: 6px;
                }
                .card-position-name {
                    font-size: 1.125rem;
                    font-weight: 900;
                    color: #0f172a;
                    margin: 0;
                    line-height: 1.25;
                    letter-spacing: -0.02em;
                }
                .card-position-code {
                    font-family: monospace;
                    font-size: 0.78rem;
                    color: #64748b;
                    font-weight: 700;
                    background: #f1f5f9;
                    padding: 2px 6px;
                    border-radius: 4px;
                    align-self: flex-start;
                }
                .card-meta-row {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 0.6rem;
                    margin-top: 0.25rem;
                }
                .card-meta-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.78rem;
                }
                .card-meta-item .meta-label {
                    color: #64748b;
                    font-weight: 600;
                }
                .card-meta-item .meta-value {
                    color: #334155;
                    font-weight: 800;
                    max-width: 180px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-align: right;
                }
                .card-footer-stats {
                    border-top: 1px solid #f1f5f9;
                    padding-top: 0.75rem;
                    margin-top: 0.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.65rem;
                }
                .stats-progress-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.3rem;
                }
                .stats-progress-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.72rem;
                    font-weight: 800;
                    color: #475569;
                }
                .stats-progress-bar {
                    height: 6px;
                    background: #e2e8f0;
                    border-radius: 3px;
                    overflow: hidden;
                }
                .stats-progress-fill {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .assigned-avatars-section {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 0.25rem;
                }
                .avatars-label {
                    font-size: 0.72rem;
                    font-weight: 800;
                    color: #64748b;
                }
                .avatars-stack {
                    display: flex;
                    align-items: center;
                }
                .avatar-stack-item {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #881337 0%, #be185d 100%);
                    color: #ffffff;
                    border: 2px solid #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.68rem;
                    font-weight: 900;
                    margin-left: -6px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }
                .avatar-stack-item:first-child {
                    margin-left: 0;
                }
                .avatar-stack-item.count {
                    background: #f1f5f9;
                    color: #475569;
                    font-weight: 800;
                    border-color: #ffffff;
                }
                .card-action-btn {
                    margin-top: auto;
                    background: #f8fafc;
                    border: 1.5px solid #e2e8f0;
                    color: #475569;
                    border-radius: 12px;
                    padding: 0.55rem;
                    font-size: 0.82rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.4rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .premium-position-card:hover .card-action-btn {
                    background: #881337;
                    color: #ffffff;
                    border-color: #881337;
                }

                /* Focused schedule view */
                .focused-roster-view {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 24px;
                    padding: 1.75rem;
                    box-shadow: 0 8px 32px -10px rgba(15, 23, 42, 0.04);
                    margin-bottom: 2rem;
                    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .focused-roster-header {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    border-bottom: 1.5px solid #f1f5f9;
                    padding-bottom: 1.25rem;
                    margin-bottom: 1.5rem;
                }
                .btn-back-cards {
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    color: #475569;
                    padding: 0.45rem 1rem;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    align-self: flex-start;
                    transition: all 0.2s;
                }
                .btn-back-cards:hover {
                    background: #f8fafc;
                    color: #0f172a;
                    border-color: #cbd5e1;
                    transform: translateX(-2px);
                }
                .focused-roster-title-block h2 {
                    margin: 0 0 0.4rem 0;
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: #0f172a;
                    letter-spacing: -0.03em;
                }
                .focused-roster-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                .focused-meta-badge {
                    font-size: 0.72rem;
                    font-weight: 800;
                    padding: 3px 10px;
                    border-radius: 6px;
                }
                .focused-meta-badge.office {
                    background: #eff6ff;
                    color: #1e40af;
                }
                .focused-meta-badge.dept {
                    background: #faf5ff;
                    color: #6b21a8;
                }
                .focused-meta-badge.section {
                    background: #ecfdf5;
                    color: #065f46;
                }
                .focused-meta-badge.code {
                    background: #f1f5f9;
                    color: #475569;
                    font-family: monospace;
                }

                /* Grid of planner date cards */
                .planner-dates-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.25rem;
                }
                .planner-date-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.85rem;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.01);
                    transition: all 0.2s;
                }
                .planner-date-card.today {
                    border: 2px solid #881337;
                    box-shadow: 0 8px 24px -10px rgba(136, 19, 55, 0.15);
                    background: rgba(136, 19, 55, 0.005);
                }
                .planner-date-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1.5px solid #f1f5f9;
                    padding-bottom: 0.5rem;
                }
                .planner-date-card.today .planner-date-header {
                    border-color: rgba(136, 19, 55, 0.15);
                }
                .planner-date-header .day-name {
                    font-size: 0.72rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                }
                .planner-date-card.today .planner-date-header .day-name {
                    color: #881337;
                }
                .planner-date-header .date-val {
                    font-size: 0.95rem;
                    font-weight: 900;
                    color: #0f172a;
                }
                .planner-date-card.today .planner-date-header .date-val {
                    background: #881337;
                    color: #ffffff;
                    padding: 2px 8px;
                    border-radius: 6px;
                    box-shadow: 0 2px 5px rgba(136, 19, 55, 0.2);
                }
                .planner-shifts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.85rem;
                }
                .no-shifts-info {
                    font-size: 0.78rem;
                    color: #94a3b8;
                    font-style: italic;
                    text-align: center;
                    padding: 1.5rem 0;
                }
                .planner-shift-item {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 0.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .planner-shift-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px dashed #e2e8f0;
                    padding-bottom: 0.35rem;
                }
                .planner-shift-header .shift-name {
                    font-size: 0.75rem;
                    font-weight: 850;
                    color: #1e293b;
                }
                .planner-shift-header .shift-time {
                    font-size: 0.7rem;
                    color: #64748b;
                    font-weight: 650;
                    display: flex;
                    align-items: center;
                    gap: 2px;
                }
                .planner-shift-assignees {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .planner-btn-assign {
                    background: #ffffff;
                    border: 1.5px dashed #cbd5e1;
                    color: #64748b;
                    border-radius: 8px;
                    padding: 0.45rem;
                    font-size: 0.75rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.3rem;
                    width: 100%;
                    transition: all 0.2s;
                }
                .planner-btn-assign:hover {
                    background: rgba(136, 19, 55, 0.04);
                    border-color: #881337;
                    color: #881337;
                    border-style: solid;
                }
                .planner-btn-assign.another {
                    background: #f8fafc;
                    margin-top: 0.15rem;
                }
                
                .planner-assignee-card {
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 0.55rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.45rem;
                    position: relative;
                }
                .planner-assignee-card.present {
                    border: 1.5px solid #a7f3d0;
                    border-left: 4px solid #10b981;
                    background: #f0fdf4;
                }
                .planner-assignee-card.left_early {
                    border: 1.5px solid #fed7aa;
                    border-left: 4px solid #f97316;
                    background: #fff7ed;
                }
                .planner-assignee-card.late {
                    border: 1.5px solid #fde68a;
                    border-left: 4px solid #f59e0b;
                    background: #fffbeb;
                }
                .planner-assignee-card.absent {
                    border: 1.5px solid #fecaca;
                    border-left: 4px solid #ef4444;
                    background: #fef2f2;
                }
                .planner-assignee-card.partial {
                    border: 1.5px solid #bfdbfe;
                    border-left: 4px solid #3b82f6;
                    background: #eff6ff;
                }
                .planner-assignee-card.pending {
                    border: 1.5px solid #e2e8f0;
                    border-left: 4px solid #94a3b8;
                    background: #f8fafc;
                }
                
                .assignee-emp-row {
                    display: flex;
                    align-items: center;
                    gap: 0.45rem;
                }
                .assignee-avatar {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #881337 0%, #be185d 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.68rem;
                    font-weight: 900;
                    box-shadow: 0 1px 4px rgba(136, 19, 55, 0.15);
                }
                .assignee-emp-details {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .assignee-emp-details .emp-name {
                    font-size: 0.78rem;
                    font-weight: 850;
                    color: #0f172a;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 140px;
                }
                .assignee-emp-details .emp-code {
                    font-size: 0.65rem;
                    color: #64748b;
                    font-family: monospace;
                    font-weight: 700;
                }
                .assignee-actuals {
                    font-size: 0.68rem;
                    color: #475569;
                    font-weight: 700;
                    background: #f1f5f9;
                    padding: 2px 6px;
                    border-radius: 4px;
                    display: flex;
                    justify-content: space-between;
                }
                .assignee-actuals .hours {
                    color: #64748b;
                    font-weight: 550;
                }
                .assignee-status-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1.5px solid #f1f5f9;
                    padding-top: 0.4rem;
                }
                .planner-assignee-card.present .assignee-status-row,
                .planner-assignee-card.absent .assignee-status-row,
                .planner-assignee-card.late .assignee-status-row,
                .planner-assignee-card.left_early .assignee-status-row,
                .planner-assignee-card.partial .assignee-status-row {
                    border-top-color: rgba(0,0,0,0.02);
                }
                .assignee-status-row .status-pill {
                    font-size: 0.58rem;
                    font-weight: 900;
                    padding: 1px 5px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }
                .assignee-actions {
                    display: flex;
                    gap: 0.25rem;
                }
                .btn-assignee-action {
                    background: transparent;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 2px 4px;
                    display: flex;
                    align-items: center;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .btn-assignee-action:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }
                .btn-assignee-action.delete:hover {
                    background: #fee2e2;
                    color: #ef4444;
                }
                
                /* Filter Tagging Switch */
                .my-offices-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    background: #fdf2f8;
                    color: #db2777;
                    border: 1px solid #fbcfe8;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .premium-cards-empty {
                    background: #ffffff;
                    border: 1px dashed #cbd5e1;
                    border-radius: 20px;
                    padding: 3rem;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    color: #64748b;
                    margin-top: 1rem;
                }
                .premium-cards-empty h3 {
                    margin: 0;
                    font-size: 1.15rem;
                    font-weight: 900;
                    color: #1e293b;
                }
                .premium-cards-empty p {
                    margin: 0;
                    font-size: 0.85rem;
                    max-width: 400px;
                }
            `}</style>

            <div className="roster-header-section">
                <div className="roster-title">
                    <h1>Shift Allocation Roster</h1>
                    <p>Schedule and allocate employees to position-specific shifts with overlap conflict checking.</p>
                </div>
                <div className="nav-controls">
                    <button className="btn-bulk-trigger" onClick={handleOpenHeaderBulkModal}>
                        <Calendar size={16} /> Bulk Scheduler
                    </button>
                    <button className="btn-nav" onClick={handlePrevWeek} title="Previous Week">
                        <ChevronLeft size={18} />
                    </button>
                    <button className="btn-today" onClick={handleToday}>
                        Today
                    </button>
                    <button className="btn-nav" onClick={handleNextWeek} title="Next Week">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="filters-container">
                <div className="filter-group" style={{ gridColumn: 'span 2' }}>
                    <label>Universal Roster Search</label>
                    <div className="search-box" style={{ margin: 0 }}>
                        <Search size={14} className="search-icon-inside" />
                        <input
                            type="text"
                            placeholder="Search position name, code, employee name, or employee ID..."
                            value={tableSearch}
                            onChange={(e) => setTableSearch(e.target.value)}
                            className="filter-input search-input-inside"
                        />
                    </div>
                </div>
                <div className="filter-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="filter-input"
                    />
                </div>
                <div className="filter-group">
                    <label>View Range</label>
                    <select
                        value={durationDays}
                        onChange={(e) => setDurationDays(parseInt(e.target.value))}
                        className="filter-select"
                    >
                        <option value={7}>7 Days (Weekly)</option>
                        <option value={14}>14 Days (Bi-weekly)</option>
                        <option value={30}>30 Days (Monthly)</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Office Scope</label>
                    <button
                        type="button"
                        onClick={() => setMyOfficesOnly(prev => !prev)}
                        style={{
                            background: myOfficesOnly ? 'rgba(136,19,55,0.06)' : '#ffffff',
                            border: `1.5px solid ${myOfficesOnly ? '#881337' : '#e2e8f0'}`,
                            color: myOfficesOnly ? '#881337' : '#475569',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 10,
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            height: 38,
                            transition: 'all 0.2s'
                        }}
                    >
                        <Tag size={13} /> {myOfficesOnly ? 'My Tagged Offices' : 'All Available Offices'}
                    </button>
                </div>
                <div className="filter-group">
                    <label>Office Unit</label>
                    <select
                        value={selectedOffice}
                        onChange={(e) => setSelectedOffice(e.target.value)}
                        className="filter-select"
                        disabled={myOfficesOnly}
                    >
                        <option value="all">All Offices</option>
                        {offices && offices.map(off => (
                            <option key={off.id} value={off.id}>{off.name}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Project</label>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Projects</option>
                        {projects && projects.map(proj => (
                            <option key={proj.id} value={proj.id}>{proj.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && positions.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <BavyaSpinner label="Syncing Roster Matrix..." />
                </div>
            ) : positions.length === 0 ? (
                <div className="grid-container empty-roster-msg">
                    <Building2 size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <h3>No positions with shifts found</h3>
                    <p style={{ maxWidth: '420px', margin: '0 auto' }}>
                        No positions have shifts mapped yet for the current filters.
                        Go to <strong>Positions</strong> → Edit a position → Add shifts in the <em>"Assigned Shifts"</em> section.
                    </p>
                </div>
            ) : (
                <div className="grid-container" style={{ position: 'relative', border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
                    {loading && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 255, 255, 0.7)',
                            zIndex: 100,
                            backdropFilter: 'blur(3px)',
                            borderRadius: '28px'
                        }}>
                            <div style={{ position: 'sticky', left: '50%', transform: 'translateX(-50%)' }}>
                                <BavyaSpinner label="Updating Roster Matrix..." minHeight="0" />
                            </div>
                        </div>
                    )}

                    {selectedPosition ? (
                        /* Focused Roster View for Selected Position */
                        <div className="focused-roster-view">
                            <div className="focused-roster-header">
                                <button type="button" className="btn-back-cards" onClick={() => setSelectedPosition(null)}>
                                    <ArrowLeft size={16} /> Back to Positions
                                </button>
                                <div className="focused-roster-title-block">
                                    <h2>{selectedPosition.name}</h2>
                                    <div className="focused-roster-meta">
                                        <span className="focused-meta-badge office">{selectedPosition.office_name || 'No Office'}</span>
                                        {selectedPosition.department_name && <span className="focused-meta-badge dept">{selectedPosition.department_name}</span>}
                                        {selectedPosition.section_name && <span className="focused-meta-badge section">{selectedPosition.section_name}</span>}
                                        <span className="focused-meta-badge code">{selectedPosition.code || 'NO CODE'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="planner-dates-grid">
                                {dates.map(dateStr => {
                                    const { day, date } = formatHeaderDate(dateStr);
                                    const isDayToday = isToday(dateStr);
                                    const positionShifts = selectedPosition.shifts_details || [];

                                    return (
                                        <div key={dateStr} className={`planner-date-card ${isDayToday ? 'today' : ''}`}>
                                            <div className="planner-date-header">
                                                <span className="day-name">{day}</span>
                                                <span className="date-val">{date}</span>
                                            </div>
                                            
                                            <div className="planner-shifts-list">
                                                {positionShifts.length === 0 ? (
                                                    <div className="no-shifts-info">
                                                        No shifts configured
                                                    </div>
                                                ) : (
                                                    positionShifts.map(shift => {
                                                        const activeRosters = rosterMap.get(`${selectedPosition.id}|${shift.id}|${dateStr}`) || [];
                                                        const startTimeStr = shift.start_time ? shift.start_time.substring(0, 5) : '';
                                                        const endTimeStr = shift.end_time ? shift.end_time.substring(0, 5) : '';

                                                        return (
                                                            <div key={shift.id} className="planner-shift-item">
                                                                <div className="planner-shift-header">
                                                                    <span className="shift-name">{shift.name}</span>
                                                                    <span className="shift-time"><Clock size={10} /> {startTimeStr}-{endTimeStr}</span>
                                                                </div>

                                                                <div className="planner-shift-assignees">
                                                                    {activeRosters.map(roster => {
                                                                        const actualStart = roster.actual_start_time ? roster.actual_start_time.substring(0, 5) : '';
                                                                        const actualEnd = roster.actual_end_time ? roster.actual_end_time.substring(0, 5) : '';
                                                                        const hasActuals = actualStart || actualEnd;

                                                                        let statusBg = '#e2e8f0';
                                                                        let statusColor = '#475569';
                                                                        if (roster.attendance_status === 'PRESENT') {
                                                                            statusBg = '#d1fae5';
                                                                            statusColor = '#065f46';
                                                                        } else if (roster.attendance_status === 'LEFT_EARLY') {
                                                                            statusBg = '#ffedd5';
                                                                            statusColor = '#9a3412';
                                                                        } else if (roster.attendance_status === 'LATE') {
                                                                            statusBg = '#fef3c7';
                                                                            statusColor = '#92400e';
                                                                        } else if (roster.attendance_status === 'ABSENT') {
                                                                            statusBg = '#fee2e2';
                                                                            statusColor = '#991b1b';
                                                                        } else if (roster.attendance_status === 'PARTIAL') {
                                                                            statusBg = '#dbeafe';
                                                                            statusColor = '#1e40af';
                                                                        }

                                                                        return (
                                                                            <div key={roster.id} className={`planner-assignee-card ${roster.attendance_status ? roster.attendance_status.toLowerCase() : 'pending'}`}>
                                                                                <div className="assignee-emp-row">
                                                                                    <div className="assignee-avatar">
                                                                                        {roster.employee_name ? roster.employee_name.charAt(0) : 'E'}
                                                                                    </div>
                                                                                    <div className="assignee-emp-details">
                                                                                        <span className="emp-name" title={roster.employee_name}>{roster.employee_name}</span>
                                                                                        <span className="emp-code">{roster.employee_code || 'N/A'}</span>
                                                                                    </div>
                                                                                </div>

                                                                                {hasActuals && (
                                                                                    <div className="assignee-actuals">
                                                                                        <span>⏱️ {actualStart || '--:--'} - {actualEnd || '--:--'}</span>
                                                                                        {roster.hours_worked !== null && (
                                                                                            <span className="hours">({parseFloat(roster.hours_worked).toFixed(1)}h)</span>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                <div className="assignee-status-row">
                                                                                    <span className="status-pill" style={{ backgroundColor: statusBg, color: statusColor }}>
                                                                                        {roster.attendance_status?.replace('_', ' ') || 'PENDING'}
                                                                                    </span>
                                                                                    <div className="assignee-actions">
                                                                                        <button
                                                                                            type="button"
                                                                                            className="btn-assignee-action edit"
                                                                                            onClick={() => handleOpenAssignModal(selectedPosition, shift, dateStr, roster)}
                                                                                            title="Re-assign employee / edit actuals"
                                                                                        >
                                                                                            <User size={12} />
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            className="btn-assignee-action delete"
                                                                                            onClick={() => handleRemoveAllocation(roster.id)}
                                                                                            title="Remove assignment"
                                                                                        >
                                                                                            <Trash2 size={12} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}

                                                                    {activeRosters.length === 0 ? (
                                                                        <button
                                                                            type="button"
                                                                            className="planner-btn-assign"
                                                                            onClick={() => handleOpenAssignModal(selectedPosition, shift, dateStr, null)}
                                                                        >
                                                                            <Plus size={12} /> Assign Shift
                                                                        </button>
                                                                    ) : (
                                                                        activeRosters.some(r => r.attendance_status !== 'PENDING' || r.actual_start_time || r.actual_end_time) &&
                                                                        !activeRosters.some(r => r.attendance_status === 'PRESENT' || r.attendance_status === 'LATE') && (
                                                                            <button
                                                                                type="button"
                                                                                className="planner-btn-assign another"
                                                                                onClick={() => handleOpenAssignModal(selectedPosition, shift, dateStr, null)}
                                                                                title="Assign another employee"
                                                                            >
                                                                                <Plus size={10} /> Assign Another
                                                                            </button>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Default Cards Grid Mode */
                        <>
                            <div className="position-cards-grid">
                                {paginatedPositions.map(pos => {
                                    const shiftsCount = pos.shifts_details?.length || 0;
                                    const posRostersCount = rosters.filter(r => r.position === pos.id).length;
                                    const totalPossibleSlots = shiftsCount * dates.length;
                                    const fullnessPercent = totalPossibleSlots > 0 ? Math.round((posRostersCount / totalPossibleSlots) * 100) : 0;
                                    
                                    const assignedEmpMap = new Map();
                                    rosters.filter(r => r.position === pos.id).forEach(r => {
                                        if (r.employee && r.employee_name) {
                                            assignedEmpMap.set(r.employee, { name: r.employee_name, code: r.employee_code });
                                        }
                                    });
                                    const assignedEmpList = Array.from(assignedEmpMap.values());

                                    return (
                                        <div key={pos.id} className="premium-position-card" onClick={() => setSelectedPosition(pos)}>
                                            <div className="card-top">
                                                <span className="card-office-badge" title={pos.office_name}>{pos.office_name || 'No Office'}</span>
                                                <span className="card-shifts-badge">{shiftsCount} {shiftsCount === 1 ? 'Shift' : 'Shifts'}</span>
                                            </div>
                                            
                                            <h3 className="card-position-name">{pos.name}</h3>
                                            <code className="card-position-code">{pos.code || 'NO CODE'}</code>
                                            
                                            <div className="card-meta-row">
                                                {pos.department_name && (
                                                    <div className="card-meta-item">
                                                        <span className="meta-label">Dept</span>
                                                        <span className="meta-value" title={pos.department_name}>{pos.department_name}</span>
                                                    </div>
                                                )}
                                                {pos.section_name && (
                                                    <div className="card-meta-item">
                                                        <span className="meta-label">Section</span>
                                                        <span className="meta-value" title={pos.section_name}>{pos.section_name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Position Employee(s) Highlight Box */}
                                            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.55rem 0.75rem', marginTop: '0.4rem' }}>
                                                <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <User size={11} color="#4338ca" /> Position Employee(s):
                                                </div>
                                                {pos.assigned_employees_details && pos.assigned_employees_details.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        {pos.assigned_employees_details.map((emp, idx) => (
                                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 850, color: '#0f172a' }}>
                                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>{emp.name}</span>
                                                                <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#4338ca', background: '#e0e7ff', border: '1px solid #c7d2fe', padding: '1px 6px', borderRadius: '6px', fontWeight: 800 }}>{emp.code || 'N/A'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : assignedEmpList.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        {assignedEmpList.map((emp, idx) => (
                                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 850, color: '#0f172a' }}>
                                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>{emp.name}</span>
                                                                <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#4338ca', background: '#e0e7ff', border: '1px solid #c7d2fe', padding: '1px 6px', borderRadius: '6px', fontWeight: 800 }}>{emp.code || 'N/A'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : pos.assigned_employee ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 850, color: '#0f172a' }}>
                                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>{pos.assigned_employee.name}</span>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#4338ca', background: '#e0e7ff', border: '1px solid #c7d2fe', padding: '1px 6px', borderRadius: '6px', fontWeight: 800 }}>{pos.assigned_employee.code || 'N/A'}</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 600 }}>No employee assigned</span>
                                                )}
                                            </div>

                                            <div className="card-footer-stats">
                                                <div className="stats-progress-container">
                                                    <div className="stats-progress-header">
                                                        <span>Roster Coverage</span>
                                                        <span>{posRostersCount} / {totalPossibleSlots} ({fullnessPercent}%)</span>
                                                    </div>
                                                    <div className="stats-progress-bar">
                                                        <div className="stats-progress-fill" style={{ width: `${fullnessPercent}%`, background: fullnessPercent > 80 ? '#10b981' : fullnessPercent > 40 ? '#f59e0b' : '#ef4444' }}></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button type="button" className="card-action-btn">
                                                <Calendar size={13} /> Manage Roster
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Bar */}
                            {totalPagesCount > 1 && (
                                <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)' }}>
                                    <button
                                        type="button"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                        style={{ background: '#ffffff', color: '#475569', border: '1.5px solid #cbd5e1', padding: '0.6rem 1.25rem', borderRadius: '12px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: currentPage === 1 ? 0.55 : 1, fontWeight: '800', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}
                                    >
                                        <ChevronLeft size={16} /> Prev
                                    </button>
                                    <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '600' }}>
                                        Page <strong style={{ color: '#0f172a', fontWeight: '900' }}>{currentPage}</strong> of <strong style={{ color: '#0f172a', fontWeight: '900' }}>{totalPagesCount}</strong> (showing {totalPositionsCount} positions)
                                    </span>
                                    <button
                                        type="button"
                                        disabled={currentPage === totalPagesCount}
                                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPagesCount))}
                                        style={{ background: '#ffffff', color: '#475569', border: '1.5px solid #cbd5e1', padding: '0.6rem 1.25rem', borderRadius: '12px', cursor: currentPage === totalPagesCount ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: currentPage === totalPagesCount ? 0.55 : 1, fontWeight: '800', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Upgraded Allocation & Bulk Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {bulkReport
                                    ? 'Bulk Operation Report'
                                    : modalData.rosterId
                                        ? 'Re-assign Shift'
                                        : assignmentMode === 'single'
                                            ? 'Assign Employee to Shift'
                                            : bulkActionType === 'assign'
                                                ? 'Bulk Shift Assignment'
                                                : 'Bulk Shift Unassignment'
                                }
                            </h3>
                            <button
                                style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '1.2rem', cursor: 'pointer' }}
                                onClick={() => setShowModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        {bulkReport ? (
                            <div className="bulk-report-view" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                <div className="modal-body">
                                    <div className="modal-error-alert" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                                        <CheckCircle size={18} />
                                        <span>Successfully applied {bulkReport.successCount} shift allocations.</span>
                                    </div>

                                    {bulkReport.skippedList && bulkReport.skippedList.length > 0 && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f59e0b', display: 'block', marginBottom: '0.5rem' }}>
                                                Skipped Assignments (Conflicts)
                                            </label>
                                            <div className="bulk-report-container">
                                                {bulkReport.skippedList.map((skip, idx) => (
                                                    <div key={idx} className="bulk-report-item conflict">
                                                        <span><strong>{skip.date}</strong></span>
                                                        <span>{skip.reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {bulkReport.errorList && bulkReport.errorList.length > 0 && (
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f87171', display: 'block', marginBottom: '0.5rem' }}>
                                                System Errors
                                            </label>
                                            <div className="bulk-report-container">
                                                {bulkReport.errorList.map((errItem, idx) => (
                                                    <div key={idx} className="bulk-report-item error">
                                                        <span><strong>{errItem.date}</strong></span>
                                                        <span>{errItem.error}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-modal-save"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Close Roster
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveAllocation} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                <div className="modal-body">
                                {modalError && (
                                    <div className="modal-error-alert">
                                        <AlertCircle size={16} />
                                        <span>{modalError}</span>
                                    </div>
                                )}

                                {/* Assignment Mode Select (only if not editing an existing roster cell) */}
                                {!modalData.rosterId && (
                                    <div className="modal-form-group">
                                        <label>Assignment Mode</label>
                                        <div className="segment-control">
                                            <button
                                                type="button"
                                                className={`segment-btn ${assignmentMode === 'single' ? 'active' : ''}`}
                                                onClick={() => { setAssignmentMode('single'); setBulkReport(null); }}
                                            >
                                                Day-Wise
                                            </button>
                                            <button
                                                type="button"
                                                className={`segment-btn ${assignmentMode === 'weekly' ? 'active' : ''}`}
                                                onClick={() => { setAssignmentMode('weekly'); setBulkReport(null); }}
                                            >
                                                Weekly
                                            </button>
                                            <button
                                                type="button"
                                                className={`segment-btn ${assignmentMode === 'monthly' ? 'active' : ''}`}
                                                onClick={() => { setAssignmentMode('monthly'); setBulkReport(null); }}
                                            >
                                                Monthly
                                            </button>
                                            <button
                                                type="button"
                                                className={`segment-btn ${assignmentMode === 'custom' ? 'active' : ''}`}
                                                onClick={() => { setAssignmentMode('custom'); setBulkReport(null); }}
                                            >
                                                Custom Range
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Action Type toggle: Assign vs Clear (for bulk modes only) */}
                                {assignmentMode !== 'single' && (
                                    <div className="modal-form-group">
                                        <label>Action Type</label>
                                        <div className="action-type-selector">
                                            <button
                                                type="button"
                                                className={`action-type-btn assign ${bulkActionType === 'assign' ? 'active' : ''}`}
                                                onClick={() => setBulkActionType('assign')}
                                            >
                                                <Plus size={14} /> Assign Employee
                                            </button>
                                            <button
                                                type="button"
                                                className={`action-type-btn unassign ${bulkActionType === 'unassign' ? 'active' : ''}`}
                                                onClick={() => setBulkActionType('unassign')}
                                            >
                                                <Trash2 size={14} /> Unassign / Clear Shifts
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Position Selection */}
                                {modalData.position ? (
                                    <div className="modal-form-group">
                                        <label>Position</label>
                                        <input
                                            type="text"
                                            value={modalData.position.name}
                                            readonly
                                            className="filter-input"
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="modal-form-group">
                                        <label>Position Search & Selection</label>
                                        <div className="search-box">
                                            <Search size={14} className="search-icon-inside" />
                                            <input
                                                type="text"
                                                placeholder="Search positions..."
                                                value={positionSearch}
                                                onChange={(e) => setPositionSearch(e.target.value)}
                                                className="filter-input search-input-inside"
                                            />
                                        </div>
                                        <div className="employee-select-list" style={{ maxHeight: '120px' }}>
                                            {getFilteredPositions().length === 0 ? (
                                                <div style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                                                    No matching positions found
                                                </div>
                                            ) : (
                                                getFilteredPositions().map(pos => {
                                                    const isSelected = modalData.position && modalData.position.id === pos.id;
                                                    return (
                                                        <div
                                                            key={pos.id}
                                                            className={`employee-select-option ${isSelected ? 'selected' : ''}`}
                                                            onClick={() => setModalData(prev => ({ ...prev, position: pos, shift: null }))}
                                                        >
                                                            <div>
                                                                <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{pos.name}</div>
                                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{pos.office_name || 'No Office Unit'}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Shift Selection */}
                                {modalData.position ? (
                                    <div className="modal-form-group">
                                        <label>Shift Selection</label>
                                        <select
                                            className="filter-select"
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                            value={modalData.shift ? modalData.shift.id : ''}
                                            onChange={(e) => {
                                                const sId = parseInt(e.target.value);
                                                const foundShift = modalData.position.shifts_details.find(sh => sh.id === sId);
                                                if (foundShift) {
                                                    const schedStart = foundShift.start_time ? foundShift.start_time.substring(0, 5) : '';
                                                    const schedEnd = foundShift.end_time ? foundShift.end_time.substring(0, 5) : '';
                                                    setModalData(prev => ({
                                                        ...prev,
                                                        shift: foundShift,
                                                        actual_start_time: schedStart,
                                                        actual_end_time: schedEnd
                                                    }));
                                                } else {
                                                    setModalData(prev => ({ ...prev, shift: null }));
                                                }
                                            }}
                                        >
                                            <option value="">Select Shift</option>
                                            {(modalData.position.shifts_details || []).map(sh => (
                                                <option key={sh.id} value={sh.id}>
                                                    {sh.name} ({sh.start_time.substring(0, 5)} - {sh.end_time.substring(0, 5)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="modal-form-group">
                                        <label>Shift Selection</label>
                                        <select className="filter-select" style={{ width: '100%' }} disabled>
                                            <option>Select a position first</option>
                                        </select>
                                    </div>
                                )}

                                {/* Date Inputs based on Assignment Mode */}
                                {assignmentMode === 'single' && (
                                    <div className="modal-form-group">
                                        <label>Date</label>
                                        <input
                                            type="text"
                                            value={modalData.date}
                                            readonly
                                            className="filter-input"
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                )}

                                {assignmentMode === 'weekly' && (
                                    <div className="modal-form-group">
                                        <label>Select Week (Choose any day of target week)</label>
                                        <input
                                            type="date"
                                            value={weekSelect}
                                            onChange={(e) => setWeekSelect(e.target.value)}
                                            className="filter-input"
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                )}

                                {assignmentMode === 'monthly' && (
                                    <div className="modal-form-group">
                                        <label>Select Target Month</label>
                                        <input
                                            type="month"
                                            value={monthSelect}
                                            onChange={(e) => setMonthSelect(e.target.value)}
                                            className="filter-input"
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                )}

                                {assignmentMode === 'custom' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="modal-form-group">
                                        <div>
                                            <label>Start Date</label>
                                            <input
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="filter-input"
                                                style={{ width: '100%', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>
                                            <label>End Date</label>
                                            <input
                                                type="date"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="filter-input"
                                                style={{ width: '100%', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Weekday Recurrence Checkboxes */}
                                {assignmentMode !== 'single' && (
                                    <div className="modal-form-group">
                                        <label>Days of the Week to Schedule</label>
                                        <div className="weekday-checkboxes">
                                            {[
                                                { label: 'M', value: 1 },
                                                { label: 'T', value: 2 },
                                                { label: 'W', value: 3 },
                                                { label: 'T', value: 4 },
                                                { label: 'F', value: 5 },
                                                { label: 'S', value: 6 },
                                                { label: 'S', value: 0 }
                                            ].map(day => {
                                                const isActive = recurrenceDays.includes(day.value);
                                                return (
                                                    <button
                                                        key={day.value}
                                                        type="button"
                                                        className={`weekday-btn ${isActive ? 'active' : ''}`}
                                                        onClick={() => {
                                                            if (isActive) {
                                                                setRecurrenceDays(recurrenceDays.filter(d => d !== day.value));
                                                            } else {
                                                                setRecurrenceDays([...recurrenceDays, day.value]);
                                                            }
                                                        }}
                                                    >
                                                        {day.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Employee Selector (not rendered if bulk mode unassign) */}
                                {(assignmentMode === 'single' || bulkActionType === 'assign') && (
                                    <div className="modal-form-group">
                                        <label>Employee Assignment</label>
                                        {modalData.rosterId && !isChangingEmployee ? (
                                            <div 
                                                className="employee-select-option selected"
                                                style={{ background: '#e0e7ff', border: '1.5px solid #6366f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1e1b4b' }}>
                                                        {modalData.employeeName || "Assigned Employee"}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#4f46e5', fontFamily: 'monospace' }}>
                                                        {modalData.employeeCode || "No Code"}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                                    <span style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: 800 }}>Active Assignment</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsChangingEmployee(true)}
                                                        style={{
                                                            background: '#6366f1',
                                                            color: '#ffffff',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            padding: '4px 10px',
                                                            fontSize: '0.72rem',
                                                            fontWeight: '700',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
                                                        }}
                                                    >
                                                        Change Employee
                                                     </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {modalData.rosterId && isChangingEmployee && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4f46e5' }}>Select replacement employee:</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setModalData(prev => ({
                                                                    ...prev,
                                                                    employeeId: prev.originalEmployeeId,
                                                                    employeeName: prev.originalEmployeeName,
                                                                    employeeCode: prev.originalEmployeeCode
                                                                }));
                                                                setIsChangingEmployee(false);
                                                            }}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: '#ef4444',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Cancel Change
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="search-box">
                                                    <Search size={14} className="search-icon-inside" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search by employee name or code..."
                                                        value={employeeSearch}
                                                        onChange={(e) => setEmployeeSearch(e.target.value)}
                                                        className="filter-input search-input-inside"
                                                    />
                                                </div>
                                                <div className="employee-select-list">
                                                    {sortedRecommendedEmployees.length === 0 ? (
                                                        <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                                            No active employees found
                                                        </div>
                                                    ) : (
                                                        sortedRecommendedEmployees.map(emp => {
                                                            const isSelected = String(modalData.employeeId) === String(emp.id);
                                                            return (
                                                                <div
                                                                    key={emp.id}
                                                                    className={`employee-select-option ${isSelected ? 'selected' : ''}`}
                                                                    onClick={() => {
                                                                        setModalData(prev => ({ 
                                                                            ...prev, 
                                                                            employeeId: String(emp.id),
                                                                            employeeName: emp.name,
                                                                            employeeCode: emp.employee_code
                                                                        }));
                                                                        setIsChangingEmployee(false);
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                                                                            {emp.name}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                                                                            {emp.employee_code || 'No Code'}
                                                                        </div>
                                                                    </div>
                                                                    {emp.isRecommended && (
                                                                        <span className="badge-recommended">Recommended</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Attendance & Deviation Tracking (Only in single assignment mode, both new and edit) */}
                                {assignmentMode === 'single' && (
                                    <div style={{
                                        marginTop: '1.5rem',
                                        padding: '1.25rem',
                                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                        borderRadius: '16px',
                                        border: '1px solid #cbd5e1',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                                    }}>
                                        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontSize: '0.95rem', fontWeight: '850' }}>
                                            <Clock size={16} color="var(--primary)" /> Attendance & Deviation Tracking
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                            <div className="modal-form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: '750', color: '#475569' }}>Actual Start Time</label>
                                                <input
                                                    type="time"
                                                    value={modalData.actual_start_time || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setModalData(prev => {
                                                            const updated = { ...prev, actual_start_time: val };
                                                            if (updated.actual_start_time && updated.actual_end_time) {
                                                                const hours = calculateHoursDifference(updated.actual_start_time, updated.actual_end_time);
                                                                updated.hours_worked = hours;
                                                                const scheduledStart = modalData.shift?.start_time ? modalData.shift.start_time.substring(0, 5) : '';
                                                                const scheduledEnd = modalData.shift?.end_time ? modalData.shift.end_time.substring(0, 5) : '';
                                                                if (scheduledStart && scheduledEnd) {
                                                                    if (updated.actual_end_time < scheduledEnd) {
                                                                        updated.attendance_status = 'LEFT_EARLY';
                                                                    } else if (updated.actual_start_time > scheduledStart) {
                                                                        updated.attendance_status = 'LATE';
                                                                    } else {
                                                                        updated.attendance_status = 'PRESENT';
                                                                    }
                                                                }
                                                            }
                                                            return updated;
                                                        });
                                                    }}
                                                    className="filter-input"
                                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <div className="modal-form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: '750', color: '#475569' }}>Actual End Time</label>
                                                <input
                                                    type="time"
                                                    value={modalData.actual_end_time || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setModalData(prev => {
                                                            const updated = { ...prev, actual_end_time: val };
                                                            if (updated.actual_start_time && updated.actual_end_time) {
                                                                const hours = calculateHoursDifference(updated.actual_start_time, updated.actual_end_time);
                                                                updated.hours_worked = hours;
                                                                const scheduledStart = modalData.shift?.start_time ? modalData.shift.start_time.substring(0, 5) : '';
                                                                const scheduledEnd = modalData.shift?.end_time ? modalData.shift.end_time.substring(0, 5) : '';
                                                                if (scheduledStart && scheduledEnd) {
                                                                    if (updated.actual_end_time < scheduledEnd) {
                                                                        updated.attendance_status = 'LEFT_EARLY';
                                                                    } else if (updated.actual_start_time > scheduledStart) {
                                                                        updated.attendance_status = 'LATE';
                                                                    } else {
                                                                        updated.attendance_status = 'PRESENT';
                                                                    }
                                                                }
                                                            }
                                                            return updated;
                                                        });
                                                    }}
                                                    className="filter-input"
                                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                            <div className="modal-form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: '750', color: '#475569' }}>Attendance Status</label>
                                                <select
                                                    value={modalData.attendance_status || 'PENDING'}
                                                    onChange={(e) => setModalData(prev => ({ ...prev, attendance_status: e.target.value }))}
                                                    className="filter-select"
                                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                                >
                                                    <option value="PENDING">Pending</option>
                                                    <option value="PRESENT">Present</option>
                                                    <option value="ABSENT">Absent</option>
                                                    <option value="LATE">Late</option>
                                                    <option value="LEFT_EARLY">Left Early</option>
                                                    <option value="PARTIAL_SHIFT">Partial Shift / Left Early</option>
                                                    <option value="WEEK_OFF">Week Off</option>
                                                </select>
                                            </div>
                                            <div className="modal-form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: '750', color: '#475569' }}>Hours Worked</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={modalData.hours_worked || ''}
                                                    onChange={(e) => setModalData(prev => ({ ...prev, hours_worked: e.target.value }))}
                                                    placeholder="0.00"
                                                    className="filter-input"
                                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="modal-form-group" style={{ margin: 0 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '750', color: '#475569' }}>Remarks / Deviation Reason</label>
                                            <textarea
                                                value={modalData.remarks || ''}
                                                onChange={(e) => setModalData(prev => ({ ...prev, remarks: e.target.value }))}
                                                placeholder="e.g. Left early at 10:00 AM due to emergency"
                                                className="filter-input"
                                                style={{ width: '100%', boxSizing: 'border-box', height: '60px', padding: '8px', fontSize: '0.85rem', resize: 'none' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Request Workflow Checkbox */}
                                {assignmentMode === 'single' && (
                                    <div className="modal-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <input
                                            type="checkbox"
                                            id="isRequestWorkflowCheck"
                                            checked={isRequestWorkflow}
                                            onChange={(e) => setIsRequestWorkflow(e.target.checked)}
                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="isRequestWorkflowCheck" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}>
                                            Submit as Shift Change Request Workflow (Requires Consent/Approval)
                                        </label>
                                    </div>
                                )}

                                {/* Overwrite Checkbox (only in bulk assign mode) */}
                                {assignmentMode !== 'single' && bulkActionType === 'assign' && (
                                    <div className="modal-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            id="overwriteCheck"
                                            checked={overwriteExisting}
                                            onChange={(e) => setOverwriteExisting(e.target.checked)}
                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="overwriteCheck" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', color: '#475569' }}>
                                            Overwrite existing shift assignments on target dates
                                        </label>
                                    </div>
                                )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-modal-cancel"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-modal-save"
                                        disabled={submitting}
                                    >
                                        {submitting
                                            ? 'Processing...'
                                            : assignmentMode === 'single'
                                                ? 'Confirm Assignment'
                                                : bulkActionType === 'assign'
                                                    ? 'Run Bulk Scheduler'
                                                    : 'Run Bulk Unassignment'
                                        }
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PositionShiftRoster;