import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import TLDashboard from "./pages/TLDashboard.jsx";
import ConsultantLayout from "./components/ConsultantLayout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminGroups from "./pages/AdminGroups.jsx";
import AdminStats from "./pages/AdminStats.jsx";
import AdminProfile from "./pages/AdminProfile.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import CourseDetailPage from "./pages/CourseDetailPage.jsx";
import ConsultantGroupe from "./pages/ConsultantGroupe.jsx";
import ConsultantStatistique from "./pages/ConsultantStatistique.jsx";
import ConsultantProfile from "./pages/ConsultantProfile.jsx";
import ConsultantDashboard from "./pages/ConsultantDashboard.jsx";
import ProfileTL from "./pages/ProfileTL.jsx";
import TLCourses from "./pages/TLCourses.jsx";
import TLGroups from "./pages/TLGroups.jsx";
import TLStats from "./pages/TLStats.jsx";
import CreateCourse from "./pages/CreateCourse.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import TLPackageDetail from "./pages/TLPackageDetail.jsx";
import { AuthProvider } from "./auth/AuthContext.js";
import PrivateRoute from "./auth/PrivateRoute.js";
import AuthPage from "./pages/AuthPage.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/AuthPage" element={<Navigate to="/login" replace />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<AdminHome />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="groups" element={<AdminGroups />} />
            <Route path="stats" element={<AdminStats />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          <Route path="/tl" element={<Navigate to="/tl/dashboard" replace />} />
          <Route path="/tl/dashboard" element={<PrivateRoute role="tl"><TLDashboard /></PrivateRoute>} />
          <Route path="/tl/courses" element={<PrivateRoute role="tl"><TLCourses /></PrivateRoute>} />
          <Route path="/tl/courses/create" element={<PrivateRoute role="tl"><CreateCourse /></PrivateRoute>} />
          <Route path="/tl/courses/:id" element={<PrivateRoute role="tl"><CourseDetail /></PrivateRoute>} />
          <Route path="/tl/packages/:id" element={<PrivateRoute role="tl"><TLPackageDetail /></PrivateRoute>} />
          <Route path="/tl/groups" element={<PrivateRoute role="tl"><TLGroups /></PrivateRoute>} />
          <Route path="/tl/stats" element={<PrivateRoute role="tl"><TLStats /></PrivateRoute>} />
          <Route
            path="/consultant"
            element={
              <PrivateRoute role="consultant">
                <ConsultantLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ConsultantDashboard />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:id" element={<CourseDetailPage />} />
            <Route path="groupe" element={<ConsultantGroupe />} />
            <Route path="statistique" element={<ConsultantStatistique />} />
            <Route path="profile" element={<ConsultantProfile />} />
          </Route>
          <Route path="/tl/profile" element={<PrivateRoute role="tl"><ProfileTL /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
