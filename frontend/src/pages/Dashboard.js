import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [data, setData] = useState({
    classes: [],
    students: [],
    teachers: [],
    subjects: [],
    assignments: []
  });

  const [error, setError] = useState('');

  const stats = useMemo(() => {
    const totalHours = (data.assignments || []).reduce(
      (sum, a) => sum + (Number(a.hours) || 0),
      0
    );

    return {
      classes: data.classes.length,
      students: data.students.length,
      teachers: data.teachers.length,
      subjects: data.subjects.length,
      assignments: data.assignments.length,
      totalHours
    };
  }, [data]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setError('');

        const [classesRes, studentsRes, teachersRes, subjectsRes, assignmentsRes] =
          await Promise.all([
            api.get('/classes'),
            api.get('/students'),
            api.get('/teachers'),
            api.get('/subjects'),
            api.get('/assignments')
          ]);

        setData({
          classes: classesRes.data,
          students: studentsRes.data,
          teachers: teachersRes.data,
          subjects: subjectsRes.data,
          assignments: assignmentsRes.data
        });
      } catch (e) {
        setError('Не удалось загрузить статистику. Проверь, что backend запущен.');
      }
    };

    loadStats();
  }, []);

  return (
    <div className="container">
      <h1 className="mb-3">Школьная система</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row g-3">
        <StatCard title="Классы" value={stats.classes} icon="fa-book" to="/classes" />
        <StatCard title="Ученики" value={stats.students} icon="fa-user-graduate" to="/students" />
        <StatCard title="Учителя" value={stats.teachers} icon="fa-chalkboard-teacher" to="/teachers" />
        <StatCard title="Предметы" value={stats.subjects} icon="fa-book-open" to="/subjects" />
        <StatCard title="Назначения" value={stats.assignments} icon="fa-link" to="/assignments" />
        <StatCard title="Всего часов" value={stats.totalHours} icon="fa-clock" to="/assignments" />
        <StatCard
          title="Учебный календарь"
          value="Открыть"
          icon="fa-calendar-alt"
          to="/academic-calendar"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, to }) {
  return (
    <div className="col-12 col-sm-6 col-lg-4">
      <div className="card text-center h-100">
        <div className="card-body">
          <i className={`fas ${icon} fa-2x mb-2`}></i>
          <h5 className="mb-1">{title}</h5>

          {to ? (
            <Link
              to={to}
              className="text-decoration-none"
            >
              <h3 className="mb-0">{value}</h3>
            </Link>
          ) : (
            <h3 className="mb-0">{value}</h3>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;