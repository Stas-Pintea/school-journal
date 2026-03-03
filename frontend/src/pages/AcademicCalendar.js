import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';

function getAcademicYears() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const startYear = m >= 8 ? y : y - 1;
  return { startYear, nextYear: startYear + 1 };
}

const MONTHS = {
  ru: ['\u042f\u043d\u0432\u0430\u0440\u044c', '\u0424\u0435\u0432\u0440\u0430\u043b\u044c', '\u041c\u0430\u0440\u0442', '\u0410\u043f\u0440\u0435\u043b\u044c', '\u041c\u0430\u0439', '\u0418\u044e\u043d\u044c', '\u0418\u044e\u043b\u044c', '\u0410\u0432\u0433\u0443\u0441\u0442', '\u0421\u0435\u043d\u0442\u044f\u0431\u0440\u044c', '\u041e\u043a\u0442\u044f\u0431\u0440\u044c', '\u041d\u043e\u044f\u0431\u0440\u044c', '\u0414\u0435\u043a\u0430\u0431\u0440\u044c'],
  ro: ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'],
};

const WEEKDAYS = {
  ru: ['\u041f\u043d', '\u0412\u0442', '\u0421\u0440', '\u0427\u0442', '\u041f\u0442', '\u0421\u0431', '\u0412\u0441'],
  ro: ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa', 'Du'],
};

function toISODateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function clampRange(startIso, endIso) {
  if (!startIso) return { startIso: '', endIso: '' };
  if (!endIso) return { startIso, endIso: startIso };
  return startIso <= endIso ? { startIso, endIso } : { startIso: endIso, endIso: startIso };
}

function isIsoBetween(iso, startIso, endIso) {
  return iso >= startIso && iso <= endIso;
}

