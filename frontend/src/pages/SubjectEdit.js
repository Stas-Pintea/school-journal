import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { pickLocalI18n, subjectEditLocalI18n, useI18n } from '../i18n/I18nContext';

function SubjectEdit() {
  const { ready } = useAuth();
  const { language } = useI18n();
  const tr = pickLocalI18n(subjectEditLocalI18n, language);

  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;

    const load = async () => {
      try {
        setError('');
        const res = await api.get(`/subjects/${id}`);
        setName(res.data?.name || '');
      } catch (e) {
        const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : tr.networkError);
        setError(tr.loadFailed.replace('{msg}', msg));
      }
    };

    load();
  }, [id, ready, tr.loadFailed, tr.networkError]);

  const save = async () => {
    if (!name.trim()) {
      alert(tr.nameRequired);
      return;
    }

    try {
      await api.put(`/subjects/${id}`, { name: name.trim() });
      navigate(`/subjects/${id}`);
    } catch (e) {
      const msg = e.response?.data?.message || (e.response?.status ? `HTTP ${e.response.status}` : tr.networkError);
      setError(tr.saveFailed.replace('{msg}', msg));
    }
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">
          <i className="fas fa-book-open me-1"></i>
          {tr.title}
        </h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to={`/subjects/${id}`}>
            {tr.cancel}
          </Link>
          <button className="btn btn-primary" onClick={save} disabled={!ready}>
            {tr.save}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          <label className="form-label">{tr.name}</label>
          <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr.placeholder} disabled={!ready} />
        </div>
      </div>
    </div>
  );
}

export default SubjectEdit;
