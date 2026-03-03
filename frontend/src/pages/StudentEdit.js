import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { pickLocalI18n, studentEditLocalI18n, useI18n } from '../i18n/I18nContext';

const emptyParent = () => ({ fullName: '', phone: '', type: 'Mother', workplace: '' });

function StudentEdit() {
  const { ready, user } = useAuth();
  const { language } = useI18n();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEPUTY_ADMIN';
  const tr = pickLocalI18n(studentEditLocalI18n, language);

  const { id } = useParams();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('Active');
  const [photo, setPhoto] = useState(null);
  const [parents, setParents] = useState([emptyParent()]);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      try {
        setError('');
        const [studentRes, classesRes] = await Promise.all([api.get(`/students/${id}`), api.get('/classes')]);
        const s = studentRes.data;
        setClasses(classesRes.data || []);
        setFullName(s.fullName || '');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setAddress(s.address || '');
        setBirthDate(s.birthDate ? String(s.birthDate).slice(0, 10) : '');
        setClassId(s.class?._id || '');
        setStatus(s.status || 'Active');
        setParents(s.parents?.length ? s.parents : [emptyParent()]);
      } catch (e) {
        const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : tr.network);
        setError(tr.loadFailed.replace('{msg}', msg));
      }
    };
    load();
  }, [id, ready, tr.loadFailed, tr.network]);

  const addParent = () => setParents((prev) => [...prev, emptyParent()]);
  const removeParent = (index) => setParents((prev) => {
    const next = prev.filter((_, i) => i !== index);
    return next.length ? next : [emptyParent()];
  });
  const updateParent = (index, field, value) =>
    setParents((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

  const save = async () => {
    if (!isAdmin) return;
    if (!fullName.trim()) return alert(tr.enterName);
    if (!classId) return alert(tr.chooseClass);

    const parentsPayload = parents
      .map((p) => ({
        fullName: (p.fullName || '').trim(),
        phone: (p.phone || '').trim(),
        type: (p.type || '').trim(),
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
      await api.put(`/students/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPhoto(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
      navigate(`/students/${id}`);
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : tr.network);
      setError(tr.saveFailed.replace('{msg}', msg));
    }
  };

  const disabled = !ready || !isAdmin;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">{tr.title}</h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to={`/students/${id}`}>{tr.cancel}</Link>
          <button className="btn btn-primary" onClick={save} disabled={disabled}>{tr.save}</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card"><div className="card-body"><div className="row g-3">
        <div className="col-md-6"><label className="form-label">{tr.fullName}</label><input className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={disabled} /></div>
        <div className="col-md-6"><label className="form-label">{tr.cls}</label><select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)} disabled={disabled}><option value="">{tr.selectClass}</option>{classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
        <div className="col-md-6"><label className="form-label">{tr.photo}</label><input ref={photoInputRef} type="file" className="form-control" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} disabled={disabled} /></div>
        <div className="col-md-6"><label className="form-label">{tr.status}</label><input className="form-control" value={status} onChange={(e) => setStatus(e.target.value)} disabled={disabled} /></div>
        <div className="col-md-4"><label className="form-label">{tr.birthDate}</label><input type="date" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={disabled} /></div>
        <div className="col-md-4"><label className="form-label">{tr.phone}</label><input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={disabled} /></div>
        <div className="col-md-4"><label className="form-label">{tr.email}</label><input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} disabled={disabled} /></div>
        <div className="col-md-12"><label className="form-label">{tr.address}</label><input className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} disabled={disabled} /></div>
        <div className="col-12"><hr /><div className="d-flex justify-content-between align-items-center"><h6 className="mb-0">{tr.parents}</h6><button type="button" className="btn btn-outline-primary btn-sm" onClick={addParent} disabled={disabled}>{tr.addParent}</button></div></div>
        {parents.map((p, idx) => <div className="col-12" key={idx}><div className="card"><div className="card-body"><div className="d-flex justify-content-between align-items-center mb-2"><strong>{tr.parent} #{idx + 1}</strong><button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeParent(idx)} disabled={disabled}>{tr.remove}</button></div><div className="row g-2"><div className="col-md-6"><label className="form-label">{tr.fullName}</label><input className="form-control" value={p.fullName} onChange={(e) => updateParent(idx, 'fullName', e.target.value)} disabled={disabled} /></div><div className="col-md-3"><label className="form-label">{tr.phone}</label><input className="form-control" value={p.phone} onChange={(e) => updateParent(idx, 'phone', e.target.value)} disabled={disabled} /></div><div className="col-md-3"><label className="form-label">{tr.type}</label><input className="form-control" value={p.type} onChange={(e) => updateParent(idx, 'type', e.target.value)} disabled={disabled} /></div><div className="col-md-12"><label className="form-label">{tr.workplace}</label><input className="form-control" value={p.workplace} onChange={(e) => updateParent(idx, 'workplace', e.target.value)} disabled={disabled} /></div></div></div></div></div>)}
      </div></div></div>
    </div>
  );
}

export default StudentEdit;