function buildMonthMatrix(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const jsDay = first.getDay();
  const mondayIndex = (jsDay + 6) % 7;

  const cells = [];
  for (let i = 0; i < mondayIndex; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIndex, d));

  while (cells.length < 42) cells.push(null);
  cells.length = 42;

  const weeks = [];
  for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function MonthCard({ year, monthIndex, events, monthNames, weekdayNames }) {
  const weeks = useMemo(() => buildMonthMatrix(year, monthIndex), [year, monthIndex]);

  const getEventTitlesForDay = (iso) => {
    const titles = [];
    for (const ev of events) {
      if (isIsoBetween(iso, ev.startIso, ev.endIso)) titles.push(ev.title);
    }
    return titles;
  };

  return (
    <div className="card shadow-sm h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="fw-bold">
            {monthNames[monthIndex]} {year}
          </div>
        </div>

        <div className="table-responsive flex-grow-1">
          <table className="table table-bordered align-middle mb-0 ac-cal-table" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {weekdayNames.map((w) => (
                  <th key={w} className="text-center small text-secondary" style={{ width: '14.285%' }}>
                    {w}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((dateObj, di) => {
                    if (!dateObj) return <td key={di} className="bg-light-subtle" />;

                    const iso = toISODateLocal(dateObj);
                    const isSunday = dateObj.getDay() === 0;

                    const titles = getEventTitlesForDay(iso);
                    const holiday = titles.length > 0;

                    const bg = holiday ? 'bg-danger text-white' : isSunday ? 'bg-warning-subtle' : '';

                    return (
                      <td key={di} className={bg} style={{ cursor: 'default' }} title={holiday ? `${iso}\n${titles.join('\n')}` : iso}>
                        <div className="ac-day">{dateObj.getDate()}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AcademicCalendar() {
  const { ready, user } = useAuth();
  const { language, t } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';

  const monthNames = MONTHS[language] || MONTHS.ru;
  const weekdayNames = WEEKDAYS[language] || WEEKDAYS.ru;

  const defaults = useMemo(() => getAcademicYears(), []);
  const [startYear, setStartYear] = useState(defaults.startYear);
  const [nextYear, setNextYear] = useState(defaults.nextYear);
  const semSummaryLabel =
    language === 'ro'
      ? `Semestrul I: Septembrie-Decembrie ${startYear} | Semestrul II: Ianuarie-Mai ${nextYear}`
      : `I \u0441\u0435\u043c\u0435\u0441\u0442\u0440: \u0421\u0435\u043d\u0442\u044f\u0431\u0440\u044c-\u0414\u0435\u043a\u0430\u0431\u0440\u044c ${startYear} | II \u0441\u0435\u043c\u0435\u0441\u0442\u0440: \u042f\u043d\u0432\u0430\u0440\u044c-\u041c\u0430\u0439 ${nextYear}`;
  const [firstYearInput, setFirstYearInput] = useState(String(defaults.startYear));
  const [savingAcademicYear, setSavingAcademicYear] = useState(false);

  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('range');
  const [startIso, setStartIso] = useState('');
  const [endIso, setEndIso] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      setError('');
      const [eventsRes, ayRes] = await Promise.all([
        api.get('/calendar-events'),
        api.get('/system-settings/academic-year').catch(() => ({ data: null })),
      ]);
      setEvents(eventsRes.data);
      const first = Number(ayRes?.data?.firstSemesterYear || defaults.startYear);
      const second = Number(ayRes?.data?.secondSemesterYear || defaults.nextYear);
      setStartYear(first);
      setNextYear(second);
      setFirstYearInput(String(first));
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.status ? `HTTP ${e.response.status}` : t('dashboard.networkError'));
      setError(t('calendar.loadFailed', { msg }));
    }
  }, [t, defaults.startYear, defaults.nextYear]);

  useEffect(() => {
    if (!ready) return;
    loadEvents();
  }, [ready, loadEvents]);

  const months = useMemo(() => {
    const first = [
      { year: startYear, monthIndex: 8 },
      { year: startYear, monthIndex: 9 },
      { year: startYear, monthIndex: 10 },
      { year: startYear, monthIndex: 11 },
    ];
    const second = [
      { year: nextYear, monthIndex: 0 },
      { year: nextYear, monthIndex: 1 },
      { year: nextYear, monthIndex: 2 },
      { year: nextYear, monthIndex: 3 },
      { year: nextYear, monthIndex: 4 },
    ];
    return { first, second };
  }, [startYear, nextYear]);

  const addEvent = async () => {
    if (!isAdmin) return;

    const trimmed = title.trim();
    if (!trimmed) {
      alert(t('calendar.nameRequired'));
      return;
    }

    if (!startIso) {
      alert(t('calendar.dateRequired'));
      return;
    }

    const normalized = mode === 'single' ? { startIso, endIso: startIso } : clampRange(startIso, endIso || startIso);

    try {
      await api.post('/calendar-events', {
        title: trimmed,
        startIso: normalized.startIso,
        endIso: normalized.endIso,
      });

      await loadEvents();

      setTitle('');
      setMode('range');
      setStartIso('');
      setEndIso('');
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.status ? `HTTP ${e.response.status}` : t('dashboard.networkError'));
      setError(t('calendar.createFailed', { msg }));
    }
  };

  const removeEvent = async (_id) => {
    if (!isAdmin) return;

    try {
      await api.delete(`/calendar-events/${_id}`);
      setEvents((prev) => prev.filter((e) => e._id !== _id));
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.status ? `HTTP ${e.response.status}` : t('dashboard.networkError'));
      setError(t('calendar.deleteFailed', { msg }));
    }
  };

  const prettyRange = (e) => {
    if (e.startIso === e.endIso) return e.startIso;
    return `${e.startIso} -> ${e.endIso}`;
  };

  const saveAcademicYear = async () => {
    if (!isAdmin) return;
    const first = Number(firstYearInput);
    if (!Number.isInteger(first)) {
      alert(language === 'ro' ? 'Anul primului semestru trebuie s\u0103 fie num\u0103r \u00eentreg' : '\u0413\u043e\u0434 \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u0441\u0435\u043c\u0435\u0441\u0442\u0440\u0430 \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u0446\u0435\u043b\u044b\u043c \u0447\u0438\u0441\u043b\u043e\u043c');
      return;
    }
    const second = first + 1;

    try {
      setSavingAcademicYear(true);
      await api.put('/system-settings/academic-year', {
        firstSemesterYear: first,
        secondSemesterYear: second,
      });
      setStartYear(first);
      setNextYear(second);
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.status ? `HTTP ${e.response.status}` : t('dashboard.networkError'));
      setError(msg);
    } finally {
      setSavingAcademicYear(false);
    }
  };

  if (!ready) return <div className="container py-4 text-muted">{t('calendar.loading')}</div>;

  return (
    <div className="container py-4 px-2 px-sm-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h3 className="mb-0">
            <i className="fas fa-calendar-alt me-1"></i>{t('calendar.title')}
          </h3>
          <div className="text-secondary small">
            {semSummaryLabel}
            <span className="badge text-bg-warning ms-2">{t('calendar.sunday')}</span>
            <span className="badge text-bg-danger ms-1">{t('calendar.holiday')}</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">
            <i className="fa-solid fa-calendar-week me-2"></i>{language === 'ro' ? 'Anul academic' : '\u0423\u0447\u0435\u0431\u043d\u044b\u0439 \u0433\u043e\u0434'}
          </h5>
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label">{language === 'ro' ? 'Anul semestrului I' : '\u0413\u043e\u0434 1-\u0433\u043e \u0441\u0435\u043c\u0435\u0441\u0442\u0440\u0430'}</label>
              <input
                className="form-control"
                type="number"
                value={firstYearInput}
                onChange={(e) => setFirstYearInput(e.target.value)}
                disabled={!isAdmin || savingAcademicYear}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">{language === 'ro' ? 'Anul semestrului II' : '\u0413\u043e\u0434 2-\u0433\u043e \u0441\u0435\u043c\u0435\u0441\u0442\u0440\u0430'}</label>
              <input className="form-control" type="number" value={Number(firstYearInput || 0) + 1} readOnly />
            </div>
            {isAdmin && (
              <div className="col-12 col-md-4">
                <button className="btn btn-primary w-100" onClick={saveAcademicYear} disabled={savingAcademicYear}>
                  {savingAcademicYear ? (language === 'ro' ? 'Se salveaz\u0103...' : '\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435...') : (language === 'ro' ? 'Salveaz\u0103' : '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <h5 className="mt-3 mb-2">{t('calendar.firstSemester')}</h5>
      <div className="ac-row ac-row-4">
        {months.first.map((m) => (
          <div key={`${m.year}-${m.monthIndex}`} className="ac-col">
            <MonthCard
              year={m.year}
              monthIndex={m.monthIndex}
              events={events}
              monthNames={monthNames}
              weekdayNames={weekdayNames}
            />
          </div>
        ))}
      </div>

      <h5 className="mt-4 mb-2">{t('calendar.secondSemester')}</h5>
      <div className="ac-row ac-row-5">
        {months.second.map((m) => (
          <div key={`${m.year}-${m.monthIndex}`} className="ac-col">
            <MonthCard
              year={m.year}
              monthIndex={m.monthIndex}
              events={events}
              monthNames={monthNames}
              weekdayNames={weekdayNames}
            />
          </div>
        ))}
      </div>

      <div className="card mt-4 shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">{t('calendar.eventsTitle')}</h5>

          {isAdmin && (
            <div className="row g-2 align-items-end">
              <div className="col-12 col-lg-4">
                <label className="form-label">{t('calendar.name')}</label>
                <input
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('calendar.eventsTitle')}
                />
              </div>

              <div className="col-12 col-lg-2">
                <label className="form-label">{t('calendar.inputType')}</label>
                <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="range">{t('calendar.range')}</option>
                  <option value="single">{t('calendar.singleDay')}</option>
                </select>
              </div>

              <div className="col-12 col-lg-3">
                <label className="form-label">{mode === 'single' ? t('calendar.date') : t('calendar.startDate')}</label>
                <input type="date" className="form-control" value={startIso} onChange={(e) => setStartIso(e.target.value)} />
              </div>

              <div className="col-12 col-lg-3">
                <label className="form-label">{t('calendar.endDate')}</label>
                <input
                  type="date"
                  className="form-control"
                  value={endIso}
                  onChange={(e) => setEndIso(e.target.value)}
                  disabled={mode === 'single'}
                />
              </div>

              <div className="col-12 d-flex gap-2 mt-2">
                <button className="btn btn-danger" onClick={addEvent}>
                  {t('calendar.add')}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setTitle('');
                    setMode('range');
                    setStartIso('');
                    setEndIso('');
                  }}
                >
                  {t('calendar.clear')}
                </button>
              </div>
            </div>
          )}

          <hr className="my-4" />

          {events.length === 0 ? (
            <div className="text-secondary">{t('calendar.noEvents')}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 50 }} className="text-center">#</th>
                    <th>{t('calendar.name')}</th>
                    <th style={{ width: 220 }}>{t('calendar.dates')}</th>
                    {isAdmin && <th style={{ width: 120 }} className="text-end">{t('calendar.actions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, index) => (
                    <tr key={e._id}>
                      <td className="text-center text-secondary">{index + 1}</td>
                      <td className="fw-semibold">{e.title}</td>
                      <td>
                        <span className="badge text-bg-danger">{prettyRange(e)}</span>
                      </td>
                      {isAdmin && (
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-danger" onClick={() => removeEvent(e._id)}>
                            {t('calendar.delete')}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="small text-secondary mt-2">{t('calendar.hint')}</div>
        </div>
      </div>
    </div>
  );
}
