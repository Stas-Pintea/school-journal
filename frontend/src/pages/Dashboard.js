import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';

function Dashboard() {
  const { ready } = useAuth();
  const { t, language } = useI18n();

  const [stats, setStats] = useState({
    classes: 0,
    students: 0,
    teachers: 0,
    subjects: 0,
    assignments: 0,
    totalHours: 0,
  });

  const [semester1Points, setSemester1Points] = useState([]);
  const [semester2Points, setSemester2Points] = useState([]);
  const [absenceSem1Points, setAbsenceSem1Points] = useState([]);
  const [absenceSem2Points, setAbsenceSem2Points] = useState([]);
  const [trendMode, setTrendMode] = useState('day'); // day | month
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;

    const loadStats = async () => {
      try {
        setError('');

        const ayRes = await api.get('/system-settings/academic-year').catch(() => ({ data: null }));
        const firstSemesterYear = Number(ayRes?.data?.firstSemesterYear);
        const secondSemesterYear = Number(ayRes?.data?.secondSemesterYear);
        const period = Number.isInteger(firstSemesterYear) && Number.isInteger(secondSemesterYear)
          ? `${firstSemesterYear}-${secondSemesterYear}`
          : '';

        const summaryRes = await api.get('/classes/dashboard-summary', period ? { params: { period } } : undefined);
        const payload = summaryRes?.data || {};

        const normalizeTrend = (rows) =>
          (rows || [])
            .map((p) => ({
              date: String(p?.date || p?.month || ''),
              value: Number.isFinite(Number(p?.value)) ? Number(p.value) : null,
            }))
            .filter((p) => /^\d{4}-\d{2}(-\d{2})?$/.test(p.date))
            .sort((a, b) => a.date.localeCompare(b.date));

        setStats({
          classes: Number(payload?.stats?.classes) || 0,
          students: Number(payload?.stats?.students) || 0,
          teachers: Number(payload?.stats?.teachers) || 0,
          subjects: Number(payload?.stats?.subjects) || 0,
          assignments: Number(payload?.stats?.assignments) || 0,
          totalHours: Number(payload?.stats?.totalHours) || 0,
        });

        setSemester1Points(normalizeTrend(payload?.performance?.semester1));
        setSemester2Points(normalizeTrend(payload?.performance?.semester2));
        setAbsenceSem1Points(normalizeTrend(payload?.absences?.semester1));
        setAbsenceSem2Points(normalizeTrend(payload?.absences?.semester2));
      } catch (e) {
        const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : t('dashboard.networkError'));
        setError(t('dashboard.loadFailed', { msg }));
      }
    };

    loadStats();
  }, [ready, t]);

  if (!ready) {
    return (
      <div className="container py-4">
        <div className="text-muted">{t('dashboard.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="mb-3">{t('dashboard.title')}</h1>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="row g-3">
        <StatCard title={t('dashboard.classes')} value={stats.classes} icon="fa-book" to="/classes" />
        <StatCard title={t('dashboard.students')} value={stats.students} icon="fa-user-graduate" to="/students" />
        <StatCard title={t('dashboard.teachers')} value={stats.teachers} icon="fa-chalkboard-teacher" to="/teachers" />
        <StatCard title={t('dashboard.subjects')} value={stats.subjects} icon="fa-book-open" to="/subjects" />
        <StatCard title={t('dashboard.assignments')} value={stats.assignments} icon="fa-link" to="/assignments" />
        <StatCard title={t('dashboard.totalHours')} value={stats.totalHours} icon="fa-clock" to="/assignments" />
        <StatCard title={t('dashboard.calendar')} value={t('dashboard.open')} icon="fa-calendar-alt" to="/academic-calendar" />
      </div>

      <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
        <span className="text-muted small">{t('dashboard.trendScale')}</span>
        <div className="btn-group btn-group-sm" role="group" aria-label="trend-scale">
          <button
            type="button"
            className={`btn ${trendMode === 'day' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setTrendMode('day')}
          >
            {t('dashboard.modeDay')}
          </button>
          <button
            type="button"
            className={`btn ${trendMode === 'month' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setTrendMode('month')}
          >
            {t('dashboard.modeMonth')}
          </button>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-12 col-xl-6">
          <TrendCard
            language={language}
            mode={trendMode}
            aggregation="avg"
            points={semester1Points}
            title={<><i className="fas fa-chart-line me-2" />{t('dashboard.overallPerfSem1')}</>}
            emptyLabel={t('dashboard.noDataSem1')}
          />
        </div>
        <div className="col-12 col-xl-6">
          <TrendCard
            language={language}
            mode={trendMode}
            aggregation="avg"
            points={semester2Points}
            title={<><i className="fas fa-chart-line me-2" />{t('dashboard.overallPerfSem2')}</>}
            emptyLabel={t('dashboard.noDataSem2')}
          />
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-12 col-xl-6">
          <TrendCard
            language={language}
            mode={trendMode}
            aggregation="sum"
            points={absenceSem1Points}
            title={<><i className="fas fa-user-clock me-2" />{t('dashboard.absenceSem1')}</>}
            emptyLabel={t('dashboard.noDataSem1')}
          />
        </div>
        <div className="col-12 col-xl-6">
          <TrendCard
            language={language}
            mode={trendMode}
            aggregation="sum"
            points={absenceSem2Points}
            title={<><i className="fas fa-user-clock me-2" />{t('dashboard.absenceSem2')}</>}
            emptyLabel={t('dashboard.noDataSem2')}
          />
        </div>
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
            <Link to={to} className="text-decoration-none"><h3 className="mb-0">{value}</h3></Link>
          ) : (
            <h3 className="mb-0">{value}</h3>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendCard({ title, points, emptyLabel, language, mode = 'day', aggregation = 'avg' }) {
  const pointLabel = (dateKey) => String(dateKey || '-');
  const monthLabel = useCallback((monthKey) => {
    const [y, m] = String(monthKey || '').split('-');
    const month = Number(m);
    const year = Number(y);
    if (!Number.isInteger(month) || !Number.isInteger(year)) return monthKey || '-';
    const ru = ['\u042f\u043d\u0432', '\u0424\u0435\u0432', '\u041c\u0430\u0440', '\u0410\u043f\u0440', '\u041c\u0430\u0439', '\u0418\u044e\u043d', '\u0418\u044e\u043b', '\u0410\u0432\u0433', '\u0421\u0435\u043d', '\u041e\u043a\u0442', '\u041d\u043e\u044f', '\u0414\u0435\u043a'];
    const ro = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
    const names = language === 'ro' ? ro : ru;
    return `${names[month - 1]} ${String(year).slice(-2)}`;
  }, [language]);

  const drawable = useMemo(() => {
    const dailyRows = (points || [])
      .map((p) => ({
        date: String(p?.date || ''),
        value: Number.isFinite(Number(p?.value)) && Number(p?.value) > 0 ? Number(p.value) : null,
      }))
      .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date))
      .sort((a, b) => a.date.localeCompare(b.date));

    let preparedRows = dailyRows;
    if (mode === 'month') {
      const monthMap = new Map();
      for (const r of dailyRows) {
        const monthKey = r.date.slice(0, 7);
        if (!monthMap.has(monthKey)) monthMap.set(monthKey, { sum: 0, count: 0 });
        if (r.value !== null) {
          const agg = monthMap.get(monthKey);
          agg.sum += r.value;
          agg.count += 1;
        }
      }
      preparedRows = [...monthMap.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([monthKey, agg]) => ({
          date: `${monthKey}-01`,
          value:
            agg.count > 0
              ? (aggregation === 'sum' ? agg.sum : agg.sum / agg.count)
              : null,
        }));
    }

    const rows = preparedRows.map((r, i) => ({
      i,
      ...r,
      ts: Date.parse(`${r.date}T00:00:00Z`),
    }));

    const valid = rows.filter((r) => r.value !== null);
    if (!valid.length) {
      return { rows, valid, min: 0, max: 10, pathD: '', xFor: () => 0, yFor: () => 0, monthTicks: [] };
    }

    let min = Math.min(...valid.map((r) => r.value));
    let max = Math.max(...valid.map((r) => r.value));
    if (max - min < 0.5) {
      min = Math.max(0, min - 0.5);
      max = max + 0.5;
    }
    min = Math.max(0, min - 0.2);
    max = max + 0.2;

    const w = 100;
    const h = 40;
    const validTs = rows.map((r) => r.ts).filter((v) => Number.isFinite(v));
    const minTs = validTs.length ? Math.min(...validTs) : 0;
    const maxTs = validTs.length ? Math.max(...validTs) : minTs + 1;
    const xFor = (idx) => {
      const ts = rows[idx]?.ts;
      if (!Number.isFinite(ts) || maxTs === minTs) return rows.length <= 1 ? 50 : (idx / (rows.length - 1)) * w;
      return ((ts - minTs) / (maxTs - minTs)) * w;
    };
    const yFor = (v) => {
      const n = (v - min) / (max - min || 1);
      return h - n * h;
    };

    const segments = [];
    let current = [];
    for (const r of rows) {
      if (r.value === null) {
        if (current.length) segments.push(current);
        current = [];
      } else {
        current.push({ x: xFor(r.i), y: yFor(r.value), raw: r });
      }
    }
    if (current.length) segments.push(current);

    const polylinePath = (pts) => {
      if (!pts.length) return '';
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i += 1) d += ` L ${pts[i].x} ${pts[i].y}`;
      return d;
    };

    const pathD = segments.map(polylinePath).join(' ');

    const monthTicks = [];
    const seenMonths = new Set();
    for (const r of rows) {
      const monthKey = String(r.date || '').slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(monthKey) || seenMonths.has(monthKey)) continue;
      seenMonths.add(monthKey);
      monthTicks.push({ key: monthKey, label: monthLabel(monthKey), x: xFor(r.i) });
    }

    return { rows, valid, min, max, pathD, xFor, yFor, monthTicks };
  }, [points, monthLabel, mode, aggregation]);

  return (
    <div className="card h-100">
      <div className="card-body">
        <h5 className="mb-3">{title}</h5>
        {drawable.valid.length === 0 ? (
          <div className="text-muted">{emptyLabel}</div>
        ) : (
          <div>
            <div className="border rounded p-2 bg-white">
              <svg viewBox="0 0 100 46" width="100%" height="220" role="img" aria-label={typeof title === 'string' ? title : 'trend'}>
                <line x1="0" y1="40" x2="100" y2="40" stroke="#ced4da" strokeWidth="0.4" />
                <line x1="0" y1="0" x2="0" y2="40" stroke="#ced4da" strokeWidth="0.4" />
                <path d={drawable.pathD} fill="none" stroke="#0d6efd" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" />
                {drawable.valid.map((r) => (
                  <circle key={`${r.date}-${r.i}`} cx={drawable.xFor(r.i)} cy={drawable.yFor(r.value)} r="1.2" fill="#0d6efd">
                    <title>{`${pointLabel(r.date)}: ${r.value.toFixed(2)}`}</title>
                  </circle>
                ))}
                {drawable.monthTicks.map((tick) => (
                  <text key={tick.key} x={tick.x} y="44.5" fontSize="2.5" textAnchor="middle" fill="#6c757d">
                    {tick.label}
                  </text>
                ))}
                <text x="99" y="3.5" fontSize="2.7" textAnchor="end" fill="#6c757d">{drawable.max.toFixed(2)}</text>
                <text x="99" y="39.2" fontSize="2.7" textAnchor="end" fill="#6c757d">{drawable.min.toFixed(2)}</text>
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
