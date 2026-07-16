import React from 'react';
import { DataProvider, useData } from './context/DataContext';
import Layout from './components/Layout';
import BavyaSpinner from './components/BavyaSpinner';
import BulkUploadModal from './components/BulkUploadModal';

// Pages
// Lazy Load Pages for Performance
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ProjectAnalyticsDashboard = React.lazy(() => import('./pages/ProjectAnalyticsDashboard'));
const OrganizationLevels = React.lazy(() => import('./pages/OrganizationLevels'));
const Offices = React.lazy(() => import('./pages/Offices'));
const Departments = React.lazy(() => import('./pages/Departments'));
const Sections = React.lazy(() => import('./pages/Sections'));
const Employees = React.lazy(() => import('./pages/Employees'));
const Positions = React.lazy(() => import('./pages/Positions'));
const PositionAssignments = React.lazy(() => import('./pages/PositionAssignments'));
const PositionLevels = React.lazy(() => import('./pages/PositionLevels'));
const PositionTypes = React.lazy(() => import('./pages/PositionTypes'));
const Shifts = React.lazy(() => import('./pages/Shifts'));
const PositionShiftRoster = React.lazy(() => import('./pages/PositionShiftRoster'));
const ManagerScreenMapping = React.lazy(() => import('./pages/ManagerScreenMapping'));
const PositionScreenMapping = React.lazy(() => import('./pages/PositionScreenMapping'));
const Projects = React.lazy(() => import('./pages/Projects'));
const FacilityMasters = React.lazy(() => import('./pages/FacilityMasters'));
const JobFamilies = React.lazy(() => import('./pages/JobFamilies'));
const RoleTypes = React.lazy(() => import('./pages/RoleTypes'));
const Roles = React.lazy(() => import('./pages/Roles'));
const Jobs = React.lazy(() => import('./pages/Jobs'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const TaskUrlMapping = React.lazy(() => import('./pages/TaskUrlMapping'));
const GeoLocations = React.lazy(() => import('./pages/Locations'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const AccessDenied = React.lazy(() => import('./pages/AccessDenied'));
const Organization = React.lazy(() => import('./pages/Organization'));
const APIKeyManagement = React.lazy(() => import('./pages/APIKeyManagement'));
const Reactivations = React.lazy(() => import('./pages/Reactivations'));
const Profile = React.lazy(() => import('./pages/Profile'));
const PositionActivityLogs = React.lazy(() => import('./pages/PositionActivityLogs'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));
const LoginHistory = React.lazy(() => import('./pages/LoginHistory'));
const VehicleSwaps = React.lazy(() => import('./pages/VehicleSwaps'));
const VehicleSwapRequests = React.lazy(() => import('./pages/VehicleSwapRequests'));
const ShiftChangeRequests = React.lazy(() => import('./pages/ShiftChangeRequests'));

import { Routes, Route, Navigate } from 'react-router-dom';

const ProtectedRoute = ({ section, children }) => {
  const { canView } = useData();
  // Basic modules always allowed
  if (['dashboard', 'users', 'api-keys', 'reactivations', 'position-assignments', 'profile', 'position-activity-logs', 'audit-logs', 'login-history', 'vehicle-swaps', 'vehicle-swap-requests', 'manager-screen-mappings', 'position-screen-mappings', 'shift-change-requests'].includes(section)) {
    return children;
  }

  // Check dynamic permission
  if (!canView(section)) {
    return <AccessDenied />;
  }

  return children;
};

const AppContent = () => {
  const { activeSection, isAuthenticated, notification, isBulkUploadOpen, setIsBulkUploadOpen } = useData();

  return (
    <>
      {/* Global Services - Modals, etc */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={(reason) => {
          console.log('🔴 [AppContent] Closing BulkUploadModal globally. Reason:', reason);
          setIsBulkUploadOpen(false);
        }}
        section={activeSection}
      />

      {/* Global Notifications - Shows on BOTH Login and Main Layout */}
      {notification.show && (
        <div className={`notification ${notification.type} show`} style={{ zIndex: 10000 }}>
          {notification.message}
        </div>
      )}

      {!isAuthenticated ? (
        <Login />
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/project-analytics" element={<ProtectedRoute section="dashboard"><ProjectAnalyticsDashboard /></ProtectedRoute>} />

            {/* Core Management */}
            <Route path="/users/*" element={<UserManagement />} />
            <Route path="/api-keys/*" element={<APIKeyManagement />} />
            <Route path="/reactivations/*" element={<Reactivations />} />
            <Route path="/audit-logs/*" element={<AuditLogs />} />
            <Route path="/login-history/*" element={<LoginHistory />} />
            <Route path="/profile" element={<Profile />} />

            {/* Organization */}
            <Route path="/organization/*" element={<ProtectedRoute section="organization"><Organization /></ProtectedRoute>} />
            <Route path="/organization-levels/*" element={<ProtectedRoute section="organization-levels"><OrganizationLevels /></ProtectedRoute>} />
            <Route path="/offices/*" element={<ProtectedRoute section="offices"><Offices /></ProtectedRoute>} />
            <Route path="/vehicle-swaps/*" element={<ProtectedRoute section="vehicle-swaps"><VehicleSwaps /></ProtectedRoute>} />
            <Route path="/vehicle-swap-requests/*" element={<ProtectedRoute section="vehicle-swap-requests"><VehicleSwapRequests /></ProtectedRoute>} />
            <Route path="/shift-change-requests/*" element={<ProtectedRoute section="shift-change-requests"><ShiftChangeRequests /></ProtectedRoute>} />
            <Route path="/departments/*" element={<ProtectedRoute section="departments"><Departments /></ProtectedRoute>} />
            <Route path="/sections/*" element={<ProtectedRoute section="sections"><Sections /></ProtectedRoute>} />
            <Route path="/facility-masters/*" element={<ProtectedRoute section="facility-masters"><FacilityMasters /></ProtectedRoute>} />

            {/* Job Structure */}
            <Route path="/job-families/*" element={<ProtectedRoute section="job-families"><JobFamilies /></ProtectedRoute>} />
            <Route path="/role-types/*" element={<ProtectedRoute section="role-types"><RoleTypes /></ProtectedRoute>} />
            <Route path="/roles/*" element={<ProtectedRoute section="roles"><Roles /></ProtectedRoute>} />
            <Route path="/jobs/*" element={<ProtectedRoute section="jobs"><Jobs /></ProtectedRoute>} />
            <Route path="/tasks/*" element={<ProtectedRoute section="tasks"><Tasks /></ProtectedRoute>} />
            <Route path="/task-urls/*" element={<ProtectedRoute section="task-urls"><TaskUrlMapping /></ProtectedRoute>} />

            {/* Workforce */}
            <Route path="/employees/*" element={<ProtectedRoute section="employees"><Employees /></ProtectedRoute>} />
            <Route path="/positions/*" element={<ProtectedRoute section="positions"><Positions /></ProtectedRoute>} />
            <Route path="/position-assignments/*" element={<ProtectedRoute section="position-assignments"><PositionAssignments /></ProtectedRoute>} />
            <Route path="/position-levels/*" element={<ProtectedRoute section="position-levels"><PositionLevels /></ProtectedRoute>} />
            <Route path="/position-types/*" element={<ProtectedRoute section="position-types"><PositionTypes /></ProtectedRoute>} />
            <Route path="/shifts/*" element={<ProtectedRoute section="shifts"><Shifts /></ProtectedRoute>} />
            <Route path="/position-shift-rosters/*" element={<ProtectedRoute section="position-shift-rosters"><PositionShiftRoster /></ProtectedRoute>} />
            <Route path="/manager-screen-mappings/*" element={<ProtectedRoute section="manager-screen-mappings"><ManagerScreenMapping /></ProtectedRoute>} />
            <Route path="/position-screen-mappings/*" element={<ProtectedRoute section="position-screen-mappings"><PositionScreenMapping /></ProtectedRoute>} />
            <Route path="/projects/*" element={<ProtectedRoute section="projects"><Projects /></ProtectedRoute>} />
            <Route path="/position-activity-logs/*" element={<ProtectedRoute section="position-activity-logs"><PositionActivityLogs /></ProtectedRoute>} />

            {/* Employee Sub-Records (modal-based, routes needed to prevent wildcard match) */}
            <Route path="/employee-documents/*" element={<ProtectedRoute section="employees"><Employees /></ProtectedRoute>} />
            <Route path="/employee-education/*" element={<ProtectedRoute section="employees"><Employees /></ProtectedRoute>} />
            <Route path="/employee-experience/*" element={<ProtectedRoute section="employees"><Employees /></ProtectedRoute>} />
            <Route path="/employee-employment-history/*" element={<ProtectedRoute section="employees"><Employees /></ProtectedRoute>} />
            <Route path="/employee-bank-details/*" element={<ProtectedRoute section="employees"><Employees /></ProtectedRoute>} />
            <Route path="/employee-epfo-details/*" element={<ProtectedRoute section="employees"><Employees /></ProtectedRoute>} />
            <Route path="/employee-health-details/*" element={<ProtectedRoute section="employees"><Employees /></ProtectedRoute>} />
            <Route path="/employee-salary-details/*" element={<ProtectedRoute section="employees"><Employees /></ProtectedRoute>} />

            {/* Geo Locations */}
            <Route path="/geo-continents/*" element={<GeoLocations />} />
            <Route path="/geo-countries/*" element={<GeoLocations />} />
            <Route path="/geo-states/*" element={<GeoLocations />} />
            <Route path="/geo-districts/*" element={<GeoLocations />} />
            <Route path="/geo-mandals/*" element={<GeoLocations />} />
            <Route path="/geo-clusters/*" element={<GeoLocations />} />
            <Route path="/visiting-locations/*" element={<GeoLocations />} />
            <Route path="/landmarks/*" element={<GeoLocations />} />

            <Route path="*" element={
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <h2 style={{ color: '#94a3b8' }}>Module Under Construction</h2>
                <p style={{ color: '#cbd5e1' }}>This section is currently being modularized.</p>
              </div>
            } />
          </Routes>
        </Layout>
      )}
    </>
  );
};

function App() {
  return (
    <DataProvider>
      <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><BavyaSpinner label="Initializing..." /></div>}>
        <AppContent />
      </React.Suspense>
    </DataProvider>
  );
}

export default App;
