import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, Activity, Users, BarChart3, Globe } from 'lucide-react';
import { useData } from '../context/DataContext';
import api from '../api';

const MAX_LENGTH = 30;
const PASSWORD_MAX_LENGTH = 12;
const USERNAME_REGEX = /^[a-zA-Z0-9@\-]*$/;

const Login = () => {
    const { login, error: authError, passwordResetRequired = false } = useData();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [resetData, setResetData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [mode, setMode] = useState('login');
    const [forgotUsername, setForgotUsername] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUsernameChange = (e) => {
        const raw = e.target.value;
        const filtered = raw.replace(/[^a-zA-Z0-9@\-]/g, '');
        if (filtered.length > MAX_LENGTH) { setFieldErrors(p => ({ ...p, username: `Max ${MAX_LENGTH} characters.` })); return; }
        setFieldErrors(p => ({ ...p, username: raw !== filtered ? 'Only letters, numbers, @ and - allowed.' : filtered.length === 0 ? 'Username is required.' : '' }));
        setCredentials(p => ({ ...p, username: filtered.slice(0, MAX_LENGTH) }));
    };

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        if (val.length > PASSWORD_MAX_LENGTH) { setFieldErrors(p => ({ ...p, password: `Max ${PASSWORD_MAX_LENGTH} characters.` })); return; }
        const isAdmin = credentials.username.toLowerCase().includes('admin');
        setFieldErrors(p => ({ ...p, password: !val ? 'Password is required.' : val.length < 8 && !isAdmin ? 'Min 8 characters required.' : '' }));
        setCredentials(p => ({ ...p, password: val }));
    };

    const validateForm = () => {
        const errors = {};
        if (!credentials.username.trim()) errors.username = 'Username is required.';
        else if (!USERNAME_REGEX.test(credentials.username)) errors.username = 'Only letters, numbers, @ and - allowed.';
        const isAdmin = credentials.username.toLowerCase().includes('admin');
        if (!credentials.password) errors.password = 'Password is required.';
        else if (credentials.password.length < 8 && !isAdmin) errors.password = 'Min 8 characters required.';
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (mode !== 'login') return;
        if (!validateForm()) return;
        setLoading(true); setError('');
        try { await login(credentials.username, credentials.password); }
        catch (err) { setError(err?.message || err?.error || err?.detail || 'Login failed. Please check your credentials.'); }
        finally { setLoading(false); }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (resetData.newPassword !== resetData.confirmPassword) { setError('Passwords do not match'); return; }
        const pwd = resetData.newPassword;
        if (pwd.length < 8 || pwd.length > 12 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd) || !/[!@#$%^&*]/.test(pwd)) { setError('8-12 chars with Uppercase, Number & Special Char'); return; }
        setLoading(true); setError('');
        try {
            await api.post('auth/change-password/', { old_password: resetData.oldPassword, new_password: resetData.newPassword });
            setSuccessMsg('Password changed! Redirecting...');
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) { setError(err.error || err.message || 'Failed'); setLoading(false); }
    };

    const handleForgotRequest = async (e) => {
        e.preventDefault(); setLoading(true); setError('');
        try { const res = await api.post('auth/request-reset-otp/', { username: forgotUsername }); setSuccessMsg(res.message); setMode('forgot-verify'); }
        catch (err) { setError(err.error || 'Failed to send OTP'); }
        finally { setLoading(false); }
    };

    const handleForgotVerify = (e) => { e.preventDefault(); setMode('forgot-reset'); };

    const handleForgotReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true); setError('');
        try { await api.post('auth/reset-password-otp/', { username: forgotUsername, otp, new_password: newPassword }); setSuccessMsg('Reset successful! You can now login.'); setTimeout(() => { setMode('login'); setSuccessMsg(''); }, 2000); }
        catch (err) { setError(err.error || 'Reset failed'); }
        finally { setLoading(false); }
    };

    const stats = [
        { icon: Users, label: 'Employees', value: '7,000+' },
        { icon: Activity, label: 'Fleet Units', value: '800+' },
        { icon: BarChart3, label: 'Districts', value: '26' },
        { icon: Globe, label: 'Projects', value: '3' },
    ];

    if (passwordResetRequired) {
        return (
            <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '3rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg,#f43f5e,#be185d)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><ShieldCheck size={28} color="white" /></div>
                        <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>Secure Your Account</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Please set a new password to continue.</p>
                    </div>
                    {error && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
                    {successMsg && <div style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.875rem' }}>{successMsg}</div>}
                    <form onSubmit={handleResetSubmit}>
                        {[{ label: 'Current Password', key: 'oldPassword' }, { label: 'New Password', key: 'newPassword' }, { label: 'Confirm Password', key: 'confirmPassword' }].map(({ label, key }) => (
                            <div key={key} style={{ marginBottom: '1rem' }}>
                                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>{label}</label>
                                <input type="password" value={resetData[key]} onChange={e => setResetData({ ...resetData, [key]: e.target.value })} onPaste={e => e.preventDefault()} maxLength={PASSWORD_MAX_LENGTH} required
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }} />
                            </div>
                        ))}
                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', marginTop: '0.5rem', background: 'linear-gradient(135deg,#be185d,#f43f5e)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>{loading ? 'Updating...' : 'Set New Password'}</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; }
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
                @keyframes pulse-ring { 0%{transform:scale(0.9);opacity:1} 100%{transform:scale(1.4);opacity:0} }
                @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
                @keyframes slide-in { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
                .form-input-dark { width:100%; padding:13px 16px 13px 46px; border-radius:12px; border:1.5px solid rgba(15,23,42,0.12); background:#f8fafc; font-size:0.95rem; outline:none; transition:all 0.2s; color:#1e293b; font-family:inherit; }
                .form-input-dark:focus { border-color:#6366f1; background:white; box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
                .btn-submit { width:100%; padding:14px; border:none; border-radius:14px; font-weight:700; font-size:1rem; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; }
                .btn-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 25px rgba(99,102,241,0.4); }
                .stat-card { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); border-radius:16px; padding:1.1rem; text-align:center; backdrop-filter:blur(10px); transition:all 0.2s; }
                .stat-card:hover { background:rgba(255,255,255,0.13); transform:translateY(-3px); }
            `}</style>

            {/* ── LEFT PANEL ── */}
            <div style={{ flex: '0 0 48%', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)', backgroundSize: '200% 200%', animation: 'gradient-shift 8s ease infinite', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
                {/* decorative circles */}
                <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', top: '40%', left: '60%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)' }} />

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/Bavya.png" alt="logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    </div>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px' }}>ONE HCM</span>
                </div>

                {/* Center content */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '100px', padding: '6px 16px', marginBottom: '1.5rem' }}>
                        <div style={{ width: '8px', height: '8px', background: '#6ee7b7', borderRadius: '50%', boxShadow: '0 0 8px #6ee7b7' }} />
                        <span style={{ color: '#c7d2fe', fontSize: '0.8rem', fontWeight: 600 }}>Live System Active</span>
                    </div>
                    <h2 style={{ color: 'white', fontSize: '2.6rem', fontWeight: 900, lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-1px' }}>
                        Enterprise<br />
                        <span style={{ background: 'linear-gradient(135deg,#a5b4fc,#f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Human Capital</span><br />
                        Platform
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.7, maxWidth: '340px' }}>
                        Unified workforce management across all districts, mandals and fleet operations in Andhra Pradesh.
                    </p>
                </div>

                {/* Stats */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '2rem' }}>
                        {stats.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="stat-card">
                                <Icon size={18} color="#a5b4fc" style={{ marginBottom: '6px' }} />
                                <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>{value}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                    <p style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center' }}>© 2026 ONE HCM · Bavya Health Services Pvt. Ltd.</p>
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div style={{ flex: 1, background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 4rem', overflowY: 'auto', animation: 'slide-in 0.4s ease' }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>

                    {/* Header */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>
                            {mode === 'login' ? 'Welcome back 👋' : mode === 'forgot-request' ? 'Forgot Password?' : mode === 'forgot-verify' ? 'Verify OTP' : 'Set New Password'}
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                            {mode === 'login' ? 'Sign in to your ONE HCM account' : mode === 'forgot-request' ? 'Enter your username to receive an OTP.' : mode === 'forgot-verify' ? 'Enter the 6-digit code sent to your email.' : 'Choose a strong new password.'}
                        </p>
                    </div>

                    {/* Alerts */}
                    {(error || authError) && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={15} />{error || authError}
                        </div>
                    )}
                    {successMsg && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{successMsg}</div>
                    )}

                    {/* ── FORGOT REQUEST ── */}
                    {mode === 'forgot-request' && (
                        <form onSubmit={handleForgotRequest}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', color: '#374151', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Username / Employee Code</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input className="form-input-dark" type="text" placeholder="EMP-00001" value={forgotUsername} onChange={e => setForgotUsername(e.target.value)} required maxLength={MAX_LENGTH} />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="btn-submit" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', marginBottom: '1rem' }}>{loading ? 'Sending OTP...' : 'Send OTP'}</button>
                            <button type="button" onClick={() => setMode('login')} style={{ width: '100%', background: 'transparent', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', padding: '10px' }}>← Back to Login</button>
                        </form>
                    )}

                    {/* ── FORGOT VERIFY ── */}
                    {mode === 'forgot-verify' && (
                        <form onSubmit={handleForgotVerify}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', color: '#374151', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>6-Digit OTP</label>
                                <input type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required placeholder="000000"
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: '#f8fafc', textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 800, outline: 'none', fontFamily: 'monospace', color: '#1e293b' }} />
                            </div>
                            <button type="submit" className="btn-submit" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>Verify & Continue</button>
                        </form>
                    )}

                    {/* ── FORGOT RESET ── */}
                    {mode === 'forgot-reset' && (
                        <form onSubmit={handleForgotReset}>
                            {[{ label: 'New Password', val: newPassword, set: setNewPassword }, { label: 'Confirm Password', val: confirmPassword, set: setConfirmPassword }].map(({ label, val, set }) => (
                                <div key={label} style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', color: '#374151', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>{label}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                        <input type="password" className="form-input-dark" maxLength={PASSWORD_MAX_LENGTH} value={val} onChange={e => set(e.target.value)} onPaste={e => e.preventDefault()} required />
                                    </div>
                                </div>
                            ))}
                            <button type="submit" disabled={loading} className="btn-submit" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', marginTop: '0.5rem' }}>{loading ? 'Resetting...' : 'Reset Password'}</button>
                        </form>
                    )}

                    {/* ── MAIN LOGIN ── */}
                    {mode === 'login' && (
                        <form onSubmit={handleSubmit} noValidate>
                            {/* Username */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', color: '#374151', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Username</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: fieldErrors.username ? '#ef4444' : '#9ca3af' }} />
                                    <input id="login-username" type="text" className="form-input-dark" placeholder="EMP-00001"
                                        value={credentials.username} onChange={handleUsernameChange} maxLength={MAX_LENGTH} autoComplete="username"
                                        style={{ borderColor: fieldErrors.username ? '#ef4444' : undefined, background: fieldErrors.username ? '#fef2f2' : undefined }} />
                                </div>
                                {fieldErrors.username && <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} />{fieldErrors.username}</div>}
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', color: '#374151', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: fieldErrors.password ? '#ef4444' : '#9ca3af' }} />
                                    <input id="login-password" type={showPassword ? 'text' : 'password'} className="form-input-dark" placeholder="••••••••••••"
                                        value={credentials.password} onChange={handlePasswordChange}
                                        onPaste={e => { e.preventDefault(); setFieldErrors(p => ({ ...p, password: 'Pasting not allowed.' })); }}
                                        onCopy={e => e.preventDefault()} onCut={e => e.preventDefault()} autoComplete="current-password"
                                        style={{ paddingRight: '46px', borderColor: fieldErrors.password ? '#ef4444' : undefined, background: fieldErrors.password ? '#fef2f2' : undefined }} />
                                    <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {fieldErrors.password && <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} />{fieldErrors.password}</div>}
                            </div>

                            {/* Forgot */}
                            <div style={{ textAlign: 'right', marginBottom: '2rem' }}>
                                <button type="button" onClick={() => setMode('forgot-request')}
                                    style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>Forgot Password?</button>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={loading} className="btn-submit"
                                style={{ background: loading ? '#a5b4fc' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}>
                                {loading ? 'Authenticating...' : <><span>Sign In to Dashboard</span><ArrowRight size={18} /></>}
                            </button>

                            {/* Divider info */}
                            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ShieldCheck size={14} color="#6366f1" />
                                    <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 500 }}>Secured by end-to-end encryption · ONE HCM v3</span>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
