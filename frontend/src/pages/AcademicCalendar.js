import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

/**
 * Учебный год:
 * - 1 семестр: Sep-Dec startYear
 * - 2 семестр: Jan-May nextYear
 *
 * startYear вычисляем автоматически:
 * если сейчас Sep-Dec => startYear = текущий год
 * иначе (Jan-Aug) => startYear = текущий год - 1
 */
function getAcademicYears() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0..11
  const startYear = m >= 8 ? y : y - 1; // Sep(8)..
  return { startYear, nextYear: startYear + 1 };
}

const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// YYYY-MM-DD (локальная дата)
function toISODateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clampRange(startIso, endIso) {
  if (!startIso) return { startIso: "", endIso: "" };
  if (!endIso) return { startIso, endIso: startIso };
  return startIso <= endIso ? { startIso, endIso } : { startIso: endIso, endIso: startIso };
}

function isIsoBetween(iso, startIso, endIso) {
  return iso >= startIso && iso <= endIso;
}

function buildMonthMatrix(year, monthIndex) {
  // Всегда рисуем 6 недель (42 ячейки) чтобы все месяцы были одной высоты
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const jsDay = first.getDay(); // 0..6 (Вс..Сб)
  const mondayIndex = (jsDay + 6) % 7; // Пн=0 ... Вс=6

  const cells = [];
  for (let i = 0; i < mondayIndex; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIndex, d));

  while (cells.length < 42) cells.push(null);
  cells.length = 42;

  const weeks = [];
  for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function MonthCard({ year, monthIndex, events }) {
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
            {MONTHS_RU[monthIndex]} {year}
          </div>
        </div>

        <div className="table-responsive flex-grow-1">
          <table className="table table-bordered align-middle mb-0 ac-cal-table" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                {WEEKDAYS_RU.map((w) => (
                  <th key={w} className="text-center small text-secondary" style={{ width: "14.285%" }}>
                    {w}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((dateObj, di) => {
                    if (!dateObj) {
                      return <td key={di} className="bg-light-subtle" />;
                    }

                    const iso = toISODateLocal(dateObj);
                    const isSunday = dateObj.getDay() === 0;

                    const titles = getEventTitlesForDay(iso);
                    const holiday = titles.length > 0;

                    // Приоритет: красный (событие) выше оранжевого (воскресенье)
                    const bg =
                      holiday ? "bg-danger text-white" :
                      isSunday ? "bg-warning-subtle" :
                      "";

                    return (
                      <td
                        key={di}
                        className={bg}
                        style={{ cursor: "default" }}
                        title={holiday ? `${iso}\n${titles.join("\n")}` : iso}
                      >
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
  const { startYear, nextYear } = useMemo(() => getAcademicYears(), []);

  const [events, setEvents] = useState([]);

  // форма
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState("range"); // "single" | "range"
  const [startIso, setStartIso] = useState("");
  const [endIso, setEndIso] = useState("");

  const loadEvents = async () => {
    const res = await api.get("/calendar-events"); // baseURL уже .../api
    setEvents(res.data);
  };

  useEffect(() => {
    loadEvents();
  }, []);

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
    const trimmed = title.trim();
    if (!trimmed) {
      alert("Введите название (например: Каникулы, Праздник).");
      return;
    }

    if (!startIso) {
      alert("Выберите дату (или дату начала).");
      return;
    }

    const normalized =
      mode === "single"
        ? { startIso, endIso: startIso }
        : clampRange(startIso, endIso || startIso);

    await api.post("/calendar-events", {
      title: trimmed,
      startIso: normalized.startIso,
      endIso: normalized.endIso,
    });

    await loadEvents();

    setTitle("");
    setMode("range");
    setStartIso("");
    setEndIso("");
  };

  const removeEvent = async (_id) => {
    await api.delete(`/calendar-events/${_id}`);
    setEvents((prev) => prev.filter((e) => e._id !== _id));
  };

  const prettyRange = (e) => {
    if (e.startIso === e.endIso) return e.startIso;
    return `${e.startIso} → ${e.endIso}`;
  };

  return (
    <div className="container py-4 px-2 px-sm-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h3 className="mb-0">
            <i className="fas fa-calendar-alt me-1"></i>Учебный календарь
          </h3>
          <div className="text-secondary small">
            1 семестр: Сентябрь–Декабрь {startYear} • 2 семестр: Январь–Май {nextYear}
            <span className="badge text-bg-warning ms-2">Воскресенье</span>
            <span className="badge text-bg-danger ms-1">Праздник/Каникулы</span>
          </div>
        </div>
      </div>

      <h5 className="mt-3 mb-2">Первый семестр</h5>
      <div className="ac-row ac-row-4">
        {months.first.map((m) => (
          <div key={`${m.year}-${m.monthIndex}`} className="ac-col">
            <MonthCard year={m.year} monthIndex={m.monthIndex} events={events} />
          </div>
        ))}
      </div>

      <h5 className="mt-4 mb-2">Второй семестр</h5>
      <div className="ac-row ac-row-5">
        {months.second.map((m) => (
          <div key={`${m.year}-${m.monthIndex}`} className="ac-col">
            <MonthCard year={m.year} monthIndex={m.monthIndex} events={events} />
          </div>
        ))}
      </div>

      <div className="card mt-4 shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">Праздники / Каникулы</h5>

          <div className="row g-2 align-items-end">
            <div className="col-12 col-lg-4">
              <label className="form-label">Название</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Зимние каникулы"
              />
            </div>

            <div className="col-12 col-lg-2">
              <label className="form-label">Тип ввода</label>
              <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="range">Диапазон</option>
                <option value="single">Один день</option>
              </select>
            </div>

            <div className="col-12 col-lg-3">
              <label className="form-label">{mode === "single" ? "Дата" : "Дата начала"}</label>
              <input
                type="date"
                className="form-control"
                value={startIso}
                onChange={(e) => setStartIso(e.target.value)}
              />
            </div>

            <div className="col-12 col-lg-3">
              <label className="form-label">Дата конца</label>
              <input
                type="date"
                className="form-control"
                value={endIso}
                onChange={(e) => setEndIso(e.target.value)}
                disabled={mode === "single"}
              />
            </div>

            <div className="col-12 d-flex gap-2 mt-2">
              <button className="btn btn-danger" onClick={addEvent}>
                Добавить
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setTitle("");
                  setMode("range");
                  setStartIso("");
                  setEndIso("");
                }}
              >
                Очистить
              </button>
            </div>
          </div>

          <hr className="my-4" />

          {events.length === 0 ? (
            <div className="text-secondary">Событий пока нет.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                <tr>
                    <th style={{ width: 50 }} className="text-center">№</th>
                    <th>Название</th>
                    <th style={{ width: 220 }}>Даты</th>
                    <th style={{ width: 120 }} className="text-end">Действия</th>
                </tr>
                </thead>
                <tbody>
                  {events.map((e, index) => (
                    <tr key={e._id}>
                        <td className="text-center text-secondary">
                        {index + 1}
                        </td>
                      <td className="fw-semibold">{e.title}</td>
                      <td>
                        <span className="badge text-bg-danger">{prettyRange(e)}</span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeEvent(e._id)}>
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="small text-secondary mt-2">
            Подсказка: события теперь сохраняются в базе (MongoDB) через backend API.
          </div>
        </div>
      </div>
    </div>
  );
}
