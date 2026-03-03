import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import './App.css';

import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Subjects from './pages/Subjects';
import Assignments from './pages/Assignments';
import StudentView from './pages/StudentView';
import StudentEdit from './pages/StudentEdit';
import TeacherView from './pages/TeacherView';
import TeacherEdit from './pages/TeacherEdit';
import ClassView from './pages/ClassView';
import ClassEdit from './pages/ClassEdit';
import SubjectView from './pages/SubjectView';
import SubjectEdit from './pages/SubjectEdit';
import AssignmentView from './pages/AssignmentView';
import AssignmentEdit from './pages/AssignmentEdit';
import Journal from './pages/Journal';
import AcademicCalendar from './pages/AcademicCalendar';

// ✅ добавь
import Login from './pages/Login';
import ProtectedRoute from './auth/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <>
      <Navbar />

      <div className={isLoginPage ? '' : 'mt-4'}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <Classes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <ProtectedRoute>
                <Teachers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <Subjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments"
            element={
              <ProtectedRoute>
                <Assignments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students/:id"
            element={
              <ProtectedRoute>
                <StudentView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:id/edit"
            element={
              <ProtectedRoute roles={['ADMIN', 'DEPUTY_ADMIN']}>
                <StudentEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teachers/:id"
            element={
              <ProtectedRoute>
                <TeacherView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers/:id/edit"
            element={
              <ProtectedRoute>
                <TeacherEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/classes/:id"
            element={
              <ProtectedRoute>
                <ClassView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/:id/edit"
            element={
              <ProtectedRoute roles={['ADMIN', 'DEPUTY_ADMIN']}>
                <ClassEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/subjects/:id"
            element={
              <ProtectedRoute>
                <SubjectView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:id/edit"
            element={
              <ProtectedRoute roles={['ADMIN', 'DEPUTY_ADMIN']}>
                <SubjectEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments/:id"
            element={
              <ProtectedRoute>
                <AssignmentView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments/:id/edit"
            element={
              <ProtectedRoute roles={['ADMIN', 'DEPUTY_ADMIN']}>
                <AssignmentEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/journal/:classId/:subjectId"
            element={
              <ProtectedRoute>
                <Journal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/academic-calendar"
            element={
              <ProtectedRoute>
                <AcademicCalendar />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
