import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Navbar />

      <div className="mt-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/students/:id" element={<StudentView />} />
          <Route path="/students/:id/edit" element={<StudentEdit />} />
          <Route path="/teachers/:id" element={<TeacherView />} />
          <Route path="/teachers/:id/edit" element={<TeacherEdit />} />
          <Route path="/classes/:id" element={<ClassView />} />
          <Route path="/classes/:id/edit" element={<ClassEdit />} />
          <Route path="/subjects/:id" element={<SubjectView />} />
          <Route path="/subjects/:id/edit" element={<SubjectEdit />} />
          <Route path="/assignments/:id" element={<AssignmentView />} />
          <Route path="/assignments/:id/edit" element={<AssignmentEdit />} />
          <Route path="/journal/:classId/:subjectId" element={<Journal />} />
          <Route path="/academic-calendar" element={<AcademicCalendar />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
