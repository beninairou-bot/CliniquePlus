import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const sbFetch = async (path, options = {}, token = SUPABASE_ANON_KEY) => {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation',
      ...(options.headers || {})
    }
  });
  if (r.status === 204) return true;
  try { return await r.json(); } catch { return null; }
};

const authAPI = {
  signUp: (email, password, data) => sbFetch('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password, data }) }),
  signIn: (email, password) => sbFetch('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) }),
  resetPassword: (email) => sbFetch('/auth/v1/recover', { method: 'POST', body: JSON.stringify({ email }) }),
};

const dbAPI = {
  get: (table, filter, token) => sbFetch(`/rest/v1/${table}?${filter}&select=*`, {}, token),
  post: (table, body, token) => sbFetch(`/rest/v1/${table}`, { method: 'POST', body: JSON.stringify(body) }, token),
  patch: (table, filter, body, token) => sbFetch(`/rest/v1/${table}?${filter}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
  del: (table, filter, token) => sbFetch(`/rest/v1/${table}?${filter}`, { method: 'DELETE' }, token),
};

const ROLES = {
  admin: { label: 'Administrateur', color: '#8b5cf6' },
  medecin: { label: 'Médecin', color: '#0ea5e9' },
  secretaire: { label: 'Secrétaire', color: '#f59e0b' },
  pharmacien: { label: 'Pharmacien', color: '#00c896' },
  infirmier: { label: 'Infirmier(e)', color: '#f97316' },
  caissier: { label: 'Caissier', color: '#ef4444' },
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊', roles: ['admin', 'medecin', 'secretaire', 'pharmacien', 'infirmier', 'caissier'] },
  { id: 'patients', label: 'Patients', icon: '👥', roles: ['admin', 'medecin', 'secretaire', 'infirmier'] },
  { id: 'consultations', label: 'Consultations', icon: '🩺', roles: ['admin', 'medecin', 'infirmier'] },
  { id: 'rendez_vous', label: 'Rendez-vous', icon: '📅', roles: ['admin', 'medecin', 'secretaire'] },
  { id: 'pharmacie', label: 'Pharmacie', icon: '💊', roles: ['admin', 'pharmacien'] },
  { id: 'facturation', label: 'Facturation', icon: '🧾', roles: ['admin', 'caissier', 'secretaire'] },
  { id: 'equipe', label: 'Équipe', icon: '👨‍⚕️', roles: ['admin'] },
  { id: 'parametres', label: 'Paramètres', icon: '⚙️', roles: ['admin'] },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (m) => `${(m || 0).toLocaleString('fr-FR')} FCFA`;
const mkAvatar = (nom) => nom ? nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
const age = (dob) => dob ? `${new Date().getFullYear() - new Date(dob).getFullYear()} ans` : '—';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#f0f4f8;--surface:#ffffff;--surface2:#f8fafc;--surface3:#edf2f7;
    --border:#e2e8f0;--accent:#00c896;--accent2:#0ea5e9;--accent3:#f59e0b;
    --danger:#ef4444;--purple:#8b5cf6;--orange:#f97316;
    --text:#1a202c;--text2:#4a5568;--text3:#a0aec0;
    --font-display:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;
    --radius:12px;--shadow:0 2px 12px rgba(0,0,0,0.08);
  }
  body{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh;}
  .app{display:flex;min-height:100vh;}
  .sidebar{width:240px;min-height:100vh;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;left:0;top:0;z-index:100;}
  .sidebar-logo{padding:20px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;}
  .logo-icon{width:36px;height:36px;background:var(--accent);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:16px;font-family:var(--font-display);}
  .logo-text{font-family:var(--font-display);font-weight:700;font-size:17px;}
  .nav{padding:12px 8px;flex:1;overflow-y:auto;}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;color:var(--text2);font-size:13.5px;transition:all 0.15s;margin-bottom:2px;}
  .nav-item:hover{background:var(--surface2);color:var(--text);}
  .nav-item.active{background:rgba(0,200,150,0.1);color:var(--accent);font-weight:600;}
  .nav-icon{font-size:16px;width:20px;text-align:center;}
  .sidebar-footer{padding:12px;border-top:1px solid var(--border);}
  .user-card{display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:10px;cursor:pointer;transition:all 0.15s;}
  .user-card:hover{background:rgba(239,68,68,0.05);}
  .avatar{border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;}
  .user-info{flex:1;min-width:0;}
  .user-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .user-role{font-size:11px;color:var(--text3);}
  .main{margin-left:240px;flex:1;display:flex;flex-direction:column;}
  .topbar{height:60px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;gap:16px;position:sticky;top:0;z-index:50;}
  .topbar-title{font-family:var(--font-display);font-size:17px;font-weight:700;flex:1;}
  .topbar-badge{font-size:12px;color:var(--text3);background:var(--surface2);padding:4px 12px;border-radius:20px;border:1px solid var(--border);}
  .content{padding:24px;flex:1;}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}
  .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;position:relative;overflow:hidden;}
  .stat-card::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
  .stat-card.green::after{background:var(--accent);}
  .stat-card.blue::after{background:var(--accent2);}
  .stat-card.orange::after{background:var(--accent3);}
  .stat-card.purple::after{background:var(--purple);}
  .stat-card.red::after{background:var(--danger);}
  .stat-icon{font-size:28px;margin-bottom:10px;}
  .stat-value{font-family:var(--font-display);font-size:28px;font-weight:800;line-height:1;}
  .stat-label{font-size:11px;color:var(--text3);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;}
  .stat-sub{font-size:12px;color:var(--text2);margin-top:6px;}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;}
  .card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px;}
  .card-title{font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:none;font-family:var(--font-body);transition:all 0.15s;}
  .btn:disabled{opacity:0.5;cursor:not-allowed;}
  .btn-primary{background:var(--accent);color:#fff;}
  .btn-primary:hover:not(:disabled){background:#00b085;transform:translateY(-1px);}
  .btn-secondary{background:var(--surface2);color:var(--text);border:1px solid var(--border);}
  .btn-secondary:hover:not(:disabled){border-color:var(--accent);color:var(--accent);}
  .btn-danger{background:rgba(239,68,68,0.08);color:var(--danger);border:1px solid rgba(239,68,68,0.2);}
  .btn-info{background:rgba(14,165,233,0.08);color:var(--accent2);border:1px solid rgba(14,165,233,0.2);}
  .btn-sm{padding:5px 10px;font-size:12px;}
  .badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;}
  .table{width:100%;border-collapse:collapse;}
  .table th{text-align:left;padding:10px 14px;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid var(--border);}
  .table td{padding:11px 14px;font-size:13.5px;border-bottom:1px solid rgba(226,232,240,0.5);vertical-align:middle;}
  .table tr:last-child td{border-bottom:none;}
  .table tr:hover td{background:var(--surface2);}
  .empty{text-align:center;padding:40px 20px;color:var(--text3);}
  .empty-icon{font-size:36px;margin-bottom:10px;}
  .empty p{font-size:14px;}
  .form-group{margin-bottom:16px;}
  .form-label{display:block;font-size:11px;color:var(--text2);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;}
  .form-input,.form-select,.form-textarea{width:100%;padding:10px 14px;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;color:var(--text);font-size:13.5px;font-family:var(--font-body);transition:border-color 0.15s;}
  .form-input:focus,.form-select:focus,.form-textarea:focus{outline:none;border-color:var(--accent);background:#fff;}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
  .form-textarea{resize:vertical;min-height:80px;}
  .form-section{border-top:1px solid var(--border);padding-top:16px;margin-top:16px;}
  .form-section-title{font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--accent);margin-bottom:14px;display:flex;align-items:center;gap:8px;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px);}
  .modal{background:var(--surface);border-radius:16px;width:100%;max-width:680px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);}
  .modal-lg{max-width:860px;}
  .modal-header{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surface);z-index:10;}
  .modal-title{font-family:var(--font-display);font-size:16px;font-weight:700;}
  .modal-body{padding:24px;}
  .modal-footer{padding:16px 24px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end;position:sticky;bottom:0;background:var(--surface);}
  .modal-close{background:none;border:none;font-size:18px;cursor:pointer;color:var(--text3);padding:4px;}
  .alert{padding:12px 16px;border-radius:8px;font-size:13px;margin-bottom:16px;display:flex;align-items:flex-start;gap:8px;}
  .alert-error{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:var(--danger);}
  .alert-success{background:rgba(0,200,150,0.08);border:1px solid rgba(0,200,150,0.2);color:#00a87e;}
  .alert-warning{background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);color:#b45309;}
  .alert-info{background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.2);color:#0369a1;}
  .spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;}
  .spinner-dark{border-color:rgba(0,0,0,0.1);border-top-color:var(--accent);}
  .loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:40px;color:var(--text3);font-size:13px;}
  .tag{display:inline-flex;align-items:center;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;}
  .divider{border:none;border-top:1px solid var(--border);margin:16px 0;}
  .stock-bar{height:6px;background:var(--surface3);border-radius:3px;overflow:hidden;margin-top:6px;}
  .stock-fill{height:100%;border-radius:3px;transition:width 0.4s;}
  .info-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);}
  .info-row:last-child{border-bottom:none;}
  .info-label{font-size:12px;color:var(--text3);font-weight:500;}
  .info-value{font-size:13px;font-weight:500;}
  .tabs-bar{display:flex;gap:4px;background:var(--surface2);padding:4px;border-radius:10px;margin-bottom:20px;}
  .tab-btn{flex:1;padding:8px;border-radius:7px;border:none;background:none;color:var(--text2);font-size:13px;cursor:pointer;font-family:var(--font-body);transition:all 0.15s;}
  .tab-btn.active{background:var(--surface);color:var(--accent);font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,0.08);}
  .analyse-item{border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;background:var(--surface2);}
  .medicament-item{border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;background:var(--surface2);display:flex;align-items:center;gap:10px;}
  .pdf-section{background:var(--surface);border:2px solid var(--border);border-radius:12px;padding:24px;margin-top:16px;}
  .pdf-header{text-align:center;border-bottom:2px solid var(--accent);padding-bottom:16px;margin-bottom:16px;}
  .pdf-title{font-family:var(--font-display);font-size:20px;font-weight:800;color:var(--accent);}
  .pdf-subtitle{font-size:12px;color:var(--text3);margin-top:4px;}
  .pdf-block{margin-bottom:16px;}
  .pdf-block-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--accent);border-bottom:1px solid var(--border);padding-bottom:4px;margin-bottom:8px;}
  .pdf-text{font-size:13px;line-height:1.6;color:var(--text2);}
  .login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f0f4f8,#e8f5f0);padding:20px;}
  .login-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:40px;width:100%;max-width:480px;box-shadow:var(--shadow);}
  .logo-wrap{text-align:center;margin-bottom:32px;}
  .logo-name{font-family:var(--font-display);font-size:24px;font-weight:800;}
  .logo-sub-text{font-size:12px;color:var(--text3);margin-top:4px;}
  .step-indicator{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:24px;}
  .step{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;transition:all 0.2s;}
  .step.active{background:var(--accent);color:#fff;}
  .step.inactive{background:var(--border);color:var(--text3);}
  .step-line{flex:1;height:2px;background:var(--border);max-width:40px;transition:all 0.2s;}
  .step-line.done{background:var(--accent);}
  .plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}
  .plan-card{border:2px solid var(--border);border-radius:10px;padding:14px;cursor:pointer;transition:all 0.15s;}
  .plan-card:hover{border-color:var(--accent2);}
  .plan-card.selected{border-color:var(--accent);background:rgba(0,200,150,0.04);}
  .plan-name{font-weight:700;font-size:13px;}
  .plan-prix{color:var(--accent);font-size:12px;font-weight:600;margin-top:2px;}
  .plan-desc{color:var(--text3);font-size:11px;margin-top:4px;}
  .link-btn{background:none;border:none;color:var(--accent);font-size:13px;cursor:pointer;font-family:var(--font-body);text-decoration:underline;}
  .divider-text{text-align:center;color:var(--text3);font-size:12px;margin:14px 0;position:relative;}
  .divider-text::before,.divider-text::after{content:'';position:absolute;top:50%;width:42%;height:1px;background:var(--border);}
  .divider-text::before{left:0;}.divider-text::after{right:0;}
  .search-bar{display:flex;gap:10px;align-items:center;}
  .search-input{padding:9px 14px;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;font-family:var(--font-body);width:220px;}
  .search-input:focus{outline:none;border-color:var(--accent);}
  .patient-dossier{background:var(--surface3);border-radius:10px;padding:14px;margin-bottom:12px;}
  .constante-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;}
  .constante-box{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;}
  .constante-label{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;}
  .constante-value{font-size:18px;font-weight:700;color:var(--text);margin-top:4px;}
  .constante-unit{font-size:10px;color:var(--text3);}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
  .fade-in{animation:fadeIn 0.25s ease;}
  @media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr);}.grid-3{grid-template-columns:1fr 1fr;}}
  @media(max-width:768px){.sidebar{display:none;}.main{margin-left:0;}.stats-grid{grid-template-columns:1fr 1fr;}.grid-2,.grid-3{grid-template-columns:1fr;}}
`;

// ========== COMPOSANTS UI ==========

const Modal = ({ title, children, onClose, footer, large }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className={`modal ${large ? 'modal-lg' : ''} fade-in`}>
      <div className="modal-header">
        <span className="modal-title">{title}</span>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </div>
  </div>
);

const Spinner = ({ dark }) => <span className={`spinner ${dark ? 'spinner-dark' : ''}`} />;

// ========== AUTH ==========

const plans = [
  { id: 'starter', nom: 'Starter', prix: '20 000 FCFA/mois', desc: 'Cabinets & petites cliniques' },
  { id: 'pro', nom: 'Pro', prix: '60 000 FCFA/mois', desc: 'Cliniques & polycliniques' },
  { id: 'institution', nom: 'Institution', prix: '120 000 FCFA/mois', desc: 'Hôpitaux & réseaux' },
  { id: 'pilote', nom: 'Pilote', prix: 'Gratuit 3 mois', desc: 'Clinique pilote partenaire' },
];

function LoginForm({ onLogin, onRegister, onReset }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doLogin = async () => {
    if (!email || !password) { setError('Remplissez tous les champs.'); return; }
    setLoading(true); setError('');
    const d = await authAPI.signIn(email, password);
    if (d?.access_token) onLogin(d);
    else setError('Email ou mot de passe incorrect.');
    setLoading(false);
  };

  return (
    <div>
      {error && <div className="alert alert-error">⚠️ {error}</div>}
      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Mot de passe</label>
        <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()} />
      </div>
      <button className="btn btn-primary" style={{ width: '100%', padding: 12, marginTop: 4 }} onClick={doLogin} disabled={loading}>
        {loading && <Spinner />}{loading ? 'Connexion...' : 'Se connecter'}
      </button>
      <div className="divider-text">ou</div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="link-btn" onClick={onReset}>Mot de passe oublié ?</button>
        <button className="link-btn" onClick={onRegister}>Créer une clinique</button>
      </div>
    </div>
  );
}

function RegisterForm({ onLogin, onBack }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reg, setReg] = useState({
    nomClinique: '', typeClinique: 'clinique', ville: '', pays: 'Bénin',
    adresse: '', telephone: '', email: '', ifu: '', plan: 'starter',
    nomAdmin: '', prenomAdmin: '', emailAdmin: '', passwordAdmin: '', confirmPwd: '',
  });
  const set = (k, v) => setReg(r => ({ ...r, [k]: v }));

  const doRegister = async () => {
    if (!reg.nomAdmin || !reg.emailAdmin || !reg.passwordAdmin) { setError('Champs obligatoires manquants.'); return; }
    if (reg.passwordAdmin !== reg.confirmPwd) { setError('Mots de passe différents.'); return; }
    if (reg.passwordAdmin.length < 6) { setError('Mot de passe trop court (min. 6 caractères).'); return; }
    setLoading(true); setError('');
    try {
      const authRes = await authAPI.signUp(reg.emailAdmin, reg.passwordAdmin, { nom: `${reg.prenomAdmin} ${reg.nomAdmin}`.trim(), role: 'admin' });
      if (authRes?.error) { setError(authRes.error.message || 'Erreur création compte.'); setLoading(false); return; }
      const loginRes = await authAPI.signIn(reg.emailAdmin, reg.passwordAdmin);
      if (!loginRes?.access_token) { setError('Compte créé. Connectez-vous.'); setLoading(false); return; }
      const token = loginRes.access_token;
      const userId = loginRes.user?.id;
      const cliniqueRes = await dbAPI.post('cliniques', { nom: reg.nomClinique, type: reg.typeClinique, ville: reg.ville, pays: reg.pays, adresse: reg.adresse, telephone: reg.telephone, email: reg.email, ifu: reg.ifu, plan: reg.plan }, token);
      const clinique = Array.isArray(cliniqueRes) ? cliniqueRes[0] : cliniqueRes;
      if (!clinique?.id) { setError('Erreur création clinique.'); setLoading(false); return; }
      await dbAPI.post('profils', { id: userId, clinique_id: clinique.id, nom: reg.nomAdmin, prenom: reg.prenomAdmin, role: 'admin' }, token);
      onLogin(loginRes);
    } catch (e) { setError('Erreur inattendue. Réessayez.'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="step-indicator">
        {[1, 2, 3].map(s => (
          <>
            <div key={s} className={`step ${step >= s ? 'active' : 'inactive'}`}>{s}</div>
            {s < 3 && <div className={`step-line ${step > s ? 'done' : ''}`} />}
          </>
        ))}
      </div>
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {step === 1 && (
        <div className="fade-in">
          <div className="form-group"><label className="form-label">Nom de la clinique *</label><input className="form-input" placeholder="Ex: Clinique Espoir" value={reg.nomClinique} onChange={e => set('nomClinique', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={reg.typeClinique} onChange={e => set('typeClinique', e.target.value)}><option value="clinique">Clinique</option><option value="hopital">Hôpital</option><option value="cabinet">Cabinet médical</option><option value="polyclinique">Polyclinique</option><option value="centre_sante">Centre de santé</option></select></div>
            <div className="form-group"><label className="form-label">Ville *</label><input className="form-input" placeholder="Ex: Cotonou" value={reg.ville} onChange={e => set('ville', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" placeholder="+229..." value={reg.telephone} onChange={e => set('telephone', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">IFU</label><input className="form-input" placeholder="Optionnel" value={reg.ifu} onChange={e => set('ifu', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Email clinique *</label><input className="form-input" type="email" placeholder="clinique@email.com" value={reg.email} onChange={e => set('email', e.target.value)} /></div>
          <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} onClick={() => { if (!reg.nomClinique || !reg.ville || !reg.email) { setError('Remplissez les champs obligatoires.'); } else { setError(''); setStep(2); } }}>Suivant →</button>
          <div style={{ textAlign: 'center', marginTop: 12 }}><button className="link-btn" onClick={onBack}>← Retour</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in">
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>Choisissez votre plan :</p>
          <div className="plan-grid">{plans.map(p => (<div key={p.id} className={`plan-card ${reg.plan === p.id ? 'selected' : ''}`} onClick={() => set('plan', p.id)}><div className="plan-name">{p.nom}</div><div className="plan-prix">{p.prix}</div><div className="plan-desc">{p.desc}</div></div>))}</div>
          <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} onClick={() => setStep(3)}>Suivant →</button>
          <div style={{ textAlign: 'center', marginTop: 12 }}><button className="link-btn" onClick={() => setStep(1)}>← Retour</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="fade-in">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Prénom</label><input className="form-input" placeholder="Jean" value={reg.prenomAdmin} onChange={e => set('prenomAdmin', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" placeholder="DUPONT" value={reg.nomAdmin} onChange={e => set('nomAdmin', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Email de connexion *</label><input className="form-input" type="email" value={reg.emailAdmin} onChange={e => set('emailAdmin', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Mot de passe *</label><input className="form-input" type="password" placeholder="••••••••" value={reg.passwordAdmin} onChange={e => set('passwordAdmin', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Confirmer *</label><input className="form-input" type="password" placeholder="••••••••" value={reg.confirmPwd} onChange={e => set('confirmPwd', e.target.value)} /></div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} onClick={doRegister} disabled={loading}>
            {loading && <Spinner />}{loading ? 'Création en cours...' : '🏥 Créer ma clinique'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 12 }}><button className="link-btn" onClick={() => setStep(2)}>← Retour</button></div>
        </div>
      )}
    </div>
  );
}

// ========== DASHBOARD ==========

function DashboardPage({ session, clinique, profil }) {
  const [stats, setStats] = useState({ patients: 0, consultations: 0, rdv: 0, stockValeur: 0, stockAlerts: 0, revenus: 0 });
  const [rdvAujourdhui, setRdvAujourdhui] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const token = session?.access_token;

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [patients, consultations, rdv, meds, factures] = await Promise.all([
        dbAPI.get('patients', `clinique_id=eq.${clinique.id}&select=id`, token),
        dbAPI.get('consultations', `clinique_id=eq.${clinique.id}&select=id`, token),
        dbAPI.get('rendez_vous', `clinique_id=eq.${clinique.id}&select=id`, token),
        dbAPI.get('medicaments', `clinique_id=eq.${clinique.id}`, token),
        dbAPI.get('factures', `clinique_id=eq.${clinique.id}&statut=eq.payee&select=montant_total`, token),
      ]);
      const medsArr = Array.isArray(meds) ? meds : [];
      const stockValeur = medsArr.reduce((acc, m) => acc + (m.stock_actuel * m.prix_unitaire), 0);
      const alerts = medsArr.filter(m => m.stock_actuel <= m.stock_minimum);
      const revenus = Array.isArray(factures) ? factures.reduce((acc, f) => acc + (f.montant_total || 0), 0) : 0;
      setStats({
        patients: Array.isArray(patients) ? patients.length : 0,
        consultations: Array.isArray(consultations) ? consultations.length : 0,
        rdv: Array.isArray(rdv) ? rdv.length : 0,
        stockValeur, stockAlerts: alerts.length, revenus,
      });
      setStockAlerts(alerts.slice(0, 5));
      const rdvToday = await dbAPI.get('rendez_vous', `clinique_id=eq.${clinique.id}&date_heure=gte.${today}T00:00:00&date_heure=lte.${today}T23:59:59`, token);
      if (Array.isArray(rdvToday)) setRdvAujourdhui(rdvToday);
    };
    load();
  }, [clinique.id, token]);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
          Bonjour, {profil?.prenom || profil?.nom} 👋
        </div>
        <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.patients}</div>
          <div className="stat-label">Patients</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">🩺</div>
          <div className="stat-value">{stats.consultations}</div>
          <div className="stat-label">Consultations</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">💊</div>
          <div className="stat-value">{fmtMoney(stats.stockValeur)}</div>
          <div className="stat-label">Valeur stock</div>
          {stats.stockAlerts > 0 && <div className="stat-sub" style={{ color: 'var(--danger)' }}>⚠️ {stats.stockAlerts} alerte(s)</div>}
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{fmtMoney(stats.revenus)}</div>
          <div className="stat-label">Revenus encaissés</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">📅 Rendez-vous aujourd'hui</span></div>
          {rdvAujourdhui.length === 0
            ? <div className="empty"><div className="empty-icon">📅</div><p>Aucun rendez-vous aujourd'hui</p></div>
            : <table className="table"><thead><tr><th>Heure</th><th>Motif</th><th>Statut</th></tr></thead>
              <tbody>{rdvAujourdhui.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{r.motif || '—'}</td>
                  <td><span className="badge" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--accent)' }}>{r.statut}</span></td>
                </tr>
              ))}</tbody></table>
          }
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">⚠️ Alertes stock</span></div>
          {stockAlerts.length === 0
            ? <div className="empty"><div className="empty-icon">✅</div><p>Tous les stocks sont OK</p></div>
            : stockAlerts.map(m => {
              const pct = Math.min(100, Math.round((m.stock_actuel / Math.max(1, m.stock_minimum)) * 100));
              return (
                <div key={m.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>💊 {m.nom} {m.dosage}</span>
                    <span style={{ fontSize: 12, color: m.stock_actuel === 0 ? 'var(--danger)' : 'var(--accent3)' }}>{m.stock_actuel} restants</span>
                  </div>
                  <div className="stock-bar"><div className="stock-fill" style={{ width: `${pct}%`, background: m.stock_actuel === 0 ? 'var(--danger)' : 'var(--accent3)' }} /></div>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

// ========== PATIENTS ==========

function PatientsPage({ session, clinique, onConsult }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [form, setForm] = useState({ nom: '', prenom: '', date_naissance: '', sexe: 'M', telephone: '', adresse: '', profession: '', groupe_sanguin: '', allergies: '', antecedents: '' });
  const [saving, setSaving] = useState(false);
  const token = session?.access_token;

  const load = useCallback(async () => {
    setLoading(true);
    const d = await dbAPI.get('patients', `clinique_id=eq.${clinique.id}&order=created_at.desc`, token);
    if (Array.isArray(d)) setPatients(d);
    setLoading(false);
  }, [clinique.id, token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.nom) return;
    setSaving(true);
    await dbAPI.post('patients', { ...form, clinique_id: clinique.id, numero_dossier: '' }, token);
    await load();
    setShowModal(false);
    setForm({ nom: '', prenom: '', date_naissance: '', sexe: 'M', telephone: '', adresse: '', profession: '', groupe_sanguin: '', allergies: '', antecedents: '' });
    setSaving(false);
  };

  const filtered = patients.filter(p => `${p.nom} ${p.prenom || ''} ${p.telephone || ''} ${p.numero_dossier || ''}`.toLowerCase().includes(search.toLowerCase()));

  if (selectedPatient) {
    return <DossierPatient patient={selectedPatient} session={session} clinique={clinique} onBack={() => setSelectedPatient(null)} onConsult={onConsult} />;
  }

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <span className="card-title">👥 Patients ({patients.length})</span>
          <div className="search-bar">
            <input className="search-input" placeholder="🔍 Nom, téléphone, dossier..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nouveau patient</button>
          </div>
        </div>
        {loading ? <div className="loading"><Spinner dark /> Chargement...</div>
          : filtered.length === 0 ? <div className="empty"><div className="empty-icon">👥</div><p>Aucun patient trouvé</p></div>
            : <table className="table">
              <thead><tr><th>N° Dossier</th><th>Patient</th><th>Âge</th><th>Sexe</th><th>Téléphone</th><th>Groupe</th><th>Actions</th></tr></thead>
              <tbody>{filtered.map(p => (
                <tr key={p.id}>
                  <td><span className="tag" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--accent)' }}>{p.numero_dossier || 'N/A'}</span></td>
                  <td><strong>{p.nom} {p.prenom}</strong></td>
                  <td>{age(p.date_naissance)}</td>
                  <td>{p.sexe === 'M' ? '♂ M' : '♀ F'}</td>
                  <td>{p.telephone || '—'}</td>
                  <td>{p.groupe_sanguin || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-info btn-sm" onClick={() => setSelectedPatient(p)}>📋 Dossier</button>
                      <button className="btn btn-primary btn-sm" onClick={() => onConsult(p)}>🩺 Consulter</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
        }
      </div>

      {showModal && (
        <Modal title="Nouveau patient" onClose={() => setShowModal(false)} footer={
          <><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving && <Spinner />} Enregistrer</button></>
        }>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Prénom</label><input className="form-input" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Date de naissance</label><input className="form-input" type="date" value={form.date_naissance} onChange={e => setForm(f => ({ ...f, date_naissance: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Sexe</label><select className="form-select" value={form.sexe} onChange={e => setForm(f => ({ ...f, sexe: e.target.value }))}><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Groupe sanguin</label><select className="form-select" value={form.groupe_sanguin} onChange={e => setForm(f => ({ ...f, groupe_sanguin: e.target.value }))}><option value="">—</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Adresse</label><input className="form-input" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Profession</label><input className="form-input" value={form.profession} onChange={e => setForm(f => ({ ...f, profession: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Allergies connues</label><textarea className="form-textarea" value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Antécédents médicaux</label><textarea className="form-textarea" value={form.antecedents} onChange={e => setForm(f => ({ ...f, antecedents: e.target.value }))} /></div>
        </Modal>
      )}
    </div>
  );
}

// ========== DOSSIER PATIENT ==========

function DossierPatient({ patient, session, clinique, onBack, onConsult }) {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsult, setSelectedConsult] = useState(null);
  const token = session?.access_token;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const d = await dbAPI.get('consultations', `patient_id=eq.${patient.id}&order=created_at.desc`, token);
      if (Array.isArray(d)) setConsultations(d);
      setLoading(false);
    };
    load();
  }, [patient.id, token]);

  if (selectedConsult) {
    return <ConsultationDetail consultation={selectedConsult} patient={patient} clinique={clinique} onBack={() => setSelectedConsult(null)} session={session} />;
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>← Retour</button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Dossier : {patient.nom} {patient.prenom}</h2>
        <button className="btn btn-primary btn-sm" onClick={() => onConsult(patient)}>+ Nouvelle consultation</button>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">👤 Informations personnelles</span></div>
          <div className="info-row"><span className="info-label">N° Dossier</span><span className="info-value"><span className="tag" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--accent)' }}>{patient.numero_dossier || 'N/A'}</span></span></div>
          <div className="info-row"><span className="info-label">Date de naissance</span><span className="info-value">{fmtDate(patient.date_naissance)} ({age(patient.date_naissance)})</span></div>
          <div className="info-row"><span className="info-label">Sexe</span><span className="info-value">{patient.sexe === 'M' ? '♂ Masculin' : '♀ Féminin'}</span></div>
          <div className="info-row"><span className="info-label">Téléphone</span><span className="info-value">{patient.telephone || '—'}</span></div>
          <div className="info-row"><span className="info-label">Adresse</span><span className="info-value">{patient.adresse || '—'}</span></div>
          <div className="info-row"><span className="info-label">Profession</span><span className="info-value">{patient.profession || '—'}</span></div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">🏥 Informations médicales</span></div>
          <div className="info-row"><span className="info-label">Groupe sanguin</span><span className="info-value"><strong style={{ color: 'var(--danger)' }}>{patient.groupe_sanguin || '—'}</strong></span></div>
          <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span className="info-label">Allergies</span>
            <span className="info-value" style={{ color: patient.allergies ? 'var(--danger)' : 'var(--text3)' }}>{patient.allergies || 'Aucune allergie connue'}</span>
          </div>
          <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span className="info-label">Antécédents médicaux</span>
            <span className="info-value">{patient.antecedents || 'Aucun antécédent renseigné'}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">🩺 Historique des consultations ({consultations.length})</span>
        </div>
        {loading ? <div className="loading"><Spinner dark /> Chargement...</div>
          : consultations.length === 0
            ? <div className="empty"><div className="empty-icon">🩺</div><p>Aucune consultation enregistrée</p></div>
            : <table className="table">
              <thead><tr><th>Date</th><th>Motif</th><th>Diagnostic</th><th>Statut</th><th>Action</th></tr></thead>
              <tbody>{consultations.map(c => (
                <tr key={c.id}>
                  <td>{fmtDate(c.date_consultation)}</td>
                  <td>{c.motif}</td>
                  <td><strong>{c.diagnostic}</strong></td>
                  <td>
                    <span className="badge" style={{
                      background: c.statut === 'termine' ? 'rgba(0,200,150,0.1)' : c.statut === 'suivi_requis' ? 'rgba(245,158,11,0.1)' : 'rgba(14,165,233,0.1)',
                      color: c.statut === 'termine' ? 'var(--accent)' : c.statut === 'suivi_requis' ? 'var(--accent3)' : 'var(--accent2)'
                    }}>{c.statut === 'en_cours' ? 'En cours' : c.statut === 'termine' ? 'Terminé' : 'Suivi requis'}</span>
                  </td>
                  <td><button className="btn btn-info btn-sm" onClick={() => setSelectedConsult(c)}>📋 Voir</button></td>
                </tr>
              ))}</tbody>
            </table>
        }
      </div>
    </div>
  );
}

// ========== DETAIL CONSULTATION ==========

function ConsultationDetail({ consultation, patient, clinique, onBack, session }) {
  const [analyses, setAnalyses] = useState([]);
  const [ordonnance, setOrdonnance] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [showPDF, setShowPDF] = useState(false);
  const token = session?.access_token;

  useEffect(() => {
    const load = async () => {
      const [a, o] = await Promise.all([
        dbAPI.get('analyses', `consultation_id=eq.${consultation.id}`, token),
        dbAPI.get('ordonnances', `consultation_id=eq.${consultation.id}`, token),
      ]);
      if (Array.isArray(a)) setAnalyses(a);
      if (Array.isArray(o) && o.length > 0) {
        setOrdonnance(o[0]);
        const l = await dbAPI.get('ordonnance_lignes', `ordonnance_id=eq.${o[0].id}`, token);
        if (Array.isArray(l)) setLignes(l);
      }
    };
    load();
  }, [consultation.id, token]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>← Retour au dossier</button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Consultation du {fmtDate(consultation.date_consultation)}</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowPDF(true)}>📄 Synthèse PDF</button>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">📊 Constantes vitales</span></div>
          <div className="constante-grid">
            <div className="constante-box"><div className="constante-label">Tension</div><div className="constante-value">{consultation.tension_arterielle || '—'}</div><div className="constante-unit">mmHg</div></div>
            <div className="constante-box"><div className="constante-label">Température</div><div className="constante-value">{consultation.temperature || '—'}</div><div className="constante-unit">°C</div></div>
            <div className="constante-box"><div className="constante-label">Pouls</div><div className="constante-value">{consultation.pouls || '—'}</div><div className="constante-unit">bpm</div></div>
            <div className="constante-box"><div className="constante-label">Poids</div><div className="constante-value">{consultation.poids || '—'}</div><div className="constante-unit">kg</div></div>
            <div className="constante-box"><div className="constante-label">Taille</div><div className="constante-value">{consultation.taille || '—'}</div><div className="constante-unit">cm</div></div>
            <div className="constante-box"><div className="constante-label">Saturation</div><div className="constante-value">{consultation.saturation || '—'}</div><div className="constante-unit">%</div></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">🔍 Diagnostic</span></div>
          <div style={{ marginBottom: 10 }}><div className="info-label" style={{ marginBottom: 4 }}>Motif de consultation</div><div style={{ fontSize: 13 }}>{consultation.motif}</div></div>
          <div style={{ marginBottom: 10 }}><div className="info-label" style={{ marginBottom: 4 }}>Examen clinique</div><div style={{ fontSize: 13 }}>{consultation.examen_clinique || '—'}</div></div>
          <div style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
            <div className="info-label" style={{ marginBottom: 4 }}>Diagnostic</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{consultation.diagnostic}</div>
          </div>
          <div style={{ marginBottom: 10 }}><div className="info-label" style={{ marginBottom: 4 }}>Conduite à tenir</div><div style={{ fontSize: 13 }}>{consultation.conduite_a_tenir || '—'}</div></div>
          <div><div className="info-label" style={{ marginBottom: 4 }}>Recommandations</div><div style={{ fontSize: 13 }}>{consultation.recommandations || '—'}</div></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">🔬 Analyses prescrites</span></div>
          {analyses.length === 0 ? <div className="empty"><div className="empty-icon">🔬</div><p>Aucune analyse prescrite</p></div>
            : analyses.map(a => (
              <div key={a.id} className="analyse-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 13 }}>{a.nom}</strong>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="tag" style={{ background: a.type === 'interne' ? 'rgba(0,200,150,0.1)' : 'rgba(14,165,233,0.1)', color: a.type === 'interne' ? 'var(--accent)' : 'var(--accent2)' }}>{a.type === 'interne' ? '🏥 Interne' : '🔗 Externe'}</span>
                    <span className="badge" style={{ background: a.statut === 'resultat_recu' ? 'rgba(0,200,150,0.1)' : 'rgba(245,158,11,0.1)', color: a.statut === 'resultat_recu' ? 'var(--accent)' : 'var(--accent3)' }}>{a.statut === 'resultat_recu' ? 'Reçu' : a.statut === 'en_attente' ? 'En attente' : 'Prescrit'}</span>
                  </div>
                </div>
                {a.laboratoire_externe && <div style={{ fontSize: 12, color: 'var(--text3)' }}>Labo : {a.laboratoire_externe}</div>}
                {a.resultat && <div style={{ marginTop: 6, fontSize: 13, background: 'rgba(0,200,150,0.05)', padding: '6px 10px', borderRadius: 6 }}><strong>Résultat :</strong> {a.resultat}</div>}
                {a.valeurs_reference && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Réf : {a.valeurs_reference}</div>}
              </div>
            ))
          }
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">💊 Ordonnance</span></div>
          {lignes.length === 0 ? <div className="empty"><div className="empty-icon">💊</div><p>Aucune ordonnance</p></div>
            : <>
              {ordonnance?.notes && <div className="alert alert-info" style={{ marginBottom: 12 }}>{ordonnance.notes}</div>}
              {lignes.map((l, i) => (
                <div key={l.id} className="medicament-item">
                  <div style={{ background: 'var(--accent)', color: '#fff', width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{l.medicament_nom} {l.dosage}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{l.forme} — {l.posologie}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Durée : {l.duree} | Qté : {l.quantite}</div>
                    {l.instructions && <div style={{ fontSize: 11, color: 'var(--accent2)', marginTop: 2 }}>ℹ️ {l.instructions}</div>}
                  </div>
                </div>
              ))}
            </>
          }
        </div>
      </div>

      {showPDF && (
        <Modal title="📄 Synthèse de consultation" onClose={() => setShowPDF(false)} large footer={
          <><button className="btn btn-secondary" onClick={() => setShowPDF(false)}>Fermer</button>
            <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimer</button></>
        }>
          <SynthesePDF consultation={consultation} patient={patient} clinique={clinique} analyses={analyses} lignes={lignes} ordonnance={ordonnance} />
        </Modal>
      )}
    </div>
  );
}

// ========== SYNTHESE PDF ==========

function SynthesePDF({ consultation, patient, clinique, analyses, lignes, ordonnance }) {
  return (
    <div className="pdf-section">
      <div className="pdf-header">
        <div className="pdf-title">🏥 {clinique.nom}</div>
        <div className="pdf-subtitle">{clinique.adresse} | {clinique.telephone} | {clinique.email}</div>
        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700 }}>COMPTE RENDU DE CONSULTATION</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Date : {fmtDate(consultation.date_consultation)}</div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="pdf-block">
          <div className="pdf-block-title">Informations patient</div>
          <div className="pdf-text">
            <div><strong>Nom :</strong> {patient.nom} {patient.prenom}</div>
            <div><strong>N° Dossier :</strong> {patient.numero_dossier || 'N/A'}</div>
            <div><strong>Âge :</strong> {age(patient.date_naissance)}</div>
            <div><strong>Sexe :</strong> {patient.sexe === 'M' ? 'Masculin' : 'Féminin'}</div>
            <div><strong>Groupe sanguin :</strong> {patient.groupe_sanguin || '—'}</div>
            {patient.allergies && <div style={{ color: 'var(--danger)' }}><strong>⚠️ Allergies :</strong> {patient.allergies}</div>}
          </div>
        </div>

        <div className="pdf-block">
          <div className="pdf-block-title">Constantes vitales</div>
          <div className="pdf-text">
            <div><strong>Tension :</strong> {consultation.tension_arterielle || '—'} mmHg</div>
            <div><strong>Température :</strong> {consultation.temperature || '—'} °C</div>
            <div><strong>Pouls :</strong> {consultation.pouls || '—'} bpm</div>
            <div><strong>Poids :</strong> {consultation.poids || '—'} kg</div>
            <div><strong>Taille :</strong> {consultation.taille || '—'} cm</div>
            <div><strong>Saturation :</strong> {consultation.saturation || '—'} %</div>
          </div>
        </div>
      </div>

      <div className="pdf-block">
        <div className="pdf-block-title">Motif de consultation</div>
        <div className="pdf-text">{consultation.motif}</div>
      </div>

      {consultation.examen_clinique && (
        <div className="pdf-block">
          <div className="pdf-block-title">Examen clinique</div>
          <div className="pdf-text">{consultation.examen_clinique}</div>
        </div>
      )}

      <div className="pdf-block" style={{ background: 'rgba(0,200,150,0.05)', border: '1px solid rgba(0,200,150,0.2)', borderRadius: 8, padding: 12 }}>
        <div className="pdf-block-title">Diagnostic</div>
        <div className="pdf-text" style={{ fontWeight: 600, fontSize: 14 }}>{consultation.diagnostic}</div>
        {consultation.code_cim10 && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Code CIM-10 : {consultation.code_cim10}</div>}
      </div>

      {analyses.length > 0 && (
        <div className="pdf-block">
          <div className="pdf-block-title">Analyses prescrites</div>
          {analyses.map(a => (
            <div key={a.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong className="pdf-text">{a.nom}</strong>
                <span className="tag" style={{ background: a.type === 'interne' ? 'rgba(0,200,150,0.1)' : 'rgba(14,165,233,0.1)', color: a.type === 'interne' ? 'var(--accent)' : 'var(--accent2)' }}>{a.type === 'interne' ? 'Interne' : `Externe${a.laboratoire_externe ? ' - ' + a.laboratoire_externe : ''}`}</span>
              </div>
              {a.resultat && <div className="pdf-text" style={{ marginTop: 4 }}><strong>Résultat :</strong> {a.resultat} {a.valeurs_reference && `(Réf: ${a.valeurs_reference})`}</div>}
              {a.interpretation && <div className="pdf-text"><strong>Interprétation :</strong> {a.interpretation}</div>}
            </div>
          ))}
        </div>
      )}

      {lignes.length > 0 && (
        <div className="pdf-block">
          <div className="pdf-block-title">Ordonnance</div>
          {lignes.map((l, i) => (
            <div key={l.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 6 }}>
              <div className="pdf-text"><strong>{i + 1}. {l.medicament_nom} {l.dosage}</strong> {l.forme && `(${l.forme})`}</div>
              <div className="pdf-text">{l.posologie} — Durée : {l.duree} — Qté : {l.quantite}</div>
              {l.instructions && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{l.instructions}</div>}
            </div>
          ))}
        </div>
      )}

      {consultation.conduite_a_tenir && (
        <div className="pdf-block">
          <div className="pdf-block-title">Conduite à tenir</div>
          <div className="pdf-text">{consultation.conduite_a_tenir}</div>
        </div>
      )}

      {consultation.recommandations && (
        <div className="pdf-block">
          <div className="pdf-block-title">Recommandations</div>
          <div className="pdf-text">{consultation.recommandations}</div>
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 40 }}>Signature et cachet du médecin</div>
          <div style={{ borderTop: '1px solid var(--text)', width: 150, fontSize: 11, color: 'var(--text3)', paddingTop: 4 }}>Dr. ___________________</div>
        </div>
      </div>
    </div>
  );
}

// ========== CONSULTATIONS ==========

function ConsultationsPage({ session, clinique, patientInitial, onClearPatient }) {
  const [patients, setPatients] = useState([]);
  const [meds, setMeds] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(patientInitial || null);
  const [form, setForm] = useState({ motif: '', tension_arterielle: '', temperature: '', poids: '', taille: '', pouls: '', saturation: '', examen_clinique: '', diagnostic: '', code_cim10: '', conduite_a_tenir: '', recommandations: '', statut: 'termine' });
  const [analyses, setAnalyses] = useState([]);
  const [ordoLignes, setOrdoLignes] = useState([]);
  const [ordoNotes, setOrdoNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const token = session?.access_token;

  useEffect(() => {
    const load = async () => {
      const [p, m] = await Promise.all([
        dbAPI.get('patients', `clinique_id=eq.${clinique.id}&order=nom.asc`, token),
        dbAPI.get('medicaments', `clinique_id=eq.${clinique.id}&order=nom.asc`, token),
      ]);
      if (Array.isArray(p)) setPatients(p);
      if (Array.isArray(m)) setMeds(m);
    };
    load();
  }, [clinique.id, token]);

  useEffect(() => {
    if (patientInitial) { setSelectedPatient(patientInitial); if (onClearPatient) onClearPatient(); }
  }, [patientInitial]);

  const addAnalyse = () => setAnalyses(a => [...a, { nom: '', type: 'interne', laboratoire_externe: '', statut: 'prescrit', resultat: '', valeurs_reference: '', interpretation: '' }]);
  const updAnalyse = (i, k, v) => setAnalyses(a => a.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const delAnalyse = (i) => setAnalyses(a => a.filter((_, idx) => idx !== i));

  const addLigne = () => setOrdoLignes(l => [...l, { medicament_nom: '', forme: '', dosage: '', posologie: '', duree: '', quantite: 1, instructions: '' }]);
  const updLigne = (i, k, v) => setOrdoLignes(l => l.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const delLigne = (i) => setOrdoLignes(l => l.filter((_, idx) => idx !== i));

  const fillFromMed = (i, medId) => {
    const m = meds.find(x => x.id === medId);
    if (m) updLigne(i, 'medicament_nom', m.nom);
    if (m) updLigne(i, 'forme', m.forme || '');
    if (m) updLigne(i, 'dosage', m.dosage || '');
  };

  const save = async () => {
    if (!selectedPatient) { setError('Sélectionnez un patient.'); return; }
    if (!form.motif || !form.diagnostic) { setError('Le motif et le diagnostic sont obligatoires.'); return; }
    setSaving(true); setError('');
    try {
      const consultRes = await dbAPI.post('consultations', {
        ...form,
        patient_id: selectedPatient.id,
        clinique_id: clinique.id,
        medecin_id: session.user?.id,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        poids: form.poids ? parseFloat(form.poids) : null,
        taille: form.taille ? parseFloat(form.taille) : null,
        pouls: form.pouls ? parseInt(form.pouls) : null,
        saturation: form.saturation ? parseInt(form.saturation) : null,
      }, token);
      const consult = Array.isArray(consultRes) ? consultRes[0] : consultRes;
      if (!consult?.id) { setError('Erreur création consultation.'); setSaving(false); return; }

      if (analyses.length > 0) {
        for (const a of analyses) {
          if (a.nom) await dbAPI.post('analyses', { ...a, consultation_id: consult.id, clinique_id: clinique.id }, token);
        }
      }

      if (ordoLignes.length > 0) {
        const ordoRes = await dbAPI.post('ordonnances', { consultation_id: consult.id, clinique_id: clinique.id, medecin_id: session.user?.id, notes: ordoNotes }, token);
        const ordo = Array.isArray(ordoRes) ? ordoRes[0] : ordoRes;
        if (ordo?.id) {
          for (const l of ordoLignes) {
            if (l.medicament_nom) await dbAPI.post('ordonnance_lignes', { ...l, ordonnance_id: ordo.id, quantite: parseInt(l.quantite) || 1 }, token);
          }
        }
      }

      setSaved(true);
      setForm({ motif: '', tension_arterielle: '', temperature: '', poids: '', taille: '', pouls: '', saturation: '', examen_clinique: '', diagnostic: '', code_cim10: '', conduite_a_tenir: '', recommandations: '', statut: 'termine' });
      setAnalyses([]); setOrdoLignes([]); setOrdoNotes(''); setSelectedPatient(null);
    } catch (e) { setError('Erreur inattendue.'); }
    setSaving(false);
  };

  const filteredPatients = patients.filter(p => `${p.nom} ${p.prenom || ''}`.toLowerCase().includes(patientSearch.toLowerCase()));

  if (saved) return (
    <div className="fade-in">
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Consultation enregistrée !</div>
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>La consultation a été sauvegardée avec les analyses et l'ordonnance.</p>
        <button className="btn btn-primary" onClick={() => setSaved(false)}>+ Nouvelle consultation</button>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">👤 Patient</span></div>
        {selectedPatient
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'var(--accent)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{mkAvatar(`${selectedPatient.nom} ${selectedPatient.prenom || ''}`)}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{selectedPatient.nom} {selectedPatient.prenom}</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{age(selectedPatient.date_naissance)} | {selectedPatient.groupe_sanguin || 'Gr. sanguin inconnu'} {selectedPatient.allergies && '| ⚠️ ' + selectedPatient.allergies}</div></div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPatient(null)}>Changer</button>
          </div>
          : <div>
            <input className="form-input" placeholder="Rechercher un patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} style={{ marginBottom: 10 }} />
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
              {filteredPatients.slice(0, 10).map(p => (
                <div key={p.id} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }} onClick={() => setSelectedPatient(p)} className="table">
                  <strong>{p.nom} {p.prenom}</strong> <span style={{ color: 'var(--text3)' }}>{age(p.date_naissance)} — {p.telephone || ''}</span>
                </div>
              ))}
            </div>
          </div>
        }
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">📊 Constantes vitales</span></div>
        <div className="form-row-3">
          <div className="form-group"><label className="form-label">Tension (mmHg)</label><input className="form-input" placeholder="Ex: 120/80" value={form.tension_arterielle} onChange={e => setForm(f => ({ ...f, tension_arterielle: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Température (°C)</label><input className="form-input" type="number" placeholder="37.0" value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Pouls (bpm)</label><input className="form-input" type="number" placeholder="70" value={form.pouls} onChange={e => setForm(f => ({ ...f, pouls: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Poids (kg)</label><input className="form-input" type="number" placeholder="70" value={form.poids} onChange={e => setForm(f => ({ ...f, poids: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Taille (cm)</label><input className="form-input" type="number" placeholder="170" value={form.taille} onChange={e => setForm(f => ({ ...f, taille: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Saturation (%)</label><input className="form-input" type="number" placeholder="98" value={form.saturation} onChange={e => setForm(f => ({ ...f, saturation: e.target.value }))} /></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">🔍 Consultation</span></div>
        <div className="form-group"><label className="form-label">Motif de consultation *</label><input className="form-input" placeholder="Ex: Fièvre depuis 3 jours" value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">Examen clinique</label><textarea className="form-textarea" placeholder="Observations de l'examen physique..." value={form.examen_clinique} onChange={e => setForm(f => ({ ...f, examen_clinique: e.target.value }))} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Diagnostic *</label><input className="form-input" placeholder="Ex: Paludisme simple" value={form.diagnostic} onChange={e => setForm(f => ({ ...f, diagnostic: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Code CIM-10</label><input className="form-input" placeholder="Ex: B54" value={form.code_cim10} onChange={e => setForm(f => ({ ...f, code_cim10: e.target.value }))} /></div>
        </div>
        <div className="form-group"><label className="form-label">Conduite à tenir</label><textarea className="form-textarea" value={form.conduite_a_tenir} onChange={e => setForm(f => ({ ...f, conduite_a_tenir: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">Recommandations</label><textarea className="form-textarea" value={form.recommandations} onChange={e => setForm(f => ({ ...f, recommandations: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">Statut</label>
          <select className="form-select" value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
            <option value="termine">Terminé</option>
            <option value="en_cours">En cours</option>
            <option value="suivi_requis">Suivi requis</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">🔬 Analyses</span>
          <button className="btn btn-secondary btn-sm" onClick={addAnalyse}>+ Ajouter</button>
        </div>
        {analyses.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>Aucune analyse prescrite.</p>
          : analyses.map((a, i) => (
            <div key={i} className="analyse-item">
              <div className="form-row" style={{ marginBottom: 8 }}>
                <div className="form-group" style={{ marginBottom: 0 }}><input className="form-input" placeholder="Nom de l'analyse *" value={a.nom} onChange={e => updAnalyse(i, 'nom', e.target.value)} /></div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select className="form-select" value={a.type} onChange={e => updAnalyse(i, 'type', e.target.value)}>
                    <option value="interne">🏥 Interne</option>
                    <option value="externe">🔗 Externe</option>
                  </select>
                </div>
              </div>
              {a.type === 'externe' && <div className="form-group" style={{ marginBottom: 8 }}><input className="form-input" placeholder="Nom du laboratoire externe" value={a.laboratoire_externe} onChange={e => updAnalyse(i, 'laboratoire_externe', e.target.value)} /></div>}
              <div className="form-row" style={{ marginBottom: 8 }}>
                <div className="form-group" style={{ marginBottom: 0 }}><input className="form-input" placeholder="Résultat (si disponible)" value={a.resultat} onChange={e => updAnalyse(i, 'resultat', e.target.value)} /></div>
                <div className="form-group" style={{ marginBottom: 0 }}><input className="form-input" placeholder="Valeurs de référence" value={a.valeurs_reference} onChange={e => updAnalyse(i, 'valeurs_reference', e.target.value)} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="form-select" style={{ flex: 1 }} value={a.statut} onChange={e => updAnalyse(i, 'statut', e.target.value)}>
                  <option value="prescrit">Prescrit</option>
                  <option value="en_attente">En attente</option>
                  <option value="resultat_recu">Résultat reçu</option>
                </select>
                <button className="btn btn-danger btn-sm" onClick={() => delAnalyse(i)}>🗑️</button>
              </div>
            </div>
          ))
        }
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">💊 Ordonnance</span>
          <button className="btn btn-secondary btn-sm" onClick={addLigne}>+ Ajouter médicament</button>
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}><label className="form-label">Notes ordonnance</label><input className="form-input" placeholder="Ex: À prendre pendant les repas" value={ordoNotes} onChange={e => setOrdoNotes(e.target.value)} /></div>
        {ordoLignes.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>Aucun médicament prescrit.</p>
          : ordoLignes.map((l, i) => (
            <div key={i} className="medicament-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div className="form-row" style={{ marginBottom: 8 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Médicament *</label>
                  <select className="form-select" onChange={e => { if (e.target.value) fillFromMed(i, e.target.value); }}>
                    <option value="">— Choisir du stock —</option>
                    {meds.map(m => <option key={m.id} value={m.id}>{m.nom} {m.dosage} (stock: {m.stock_actuel})</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ou saisir manuellement</label>
                  <input className="form-input" placeholder="Nom du médicament" value={l.medicament_nom} onChange={e => updLigne(i, 'medicament_nom', e.target.value)} />
                </div>
              </div>
              <div className="form-row" style={{ marginBottom: 8 }}>
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Dosage</label><input className="form-input" placeholder="Ex: 500mg" value={l.dosage} onChange={e => updLigne(i, 'dosage', e.target.value)} /></div>
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Forme</label><select className="form-select" value={l.forme} onChange={e => updLigne(i, 'forme', e.target.value)}><option value="">—</option><option>Comprimé</option><option>Sirop</option><option>Injectable</option><option>Capsule</option><option>Pommade</option></select></div>
              </div>
              <div className="form-row" style={{ marginBottom: 8 }}>
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Posologie</label><input className="form-input" placeholder="Ex: 2 cp matin et soir" value={l.posologie} onChange={e => updLigne(i, 'posologie', e.target.value)} /></div>
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Durée</label><input className="form-input" placeholder="Ex: 5 jours" value={l.duree} onChange={e => updLigne(i, 'duree', e.target.value)} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}><label className="form-label">Quantité</label><input className="form-input" type="number" min="1" value={l.quantite} onChange={e => updLigne(i, 'quantite', e.target.value)} /></div>
                <div style={{ flex: 2 }}><label className="form-label">Instructions spéciales</label><input className="form-input" placeholder="Ex: Éviter le soleil" value={l.instructions} onChange={e => updLigne(i, 'instructions', e.target.value)} /></div>
                <div style={{ paddingTop: 20 }}><button className="btn btn-danger btn-sm" onClick={() => delLigne(i)}>🗑️</button></div>
              </div>
            </div>
          ))
        }
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-secondary" onClick={() => { setForm({ motif: '', tension_arterielle: '', temperature: '', poids: '', taille: '', pouls: '', saturation: '', examen_clinique: '', diagnostic: '', code_cim10: '', conduite_a_tenir: '', recommandations: '', statut: 'termine' }); setAnalyses([]); setOrdoLignes([]); }}>Réinitialiser</button>
        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ minWidth: 160 }}>
          {saving && <Spinner />}{saving ? 'Enregistrement...' : '💾 Enregistrer la consultation'}
        </button>
      </div>
    </div>
  );
}

// ========== RENDEZ-VOUS ==========

function RendezVousPage({ session, clinique }) {
  const [rdvs, setRdvs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patient_id: '', date_heure: '', motif: '', statut: 'planifie', notes: '' });
  const [saving, setSaving] = useState(false);
  const token = session?.access_token;

  const load = useCallback(async () => {
    setLoading(true);
    const [r, p] = await Promise.all([
      dbAPI.get('rendez_vous', `clinique_id=eq.${clinique.id}&order=date_heure.asc`, token),
      dbAPI.get('patients', `clinique_id=eq.${clinique.id}&order=nom.asc`, token),
    ]);
    if (Array.isArray(r)) setRdvs(r);
    if (Array.isArray(p)) setPatients(p);
    setLoading(false);
  }, [clinique.id, token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.patient_id || !form.date_heure) return;
    setSaving(true);
    await dbAPI.post('rendez_vous', { ...form, clinique_id: clinique.id }, token);
    await load();
    setShowModal(false);
    setForm({ patient_id: '', date_heure: '', motif: '', statut: 'planifie', notes: '' });
    setSaving(false);
  };

  const updateStatut = async (id, statut) => {
    await dbAPI.patch('rendez_vous', `id=eq.${id}`, { statut }, token);
    await load();
  };

  const statutColor = (s) => ({ planifie: '#a0aec0', confirme: 'var(--accent)', en_attente: 'var(--accent3)', annule: 'var(--danger)', termine: 'var(--accent2)' }[s] || '#a0aec0');
  const statutLabel = (s) => ({ planifie: 'Planifié', confirme: 'Confirmé', en_attente: 'En attente', annule: 'Annulé', termine: 'Terminé' }[s] || s);

  const getPatient = (id) => patients.find(p => p.id === id);

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <span className="card-title">📅 Rendez-vous</span>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nouveau RDV</button>
        </div>
        {loading ? <div className="loading"><Spinner dark /> Chargement...</div>
          : rdvs.length === 0 ? <div className="empty"><div className="empty-icon">📅</div><p>Aucun rendez-vous</p></div>
            : <table className="table">
              <thead><tr><th>Date & Heure</th><th>Patient</th><th>Motif</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>{rdvs.map(r => {
                const p = getPatient(r.patient_id);
                return (
                  <tr key={r.id}>
                    <td><strong>{new Date(r.date_heure).toLocaleDateString('fr-FR')}</strong><br /><span style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(r.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></td>
                    <td>{p ? `${p.nom} ${p.prenom || ''}` : '—'}</td>
                    <td>{r.motif || '—'}</td>
                    <td><span className="badge" style={{ background: `${statutColor(r.statut)}22`, color: statutColor(r.statut) }}>{statutLabel(r.statut)}</span></td>
                    <td>
                      <select className="form-select" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} value={r.statut} onChange={e => updateStatut(r.id, e.target.value)}>
                        <option value="planifie">Planifié</option>
                        <option value="confirme">Confirmé</option>
                        <option value="en_attente">En attente</option>
                        <option value="termine">Terminé</option>
                        <option value="annule">Annulé</option>
                      </select>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
        }
      </div>

      {showModal && (
        <Modal title="Nouveau rendez-vous" onClose={() => setShowModal(false)} footer={
          <><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving && <Spinner />} Enregistrer</button></>
        }>
          <div className="form-group"><label className="form-label">Patient *</label>
            <select className="form-select" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
              <option value="">— Sélectionner —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenom || ''}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Date et heure *</label><input className="form-input" type="datetime-local" value={form.date_heure} onChange={e => setForm(f => ({ ...f, date_heure: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Motif</label><input className="form-input" placeholder="Raison de la consultation" value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </Modal>
      )}
    </div>
  );
}

// ========== PHARMACIE ==========

function PharmaciePage({ session, clinique }) {
  const [meds, setMeds] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReappro, setShowReappro] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [reapproQty, setReapproQty] = useState('');
  const [reapproNotes, setReapproNotes] = useState('');
  const [form, setForm] = useState({ nom: '', forme: '', dosage: '', categorie: '', prix_unitaire: '', stock_actuel: '', stock_minimum: 10, date_expiration: '', fournisseur: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [onglet, setOnglet] = useState('stock');
  const token = session?.access_token;

  const load = useCallback(async () => {
    setLoading(true);
    const d = await dbAPI.get('medicaments', `clinique_id=eq.${clinique.id}&order=nom.asc`, token);
    if (Array.isArray(d)) setMeds(d);
    setLoading(false);
  }, [clinique.id, token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.nom) return;
    setSaving(true);
    await dbAPI.post('medicaments', { ...form, clinique_id: clinique.id, prix_unitaire: parseFloat(form.prix_unitaire) || 0, stock_actuel: parseInt(form.stock_actuel) || 0, stock_minimum: parseInt(form.stock_minimum) || 10 }, token);
    await load();
    setShowModal(false);
    setForm({ nom: '', forme: '', dosage: '', categorie: '', prix_unitaire: '', stock_actuel: '', stock_minimum: 10, date_expiration: '', fournisseur: '' });
    setSaving(false);
  };

  const doReappro = async () => {
    if (!selectedMed || !reapproQty) return;
    setSaving(true);
    const newStock = selectedMed.stock_actuel + parseInt(reapproQty);
    await dbAPI.patch('medicaments', `id=eq.${selectedMed.id}`, { stock_actuel: newStock }, token);
    await load();
    setShowReappro(false);
    setSelectedMed(null);
    setReapproQty('');
    setReapproNotes('');
    setSaving(false);
  };

  const filtered = meds.filter(m => `${m.nom} ${m.forme || ''} ${m.categorie || ''}`.toLowerCase().includes(search.toLowerCase()));
  const totalValeur = meds.reduce((acc, m) => acc + (m.stock_actuel * m.prix_unitaire), 0);
  const alertes = meds.filter(m => m.stock_actuel <= m.stock_minimum);
  const ruptures = meds.filter(m => m.stock_actuel === 0);

  return (
    <div className="fade-in">
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 16 }}>
        <div className="stat-card green"><div className="stat-icon">💊</div><div className="stat-value">{meds.length}</div><div className="stat-label">Médicaments</div></div>
        <div className="stat-card orange"><div className="stat-icon">💰</div><div className="stat-value">{fmtMoney(totalValeur)}</div><div className="stat-label">Valeur totale stock</div></div>
        <div className="stat-card red"><div className="stat-icon">⚠️</div><div className="stat-value">{alertes.length}</div><div className="stat-label">Alertes stock bas</div><div className="stat-sub" style={{ color: 'var(--danger)' }}>{ruptures.length} en rupture</div></div>
      </div>

      <div className="tabs-bar">
        <button className={`tab-btn ${onglet === 'stock' ? 'active' : ''}`} onClick={() => setOnglet('stock')}>📦 Stock</button>
        <button className={`tab-btn ${onglet === 'alertes' ? 'active' : ''}`} onClick={() => setOnglet('alertes')}>⚠️ Alertes ({alertes.length})</button>
      </div>

      {onglet === 'stock' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">📦 Stock médicaments</span>
            <div className="search-bar">
              <input className="search-input" placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Ajouter</button>
            </div>
          </div>
          {loading ? <div className="loading"><Spinner dark /> Chargement...</div>
            : filtered.length === 0 ? <div className="empty"><div className="empty-icon">💊</div><p>Aucun médicament</p></div>
              : <table className="table">
                <thead><tr><th>Médicament</th><th>Forme</th><th>Prix unit.</th><th>Stock initial→actuel</th><th>Valeur stock</th><th>Expiration</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>{filtered.map(m => {
                  const alerte = m.stock_actuel <= m.stock_minimum;
                  const rupture = m.stock_actuel === 0;
                  const valeur = m.stock_actuel * m.prix_unitaire;
                  const pct = Math.min(100, Math.round((m.stock_actuel / Math.max(1, m.stock_minimum)) * 100));
                  return (
                    <tr key={m.id}>
                      <td><strong>{m.nom}</strong>{m.dosage && <span style={{ color: 'var(--text3)', fontSize: 12 }}> {m.dosage}</span>}<br /><span style={{ fontSize: 11, color: 'var(--text3)' }}>{m.categorie || ''}</span></td>
                      <td>{m.forme || '—'}</td>
                      <td>{fmtMoney(m.prix_unitaire)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ color: rupture ? 'var(--danger)' : alerte ? 'var(--accent3)' : 'var(--accent)', fontSize: 16 }}>{m.stock_actuel}</strong>
                          <span style={{ color: 'var(--text3)', fontSize: 12 }}>/ min {m.stock_minimum}</span>
                        </div>
                        <div className="stock-bar"><div className="stock-fill" style={{ width: `${pct}%`, background: rupture ? 'var(--danger)' : alerte ? 'var(--accent3)' : 'var(--accent)' }} /></div>
                      </td>
                      <td><strong>{fmtMoney(valeur)}</strong></td>
                      <td style={{ fontSize: 12 }}>{m.date_expiration ? fmtDate(m.date_expiration) : '—'}</td>
                      <td>{rupture ? <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>Rupture</span>
                        : alerte ? <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent3)' }}>Stock bas</span>
                          : <span className="badge" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--accent)' }}>OK</span>}
                      </td>
                      <td><button className="btn btn-info btn-sm" onClick={() => { setSelectedMed(m); setShowReappro(true); }}>📥 Réappro</button></td>
                    </tr>
                  );
                })}</tbody>
              </table>
          }
        </div>
      )}

      {onglet === 'alertes' && (
        <div className="card">
          <div className="card-header"><span className="card-title">⚠️ Médicaments en alerte</span></div>
          {alertes.length === 0 ? <div className="empty"><div className="empty-icon">✅</div><p>Tous les stocks sont OK</p></div>
            : alertes.map(m => {
              const pct = Math.min(100, Math.round((m.stock_actuel / Math.max(1, m.stock_minimum)) * 100));
              return (
                <div key={m.id} style={{ border: `1px solid ${m.stock_actuel === 0 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: 8, padding: 14, marginBottom: 10, background: m.stock_actuel === 0 ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div><strong>{m.nom} {m.dosage}</strong> <span style={{ fontSize: 12, color: 'var(--text3)' }}>{m.forme}</span></div>
                    <button className="btn btn-primary btn-sm" onClick={() => { setSelectedMed(m); setShowReappro(true); }}>📥 Réapprovisionner</button>
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 13, marginBottom: 6 }}>
                    <span>Stock actuel : <strong style={{ color: m.stock_actuel === 0 ? 'var(--danger)' : 'var(--accent3)' }}>{m.stock_actuel}</strong></span>
                    <span>Minimum requis : <strong>{m.stock_minimum}</strong></span>
                    <span>Valeur restante : <strong>{fmtMoney(m.stock_actuel * m.prix_unitaire)}</strong></span>
                  </div>
                  <div className="stock-bar"><div className="stock-fill" style={{ width: `${pct}%`, background: m.stock_actuel === 0 ? 'var(--danger)' : 'var(--accent3)' }} /></div>
                </div>
              );
            })
          }
        </div>
      )}

      {showModal && (
        <Modal title="Ajouter un médicament" onClose={() => setShowModal(false)} footer={
          <><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving && <Spinner />} Enregistrer</button></>
        }>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" placeholder="Ex: Paracétamol" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Dosage</label><input className="form-input" placeholder="Ex: 500mg" value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Forme</label><select className="form-select" value={form.forme} onChange={e => setForm(f => ({ ...f, forme: e.target.value }))}><option value="">—</option><option>Comprimé</option><option>Sirop</option><option>Injectable</option><option>Capsule</option><option>Pommade</option><option>Collyre</option><option>Suppositoire</option></select></div>
            <div className="form-group"><label className="form-label">Catégorie</label><input className="form-input" placeholder="Ex: Antalgique" value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Prix unitaire (FCFA)</label><input className="form-input" type="number" value={form.prix_unitaire} onChange={e => setForm(f => ({ ...f, prix_unitaire: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Stock initial</label><input className="form-input" type="number" value={form.stock_actuel} onChange={e => setForm(f => ({ ...f, stock_actuel: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Stock minimum</label><input className="form-input" type="number" value={form.stock_minimum} onChange={e => setForm(f => ({ ...f, stock_minimum: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Date expiration</label><input className="form-input" type="date" value={form.date_expiration} onChange={e => setForm(f => ({ ...f, date_expiration: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Fournisseur</label><input className="form-input" value={form.fournisseur} onChange={e => setForm(f => ({ ...f, fournisseur: e.target.value }))} /></div>
        </Modal>
      )}

      {showReappro && selectedMed && (
        <Modal title={`📥 Réapprovisionnement — ${selectedMed.nom}`} onClose={() => { setShowReappro(false); setSelectedMed(null); }} footer={
          <><button className="btn btn-secondary" onClick={() => setShowReappro(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={doReappro} disabled={saving}>{saving && <Spinner />} Confirmer</button></>
        }>
          <div className="alert alert-info">Stock actuel : <strong>{selectedMed.stock_actuel}</strong> unités | Prix unit. : <strong>{fmtMoney(selectedMed.prix_unitaire)}</strong></div>
          <div className="form-group"><label className="form-label">Quantité à ajouter *</label><input className="form-input" type="number" min="1" placeholder="Ex: 50" value={reapproQty} onChange={e => setReapproQty(e.target.value)} /></div>
          {reapproQty && <div className="alert alert-success">Nouveau stock après réappro : <strong>{selectedMed.stock_actuel + parseInt(reapproQty || 0)}</strong> unités | Valeur : <strong>{fmtMoney((selectedMed.stock_actuel + parseInt(reapproQty || 0)) * selectedMed.prix_unitaire)}</strong></div>}
          <div className="form-group"><label className="form-label">Notes</label><input className="form-input" placeholder="Ex: Livraison du 05/07/2026" value={reapproNotes} onChange={e => setReapproNotes(e.target.value)} /></div>
        </Modal>
      )}
    </div>
  );
}

// ========== FACTURATION ==========

function FacturationPage({ session, clinique }) {
  const [factures, setFactures] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patient_id: '', montant_consultation: '', montant_analyses: '', montant_medicaments: '', remise: 0, mode_paiement: 'especes', statut: 'payee' });
  const [saving, setSaving] = useState(false);
  const token = session?.access_token;

  const load = useCallback(async () => {
    setLoading(true);
    const [f, p] = await Promise.all([
      dbAPI.get('factures', `clinique_id=eq.${clinique.id}&order=created_at.desc`, token),
      dbAPI.get('patients', `clinique_id=eq.${clinique.id}&order=nom.asc`, token),
    ]);
    if (Array.isArray(f)) setFactures(f);
    if (Array.isArray(p)) setPatients(p);
    setLoading(false);
  }, [clinique.id, token]);

  useEffect(() => { load(); }, [load]);

  const totalFacture = () => {
    const c = parseFloat(form.montant_consultation) || 0;
    const a = parseFloat(form.montant_analyses) || 0;
    const m = parseFloat(form.montant_medicaments) || 0;
    const r = parseFloat(form.remise) || 0;
    return Math.max(0, c + a + m - r);
  };

  const save = async () => {
    if (!form.patient_id) return;
    setSaving(true);
    const total = totalFacture();
    await dbAPI.post('factures', {
      ...form,
      clinique_id: clinique.id,
      montant_consultation: parseFloat(form.montant_consultation) || 0,
      montant_analyses: parseFloat(form.montant_analyses) || 0,
      montant_medicaments: parseFloat(form.montant_medicaments) || 0,
      remise: parseFloat(form.remise) || 0,
      montant_total: total,
      montant_paye: form.statut === 'payee' ? total : 0,
      numero_facture: `FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    }, token);
    await load();
    setShowModal(false);
    setForm({ patient_id: '', montant_consultation: '', montant_analyses: '', montant_medicaments: '', remise: 0, mode_paiement: 'especes', statut: 'payee' });
    setSaving(false);
  };

  const getPatient = (id) => patients.find(p => p.id === id);
  const totalEncaisse = factures.filter(f => f.statut === 'payee').reduce((acc, f) => acc + (f.montant_total || 0), 0);
  const totalImpaye = factures.filter(f => f.statut === 'impayee').reduce((acc, f) => acc + (f.montant_total || 0), 0);

  const statutColor = (s) => ({ payee: 'var(--accent)', impayee: 'var(--danger)', partielle: 'var(--accent3)', annulee: 'var(--text3)' }[s] || 'var(--text3)');

  return (
    <div className="fade-in">
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 16 }}>
        <div className="stat-card green"><div className="stat-icon">💰</div><div className="stat-value">{fmtMoney(totalEncaisse)}</div><div className="stat-label">Total encaissé</div></div>
        <div className="stat-card red"><div className="stat-icon">⏳</div><div className="stat-value">{fmtMoney(totalImpaye)}</div><div className="stat-label">Impayés</div></div>
        <div className="stat-card blue"><div className="stat-icon">🧾</div><div className="stat-value">{factures.length}</div><div className="stat-label">Total factures</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">🧾 Factures</span>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nouvelle facture</button>
        </div>
        {loading ? <div className="loading"><Spinner dark /> Chargement...</div>
          : factures.length === 0 ? <div className="empty"><div className="empty-icon">🧾</div><p>Aucune facture</p></div>
            : <table className="table">
              <thead><tr><th>N° Facture</th><th>Patient</th><th>Consultation</th><th>Analyses</th><th>Médicaments</th><th>Remise</th><th>Total</th><th>Paiement</th><th>Statut</th></tr></thead>
              <tbody>{factures.map(f => {
                const p = getPatient(f.patient_id);
                return (
                  <tr key={f.id}>
                    <td><span className="tag" style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--accent2)' }}>{f.numero_facture}</span></td>
                    <td>{p ? `${p.nom} ${p.prenom || ''}` : '—'}</td>
                    <td>{fmtMoney(f.montant_consultation)}</td>
                    <td>{fmtMoney(f.montant_analyses)}</td>
                    <td>{fmtMoney(f.montant_medicaments)}</td>
                    <td style={{ color: 'var(--danger)' }}>{f.remise > 0 ? `-${fmtMoney(f.remise)}` : '—'}</td>
                    <td><strong>{fmtMoney(f.montant_total)}</strong></td>
                    <td><span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>{f.mode_paiement === 'especes' ? '💵 Espèces' : f.mode_paiement === 'mobile_money' ? '📱 Mobile Money' : f.mode_paiement}</span></td>
                    <td><span className="badge" style={{ background: `${statutColor(f.statut)}22`, color: statutColor(f.statut) }}>{f.statut === 'payee' ? '✅ Payée' : f.statut === 'impayee' ? '⏳ Impayée' : f.statut === 'partielle' ? '⚡ Partielle' : 'Annulée'}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
        }
      </div>

      {showModal && (
        <Modal title="Nouvelle facture" onClose={() => setShowModal(false)} footer={
          <><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving && <Spinner />} Créer la facture</button></>
        }>
          <div className="form-group"><label className="form-label">Patient *</label>
            <select className="form-select" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
              <option value="">— Sélectionner —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenom || ''}</option>)}
            </select>
          </div>
          <div className="form-section"><div className="form-section-title">💰 Détail des montants</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Consultation (FCFA)</label><input className="form-input" type="number" value={form.montant_consultation} onChange={e => setForm(f => ({ ...f, montant_consultation: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Analyses (FCFA)</label><input className="form-input" type="number" value={form.montant_analyses} onChange={e => setForm(f => ({ ...f, montant_analyses: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Médicaments (FCFA)</label><input className="form-input" type="number" value={form.montant_medicaments} onChange={e => setForm(f => ({ ...f, montant_medicaments: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Remise (FCFA)</label><input className="form-input" type="number" value={form.remise} onChange={e => setForm(f => ({ ...f, remise: e.target.value }))} /></div>
            </div>
            <div className="alert alert-success" style={{ fontSize: 16, fontWeight: 700 }}>Total à payer : {fmtMoney(totalFacture())}</div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Mode de paiement</label>
              <select className="form-select" value={form.mode_paiement} onChange={e => setForm(f => ({ ...f, mode_paiement: e.target.value }))}>
                <option value="especes">💵 Espèces</option>
                <option value="mobile_money">📱 Mobile Money</option>
                <option value="carte">💳 Carte bancaire</option>
                <option value="assurance">🏥 Assurance</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Statut</label>
              <select className="form-select" value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                <option value="payee">✅ Payée</option>
                <option value="impayee">⏳ Impayée</option>
                <option value="partielle">⚡ Partielle</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ========== EQUIPE ==========

function EquipePage({ session, clinique }) {
  const [equipe, setEquipe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', role: 'medecin', specialite: '', telephone: '', emailMembre: '', passwordMembre: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = session?.access_token;

  const load = useCallback(async () => {
    setLoading(true);
    const d = await dbAPI.get('profils', `clinique_id=eq.${clinique.id}&order=nom.asc`, token);
    if (Array.isArray(d)) setEquipe(d);
    setLoading(false);
  }, [clinique.id, token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.nom || !form.emailMembre || !form.passwordMembre) { setError('Champs obligatoires manquants.'); return; }
    setSaving(true); setError('');
    try {
      const authRes = await authAPI.signUp(form.emailMembre, form.passwordMembre, { nom: `${form.prenom} ${form.nom}`.trim(), role: form.role });
      if (authRes?.error) { setError(authRes.error.message || 'Erreur.'); setSaving(false); return; }
      const userId = authRes?.user?.id || authRes?.id;
      if (userId) await dbAPI.post('profils', { id: userId, clinique_id: clinique.id, nom: form.nom, prenom: form.prenom, role: form.role, specialite: form.specialite, telephone: form.telephone }, token);
      await load();
      setShowModal(false);
      setForm({ nom: '', prenom: '', role: 'medecin', specialite: '', telephone: '', emailMembre: '', passwordMembre: '' });
    } catch (e) { setError('Erreur inattendue.'); }
    setSaving(false);
  };

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <span className="card-title">👨‍⚕️ Équipe ({equipe.length})</span>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Ajouter membre</button>
        </div>
        {loading ? <div className="loading"><Spinner dark /> Chargement...</div>
          : equipe.length === 0 ? <div className="empty"><div className="empty-icon">👨‍⚕️</div><p>Aucun membre</p></div>
            : <table className="table">
              <thead><tr><th>Membre</th><th>Rôle</th><th>Spécialité</th><th>Téléphone</th></tr></thead>
              <tbody>{equipe.map(m => {
                const roleInfo = ROLES[m.role] || { label: m.role, color: '#6b7280' };
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: roleInfo.color, width: 34, height: 34, fontSize: 12 }}>{mkAvatar(`${m.nom} ${m.prenom || ''}`)}</div>
                        <strong>{m.prenom} {m.nom}</strong>
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: `${roleInfo.color}22`, color: roleInfo.color }}>{roleInfo.label}</span></td>
                    <td>{m.specialite || '—'}</td>
                    <td>{m.telephone || '—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
        }
      </div>

      {showModal && (
        <Modal title="Ajouter un membre" onClose={() => setShowModal(false)} footer={
          <><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving && <Spinner />} Créer le compte</button></>
        }>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <div className="form-row">
            <div className="form-group"><label className="form-label">Prénom</label><input className="form-input" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Rôle *</label>
              <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="medecin">Médecin</option>
                <option value="infirmier">Infirmier(e)</option>
                <option value="secretaire">Secrétaire</option>
                <option value="pharmacien">Pharmacien</option>
                <option value="caissier">Caissier</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Spécialité</label><input className="form-input" placeholder="Ex: Pédiatrie" value={form.specialite} onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Email de connexion *</label><input className="form-input" type="email" value={form.emailMembre} onChange={e => setForm(f => ({ ...f, emailMembre: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Mot de passe provisoire *</label><input className="form-input" type="password" placeholder="Min. 6 caractères" value={form.passwordMembre} onChange={e => setForm(f => ({ ...f, passwordMembre: e.target.value }))} /></div>
        </Modal>
      )}
    </div>
  );
}

// ========== PARAMETRES ==========

function ParametresPage({ session, clinique, profil }) {
  const [form, setForm] = useState({ nom: clinique.nom || '', type: clinique.type || '', ville: clinique.ville || '', pays: clinique.pays || '', adresse: clinique.adresse || '', telephone: clinique.telephone || '', email: clinique.email || '', ifu: clinique.ifu || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const token = session?.access_token;

  const save = async () => {
    setSaving(true);
    await dbAPI.patch('cliniques', `id=eq.${clinique.id}`, form, token);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="fade-in">
      {saved && <div className="alert alert-success">✅ Paramètres sauvegardés avec succès !</div>}
      <div className="card">
        <div className="card-header"><span className="card-title">⚙️ Informations de la clinique</span></div>
        <div className="form-group"><label className="form-label">Nom de la clinique</label><input className="form-input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="clinique">Clinique</option><option value="hopital">Hôpital</option><option value="cabinet">Cabinet médical</option><option value="polyclinique">Polyclinique</option><option value="centre_sante">Centre de santé</option></select></div>
          <div className="form-group"><label className="form-label">Ville</label><input className="form-input" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Pays</label><input className="form-input" value={form.pays} onChange={e => setForm(f => ({ ...f, pays: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} /></div>
        </div>
        <div className="form-group"><label className="form-label">Adresse complète</label><input className="form-input" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">IFU</label><input className="form-input" value={form.ifu} onChange={e => setForm(f => ({ ...f, ifu: e.target.value }))} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving && <Spinner />} Sauvegarder</button>
        </div>
      </div>
    </div>
  );
}

// ========== APP PRINCIPAL ==========

export default function App() {
  const [session, setSession] = useState(null);
  const [profil, setProfil] = useState(null);
  const [clinique, setClinique] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [view, setView] = useState('login');
  const [patientPourConsult, setPatientPourConsult] = useState(null);

  const handleLogin = async (sessionData) => {
    const token = sessionData.access_token;
    const userId = sessionData.user?.id;
    setSession(sessionData);
    const p = await dbAPI.get('profils', `id=eq.${userId}`, token);
    if (Array.isArray(p) && p.length > 0) {
      setProfil(p[0]);
      const c = await dbAPI.get('cliniques', `id=eq.${p[0].clinique_id}`, token);
      if (Array.isArray(c) && c.length > 0) setClinique(c[0]);
    }
  };

  const handleLogout = () => { setSession(null); setProfil(null); setClinique(null); setPage('dashboard'); setView('login'); };

  const lancerConsultation = (patient) => { setPatientPourConsult(patient); setPage('consultations'); };

  const roleInfo = profil ? (ROLES[profil.role] || { label: profil.role, color: '#6b7280' }) : null;
  const navItems = NAV_ITEMS.filter(item => !profil || item.roles.includes(profil.role));
  const pageInfo = NAV_ITEMS.find(n => n.id === page);

  if (!session || !profil || !clinique) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="login-page">
          <div className="login-card">
            <div className="logo-wrap">
              <div className="logo-icon" style={{ width: 56, height: 56, borderRadius: 16, fontSize: 22, margin: '0 auto 12px' }}>C+</div>
              <div className="logo-name">CliniPlus</div>
              <div className="logo-sub-text">Gestion clinique intelligente</div>
            </div>
            {view === 'login' && <LoginForm onLogin={handleLogin} onRegister={() => setView('register')} onReset={() => setView('reset')} />}
            {view === 'register' && <RegisterForm onLogin={handleLogin} onBack={() => setView('login')} />}
            {view === 'reset' && (
              <div>
                <div className="alert alert-info">ℹ️ Entrez votre email pour recevoir un lien de réinitialisation.</div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="votre@email.com" /></div>
                <button className="btn btn-primary" style={{ width: '100%', padding: 12 }}>Envoyer le lien</button>
                <div style={{ textAlign: 'center', marginTop: 12 }}><button className="link-btn" onClick={() => setView('login')}>← Retour</button></div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">C+</div>
            <div><div className="logo-text">CliniPlus</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>Gestion clinique</div></div>
          </div>
          <nav className="nav">
            {navItems.map(item => (
              <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="user-card" onClick={handleLogout} title="Cliquer pour se déconnecter">
              <div className="avatar" style={{ background: roleInfo?.color || 'var(--accent)', width: 34, height: 34, fontSize: 12 }}>{mkAvatar(`${profil.nom} ${profil.prenom || ''}`)}</div>
              <div className="user-info">
                <div className="user-name">{profil.prenom} {profil.nom}</div>
                <div className="user-role">{roleInfo?.label}</div>
              </div>
              <span style={{ fontSize: 14, color: 'var(--text3)' }}>↪</span>
            </div>
          </div>
        </div>

        <div className="main">
          <div className="topbar">
            <span className="topbar-title">{pageInfo?.icon} {pageInfo?.label}</span>
            <span className="topbar-badge">🏥 {clinique.nom}</span>
          </div>
          <div className="content">
            {page === 'dashboard' && <DashboardPage session={session} clinique={clinique} profil={profil} />}
            {page === 'patients' && <PatientsPage session={session} clinique={clinique} onConsult={lancerConsultation} />}
            {page === 'consultations' && <ConsultationsPage session={session} clinique={clinique} patientInitial={patientPourConsult} onClearPatient={() => setPatientPourConsult(null)} />}
            {page === 'rendez_vous' && <RendezVousPage session={session} clinique={clinique} />}
            {page === 'pharmacie' && <PharmaciePage session={session} clinique={clinique} />}
            {page === 'facturation' && <FacturationPage session={session} clinique={clinique} />}
            {page === 'equipe' && <EquipePage session={session} clinique={clinique} />}
            {page === 'parametres' && <ParametresPage session={session} clinique={clinique} profil={profil} />}
          </div>
        </div>
      </div>
    </>
  );
}
