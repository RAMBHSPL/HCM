import React from 'react';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import ModalForm from './ModalForm';
import EmployeeProfileModal from './EmployeeProfileModal';
import PositionDetailModal from './PositionDetailModal';
import OfficeDetailModal from './OfficeDetailModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import CancelConfirmationModal from './CancelConfirmationModal';
import { useData } from '../context/DataContext';

import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    const isProfilePage = location.pathname === '/profile';

    const {
        showModal,
        setShowModal,
        modalType,
        formData,
        handleFormSubmit,
        closeModal,
        showEmployeeProfile,
        showPositionDetail,
        showOfficeDetail,
        notification,
        isSidebarOpen,
        toggleSidebar,
        isSubmitting,
        validationErrors
    } = useData();

    return (
        <div className="app-container">
            {!isProfilePage && <Sidebar />}

            {/* Mobile Overlay */}
            {!isProfilePage && isSidebarOpen && (
                <div
                    className="mobile-overlay"
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1500,
                        display: 'none' // Controlled by CSS media queries
                    }}
                />
            )}

            <div className="main-layout">
                {!isProfilePage && <TopNav />}
                <main className="main-content" style={isProfilePage ? { padding: 0 } : {}}>
                    {children}
                </main>
                {!isProfilePage && (
                    <div style={{
                        width: '100%',
                        background: '#0f172a',
                        padding: '0.4rem 1rem',
                        textAlign: 'center',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        zIndex: 10,
                        borderTop: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <span style={{ color: '#64748b', fontSize: '0.68rem' }}>© 2026</span>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em', color: 'white' }}>ONE <span style={{ color: '#818cf8' }}>HCM</span></span>
                        <span style={{ color: '#475569' }}>•</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Enterprise Workforce Management System</span>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showEmployeeProfile && <EmployeeProfileModal />}
            {showPositionDetail && <PositionDetailModal />}
            {showOfficeDetail && <OfficeDetailModal />}
            <DeleteConfirmationModal />
            <CancelConfirmationModal />

            {showModal && (
                <div className="modal-overlay active" onClick={(e) => {
                    if (e.target.classList.contains('modal-overlay')) closeModal();
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="section-title" style={{ margin: 0, background: 'var(--sunset)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {formData.id ? 'Edit' : 'Add New'} {modalType}
                            </h2>
                            <button type="button" className="btn-close" onClick={closeModal} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                <X size={14} /> CLOSE
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
                            <div className="modal-form-container" style={{ flex: 1, overflowY: 'auto' }}>
                                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                                    <ModalForm />
                                </div>
                            </div>
                            <div className="modal-footer-container" style={{ background: 'white', borderTop: '1px solid var(--primary-light)', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', gap: '1.5rem' }}>
                                    <button
                                        type="button"
                                        className="form-input"
                                        style={{ flex: 1, background: '#f3f4f6', border: 'none', cursor: 'pointer', fontWeight: 600, margin: 0 }}
                                        onClick={closeModal}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        style={{ 
                                            flex: 1, 
                                            justifyContent: 'center', 
                                            opacity: (isSubmitting || Object.keys(validationErrors || {}).length > 0) ? 0.6 : 1, 
                                            cursor: isSubmitting ? 'wait' : (Object.keys(validationErrors || {}).length > 0 ? 'not-allowed' : 'pointer'),
                                            filter: Object.keys(validationErrors || {}).length > 0 ? 'grayscale(1)' : 'none'
                                        }}
                                        disabled={isSubmitting || Object.keys(validationErrors || {}).length > 0}
                                    >
                                        {isSubmitting ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="inner-spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}></div>
                                                SAVING...
                                            </div>
                                        ) : (
                                            formData.id ? 'UPDATE' : 'CREATE'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
