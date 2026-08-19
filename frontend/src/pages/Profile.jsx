import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
    User, Mail, Phone, Calendar, MapPin, Briefcase, Users,
    Camera, Building2, Shield, Clock, Award, CheckCircle, ArrowLeft
} from 'lucide-react';
import api, { fileToBase64 } from '../api';
import { useNavigate } from 'react-router-dom';
import BavyaSpinner from '../components/BavyaSpinner';

const Profile = () => {
    const { user, showNotification, fetchData, refreshPermissions, getPhotoUrl } = useData();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imgError, setImgError] = useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            if (user?.employee_profile_id) {
                try {
                    const res = await api.get(`employees/${user.employee_profile_id}`);
                    setProfileData(res.data || res);
                } catch (err) {
                    console.error("Failed to load profile:", err);
                    showNotification("Failed to load profile details", "error");
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select an image file', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image size should be less than 5MB', 'error');
            return;
        }

        setUploading(true);
        try {
            const base64 = await fileToBase64(file);
            const res = await api.patch(`employees/${user.employee_profile_id}`, { photo: base64 });
            showNotification('Profile photo updated successfully', 'success');

            // Refresh local profile data
            setProfileData(res.data || res);

            if (refreshPermissions) refreshPermissions();
            if (fetchData) fetchData(); // Refresh global user context
        } catch (err) {
            showNotification('Failed to upload photo', 'error');
        } finally {
            setUploading(false);
        }
    };

    // Use profileData instead of user for display
    const data = profileData;

    return (
        <div className="fade-in scroll-container" style={{ minHeight: '100vh', background: '#f8fafc', width: '100%' }}>
            {/* Top Navigation Bar for Profile */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        color: '#64748b',
                        fontWeight: 600,
                        padding: '8px 16px',
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                        background: 'white',
                        border: '1px solid #e2e8f0'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; }}
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </div>

                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e293b' }}>
                    My Profile
                </div>

                <div style={{ width: '140px' }}></div> {/* Spacer to balance center text */}
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start', padding: '2rem', paddingBottom: '4rem', position: 'relative' }}>
                {loading && (
                    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, background: 'rgba(248, 250, 252, 0.8)', backdropFilter: 'blur(8px)' }}>
                        <BavyaSpinner label="Syncing Profile..." />
                    </div>
                )}

                {!loading && !profileData ? (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', textAlign: 'center' }}>
                        <h2 style={{ color: '#1e293b' }}>Account Scope Not Found</h2>
                        <p style={{ color: '#64748b' }}>Your user identity is not linked to a valid employee profile.</p>
                        <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '1rem' }}>Return to Dashboard</button>
                    </div>
                ) : data && (
                    <>

                        {/* LEFT COLUMN: Identity Card */}
                        <div className="fade-in" style={{
                            flex: '0 0 350px',
                            background: 'white',
                            borderRadius: '24px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            padding: '3rem 2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            minHeight: '500px',
                            position: 'relative'
                        }}>
                            {/* Photo with edit badge */}
                            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                                <div style={{
                                    width: '160px',
                                    height: '160px',
                                    borderRadius: '50%',
                                    border: '4px solid white',
                                    padding: '4px',
                                    background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {data.photo && !imgError ? (
                                        <img
                                            src={getPhotoUrl(data.photo)}
                                            alt=""
                                            onError={() => setImgError(true)}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ fontSize: '3.5rem', fontWeight: 700, color: '#94a3b8' }}>
                                            {data.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                                {/* Status Dot */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '12px',
                                    right: '12px',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: data.status === 'Active' ? '#22c55e' : '#ef4444',
                                    border: '3px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }} title={data.status} />

                                {/* Camera Upload Button */}
                                <label style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '-10px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    padding: '10px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'transform 0.2s'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Camera size={20} color="#64748b" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        disabled={uploading}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem', margin: 0 }}>
                                {data.name}
                            </h2>

                            <div style={{
                                fontSize: '0.9rem',
                                color: '#64748b',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '2rem',
                                background: '#f1f5f9',
                                padding: '6px 16px',
                                borderRadius: '100px',
                                marginTop: '0.5rem'
                            }}>
                                {data.primary_position || 'NO POSITION'}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginBottom: 'auto' }}>
                                <div style={{
                                    background: 'rgba(254, 242, 242, 0.5)',
                                    border: '1px solid #fee2e2',
                                    color: '#991b1b',
                                    padding: '10px',
                                    borderRadius: '12px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ opacity: 0.7 }}>ID</span>
                                    <span>{data.employee_code}</span>
                                </div>
                                {data.positions_details?.[0]?.department_name && (
                                    <div style={{
                                        background: 'rgba(253, 242, 248, 0.5)',
                                        border: '1px solid #fce7f3',
                                        color: '#be185d',
                                        padding: '10px',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ opacity: 0.7 }}>DEPT</span>
                                        <span style={{ textAlign: 'right', maxWidth: '180px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{data.positions_details[0].department_name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Contact Bottom Section */}
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem', marginTop: '2rem', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}><Mail size={18} color="#64748b" /></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>OFFICIAL EMAIL</span>
                                        <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{data.email || '--'}</span>
                                    </div>
                                </div>
                                {data.personal_email && (
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
                                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}><Mail size={18} color="#64748b" /></div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>PERSONAL EMAIL</span>
                                            <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{data.personal_email}</span>
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}><Phone size={18} color="#64748b" /></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>PHONE</span>
                                        <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{data.phone || '--'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Details Sections */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: '350px' }}>

                            {/* Organization Details Panel */}
                            <div className="fade-in" style={{
                                background: 'white',
                                borderRadius: '24px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                padding: '2.5rem',
                                border: '1px solid #f1f5f9'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                                    <div style={{ background: 'linear-gradient(135deg, #be185d 0%, #881337 100%)', padding: '10px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 12px rgba(190, 24, 93, 0.3)' }}><Briefcase size={22} /></div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Organization Details</h3>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>DEPARTMENT</div>
                                        <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '1.1rem' }}>{data.positions_details?.[0]?.department_name || '--'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>OFFICE</div>
                                        <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '1.1rem' }}>{data.positions_details?.[0]?.office_name || '--'}</div>
                                    </div>
                                </div>

                                {data.reporting_to_name && (
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>REPORTING TO</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#881337', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                                {data.reporting_to_name[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>{data.reporting_to_name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Manager</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Work Location Panel */}
                            <div className="fade-in" style={{
                                background: 'white',
                                borderRadius: '24px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                padding: '2.5rem',
                                border: '1px solid #f1f5f9'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                                    <div style={{ background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', padding: '10px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 12px rgba(30, 41, 59, 0.3)' }}><MapPin size={22} /></div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Work Location</h3>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>OFFICE NAME</div>
                                        <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '1.1rem' }}>{data.positions_details?.[0]?.office_name || '--'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>DISTRICT</div>
                                        <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '1.1rem' }}>
                                            {data.location_details?.district || (data.address ? data.address.split(',')[0] : '--')}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>STATE, COUNTRY</div>
                                        <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '1.1rem' }}>
                                            {(data.location_details?.state || data.location_details?.country) ?
                                                [data.location_details.state, data.location_details.country].filter(Boolean).join(', ') :
                                                (data.address ? data.address.split(',').slice(1).join(', ') : 'India')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Profile;
