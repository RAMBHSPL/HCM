import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import api from '../api';

const globalCache = {};
const OPTION_HEIGHT = 40;
const VIEWPORT_HEIGHT = 240;

const SearchableSelect = ({
    options = [],
    value = '',
    onChange,
    placeholder = 'Select option...',
    className = '',
    icon: Icon = null,
    required = false,
    disabled = false,
    endpoint = null,
    queryParam = 'search'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [localOptions, setLocalOptions] = useState(options);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedValueDetail, setSelectedValueDetail] = useState(null);
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Sync localOptions when options prop changes (for static dropdown usage)
    useEffect(() => {
        if (!endpoint) {
            setLocalOptions(options);
        }
    }, [options, endpoint]);

    // Fetch details of selected value if we don't have it in options
    useEffect(() => {
        if (!endpoint || !value) {
            setSelectedValueDetail(null);
            return;
        }

        const found = localOptions.find(opt => String(opt.id || opt.value) === String(value));
        if (found) {
            setSelectedValueDetail(found);
            return;
        }

        // Fetch details of the selected item
        let isMounted = true;
        const fetchDetail = async () => {
            const cacheKey = `${endpoint}_detail_${value}`;
            if (globalCache[cacheKey]) {
                if (isMounted) setSelectedValueDetail(globalCache[cacheKey]);
                return;
            }

            try {
                // Try fetching by id filter: e.g. /api/employees/all_data/?id=123
                const res = await api.get(`${endpoint}?id=${value}`);
                const detail = Array.isArray(res) ? res[0] : (res.results && res.results.length ? res.results[0] : res);
                if (detail && isMounted) {
                    globalCache[cacheKey] = detail;
                    setSelectedValueDetail(detail);
                    // Also prepend to localOptions so we can find it
                    setLocalOptions(prev => {
                        if (prev.some(x => String(x.id || x.value) === String(value))) return prev;
                        return [detail, ...prev];
                    });
                }
            } catch (err) {
                console.error("Failed to fetch selected option detail:", err);
            }
        };

        fetchDetail();
        return () => { isMounted = false; };
    }, [value, endpoint, localOptions]);

    // Fetch options on search/open
    useEffect(() => {
        if (!endpoint || !isOpen) return;

        let isMounted = true;
        const delayDebounce = setTimeout(async () => {
            setIsLoading(true);
            const cacheKey = `${endpoint}_query_${searchTerm}`;
            if (globalCache[cacheKey]) {
                if (isMounted) {
                    setLocalOptions(globalCache[cacheKey]);
                    setIsLoading(false);
                }
                return;
            }

            try {
                // Fetch paginated/filtered list
                const url = `${endpoint}?${queryParam}=${encodeURIComponent(searchTerm)}&page=1&page_size=50`;
                const res = await api.get(url);
                const items = Array.isArray(res) ? res : (res.results || []);
                
                if (isMounted) {
                    globalCache[cacheKey] = items;
                    setLocalOptions(prev => {
                        // Keep the current selected value in the list so it doesn't disappear from UI
                        const currentSelected = prev.find(x => String(x.id || x.value) === String(value));
                        const filteredItems = items.filter(x => String(x.id || x.value) !== String(value));
                        return currentSelected ? [currentSelected, ...filteredItems] : items;
                    });
                }
            } catch (err) {
                console.error("Failed to fetch search options:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }, searchTerm ? 300 : 0); // debounced when typing

        return () => {
            clearTimeout(delayDebounce);
            isMounted = false;
        };
    }, [searchTerm, isOpen, endpoint, queryParam, value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (listRef.current) {
            listRef.current.scrollTop = 0;
            setScrollTop(0);
        }
    }, [isOpen, searchTerm]);

    const handleSelect = (option) => {
        if (disabled) {
            console.warn("Security: Attempted to select value in a disabled dropdown. Action blocked.");
            return;
        }
        onChange({ target: { value: option.id || option.value } }, option);
        setIsOpen(false);
        setSearchTerm('');
    };

    const getOptionLabel = (opt) => {
        if (!opt) return '';
        if (opt.employee_code) {
            return `${opt.name} (${opt.employee_code})`;
        }
        if (opt.code) {
            return `${opt.name} (${opt.code})`;
        }
        return opt.name || opt.label || '';
    };

    // Determine the active display option
    const selectedOption = selectedValueDetail || localOptions.find(opt => String(opt.id || opt.value) === String(value));

    // Filter local options (only client-side if not using dynamic endpoint)
    const filteredOptions = useMemo(() => {
        if (endpoint) return localOptions;
        return localOptions.filter(opt => {
            const label = getOptionLabel(opt).toLowerCase();
            const search = searchTerm.toLowerCase().trim();
            if (!search) return true;
            return label.includes(search);
        });
    }, [localOptions, endpoint, searchTerm]);

    // Virtualization Calculations
    const handleScroll = (e) => {
        setScrollTop(e.target.scrollTop);
    };

    const totalHeight = filteredOptions.length * OPTION_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / OPTION_HEIGHT) - 2);
    const endIndex = Math.min(filteredOptions.length, Math.ceil((scrollTop + VIEWPORT_HEIGHT) / OPTION_HEIGHT) + 2);
    const visibleOptions = filteredOptions.slice(startIndex, endIndex);

    return (
        <div className={`premium-select-container ${className}`} ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div
                className={`premium-input ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '3.5rem',
                    opacity: disabled ? 0.6 : 1
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                    {Icon && <Icon className="premium-input-icon" size={18} style={{ position: 'static', transform: 'none', color: isOpen ? 'var(--primary)' : '#94a3b8' }} />}
                    <span style={{
                        color: selectedOption ? '#1e293b' : '#94a3b8',
                        fontWeight: selectedOption ? 600 : 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {selectedOption ? getOptionLabel(selectedOption) : placeholder}
                    </span>
                </div>
                <ChevronDown size={18} color="#94a3b8" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
            </div>

            {/* Hidden Input for Form Validation */}
            <input
                type="text"
                value={value || ''}
                required={required}
                onChange={() => { }} // Controlled but silent
                style={{
                    opacity: 0,
                    width: 0,
                    height: 0,
                    position: 'absolute',
                    pointerEvents: 'none'
                }}
            />

            {isOpen && (
                <div className="glass" style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    zIndex: 2000,
                    padding: '8px',
                    maxHeight: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type to search..."
                            value={searchTerm}
                            maxLength={30}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (visibleOptions.length > 0) {
                                        handleSelect(visibleOptions[0]);
                                    } else {
                                        setIsOpen(false);
                                    }
                                } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }
                            }}
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
                    {isLoading ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                            Loading options...
                        </div>
                    ) : filteredOptions.length > 0 ? (
                        <div 
                            ref={listRef}
                            onScroll={handleScroll}
                            style={{ 
                                overflowY: 'auto', 
                                maxHeight: `${VIEWPORT_HEIGHT}px`, 
                                position: 'relative',
                                flex: 1,
                                width: '100%'
                            }}
                        >
                            <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
                                {visibleOptions.map((opt, index) => {
                                    const globalIndex = startIndex + index;
                                    return (
                                        <div
                                            key={opt.id || opt.value || globalIndex}
                                            onClick={() => handleSelect(opt)}
                                            style={{
                                                position: 'absolute',
                                                top: `${globalIndex * OPTION_HEIGHT}px`,
                                                left: 0,
                                                right: 0,
                                                height: `${OPTION_HEIGHT}px`,
                                                padding: '10px 12px',
                                                boxSizing: 'border-box',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: String(opt.id || opt.value) === String(value) ? 700 : 500,
                                                background: String(opt.id || opt.value) === String(value) ? 'var(--primary-light)' : 'transparent',
                                                color: String(opt.id || opt.value) === String(value) ? 'var(--primary)' : '#1e293b',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = String(opt.id || opt.value) === String(value) ? 'var(--primary-light)' : '#f8fafc'}
                                            onMouseLeave={(e) => e.target.style.background = String(opt.id || opt.value) === String(value) ? 'var(--primary-light)' : 'transparent'}
                                        >
                                            {(() => {
                                                const text = getOptionLabel(opt);
                                                if (!searchTerm.trim()) return text;
                                                
                                                // Escape special characters for regex safety
                                                const escapedTerm = searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                                const parts = text.toString().split(new RegExp(`(${escapedTerm})`, 'gi'));
                                                
                                                return parts.map((part, i) => (
                                                    part.toLowerCase() === searchTerm.trim().toLowerCase() ? 
                                                        <span key={i} style={{ backgroundColor: 'rgb(249 115 22 / 20%)', color: '#ea580c', fontWeight: 800, padding: '0 2px', borderRadius: '4px' }}>{part}</span> : 
                                                        <span key={i}>{part}</span>
                                                ));
                                            })()}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                            No results found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;

