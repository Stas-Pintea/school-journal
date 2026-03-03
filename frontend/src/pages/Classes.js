import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';

function Classes() {
  const { ready, user } = useAuth();
  const { language, t } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classMetrics, setClassMetrics] = useState({});
  const [error, setError] = useState('');

  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const [name, setName] = useState('');
  const [subjectIds, setSubjectIds] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const total = useMemo(() => classes.length, [classes]);
  const overallPerfLabel = t('classes.overallPerformance');
  const totalAbsencesLabel = t('classes.totalAbsences');

  const formatAvg = (x) => {
    const n = Number(x);
    if (!Number.isFinite(n)) return '-';
    const s = (Math.round(n * 100) / 100).toFixed(2);
    return s.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  };

  const studentsCountByClass = useMemo(() => {
    const map = {};
    for (const s of students) {
      const cid = s.class?._id;
      if (!cid) continue;
      map[cid] = (map[cid] || 0) + 1;
    }
    return map;
  }, [students]);

  const onSort = (field) => {
    if (sortBy === field) setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sortedClasses = useMemo(() => {
    const arr = [...classes];

    arr.sort((a, b) => {
      let cmp = 0;

      if (sortBy === 'name') {
        const an = (a.name ?? '').toString();
        const bn = (b.name ?? '').toString();
        cmp = an.localeCompare(bn, language, { numeric: true, sensitivity: 'base' });
      }

      if (sortBy === 'students') {
        const ac = studentsCountByClass[a._id] || 0;
        const bc = studentsCountByClass[b._id] || 0;
        cmp = ac - bc;
      }

      if (sortBy === 'overallPerformance') {
        const ac = Number(classMetrics?.[a._id]?.overallPerformance);
        const bc = Number(classMetrics?.[b._id]?.overallPerformance);
        const av = Number.isFinite(ac) ? ac : -1;
        const bv = Number.isFinite(bc) ? bc : -1;
        cmp = av - bv;
      }

      if (sortBy === 'totalAbsences') {
        const ac = Number(classMetrics?.[a._id]?.totalAbsences) || 0;
        const bc = Number(classMetrics?.[b._id]?.totalAbsences) || 0;
        cmp = ac - bc;
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return arr;
  }, [classes, sortBy, sortDir, studentsCountByClass, language, classMetrics]);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [classesRes, studentsRes, subjectsRes, yearRes] = await Promise.all([
        api.get('/classes'),
        api.get('/students'),
        api.get('/subjects'),
        api.get('/system-settings/academic-year').catch(() => ({ data: null })),
      ]);

      const classesData = classesRes.data || [];
      const studentsData = studentsRes.data || [];
      const subjectsData = subjectsRes.data || [];
      setClasses(classesData);
      setStudents(studentsData);
      setSubjects(subjectsData);

      const firstSemesterYear = Number(yearRes?.data?.firstSemesterYear);
      const secondSemesterYear = Number(yearRes?.data?.secondSemesterYear);
      const period =
        Number.isInteger(firstSemesterYear) && Number.isInteger(secondSemesterYear)
          ? `${firstSemesterYear}-${secondSemesterYear}`
          : '';
      const metricsRes = await api.get('/classes/metrics', period ? { params: { period } } : undefined);
      setClassMetrics(metricsRes?.data?.metrics || {});
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : t('common.networkError'));
      setError(msg);
    }
  }, [t]);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const resetForm = () => {
    setName('');
    setSubjectIds([]);
  };

  const toggleSubject = (subjectId) => {
    setSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const createClass = async () => {
    if (!isAdmin) return;
    if (!name.trim()) return alert(t('classes.nameRequired'));

    await api.post('/classes', {
      name: name.trim(),
      subjects: subjectIds,
    });

    resetForm();
    loadData();
  };

  const deleteClass = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm(t('classes.deleteConfirm'))) return;
    await api.delete(`/classes/${id}`);
    loadData();
  };

  const exportClasses = async () => {
    if (!classes.length || isExporting) return;

    try {
      setIsExporting(true);
      const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
        import('exceljs'),
        import('file-saver'),
      ]);

      const ayRes = await api.get('/system-settings/academic-year').catch(() => ({ data: null }));
      const firstSemesterYear = Number(ayRes?.data?.firstSemesterYear);
      const secondSemesterYear = Number(ayRes?.data?.secondSemesterYear);
      const period =
        Number.isInteger(firstSemesterYear) && Number.isInteger(secondSemesterYear)
          ? `${firstSemesterYear}-${secondSemesterYear}`
          : '';
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'School Journal';
      workbook.created = new Date();
      const subjectsById = new Map(subjects.map((s) => [String(s._id), s]));

      const summaryRows = [
        ['Nr', 'ID clasa', 'Clasa', 'Elevi', 'Materii', 'Perioada'],
      ];

      const safeSheetName = (name, idx) => {
        const raw = String(name || `Class ${idx + 1}`).replace(/[:\\/?*[\]]/g, ' ');
        return raw.length > 31 ? raw.slice(0, 31) : raw;
      };

      const fmtAvg = (x) => {
        if (x === '' || x === null || x === undefined) return '';
        const n = Number(x);
        if (!Number.isFinite(n)) return '';
        const s = (Math.round(n * 100) / 100).toFixed(2);
        return s.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
      };

      const computeSemesterAvg = (taskIds, taskGradeMap) => {
        let sum = 0;
        let count = 0;
        for (const tid of taskIds) {
          const v = taskGradeMap.get(String(tid));
          if (v === '' || v === null || v === undefined) continue;
          const n = Number(v);
          sum += Number.isFinite(n) && n >= 1 && n <= 10 ? n : 0;
          count += 1;
        }
        if (count < 3) return '';
        return sum / count;
      };

      for (let idx = 0; idx < classes.length; idx += 1) {
        const cls = classes[idx];
        const classId = String(cls?._id || '');
        const classStudents = students
          .filter((s) => String(s?.class?._id || s?.class || '') === classId)
          .sort((a, b) => String(a?.fullName || '').localeCompare(String(b?.fullName || ''), language, { sensitivity: 'base' }));

        const classSubjectIds = Array.isArray(cls?.subjects)
          ? cls.subjects.map((item) => (typeof item === 'object' ? String(item?._id || '') : String(item))).filter(Boolean)
          : [];

        const classSubjects = classSubjectIds
          .map((sid) => {
            const fromList = subjectsById.get(sid);
            const fromClassPayload = Array.isArray(cls?.subjects)
              ? cls.subjects.find((item) => typeof item === 'object' && String(item?._id || '') === sid)
              : null;
            return fromList || fromClassPayload || { _id: sid, name: sid };
          })
          .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), language, { sensitivity: 'base' }));

        summaryRows.push([
          idx + 1,
          classId,
          cls?.name || '',
          classStudents.length,
          classSubjects.length,
          period || '',
        ]);

        const subjectPayloads = await Promise.all(
          classSubjects.map(async (subj) => {
            const subjectId = String(subj?._id || '');
            const [tasksRes, gradesRes] = await Promise.all([
              api.get('/tasks', { params: { classId, subjectId, ...(period ? { period } : {}) } }),
              api.get('/grades', { params: { classId, subjectId, ...(period ? { period } : {}) } }),
            ]);

            const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
            const grades = Array.isArray(gradesRes.data) ? gradesRes.data : [];

            const sem1Tasks = tasks
              .filter((t) => Number(t?.semester) === 1)
              .sort((a, b) => String(a?.dateIso || '').localeCompare(String(b?.dateIso || '')));
            const sem2Tasks = tasks
              .filter((t) => Number(t?.semester) === 2)
              .sort((a, b) => String(a?.dateIso || '').localeCompare(String(b?.dateIso || '')));

            const taskIdsSet = new Set(tasks.map((t) => String(t?._id || '')));
            const taskGradesByStudent = new Map();
            const examByStudent = new Map();

            for (const g of grades) {
              const sid = String(g?.student?._id || g?.student || '');
              if (!sid) continue;

              if (g?.kind === 'task' && g?.task) {
                const tid = String(g?.task?._id || g?.task || '');
                if (!taskIdsSet.has(tid)) continue;
                if (!taskGradesByStudent.has(sid)) taskGradesByStudent.set(sid, new Map());
                taskGradesByStudent.get(sid).set(tid, g?.value ?? '');
                continue;
              }

              if (g?.kind === 'exam' && String(g?.period || '') === String(period || '')) {
                examByStudent.set(sid, g?.value ?? '');
              }
            }

            return {
              subjectId,
              subjectName: subj?.name || '',
              sem1Tasks,
              sem2Tasks,
              allTasks: tasks.sort((a, b) => String(a?.dateIso || '').localeCompare(String(b?.dateIso || ''))),
              taskGradesByStudent,
              examByStudent,
            };
          })
        );

        const headerTop = ['#', 'ID elev', 'Elev'];
        const headerMid = ['', '', ''];
        const headerLow = ['', '', ''];
        const merges = [
          { s: { r: 0, c: 0 }, e: { r: 2, c: 0 } },
          { s: { r: 0, c: 1 }, e: { r: 2, c: 1 } },
          { s: { r: 0, c: 2 }, e: { r: 2, c: 2 } },
        ];

        let currentCol = 3;
        const subjectColumnMeta = [];

        for (const payload of subjectPayloads) {
          const sem1Tasks = payload.sem1Tasks;
          const sem2Tasks = payload.sem2Tasks;
          const sem1Count = Math.max(sem1Tasks.length, 1);
          const sem2Count = Math.max(sem2Tasks.length, 1);
          const blockWidth = sem1Count + 1 + sem2Count + 1 + 1 + 1;
          const start = currentCol;
          const sem1Start = start;
          const sem1Total = sem1Start + sem1Count;
          const sem2Start = sem1Total + 1;
          const sem2Total = sem2Start + sem2Count;
          const examCol = sem2Total + 1;
          const yearCol = sem2Total + 2;

          merges.push({ s: { r: 0, c: start }, e: { r: 0, c: start + blockWidth - 1 } });
          merges.push({ s: { r: 1, c: sem1Start }, e: { r: 1, c: sem1Total } });
          merges.push({ s: { r: 1, c: sem2Start }, e: { r: 1, c: sem2Total } });
          merges.push({ s: { r: 1, c: examCol }, e: { r: 2, c: examCol } });
          merges.push({ s: { r: 1, c: yearCol }, e: { r: 2, c: yearCol } });

          headerTop.push(payload.subjectName);
          for (let i = 1; i < blockWidth; i += 1) headerTop.push('');

          headerMid.push('Semestrul 1');
          for (let i = 0; i < sem1Count; i += 1) headerMid.push('');
          headerMid.push('Semestrul 2');
          for (let i = 0; i < sem2Count; i += 1) headerMid.push('');
          headerMid.push('Examen');
          headerMid.push('Anual');

          for (let i = 0; i < sem1Count; i += 1) headerLow.push(`Z${i + 1}`);
          headerLow.push('Total');
          for (let i = 0; i < sem2Count; i += 1) headerLow.push(`Z${i + 1}`);
          headerLow.push('Total');
          headerLow.push('Examen');
          headerLow.push('Anual');

          subjectColumnMeta.push({
            subjectId: payload.subjectId,
            sem1Tasks,
            sem2Tasks,
            sem1Count,
            sem2Count,
            examCol,
            yearCol,
          });

          currentCol += blockWidth;
        }

        const performanceRows = classStudents.map((st, studentIndex) => {
          const row = [studentIndex + 1, String(st?._id || ''), st?.fullName || ''];

          for (const meta of subjectColumnMeta) {
            const payload = subjectPayloads.find((p) => p.subjectId === meta.subjectId);
            const studentTaskMap = payload?.taskGradesByStudent.get(String(st?._id || '')) || new Map();

            for (let i = 0; i < meta.sem1Count; i += 1) {
              const t = meta.sem1Tasks[i];
              row.push(t ? (studentTaskMap.get(String(t._id)) ?? '') : '');
            }

            const sem1Avg = computeSemesterAvg(meta.sem1Tasks.map((t) => String(t._id)), studentTaskMap);
            row.push(fmtAvg(sem1Avg));

            for (let i = 0; i < meta.sem2Count; i += 1) {
              const t = meta.sem2Tasks[i];
              row.push(t ? (studentTaskMap.get(String(t._id)) ?? '') : '');
            }

            const sem2Avg = computeSemesterAvg(meta.sem2Tasks.map((t) => String(t._id)), studentTaskMap);
            row.push(fmtAvg(sem2Avg));

            const examVal = payload?.examByStudent.get(String(st?._id || '')) ?? '';
            row.push(examVal);

            const examNum = Number(examVal);
            const s1Num = Number(sem1Avg);
            const s2Num = Number(sem2Avg);
            const year =
              Number.isFinite(examNum) && Number.isFinite(s1Num) && Number.isFinite(s2Num)
                ? (examNum + s1Num + s2Num) / 3
                : '';
            row.push(fmtAvg(year));
          }

          return row;
        });

        const taskDetailsRows = [];
        for (const payload of subjectPayloads) {
          for (const task of payload.allTasks) {
            taskDetailsRows.push([
              payload.subjectName,
              task?.dateIso || '',
              Number(task?.semester) || '',
              task?.name || '',
              task?.description || '',
            ]);
          }
        }

        taskDetailsRows.sort((a, b) => String(a[1]).localeCompare(String(b[1])));

        const sheetRows = [
          ['Clasa', cls?.name || '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
          ['ID clasa', classId, '', '', '', '', '', '', '', '', '', '', '', '', ''],
          ['Perioada', period || '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
          [],
          ['Performanta pe materii'],
          headerTop,
          headerMid,
          headerLow,
          ...performanceRows,
          [],
          ['Sarcini semestrul 1 si 2'],
          ['Materia', 'Data', 'Semestru', 'Sarcina', 'Descriere'],
          ...taskDetailsRows,
        ];

        const sheet = workbook.addWorksheet(safeSheetName(cls?.name, idx), {
          views: [{ state: 'frozen', xSplit: 3, ySplit: 8 }],
        });
        sheetRows.forEach((r) => sheet.addRow(r));

        merges.forEach((m) => {
          sheet.mergeCells(m.s.r + 6, m.s.c + 1, m.e.r + 6, m.e.c + 1);
        });

        const thin = { style: 'thin', color: { argb: 'FF444444' } };
        const allBorder = { top: thin, left: thin, bottom: thin, right: thin };
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9F1FB' } };
        const titleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };

        sheet.getColumn(1).width = 6;
        sheet.getColumn(2).width = 26;
        sheet.getColumn(3).width = 30;
        for (let c = 4; c <= currentCol; c += 1) {
          sheet.getColumn(c).width = 8;
        }

        const perfHeaderStart = 6;
        const perfHeaderEnd = 8;
        const perfDataStart = 9;
        const perfDataEnd = 8 + performanceRows.length;
        const taskHeaderRow = 11 + performanceRows.length;
        const taskDataStart = 12 + performanceRows.length;
        const lastRow = sheet.rowCount;

        for (let r = 1; r <= lastRow; r += 1) {
          for (let c = 1; c <= currentCol; c += 1) {
            const cell = sheet.getRow(r).getCell(c);
            if (cell.value !== null && cell.value !== '') {
              cell.border = allBorder;
            }
          }
        }

        for (let r = perfHeaderStart; r <= perfHeaderEnd; r += 1) {
          const row = sheet.getRow(r);
          for (let c = 1; c <= currentCol; c += 1) {
            const cell = row.getCell(c);
            cell.font = { bold: true };
            cell.fill = headerFill;
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            if (cell.value !== null && cell.value !== '') {
              cell.border = allBorder;
            }
          }
          row.height = 22;
        }

        for (let r = perfDataStart; r <= perfDataEnd; r += 1) {
          const row = sheet.getRow(r);
          row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
          row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
          row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
          for (let c = 4; c <= currentCol; c += 1) {
            row.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
          }
        }

        sheet.getRow(5).getCell(1).font = { bold: true, size: 12 };
        sheet.getRow(5).getCell(1).fill = titleFill;
        sheet.getRow(10 + performanceRows.length).getCell(1).font = { bold: true, size: 12 };
        sheet.getRow(10 + performanceRows.length).getCell(1).fill = titleFill;

        const taskHeader = sheet.getRow(taskHeaderRow);
        for (let c = 1; c <= 5; c += 1) {
          const cell = taskHeader.getCell(c);
          cell.font = { bold: true };
          cell.fill = headerFill;
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = allBorder;
        }
        sheet.getColumn(4).width = 28;
        sheet.getColumn(5).width = 44;

        for (let r = taskDataStart; r <= lastRow; r += 1) {
          sheet.getRow(r).getCell(1).alignment = { vertical: 'top', horizontal: 'left' };
          sheet.getRow(r).getCell(2).alignment = { vertical: 'top', horizontal: 'center' };
          sheet.getRow(r).getCell(3).alignment = { vertical: 'top', horizontal: 'center' };
          sheet.getRow(r).getCell(4).alignment = { vertical: 'top', horizontal: 'left' };
          sheet.getRow(r).getCell(5).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        }
      }

      const summarySheet = workbook.addWorksheet('Clase');
      summaryRows.forEach((r) => summarySheet.addRow(r));
      summarySheet.columns = [
        { width: 6 },
        { width: 28 },
        { width: 20 },
        { width: 10 },
        { width: 10 },
        { width: 14 },
      ];
      const thin = { style: 'thin', color: { argb: 'FF444444' } };
      const allBorder = { top: thin, left: thin, bottom: thin, right: thin };
      summarySheet.getRow(1).font = { bold: true };
      summarySheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
      summarySheet.getRow(1).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9F1FB' } };
        cell.border = allBorder;
      });
      for (let r = 2; r <= summarySheet.rowCount; r += 1) {
        for (let c = 1; c <= 6; c += 1) {
          const cell = summarySheet.getRow(r).getCell(c);
          if (cell.value !== null && cell.value !== '') {
            cell.border = allBorder;
          }
          cell.alignment = { vertical: 'middle', horizontal: c <= 2 ? 'left' : 'center' };
        }
      }

      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `export-clase-${stamp}.xlsx`
      );
    } catch (e) {
      const msg = e.response?.data?.message || e.message || t('common.networkError');
      setError(msg);
    } finally {
      setIsExporting(false);
    }
  };

  if (!ready) return <div className="container py-4 text-muted">{t('common.loading')}</div>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-0">
            <i className="fas fa-book me-1"></i>{t('classes.title')}
          </h1>
          <div className="text-muted">{t('classes.total', { count: total })}</div>
        </div>

        {isAdmin && (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-success" onClick={exportClasses} disabled={classes.length === 0 || isExporting}>
              <i className="fa-solid fa-file-excel me-1"></i>
              {isExporting ? 'Export...' : (t('classes.export') === 'classes.export' ? 'Export' : t('classes.export'))}
            </button>
            <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addClassModal" onClick={resetForm}>
              {t('classes.add')}
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table table-bordered align-middle table-hover">
          <thead>
            <tr>
              <th role="button" className="user-select-none" onClick={() => onSort('name')}>
                {t('classes.name')}
                {sortBy === 'name' && (
                  <i className={`fa-solid ms-2 ${sortDir === 'asc' ? 'fa-arrow-up-a-z' : 'fa-arrow-down-z-a'}`}></i>
                )}
              </th>

              <th
                role="button"
                className="text-center user-select-none"
                style={{ width: 1, whiteSpace: 'nowrap' }}
                onClick={() => onSort('overallPerformance')}
              >
                {overallPerfLabel}
                {sortBy === 'overallPerformance' && (
                  <i className={`fa-solid ms-2 ${sortDir === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'}`}></i>
                )}
              </th>

              <th
                role="button"
                className="text-center user-select-none"
                style={{ width: 1, whiteSpace: 'nowrap' }}
                onClick={() => onSort('totalAbsences')}
              >
                {totalAbsencesLabel}
                {sortBy === 'totalAbsences' && (
                  <i className={`fa-solid ms-2 ${sortDir === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'}`}></i>
                )}
              </th>

              <th role="button" className="text-center user-select-none" style={{ width: 1, whiteSpace: 'nowrap' }} onClick={() => onSort('students')}>
                {t('classes.students')}
                {sortBy === 'students' && (
                  <i className={`fa-solid ms-2 ${sortDir === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'}`}></i>
                )}
              </th>

              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>{t('classes.actions')}</th>
            </tr>
          </thead>

          <tbody>
            {sortedClasses.map((cls) => (
              <tr key={cls._id}>
                <td>
                  <i className="fas fa-book me-1 text-muted"></i>
                  {cls.name}
                </td>

                <td className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                  {formatAvg(classMetrics?.[cls._id]?.overallPerformance)}
                </td>

                <td className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                  {classMetrics?.[cls._id]?.totalAbsences ?? 0}
                </td>

                <td className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                  {studentsCountByClass[cls._id] || 0}
                </td>

                <td className="text-end">
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-1">
                    <Link to={`/classes/${cls._id}`} className="btn btn-outline-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                      <i className="fa-solid fa-eye me-1"></i>{t('teacherCommon.open')}
                    </Link>

                    {isAdmin && (
                      <Link to={`/classes/${cls._id}/edit`} className="btn btn-outline-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                        <i className="fa-solid fa-pen me-1"></i>{t('teacherCommon.edit')}
                      </Link>
                    )}

                    {isAdmin && (
                      <button className="btn btn-danger btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => deleteClass(cls._id)}>
                        <i className="fa-solid fa-xmark me-1"></i>{t('teacherCommon.delete')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {classes.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  {t('classes.none')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="modal fade" id="addClassModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('classes.addTitle')}</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={resetForm}></button>
              </div>

              <div className="modal-body">
                <label className="form-label">{t('classes.nameLabel')}</label>
                <input className="form-control" placeholder={t('classes.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />

                <div className="mt-3">
                  <label className="form-label">{t('classes.subjects')}</label>
                  <div className="border rounded p-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {subjects.map((s) => (
                      <div className="form-check" key={s._id}>
                        <input
                          id={`add-class-subject-${s._id}`}
                          className="form-check-input"
                          type="checkbox"
                          checked={subjectIds.includes(s._id)}
                          onChange={() => toggleSubject(s._id)}
                        />
                        <label className="form-check-label" htmlFor={`add-class-subject-${s._id}`}>
                          {s.name}
                        </label>
                      </div>
                    ))}
                    {subjects.length === 0 && (
                      <div className="text-muted" style={{ fontSize: 14 }}>
                        -
                      </div>
                    )}
                  </div>
                  <div className="text-muted mt-1" style={{ fontSize: 14 }}>
                    {t('classes.subjectsHint')}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal" onClick={resetForm}>
                  {t('teacherCommon.cancel')}
                </button>
                <button type="button" className="btn btn-primary" onClick={createClass} data-bs-dismiss="modal">
                  {t('teacherCommon.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Classes;
