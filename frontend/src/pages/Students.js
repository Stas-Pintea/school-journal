import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api, { getFileUrl } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { pickLocalI18n, studentsLocalI18n, useI18n } from '../i18n/I18nContext';

function calcAge(birthDate) {
  if (!birthDate) return '';
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function Students() {
  const { ready, user } = useAuth();
  const { language } = useI18n();
  const tr = pickLocalI18n(studentsLocalI18n, language);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';
  const [error, setError] = useState('');

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [sortBy, setSortBy] = useState('fullName');
  const [sortDir, setSortDir] = useState('asc');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchName, setSearchName] = useState(() => searchParams.get('q') || '');
  const [filterClassId, setFilterClassId] = useState(() => searchParams.get('classId') || '');
  const [filterAgeFrom, setFilterAgeFrom] = useState(() => searchParams.get('ageFrom') || '');
  const [filterAgeTo, setFilterAgeTo] = useState(() => searchParams.get('ageTo') || '');
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get('status') || '');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState(tr.active);

  const [photo, setPhoto] = useState(null);
  const photoInputRef = useRef(null);

  const emptyParent = useCallback(() => ({ fullName: '', phone: '', type: tr.mother, workplace: '' }), [tr.mother]);
  const [parents, setParents] = useState([emptyParent()]);

  const total = useMemo(() => students.length, [students]);
  const filteredCount = useMemo(() => {
    return students.filter((s) => {
      const fullNameLc = String(s.fullName || '').toLowerCase();
      const queryLc = String(searchName || '').trim().toLowerCase();
      if (queryLc && !fullNameLc.includes(queryLc)) return false;

      const sid = String(s.class?._id || s.class || '');
      if (filterClassId && sid !== filterClassId) return false;

      if (filterStatus && String(s.status || '') !== filterStatus) return false;

      const actual = Number(calcAge(s.birthDate));
      if (String(filterAgeFrom).trim() !== '') {
        const from = Number(filterAgeFrom);
        if (!Number.isFinite(from) || !Number.isFinite(actual) || actual < from) return false;
      }
      if (String(filterAgeTo).trim() !== '') {
        const to = Number(filterAgeTo);
        if (!Number.isFinite(to) || !Number.isFinite(actual) || actual > to) return false;
      }

      return true;
    }).length;
  }, [students, searchName, filterClassId, filterStatus, filterAgeFrom, filterAgeTo]);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [studentsRes, classesRes] = await Promise.all([api.get('/students'), api.get('/classes')]);
      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : tr.networkError);
      setError(msg);
    }
  }, [tr.networkError]);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  useEffect(() => {
    setStatus((prev) => (prev ? prev : tr.active));
  }, [tr.active]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (searchName.trim()) next.set('q', searchName.trim());
    if (filterClassId) next.set('classId', filterClassId);
    if (String(filterAgeFrom).trim() !== '') next.set('ageFrom', String(filterAgeFrom).trim());
    if (String(filterAgeTo).trim() !== '') next.set('ageTo', String(filterAgeTo).trim());
    if (filterStatus) next.set('status', filterStatus);
    setSearchParams(next, { replace: true });
  }, [searchName, filterClassId, filterAgeFrom, filterAgeTo, filterStatus, setSearchParams]);

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setBirthDate('');
    setClassId('');
    setStatus(tr.active);
    setPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
    setParents([emptyParent()]);
  };

  const addParent = () => setParents((prev) => [...prev, emptyParent()]);

  const removeParent = (index) => {
    setParents((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [emptyParent()];
    });
  };

  const updateParent = (index, field, value) => {
    setParents((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const onSort = (field) => {
    if (sortBy === field) setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const fullNameLc = String(s.fullName || '').toLowerCase();
      const queryLc = String(searchName || '').trim().toLowerCase();
      if (queryLc && !fullNameLc.includes(queryLc)) return false;

      const sid = String(s.class?._id || s.class || '');
      if (filterClassId && sid !== filterClassId) return false;

      if (filterStatus && String(s.status || '') !== filterStatus) return false;

      const actual = Number(calcAge(s.birthDate));
      if (String(filterAgeFrom).trim() !== '') {
        const from = Number(filterAgeFrom);
        if (!Number.isFinite(from) || !Number.isFinite(actual) || actual < from) return false;
      }
      if (String(filterAgeTo).trim() !== '') {
        const to = Number(filterAgeTo);
        if (!Number.isFinite(to) || !Number.isFinite(actual) || actual > to) return false;
      }

      return true;
    });
  }, [students, searchName, filterClassId, filterStatus, filterAgeFrom, filterAgeTo]);

  const sortedStudents = useMemo(() => {
    const arr = [...filteredStudents];

    arr.sort((a, b) => {
      let cmp = 0;

      if (sortBy === 'class') cmp = String(a.class?.name || '').localeCompare(String(b.class?.name || ''), language, { numeric: true, sensitivity: 'base' });
      if (sortBy === 'fullName') cmp = String(a.fullName || '').localeCompare(String(b.fullName || ''), language, { numeric: true, sensitivity: 'base' });
      if (sortBy === 'age') {
        const av = Number.isFinite(calcAge(a.birthDate)) ? calcAge(a.birthDate) : 9999;
        const bv = Number.isFinite(calcAge(b.birthDate)) ? calcAge(b.birthDate) : 9999;
        cmp = av - bv;
      }
      if (sortBy === 'status') cmp = String(a.status || '').localeCompare(String(b.status || ''), language, { numeric: true, sensitivity: 'base' });

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return arr;
  }, [filteredStudents, sortBy, sortDir, language]);

  const createStudent = async () => {
    if (!isAdmin) return;
    if (!fullName.trim()) return alert(tr.enterFullName);
    if (!classId) return alert(tr.chooseClass);

    const parentsPayload = parents
      .map((p) => ({
        fullName: (p.fullName || '').trim(),
        phone: (p.phone || '').trim(),
        type: p.type || tr.other,
        workplace: (p.workplace || '').trim(),
      }))
      .filter((p) => p.fullName.length > 0);

    const formData = new FormData();
    formData.append('fullName', fullName.trim());
    formData.append('phone', phone.trim());
    formData.append('email', email.trim());
    formData.append('address', address.trim());
    formData.append('birthDate', birthDate || '');
    formData.append('class', classId);
    formData.append('status', status);
    formData.append('parents', JSON.stringify(parentsPayload));
    if (photo) formData.append('photo', photo);

    try {
      await api.post('/students', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      resetForm();
      loadData();
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : tr.networkError);
      setError(tr.createFailed.replace('{msg}', msg));
    }
  };

  const deleteStudent = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm(tr.deleteConfirm)) return;
    try {
      await api.delete(`/students/${id}`);
      loadData();
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : tr.networkError);
      setError(tr.deleteFailed.replace('{msg}', msg));
    }
  };

  const parentTypes = [tr.mother, tr.father, tr.grandmother, tr.grandfather, tr.other];

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-0">
            <i className="fas fa-user-graduate me-1"></i>{tr.title}
          </h1>
          <div className="text-muted">{tr.total.replace('{count}', total)}</div>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addStudentModal">
            {tr.add}
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{tr.loadError.replace('{error}', error)}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label"><i className="fa-solid fa-magnifying-glass me-1 text-muted"></i>{tr.searchLabel}</label>
              <input
                className="form-control"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder={tr.searchPlaceholder}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label"><i className="fas fa-book me-1 text-muted"></i>{tr.class}</label>
              <select className="form-select" value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)}>
                <option value="">{tr.allClassesLabel}</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label"><i className="fa-solid fa-cake-candles me-1 text-muted"></i>{tr.ageFromLabel}</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={filterAgeFrom}
                onChange={(e) => setFilterAgeFrom(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label"><i className="fa-solid fa-cake-candles me-1 text-muted"></i>{tr.ageToLabel}</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={filterAgeTo}
                onChange={(e) => setFilterAgeTo(e.target.value)}
                placeholder="-"
              />
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label"><i className="fa-solid fa-toggle-on me-1 text-muted"></i>{tr.status}</label>
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">{tr.allStatusesLabel}</option>
                <option value={tr.active}>{tr.active}</option>
                <option value={tr.inactive}>{tr.inactive}</option>
                <option value={tr.academicLeave}>{tr.academicLeave}</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <div className="text-muted" style={{ fontSize: 14 }}>
              {tr.foundLabel.replace('{count}', filteredCount)}
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setSearchName('');
                setFilterClassId('');
                setFilterAgeFrom('');
                setFilterAgeTo('');
                setFilterStatus('');
              }}
            >
              <i className="fa-solid fa-rotate-left me-1"></i>
              {tr.clearFiltersLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle table-hover">
          <thead>
            <tr>
              <th role="button" className="text-center user-select-none" style={{ width: 1, whiteSpace: 'nowrap' }} onClick={() => onSort('class')} title={tr.sortClass}>
                <i className="fas fa-book me-1 text-muted"></i>{tr.class}
              </th>
              <th role="button" className="user-select-none" onClick={() => onSort('fullName')} title={tr.sortName}>
                <i className="fa-solid fa-user me-1 text-muted"></i>{tr.fullName}
              </th>
              <th role="button" className="text-center user-select-none" style={{ width: 1, whiteSpace: 'nowrap' }} onClick={() => onSort('age')} title={tr.sortAge}>
                <i className="fa-solid fa-cake-candles me-1 text-muted"></i>{tr.age}
              </th>
              <th role="button" className="text-center user-select-none" style={{ width: 1, whiteSpace: 'nowrap' }} onClick={() => onSort('status')} title={tr.sortStatus}>
                <i className="fa-solid fa-toggle-on me-1 text-muted"></i>{tr.status}
              </th>
              <th className="text-center" style={{ width: 1, whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-gear me-1 text-muted"></i>{tr.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((s) => (
              <tr key={s._id}>
                <td className="text-center">{s.class ? <b><Link to={`/classes/${s.class._id}`} className="text-decoration-none">{s.class.name}</Link></b> : '-'}</td>
                <td>
                  {s.photo ? (
                    <img src={getFileUrl(s.photo)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '10%', marginRight: 10, verticalAlign: 'middle' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '10%', background: '#eee', color: '#bbb', marginRight: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle' }}>
                      <i className="fas fa-user-graduate"></i>
                    </div>
                  )}
                  {s.fullName}
                </td>
                <td className="text-center">{calcAge(s.birthDate) || '-'}</td>
                <td className="text-center">{s.status || '-'}</td>
                <td className="text-end">
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-1">
                    <Link to={`/students/${s._id}`} className="btn btn-outline-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                      <i className="fa-solid fa-eye me-1"></i>{tr.open}
                    </Link>
                    {isAdmin && (
                      <Link to={`/students/${s._id}/edit`} className="btn btn-outline-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                        <i className="fa-solid fa-pen me-1"></i>{tr.edit}
                      </Link>
                    )}
                    {isAdmin && (
                      <button className="btn btn-danger btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => deleteStudent(s._id)}>
                        <i className="fa-solid fa-xmark me-1"></i>{tr.delete}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {sortedStudents.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted">{tr.none}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="modal fade" id="addStudentModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{tr.addTitle}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={resetForm}></button>
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label"><i className="fa-solid fa-user me-1 text-muted"></i>{tr.fullNameRequired}</label>
                  <input className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={tr.fullNamePh} disabled={!isAdmin} />
                </div>

                <div className="col-md-6">
                  <label className="form-label"><i className="fas fa-book me-1 text-muted"></i>{tr.classRequired}</label>
                  <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!isAdmin}>
                    <option value="">{tr.chooseClass}</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label"><i className="fa-solid fa-image me-1 text-muted"></i>{tr.photo}</label>
                  <input ref={photoInputRef} type="file" className="form-control" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} disabled={!isAdmin} />
                </div>

                <div className="col-md-6">
                  <label className="form-label"><i className="fa-solid fa-toggle-on me-1 text-muted"></i>{tr.status}</label>
                  <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} disabled={!isAdmin}>
                    <option value={tr.active}>{tr.active}</option>
                    <option value={tr.inactive}>{tr.inactive}</option>
                    <option value={tr.academicLeave}>{tr.academicLeave}</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label"><i className="fa-solid fa-calendar-day me-1 text-muted"></i>{tr.birthDate}</label>
                  <input type="date" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={!isAdmin} />
                </div>

                <div className="col-md-4">
                  <label className="form-label"><i className="fa-solid fa-phone me-1 text-muted"></i>{tr.phone}</label>
                  <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+373..." disabled={!isAdmin} />
                </div>

                <div className="col-md-4">
                  <label className="form-label"><i className="fa-solid fa-envelope me-1 text-muted"></i>Email</label>
                  <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@example.com" disabled={!isAdmin} />
                </div>

                <div className="col-md-12">
                  <label className="form-label"><i className="fa-solid fa-location-dot me-1 text-muted"></i>{tr.address}</label>
                  <input className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} disabled={!isAdmin} />
                </div>

                <div className="col-12">
                  <hr />
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0"><i className="fa-solid fa-people-roof me-1 text-muted"></i>{tr.parents}</h6>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={addParent} disabled={!isAdmin}>{tr.addParent}</button>
                  </div>
                  <div className="text-muted mt-1" style={{ fontSize: 14 }}>{tr.parentsHint}</div>
                </div>

                {parents.map((p, idx) => (
                  <div className="col-12" key={idx}>
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong>{tr.parent} #{idx + 1}</strong>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeParent(idx)} disabled={!isAdmin}>{tr.delete}</button>
                        </div>

                        <div className="row g-2">
                          <div className="col-md-6">
                            <label className="form-label"><i className="fa-solid fa-user me-1 text-muted"></i>{tr.fullName}</label>
                            <input className="form-control" value={p.fullName} onChange={(e) => updateParent(idx, 'fullName', e.target.value)} disabled={!isAdmin} />
                          </div>

                          <div className="col-md-3">
                            <label className="form-label"><i className="fa-solid fa-phone me-1 text-muted"></i>{tr.phone}</label>
                            <input className="form-control" value={p.phone} onChange={(e) => updateParent(idx, 'phone', e.target.value)} disabled={!isAdmin} />
                          </div>

                          <div className="col-md-3">
                            <label className="form-label"><i className="fa-solid fa-user-tag me-1 text-muted"></i>{tr.type}</label>
                            <select className="form-select" value={p.type} onChange={(e) => updateParent(idx, 'type', e.target.value)} disabled={!isAdmin}>
                              {parentTypes.map((pt) => (
                                <option key={pt} value={pt}>{pt}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-md-12">
                            <label className="form-label"><i className="fa-solid fa-briefcase me-1 text-muted"></i>{tr.workplace}</label>
                            <input className="form-control" value={p.workplace} onChange={(e) => updateParent(idx, 'workplace', e.target.value)} disabled={!isAdmin} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal" onClick={resetForm}>{tr.cancel}</button>
              <button type="button" className="btn btn-primary" onClick={createStudent} data-bs-dismiss="modal" disabled={!isAdmin} title={!isAdmin ? tr.adminOnly : ''}>{tr.save}</button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default Students;
