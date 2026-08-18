import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Info, Loader2, Download, CloudUpload, RotateCcw, ShieldCheck, ChevronRight, FileCheck, Database, Zap, Layers, BarChart3, ArrowRight, DownloadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from '../context/DataContext';
import api from '../api';

const BulkUploadModal = ({ isOpen, onClose, section }) => {
    const { showNotification, fetchDropdownData, fetchData, activeSection } = useData();

    // Core State
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // Lifecycle States
    const [stage, setStage] = useState('selection'); // 'selection', 'ready', 'syncing', 'final'
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processedRows, setProcessedRows] = useState(0);
    const [totalRows, setTotalRows] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'parsing', 'validating', 'uploading', 'complete'
    const [chunkErrors, setChunkErrors] = useState([]);
    const [createdCount, setCreatedCount] = useState(0);
    const [updatedCount, setUpdatedCount] = useState(0);

    const openTimeRef = useRef(0);
    const abortControllerRef = useRef(null);
    const CHUNK_SIZE = 500;

    const normalizeRow = (row) => {
        const clean = (val) => val === undefined || val === null ? '' : String(val).trim();
        const newRow = {};
        const keys = Object.keys(row);
        keys.forEach(key => { newRow[key.trim()] = clean(row[key]); });

        const fixDate = (dateVal) => {
            if (!dateVal) return dateVal;
            try {
                let v = dateVal;
                if (typeof v === 'string' && /^\d+$/.test(v.trim())) {
                    v = parseInt(v.trim(), 10);
                }
                if (!isNaN(v) && v !== '' && typeof v === 'number' && v > 20000 && v < 100000) {
                    const date = new Date(Math.round((v - 25569) * 86400 * 1000));
                    return date.toISOString().split('T')[0];
                } else if (String(v).includes('/') || String(v).includes('-')) {
                    const parts = String(v).split(/[\/-]/);
                    if (parts.length === 3) {
                        try {
                            const d = new Date(v);
                            if(!isNaN(d.getTime())) {
                                // Prevent India +5:30 jumping backwards to previous day
                                const offset = d.getTimezoneOffset() * 60000;
                                return new Date(d.getTime() - offset).toISOString().split('T')[0];
                            }
                        }catch(e){}
                    }
                } else if (String(v).includes(' ')) {
                    return String(v).split(' ')[0];
                }
            } catch (e) {
                console.error('Date normalization failed for:', dateVal);
            }
            return dateVal;
        };

        if (section === 'employees') {
            const employeeMap = {
                'name': ['name', 'full name', 'employee name', 'name *'],
                'email': ['email', 'email address', 'official email', 'login email', 'email *'],
                'phone': ['phone', 'mobile', 'contact', 'phone number', 'phone *'],
                'employee_code': ['code', 'employee code', 'id', 'emp code', 'employee code *'],
                'gender': ['gender', 'sex', 'gender *'],
                'date_of_birth': ['date of birth', 'dob', 'date of birth *'],
                'employment_type': ['employment type', 'type', 'employment type *'],
                'hire_date': ['hire date', 'joining date', 'start date', 'hire date *', 'joining date *'],
                'status': ['status', 'active', 'is active', 'status *'],
                'Position Codes': ['position codes', 'positions', 'tagged positions', 'position code', 'tagged position code']
            };

            const normalized = {};
            Object.keys(employeeMap).forEach(targetKey => {
                const sourceKey = keys.find(k => {
                    const cleanKey = k.toLowerCase().replace(/\*/g, '').trim();
                    return employeeMap[targetKey].includes(cleanKey);
                });
                if (sourceKey) normalized[targetKey] = clean(row[sourceKey]);
            });

            if (normalized.hire_date) normalized.hire_date = fixDate(normalized.hire_date);
            if (normalized.date_of_birth) normalized.date_of_birth = fixDate(normalized.date_of_birth);

            // Employment Type normalization
            if (normalized.employment_type) {
                const et = String(normalized.employment_type).toLowerCase();
                if (et.includes('perm')) normalized.employment_type = 'Permanent';
                else if (et.includes('temp') || et.includes('cont')) normalized.employment_type = 'Temporary';
            }

            const idKey = keys.find(k => k.toLowerCase() === 'id');
            if (idKey) normalized['id'] = clean(row[idKey]);

            return normalized;
        }

        if (section === 'positions') {
            const positionMap = {
                'Position Title': ['position title', 'position name', 'name', 'title', 'position'],
                'Position Code': ['position code', 'code', 'pos code'],
                'Designation Rank / Level': ['designation rank', 'level', 'position level', 'rank', 'designation rank / level'],
                'Activation Date': ['activation date', 'start date', 'date', 'effective date'],
                'Job Family': ['job family', 'family'],
                'Role Type': ['role type', 'type'],
                'Role Name': ['role name', 'role', 'role code'],
                'Role Sub Group': ['role sub group', 'role sub-group', 'role group', 'sub group', 'role_sub_group'],
                'Position Type': ['position type', 'pos type', 'position_type'],
                'Shift Names': ['shift names', 'shift', 'shifts', 'shift name'],
                'Job Profile (Specific Role)': ['job profile', 'job', 'job code', 'job profile (specific role)'],
                'Structural Tier (Office Level)': ['structural tier', 'office level', 'tier', 'structural tier (office level)'],
                'Assign to Office / Unit': ['assign to office', 'office', 'unit', 'assign to office / unit'],
                'Department': ['department', 'dept', 'division'],
                'Section / Team': ['section', 'unit', 'section / team'],
                'Reporting To (Codes)': ['reporting to', 'reports to', 'boss', 'manager', 'reporting codes', 'reporting to (codes)'],
                'Additional Roles': ['additional roles', 'additional role', 'extra roles', 'additional_roles'],
                'Additional Sub Groups': ['additional sub groups', 'additional sub-groups', 'additional_sub_groups'],
                'Additional Jobs': ['additional jobs', 'additional job', 'additional_jobs'],
                'Status': ['status']
            };

            const normalized = {};
            Object.keys(positionMap).forEach(targetKey => {
                const sourceKey = keys.find(k => {
                    const cleanKey = k.toLowerCase().replace(/\*/g, '').trim();
                    return positionMap[targetKey].includes(cleanKey);
                });
                if (sourceKey) normalized[targetKey] = clean(row[sourceKey]);
            });
            
            if (normalized['Activation Date']) {
                normalized['Activation Date'] = fixDate(normalized['Activation Date']);
            }

            // Pass through status and other fields if not found in map
            if (!normalized.Status) {
                const statusKey = keys.find(k => k.toLowerCase().replace(/\*/g, '').trim() === 'status');
                if (statusKey) normalized.Status = clean(row[statusKey]);
                else normalized.Status = 'Active';
            }

            const idKey = keys.find(k => k.toLowerCase() === 'id');
            if (idKey) normalized['id'] = clean(row[idKey]);

            return normalized;
        }

        if (section === 'offices') {
            const officeMap = {
                'Office Name': ['office name', 'name', 'unit name', 'branch name', 'office'],
                'Office Code': ['office code', 'code'],
                'Registered Name': ['registered name'],
                'Structural Tier': ['structural tier', 'level', 'tier', 'rank'],
                'Parent Office': ['parent office', 'parent', 'reporting to office'],
                'Cluster': ['cluster', 'geo cluster'],
                'Facility Template': ['facility template', 'facility architecture', 'facility master', 'template'],
                'Location': ['location', 'base location'],
                'Address': ['address'],
                'Phone': ['phone', 'mobile', 'contact', 'contact number'],
                'Email': ['email'],
                'Status': ['status'],
                'Start Date': ['start date', 'operational start date']
            };
            const normalized = {};
            Object.keys(officeMap).forEach(targetKey => {
                const sourceKey = keys.find(k => {
                    const cleanKey = k.toLowerCase().replace(/\*/g, '').trim();
                    return officeMap[targetKey].includes(cleanKey);
                });
                if (sourceKey) normalized[targetKey] = clean(row[sourceKey]);
            });
            if (normalized['Start Date']) normalized['Start Date'] = fixDate(normalized['Start Date']);
            const idKey = keys.find(k => k.toLowerCase() === 'id');
            if (idKey) normalized['id'] = clean(row[idKey]);

            return normalized;
        }

        if (section === 'departments') {
            const deptMap = {
                'Department Name': ['department name', 'name', 'dept'],
                'Department Code': ['department code', 'code'],
                'Office': ['office', 'unit', 'parent office'],
                'Description': ['description'],
                'Status': ['status']
            };
            const normalized = {};
            Object.keys(deptMap).forEach(targetKey => {
                const sourceKey = keys.find(k => {
                    const cleanKey = k.toLowerCase().replace(/\*/g, '').trim();
                    return deptMap[targetKey].includes(cleanKey);
                });
                if (sourceKey) normalized[targetKey] = clean(row[sourceKey]);
            });
            const idKey = keys.find(k => k.toLowerCase() === 'id');
            if (idKey) normalized['id'] = clean(row[idKey]);

            return normalized;
        }

        if (section === 'sections') {
            const secMap = {
                'Section Name': ['section name', 'name', 'unit', 'section'],
                'Section Code': ['section code', 'code'],
                'Department': ['department', 'dept'],
                'Office': ['office', 'unit'],
                'Description': ['description'],
                'Status': ['status']
            };
            const normalized = {};
            Object.keys(secMap).forEach(targetKey => {
                const sourceKey = keys.find(k => {
                    const cleanKey = k.toLowerCase().replace(/\*/g, '').trim();
                    return secMap[targetKey].includes(cleanKey);
                });
                if (sourceKey) normalized[targetKey] = clean(row[sourceKey]);
            });
            const idKey = keys.find(k => k.toLowerCase() === 'id');
            if (idKey) normalized['id'] = clean(row[idKey]);

            return normalized;
        }

        const findBestKey = (category) => {
            const cat = category.toLowerCase().trim();
            let match = keys.find(k => {
                const lk = k.trim().toLowerCase().replace(/_/g, ' ');
                return lk.includes(cat) && lk.includes('name');
            });
            if (match) return match;
            match = keys.find(k => {
                const lk = k.trim().toLowerCase().replace(/_/g, ' ');
                const val = clean(row[k]);
                return lk === cat && !(val !== '' && !isNaN(val));
            });
            return match;
        };

        ['continent', 'country', 'state', 'district', 'mandal', 'cluster'].forEach(cat => {
            const key = findBestKey(cat) || (cat === 'continent' ? findBestKey('territory') : null);
            if (key) newRow[cat.charAt(0).toUpperCase() + cat.slice(1)] = clean(row[key]);
        });

        keys.forEach(key => {
            const k = key.toLowerCase();
            if (k.includes('code')) {
                if (k.includes('continent')) newRow['Continent Code'] = clean(row[key]);
                else if (k.includes('country')) newRow['Country Code'] = clean(row[key]);
                else if (k.includes('state')) newRow['State Code'] = clean(row[key]);
                else if (k.includes('district')) newRow['District Code'] = clean(row[key]);
                else if (k.includes('mandal')) newRow['Mandal Code'] = clean(row[key]);
                else if (k.includes('cluster')) newRow['Cluster Code'] = clean(row[key]);
            }
        });

        // Fix Excel date parsing for Activation Date specifically
        if (newRow['Activation Date'] !== undefined && newRow['Activation Date'] !== null) {
            let val = newRow['Activation Date'];
            // If it came as a string containing only digits, parse the integer
            if (typeof val === 'string' && /^\d+$/.test(val.trim())) {
                val = parseInt(val.trim(), 10);
            }
            // If it's a numeric literal from Excel representing a date, convert it to YYYY-MM-DD
            if (typeof val === 'number' && val > 20000 && val < 100000) {
                const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                newRow['Activation Date'] = date.toISOString().split('T')[0];
            } else if (typeof val === 'string' && (val.includes('/') || val.includes('-'))) {
                // If it arrived as an actual date string, normalize it
                try {
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) {
                        newRow['Activation Date'] = d.toISOString().split('T')[0];
                    }
                } catch(e) {}
            }
        }
        
        return newRow;
    };


    useEffect(() => {
        if (isOpen) {
            openTimeRef.current = Date.now();
            setFile(null);
            setPreviewData([]);
            setResult(null);
            setLoading(false);
            setStage('selection');
            setUploadProgress(0);
            setProcessedRows(0);
            setTotalRows(0);
            setUploadStatus('idle');
            setChunkErrors([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setUploadStatus('parsing');

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) throw new Error('Excel file is empty.');

                const normalized = jsonData.slice(0, 5).map(normalizeRow);
                setPreviewData(normalized);
                setTotalRows(jsonData.length);
                setStage('ready');
                setUploadStatus('idle');
                console.log('✅ File Pre-processed successfully.');
            } catch (err) {
                showNotification(err.message || 'Error parsing file.', 'error');
                setFile(null);
                setUploadStatus('idle');
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setStage('syncing');
        setUploadStatus('validating');
        setProcessedRows(0);
        setChunkErrors([]);
        setCreatedCount(0);
        setUpdatedCount(0);

        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                const normalizedData = jsonData.map(normalizeRow).filter(r => r && Object.keys(r).length > 0);

                // Pre-validation
                const mandatoryFields = {
                    'employees': ['name', 'email', 'phone', 'employee_code', 'date_of_birth', 'gender', 'employment_type', 'hire_date'],
                    'positions': ['Position Title', 'Designation Rank / Level', 'Role Name', 'Assign to Office / Unit', 'Department'],
                    'geo-continents': ['Continent', 'Continent Code'],
                    'geo-countries': ['Continent', 'Country', 'Country Code'],
                    'geo-states': ['Continent', 'Country', 'State', 'State Code'],
                    'geo-districts': ['Continent', 'Country', 'State', 'District', 'District Code'],
                    'geo-mandals': ['Continent', 'Country', 'State', 'District', 'Mandal', 'Mandal Code'],
                    'geo-clusters': ['Continent', 'Country', 'State', 'District', 'Mandal', 'Cluster'],
                    'offices': ['Office Name', 'Office Code', 'Structural Tier', 'Parent Office', 'Start Date'],
                    'departments': ['Department Name', 'Office'],
                    'sections': ['Section Name', 'Department']
                };


                const fieldsToCheck = mandatoryFields[section] || [];
                const preValidationErrors = [];

                const codeCounts = {};
                normalizedData.forEach((row, idx) => {
                    // Check within-file duplicates for employee_code
                    if (section === 'employees' && row.employee_code) {
                        const code = String(row.employee_code).toUpperCase();
                        if (codeCounts[code]) {
                            preValidationErrors.push({ row: idx + 2, reason: `Duplicate Employee Code "${code}" found within this file.`, data: row });
                        } else {
                            codeCounts[code] = true;
                        }
                    }

                    for (const field of fieldsToCheck) {
                        const val = String(row[field] || '').trim();
                        if (!val || val === '-') {
                            preValidationErrors.push({ row: idx + 2, reason: `${field} is missing.`, data: row });
                            break;
                        }
                    }
                });

                if (preValidationErrors.length > 0) {
                    setResult({
                        success: false,
                        total_processed: normalizedData.length,
                        created: 0,
                        updated: 0,
                        errors: preValidationErrors,
                        isPreValidation: true
                    });
                    setStage('final');
                    setLoading(false);
                    return;
                }

                const currentChunkSize = section === 'employees' ? 50 : CHUNK_SIZE;
                const totalChunks = Math.ceil(normalizedData.length / currentChunkSize);
                let allErrors = [], cCreated = 0, cUpdated = 0, cProcessed = 0;

                for (let i = 0; i < totalChunks; i++) {
                    if (signal.aborted) throw new Error('Process aborted.');
                    const chunk = normalizedData.slice(i * currentChunkSize, (i + 1) * currentChunkSize);


                    try {
                        let targetEndpoint = '';
                        if (section === 'employees') targetEndpoint = 'employees/bulk-upload/';
                        else if (section === 'positions') targetEndpoint = 'positions/bulk-upload/';
                        else if (section === 'offices') targetEndpoint = 'offices/bulk-upload/';
                        else if (section === 'departments') targetEndpoint = 'departments/bulk-upload/';
                        else if (section === 'sections') targetEndpoint = 'sections/bulk-upload/';
                        else targetEndpoint = `geo/bulk-upload/?section=${section}`;
                        
                        const response = await api.post(targetEndpoint, chunk, { signal });


                        // Always accumulate counts, even if there are partial errors in the batch
                        cCreated += (response.created || 0);
                        cUpdated += (response.updated || 0);

                        if (response.errors) {
                            allErrors = allErrors.concat(response.errors);
                        }
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            console.error("Upload failed", err);
                            let errorReason = err?.detail || err?.details || err?.error || err?.message || JSON.stringify(err) || `Network/Server Error in batch ${i + 1}`;
                            if (typeof errorReason === 'object') errorReason = JSON.stringify(errorReason);
                            allErrors.push({ row: 'Batch ' + (i + 1), reason: String(errorReason), data: {} });
                        }
                    }

                    cProcessed += chunk.length;
                    setProcessedRows(cProcessed);
                    setCreatedCount(cCreated);
                    setUpdatedCount(cUpdated);
                    setUploadProgress(Math.round((cProcessed / normalizedData.length) * 100));
                    setChunkErrors(allErrors);

                    if (i + 1 < totalChunks) await new Promise(r => setTimeout(r, 50));

                }

                setResult({ success: allErrors.length === 0, total_processed: normalizedData.length, created: cCreated, updated: cUpdated, errors: allErrors });
                setStage('final');

                setTimeout(() => {
                    fetchDropdownData().catch(() => { });
                    if (activeSection === section) fetchData(true, true, 1).catch(() => { });
                }, 500);

            } catch (err) {
                setStage('selection');
                showNotification(err.message, 'error');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const downloadTemplate = () => {
        let headers = {};
        const s = (section || '').toLowerCase();
        if (s.includes('clusters')) {
            headers = {
                'Continent Name': 'Asia',
                'Country Name': 'India',
                'State Name': 'Andhra Pradesh',
                'District Name': 'Visakhapatnam',
                'Mandal Name': 'Gajuwaka',
                'Cluster': 'Cluster Name',
                'Cluster Code': 'VIJAY',
                'Cluster Type': 'Village'
            };
        } else if (s.includes('positions')) {
            headers = {
                'Position Title': 'Senior Project Manager',
                'Position Code': 'POS-001',
                'Designation Rank / Level': 'Level Name',
                'Activation Date': '2023-01-01',
                'Job Family': 'Family Name',
                'Role Type': 'Type Name',
                'Role Name': 'Role Name',
                'Role Sub Group': 'Sub Group Name',
                'Position Type': 'Position Type Name',
                'Shift Names': 'General Shift, Night Shift',
                'Job Profile (Specific Role)': 'Job Name',
                'Structural Tier (Office Level)': 'State/Circle/Dist',
                'Assign to Office / Unit': 'Office Name',
                'Department': 'Department Name',
                'Section / Team': 'Section Name',
                'Reporting To (Codes)': 'POS-REP-01, POS-REP-02',
                'Additional Roles': 'Role 2, Role 3',
                'Additional Sub Groups': 'Sub Group 2',
                'Additional Jobs': 'Job 2',
                'Status': 'Active'
            };
        } else if (s.includes('employees')) {
            headers = {
                'Name *': 'John Doe',
                'Email *': 'john.doe@example.com (Login)',
                'Phone *': '9876543210',
                'Employee Code *': 'EMP001',
                'Joining Date *': '2023-01-01',
                'Date of Birth *': '1995-05-15',
                'Gender *': 'Male',
                'Employment Type *': 'Permanent',
                'Status': 'Active',
                'Position Codes': 'POS-001, POS-002',
                'Address': '123 Street, City',
                'Father Name': 'Sr John Doe',
                'Mother Name': 'Smt Doe'
            };

        } else if (s.includes('offices')) {
            headers = {
                'Office Name *': 'Vizag Regional Office',
                'Office Code *': 'VZ-RO-01',
                'Structural Tier *': 'L2 - Regional Office',
                'Parent Office *': 'Head Office',
                'Cluster *': 'Cluster Name',
                'Facility Template': 'PHC Architecture Template',
                'Start Date *': '2023-01-01',
                'Status': 'Active'
            };
        } else if (s.includes('departments')) {
            headers = {
                'Department Name *': 'Operations',
                'Department Code': 'OPS-DEPT',
                'Office *': 'Vizag Regional Office',
                'Description': 'Main ops dept',
                'Status': 'Active'
            };
        } else if (s.includes('sections')) {
            headers = {
                'Section Name *': 'Billing Team',
                'Section Code': 'BILL-SEC',
                'Department *': 'Operations',
                'Office *': 'Vizag Regional Office',
                'Description': 'Billing unit',
                'Status': 'Active'
            };
        } else if (s.includes('mandals')) {

            headers = {
                'Continent Name': 'Asia',
                'Country Name': 'India',
                'State Name': 'Andhra Pradesh',
                'District Name': 'Visakhapatnam',
                'Mandal Name': 'Gajuwaka',
                'Mandal Code': 'GN-01'
            };
        } else if (s.includes('districts')) {
            headers = {
                'Continent Name': 'Asia',
                'Country Name': 'India',
                'State Name': 'Andhra Pradesh',
                'District Name': 'Visakhapatnam',
                'District Code': 'VZ-01'
            };
        } else if (s.includes('states')) {
            headers = {
                'Continent Name': 'Asia',
                'Country Name': 'India',
                'State Name': 'Andhra Pradesh',
                'State Code': 'AP-01'
            };
        } else if (s.includes('countries')) {
            headers = {
                'Continent Name': 'Asia',
                'Country Name': 'India',
                'Country Code': 'IN'
            };
        } else {
            headers = {
                'Continent Name': 'Asia',
                'Continent Code': 'AS'
            };
        }

        const ws = XLSX.utils.json_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `${section}_Master_Template.xlsx`);
    };

    const downloadCurrentData = async () => {
        try {
            setLoading(true);
            const s = (section || '').toLowerCase();
            const endpoint = `${s}/export-csv/`;
            const blob = await api.blob(endpoint);
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${section}_mass_update_template_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            showNotification(`Successfully exported all ${section} records for mass update.`, 'success');
        } catch (err) {
            console.error("Export error:", err);
            showNotification("Failed to export current data. Please ensure you have permission.", "error");
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        overlay: {
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.3s ease-out'
        },
        modal: {
            maxWidth: '780px', width: '95%', maxHeight: '92vh',
            backgroundColor: '#ffffff', borderRadius: '32px', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.5)', overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        },
        header: {
            padding: '2rem 2.5rem', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #ffffff, #f8fafc)'
        },
        sidebarItem: (active) => ({
            padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: active ? '#f5f3ff' : 'transparent',
            color: active ? '#7c3aed' : '#64748b',
            transition: 'all 0.2s ease',
            fontWeight: active ? 800 : 500
        }),
        content: { padding: '2.5rem', overflowY: 'auto', flex: 1 },
        stageIdle: {
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'
        },
        actionCard: {
            padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff', position: 'relative', overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem'
        },
        stageReady: {
            animation: 'slideUp 0.4s ease-out'
        },
        previewTable: {
            width: '100%', borderCollapse: 'separate', borderSpacing: 0,
            fontSize: '0.8rem', borderRadius: '16px', border: '1px solid #e2e8f0',
            overflow: 'hidden'
        },
        footer: {
            padding: '1.5rem 2.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'flex-end', gap: '1rem'
        }
    };

    return (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <style>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .hover-elevate:hover { transform: translateY(-5px); border-color: #7c3aed; box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.15); }
                .pulse-purple { animation: pulse 2s infinite; }
                @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(124, 58, 237, 0); } 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); } }
            `}</style>

            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header Section */}
                <div style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '20px',
                            background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 12px 24px -6px rgba(124, 58, 237, 0.4)'
                        }}>
                            <Database size={28} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Bulk Hierarchy Sync</h2>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Layers size={14} /> Unified Engine • Level: {(section.split('-')[1] || section).toUpperCase()}


                            </p>
                        </div>
                    </div>
                    <button type="button" className="btn-close" onClick={onClose} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                        <X size={14} /> CLOSE
                    </button>
                </div>

                <div style={styles.content}>
                    {/* STAGE 1: SELECTION */}
                    {stage === 'selection' && (
                        <div style={styles.stageIdle}>
                            <div className="hover-elevate" style={styles.actionCard} onClick={downloadTemplate}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fdf4ff', color: '#a21caf', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>1a. Acquire Schema</h3>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                                        Download an empty template containing accurate hierarchy headers for {section.split('-')[1] || section}.
                                    </p>
                                </div>
                                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 700, fontSize: '0.9rem' }}>
                                    <Download size={18} /> Get XLSX Template
                                </div>
                            </div>

                            {(section === 'positions' || section === 'employees') && (
                                <div className="hover-elevate" style={{ ...styles.actionCard, border: '1px solid #d1fae5' }} onClick={downloadCurrentData}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <DownloadCloud size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>1b. Mass Update Export</h3>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                                            Download <strong>all existing records with IDs</strong> to perform bulk edits on names, codes, or any other field.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <label className="hover-elevate" style={{ ...styles.actionCard, borderStyle: 'dashed' }}>
                                <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileChange} />
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f0f9ff', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {uploadStatus === 'parsing' ? <Loader2 className="animate-spin" size={24} /> : <CloudUpload size={24} />}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>2. Deploy Data</h3>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                                        Upload your populated file. We will verify the integrity and map to the database.
                                    </p>
                                </div>
                                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9', fontWeight: 700, fontSize: '0.9rem' }}>
                                    <Zap size={18} /> {uploadStatus === 'parsing' ? 'System Parsing...' : 'Select Source File'}
                                </div>
                            </label>
                        </div>
                    )}

                    {/* STAGE 2: READY / PREVIEW */}
                    {stage === 'ready' && (
                        <div style={styles.stageReady}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileCheck size={26} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>File Verified: {file?.name}</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Detected {totalRows.toLocaleString()} rows ready for hierarchical linkage.</p>
                                    </div>
                                </div>
                                <button onClick={() => setStage('selection')} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <RotateCcw size={14} /> Replace File
                                </button>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                                    Structural Preview (First 5 Rows)
                                </div>
                                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                                    <table style={styles.previewTable}>
                                        <thead style={{ background: '#f8fafc' }}>
                                            <tr>
                                                {Object.keys(previewData[0] || {}).slice(0, 6).map(h => (
                                                    <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, i) => (
                                                <tr key={i} style={{ transition: '0.2s', borderBottom: i < previewData.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                    {Object.keys(previewData[0] || {}).slice(0, 6).map(col => (
                                                        <td key={col} style={{ padding: '12px 18px', color: '#0f172a', whiteSpace: 'nowrap' }}>{row[col] || '-'}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ padding: '1.25rem', background: '#fffbeb', borderRadius: '20px', border: '1px solid #fef3c7', display: 'flex', gap: '1rem' }}>
                                <ShieldCheck size={22} color="#ca8a04" />
                                <div style={{ fontSize: '0.85rem', color: '#713f12', lineHeight: 1.6 }}>
                                    <strong>Atomic Integrity Guard:</strong> We will check for pre-existing records to avoid redundancy. Missing or malformed codes will be blocked automatically.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STAGE 3: SYNCING */}
                    {stage === 'syncing' && (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                            <div className="pulse-purple" style={{ width: '80px', height: '80px', borderRadius: '28px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto' }}>
                                <Loader2 className="animate-spin" size={40} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 950, letterSpacing: '-0.02em', margin: 0 }}>
                                {uploadStatus === 'validating' ? 'Verifying Integrity...' : 'Syncing Global Hierarchy'}
                            </h3>
                            <p style={{ margin: '10px 0 0 0', color: '#64748b' }}>Deploying {processedRows.toLocaleString()} of {totalRows.toLocaleString()} entities into the infrastructure.</p>

                            <div style={{ width: '100%', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '10px', marginTop: '3rem', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #db2777)', borderRadius: '10px', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                            </div>
                            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', padding: '0 5px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#7c3aed' }}>{uploadProgress}% Progress</span>
                                {chunkErrors.length > 0 && <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#ef4444' }}>{chunkErrors.length} Blocks Blocked</span>}
                            </div>
                        </div>
                    )}

                    {/* STAGE 4: FINAL */}
                    {stage === 'final' && (
                        <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '35px', margin: '0 auto 1.5rem auto',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: result.errors.length > 0 ? '#fef2f2' : '#f0fdf4',
                                color: result.errors.length > 0 ? '#ef4444' : '#16a34a',
                                transform: 'rotate(-3deg)',
                                boxShadow: `0 20px 40px -10px ${result.errors.length > 0 ? 'rgba(225, 29, 72, 0.2)' : 'rgba(22, 163, 74, 0.2)'}`
                            }}>
                                {result.errors.length > 0 ? <AlertCircle size={52} /> : <CheckCircle2 size={52} />}
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.04em' }}>
                                {result.errors.length > 0 ? 'Sync Session Summary' : 'Hierarchy Fully Optimized'}
                            </h3>

                            {result.errors.length > 0 && (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    padding: '6px 16px', borderRadius: '100px', marginTop: '12px',
                                    background: result.isPreValidation ? '#fff7ed' : '#f0fdf4',
                                    border: `1px solid ${result.isPreValidation ? '#ffedd5' : '#dcfce7'}`,
                                    color: result.isPreValidation ? '#9a3412' : '#166534',
                                    fontSize: '0.85rem', fontWeight: 800
                                }}>
                                    {result.isPreValidation ? (
                                        <><ShieldCheck size={16} /> DATABASE PROTECTED: No changes were committed due to structural errors.</>
                                    ) : (
                                        <><Zap size={16} /> PARTIAL SYNC LIVE: Successful records have been committed to the database.</>
                                    )}
                                </div>
                            )}

                            <p style={{ color: '#64748b', fontSize: '1.05rem', marginTop: '12px' }}>The engine evaluated {totalRows.toLocaleString()} nodes for integration.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '3rem' }}>
                                <div style={{ padding: '2rem 1rem', borderRadius: '24px', background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 950, color: '#7c3aed' }}>{createdCount.toLocaleString()}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#6d28d9', uppercase: true, marginTop: '5px' }}>New Nodes</div>
                                </div>
                                <div style={{ padding: '2rem 1rem', borderRadius: '24px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 950, color: '#0ea5e9' }}>{updatedCount.toLocaleString()}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0369a1', uppercase: true, marginTop: '5px' }}>Synced (Safe)</div>
                                </div>
                                <div style={{ padding: '2rem 1rem', borderRadius: '24px', background: result.errors.length > 0 ? '#fff1f2' : '#ffffff', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 950, color: result.errors.length > 0 ? '#e11d48' : '#64748b' }}>{result.errors.length.toLocaleString()}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: result.errors.length > 0 ? '#be123e' : '#64748b', uppercase: true, marginTop: '5px' }}>Blocked</div>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div style={{ marginTop: '2.5rem', textAlign: 'left' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#9f1239', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <BarChart3 size={20} /> Integrity Verification Report
                                        </h4>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '20px', border: '1px solid #fee2e2', backgroundColor: '#fff' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                            <thead style={{ background: '#fff1f2', position: 'sticky', top: 0 }}>
                                                <tr>
                                                    <th style={{ padding: '12px 15px', textAlign: 'left', color: '#be123e', width: '60px' }}>Row</th>
                                                    <th style={{ padding: '12px 15px', textAlign: 'left', color: '#be123e' }}>Data Context</th>
                                                    <th style={{ padding: '12px 15px', textAlign: 'left', color: '#be123e' }}>Error Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.errors.slice(0, 100).map((err, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #fff1f2' }}>
                                                        <td style={{ padding: '10px 15px', fontWeight: 900, color: '#9f1239' }}>#{err.row || i + 1}</td>
                                                        <td style={{ padding: '10px 15px' }}>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                                {(section === 'employees'
                                                                    ? ['name', 'email', 'employee_code', 'phone']
                                                                    : ['Continent', 'Country', 'State', 'District', 'Mandal', 'Cluster']
                                                                ).map(key => (
                                                                    err.data?.[key] && (
                                                                        <span key={key} style={{ padding: '2px 6px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', fontSize: '0.65rem', color: '#9f1239' }}>
                                                                            <strong style={{ opacity: 0.6 }}>{key.charAt(0).toUpperCase() + key.slice(1, 2).toLowerCase()}:</strong> {err.data[key]}
                                                                        </span>
                                                                    )
                                                                ))}

                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '10px 15px', color: '#be123e', fontWeight: 600 }}>
                                                            {err.reason || (err.errors ? Object.entries(err.errors).map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join(' | ') : String(err))}
                                                        </td>

                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                                <button onClick={() => setStage('selection')} className="btn-secondary" style={{ padding: '14px 40px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <RotateCcw size={18} /> New Sync Operation
                                </button>
                                <button onClick={onClose} className="btn-primary" style={{ padding: '14px 40px', borderRadius: '18px', background: 'linear-gradient(135deg, #7c3aed, #db2777)', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px -4px rgba(124, 58, 237, 0.3)' }}>Terminate Session</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div style={styles.footer}>
                    {stage === 'selection' ? (
                        <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', color: '#64748b', fontWeight: 800 }}>Cancel Operation</button>
                    ) : stage === 'ready' ? (
                        <>
                            <button onClick={() => setStage('selection')} style={{ background: 'none', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', color: '#64748b', fontWeight: 800 }}>Back</button>
                            <button
                                onClick={handleUpload}
                                className="pulse-purple"
                                style={{
                                    background: 'linear-gradient(135deg, #7c3aed, #db2777)', border: 'none', color: 'white',
                                    padding: '12px 48px', borderRadius: '18px', fontWeight: 800, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem',
                                    boxShadow: '0 10px 20px -5px rgba(124, 58, 237, 0.4)'
                                }}
                            >
                                <Zap size={20} /> Initiate Hierarchical Sync <ArrowRight size={20} />
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default BulkUploadModal;
