import { useState, useEffect } from "react";

const SUPABASE_URL = 'https://dnummfgcdtqjjioatbsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudW1tZmdjZHRxamppb2F0YnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTcwMjgsImV4cCI6MjA5ODU3MzAyOH0.lD7hRRlKiV_R7UMGc_gGPQAmBM9awi5IwAsf5Q6FQ3c';

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

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#f0f4f8;--surface:#ffffff;--surface2:#f8fafc;
    --border:#e2e8f0;--accent:#00c896;--accent2:#0ea5e9;
    --accent3:#f59e0b;--danger:#ef4444;--purple:#8b5cf6;
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
  .logo-sub{font-size:10px;color:var(--text3);letter-spacing:0.5px;}
  .nav{padding:12px 8px;flex:1;overflow-y:auto;}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;color:var(--text2);font-size:13.5px;transition:all 0.15s;margin-bottom:2px;}
  .nav-item:hover{background:var(--surface2);color:var(--text);}
  .nav-item.active{background:rgba(0,200,150,0.1);color:var(--accent);font-weight:600;}
  .nav-icon{font-size:16px;width:20px;text-align:center;}
  .sidebar-footer{padding:12px;border-top:1px solid var(--border);}
  .user-card{display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:10px;cursor:pointer;}
  .user-card:hover{background:rgba(0,200,150,0.05);}
  .avatar{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:12px;flex-shrink:0;}
  .user-info{flex:1;min-width:0;}
  .user-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .user-role{font-size:11px;color:var(--text3);}
  .main{margin-left:240px;flex:1;display:flex;flex-direction:column;}
  .topbar{height:60px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;gap:16px;position:sticky;top:0;z-index:50;}
  .topbar-title{font-family:var(--font-display);font-size:17px;font-weight:700;flex:1;}
  .topbar-clinique{font-size:12px;color:var(--text3);background:var(--surface2);padding:4px 10px;border-radius:20px;border:1px solid var(--border);}
  .content{padding:24px;flex:1;}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}
  .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;position:relative;overflow:hidden;}
  .stat-card::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
  .stat-card.green::after{background:var(--accent);}
  .stat-card.blue::after{background:var(--accent2);}
  .stat-card.orange::after{background:var(--accent3);}
  .stat-card.purple::after{background:var(--purple);}
  .stat-icon{font-size:28px;margin-bottom:12px;}
  .stat-value{font-family:var(--font-display);font-size:28px;font-weight:800;line-height:1;}
  .stat-label{font-size:12px;color:var(--text3);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;}
  .card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
  .card-title{font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:none;font-family:var(--font-body);transition:all 0.15s;}
  .btn:disabled{opacity:0.5;cursor:not-allowed;}
  .btn-primary{background:var(--accent);color:#fff;}
  .btn-primary:hover:not(:disabled){background:#00b085;}
  .btn-secondary{background:var(--surface2);color:var(--text);border:1px solid var(--border);}
  .btn-secondary:hover{border-color:var(--accent);color:var(--accent);}
  .btn-danger{background:rgba(239,68,68,0.1);color:var(--danger);border:1px solid rgba(239,68,68,0.2);}
  .btn-sm{padding:6px 12px;font-size:12px;}
  .badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;}
  .table{width:100%;border-collapse:collapse;}
  .table th{text-align:left;padding:10px 14px;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid var(--border);}
  .table td{padding:12px 14px;font-size:13.5px;border-bottom:1px solid rgba(226,232,240,0.5);}
  .table tr:last-child td{border-bottom:none;}
  .table tr:hover td{background:var(--surface2);}
  .empty{text-align:center;padding:40px;color:var(--text3);}
  .empty-icon{font-size:36px;margin-bottom:8px;}
  .form-group{margin-bottom:16px;}
  .form-label{display:block;font-size:12px;color:var(--text2);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;}
  .form-input,.form-select,.form-textarea{width:100%;padding:10px 14px;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;color:var(--text);font-size:13.5px;font-family:var(--font-body);transition:border-color 0.15s;}
  .form-input:focus,.form-select:focus,.form-textarea:focus{outline:none;border-color:var(--accent);}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .form-textarea{resize:vertical;min-height:80px;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;}
  .modal{background:var(--surface);border-radius:16px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);}
  .modal-header{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
  .modal-title{font-family:var(--font-display);font-size:16px;font-weight:700;}
  .modal-body{padding:24px;}
  .modal-footer{padding:16px 24px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end;}
  .modal-close{background:none;border:none;font-size:18px;cursor:pointer;color:var(--text3);}
  .alert{padding:12px 16px;border-radius:8px;font-size:13px;margin-bottom:16px;}
  .alert-error{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:var(--danger);}
  .alert-success{background:rgba(0,200,150,0.08);border:1px solid rgba(0,200,150,0.2);color:var(--accent);}
  .alert-warning{background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);color:var(--accent3);}
  .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;margin-right:8px;}
  .spinner-dark{border-color:rgba(0,0,0,0.1);border-top-color:var(--accent);}
  .loading{display:flex;align-items:center;justify-content:center;padding:40px;color:var(--text3);}
  .tag{display:inline-flex;align-items:center;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;margin-right:4px;}
  .login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f0f4f8,#e8f5f0);padding:20px;}
  .login-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:40px;width:100%;max-width:480px;box-shadow:var(--shadow);}
  .logo-wrap{text-align:center;margin-bottom:32px;}
  .logo-name{font-family:var(--font-display);font-size:24px;font-weight:800;}
  .logo-sub-text{font-size:12px;color:var(--text3);margin-top:4px;}
  .tabs{display:flex;gap:4px;background:var(--surface2);padding:4px;border-radius:10px;margin-bottom:24px;}
  .tab{flex:1;padding:9px;border-radius:7px;border:none;background:none;color:var(--text2);font-size:13px;cursor:pointer;font-family:var(--font-body);font-weight:500;transition:all 0.15s;}
  .tab.active{background:var(--surface);color:var(--accent);font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,0.1);}
  .step-indicator{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:24px;}
  .step{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;}
  .step.active{background:var(--accent);color:#fff;}
  .step.inactive{background:var(--border);color:var(--text3);}
  .step-line{flex:1;height:2px;background:var(--border);max-width:40px;}
  .step-line.done{background:var(--accent);}
  .plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}
  .plan-card{border:2px solid var(--border);border-radius:10px;padding:14px;cursor:pointer;transition:all 0.15s;}
  .plan-card.selected{border-color:var(--accent);background:rgba(0,200,150,0.04);}
  .plan-name{font-weight:700;font-size:13px;}
  .plan-prix{color:var(--accent);font-size:12px;font-weight:600;margin-top:2px;}
  .plan-desc{color:var(--text3);font-size:11px;margin-top:4px;}
  .link-btn{background:none;border:none;color:var(--accent);font-size:13px;cursor:pointer;font-family:var(--font-body);text-decoration:underline;}
  .divider{text-align:center;color:var(--text3);font-size:12px;margin:16px 0;position:relative;}
  .divider::before,.divider::after{content:'';position:absolute;top:50%;width:42%;height:1px;background:var(--border);}
  .divider::before{left:0;}.divider::after{right:0;}
  .stock-alert{background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:10px;margin-bottom:8px;}
  .progress-bar{height:6px;background:var(--surface2);border-radius:3px;overflow:hidden;margin-top:6px;}
  .progress-fill{height:100%;border-radius:3px;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @media(max-width:768px){.sidebar{display:none;}.main{margin-left:0;}.stats-grid{grid-template-columns:1fr 1fr;}.grid-2{grid-template-columns:1fr;}}
`;

const mkAvatar = (nom) => nom ? nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

const Modal = ({ title, children, onClose, footer }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-header">
        <span className="modal-title">{title}</span>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </div>
  </div>
);

// ==================== AUTH ====================

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
      <button className="btn btn-primary" style={{ width: '100%', padding: 12, marginTop: 8 }} onClick={doLogin} disabled={loading}>
        {loading && <span className="spinner" />}{loading ? 'Connexion...' : 'Se connecter'}
      </button>
      <div className="divider">ou</div>
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
        <div className={`step ${step >= 1 ? 'active' : 'inactive'}`}>1</div>
        <div className={`step-line ${step >= 2 ? 'done' : ''}`} />
        <div className={`step ${step >= 2 ? 'active' : 'inactive'}`}>2</div>
        <div className={`step-line ${step >= 3 ? 'done' : ''}`} />
        <div className={`step ${step >= 3 ? 'active' : 'inactive'}`}>3</div>
      </div>
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {step === 1 && (
        <div>
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
        <div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Choisissez votre plan :</p>
          <div className="plan-grid">{plans.map(p => (<div key={p.id} className={`plan-card ${reg.plan === p.id ? 'selected' : ''}`} onClick={() => set('plan', p.id)}><div className="plan-name">{p.nom}</div><div className="plan-prix">{p.prix}</div><div className="plan-desc">{p.desc}</div></div>))}</div>
          <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} onClick={() => setStep(3)}>Suivant →</button>
          <div style={{ textAlign: 'center', marginTop: 12 }}><button className="link-btn" onClick={() => setStep(1)}>← Retour</button></div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Prénom *</label><input className="form-input" placeholder="Jean" value={reg.prenomAdmin} onChange={e => set('prenomAdmin', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" placeholder="DUPONT" value={reg.nomAdmin} onChange={e => set('nomAdmin', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Email connexion *</label><input className="form-input" type="email" placeholder="admin@email.com" value={reg.emailAdmin} onChange={e => set('emailAdmin', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Mot de passe *</label><input className="form-input" type="password" placeholder="••••••••" value={reg.passwordAdmin} onChange={e => set('passwordAdmin', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Confirmer *</label><input className="form-input" type="password" placeholder="••••••••" value={reg.confirmPwd} onChange={e => set('confirmPwd', e.target.value)} /></div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} onClick={doRegister} disabled={loading}>
            {loading && <span className="spinner" />}{loading ? 'Création...' : '🏥 Créer ma clinique'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 12 }}><button className="link-btn" onClick={() => setStep(2)}>← Retour</button></div>
        </div>
      )}
    </div>
  );
}

// ==================== DASHBOARD ====================

function StatCard({ icon, value, label, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function DashboardPage({ session, clinique, profil }) {
  const [stats, setStats] = useState({ patients: 0, consultations: 0, rdv: 0, medicaments: 0 });
  const [rdvAujourdhui, setRdvAujourdhui] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const token = session?.access_token;

  useEffect(() => {
    const load = async () => {
      const [patients, consultations, rdv, meds] = await Promise.all([
        dbAPI.get('patients', `clinique_id=eq.${clinique.id}&select=id`, token),
        dbAPI.get('consultations', `clinique_id=eq.${clinique.id}&select=id`, token),
        dbAPI.get('rendez_vous', `clinique_id=eq.${clinique.id}&select=id`, token),
        dbAPI.get('medicaments', `clinique_id=eq.${clinique.id}`, token),
      ]);
      setStats({
        patients: Array.isArray(patients) ? patients.length : 0,
        consultations: Array.isArray(consultations) ? consultations.length : 0,
        rdv: Array.isArray(rdv) ? rdv.length : 0,
        medicaments: Array.isArray(meds) ? meds.length : 0,
      });
      if (Array.isArray(meds)) {
        setStockAlerts(meds.filter(m => m.stock_actuel <= m.stock_minimum));
      }
      const today = new Date().toISOString().split('T')[0];
      const rdvToday = await dbAPI.get('rendez_vous', `clinique_id=eq.${clinique.id}&date_heure=gte.${today}T00:00:00&date_heure=lte.${today}T23:59:59&select=*`, token);
      if (Array.isArray(rdvToday)) setRdvAujourdhui(rdvToday);
    };
    load();
  }, [clinique.id, token]);

  return (
    <div>
      <div className="stats-grid">
        <StatCard icon="👥" value={stats.patients} label="Patients" color="green" />
        <StatCard icon="🩺" value={stats.consultations} label="Consultations" color="blue" />
        <StatCard icon="📅" value={stats.rdv} label="Rendez-vous" color="orange" />
        <StatCard icon="💊" value={stats.medicaments} label="Médicaments" color="purple" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">📅 Rendez-vous aujourd'hui</span>
          </div>
          {rdvAujourdhui.length === 0 ? (
            <div className="empty"><div className="empty-icon">📅</div><p>Aucun rendez-vous aujourd'hui</p></div>
          ) : (
            <table className="table">
              <thead><tr><th>Heure</th><th>Motif</th><th>Statut</th></tr></thead>
              <tbody>{rdvAujourdhui.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{r.motif || '—'}</td>
                  <td><span className="badge" style={{ background: '#e8f5f0', color: 'var(--accent)' }}>{r.statut}</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">⚠️ Alertes stock</span>
          </div>
          {stockAlerts.length === 0 ? (
            <div className="empty"><div className="empty-icon">✅</div><p>Stock en ordre</p></div>
          ) : (
            stockAlerts.map(m => (
              <div key={m.id} className="stock-alert">
                <span style={{ fontSize: 20 }}>💊</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{m.nom} {m.dosage}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>Stock : {m.stock_actuel} / Min : {m.stock_minimum}</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, (m.stock_actuel / m.stock_minimum) * 100)}%`, background: m.stock_actuel === 0 ? 'var(--danger)' : 'var(--accent3)' }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== PATIENTS ====================

function PatientsPage({ session, clinique }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', date_naissance: '', sexe: 'M', telephone: '', adresse: '', profession: '', groupe_sanguin: '', allergies: '', antecedents: '' });
  const [saving, setSaving] = useState(false);
  const token = session?.access_token;

  const load = async () => {
    setLoading(true);
    const d = await dbAPI.get('patients', `clinique_id=eq.${clinique.id}&order=created_at.desc`, token);
    if (Array.isArray(d)) setPatients(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nom) return;
    setSaving(true);
    await dbAPI.post('patients', { ...form, clinique_id: clinique.id }, token);
    await load();
    setShowModal(false);
    setForm({ nom: '', prenom: '', date_naissance: '', sexe: 'M', telephone: '', adresse: '', profession: '', groupe_sanguin: '', allergies: '', antecedents: '' });
    setSaving(false);
  };

  const filtered = patients.filter(p => `${p.nom} ${p.prenom} ${p.telephone || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">👥 Liste des patients</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="form-input" style={{ width: 220 }} placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nouveau patient</button>
          </div>
        </div>
        {loading ? <div className="loading"><span className="spinner spinner-dark" /> Chargement...</div> : (
          filtered.length === 0 ? <div className="empty"><div className="empty-icon">👥</div><p>Aucun patient enregistré</p></div> : (
            <table className="table">
              <thead><tr><th>N° Dossier</th><th>Nom</th><th>Âge</th><th>Sexe</th><th>Téléphone</th><th>Groupe</th></tr></thead>
              <tbody>{filtered.map(p => (
                <tr key={p.id}>
                  <td><span className="tag" style={{ background: '#e8f5f0', color: 'var(--accent)' }}>{p.numero_dossier || '—'}</span></td>
                  <td><strong>{p.nom} {p.prenom}</strong></td>
                  <td>{p.date_naissance ? `${new Date().getFullYear() - new Date(p.date_naissance).getFullYear()} ans` : '—'}</td>
                  <td>{p.sexe === 'M' ? '♂ Masculin' : '♀ Féminin'}</td>
                  <td>{p.telephone || '—'}</td>
                  <td>{p.groupe_sanguin || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          )
        )}
      </div>

      {showModal && (
        <Modal title="Nouveau patient" onClose={() => setShowModal(false)} footer={
          <><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving && <span className="spinner" />}Enregistrer</button></>
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
            <div className="form-group"><label className="form-label">Groupe sanguin</label><select className="form-select" value={form.groupe_sanguin} onChange={e => setForm(f => ({ ...f, groupe_sanguin: e.target.value }))}><option value="">—</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div>
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

// ==================== PHARMACIE ====================

function PharmaciePage({ session, clinique }) {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nom: '', forme: '', dosage: '', categorie: '', prix_unitaire: '', stock_actuel: '', stock_minimum: 10, date_expiration: '', fournisseur: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const token = session?.access_token;

  const load = async () => {
    setLoading(true);
    const d = await dbAPI.get('medicaments', `clinique_id=eq.${clinique.id}&order=nom.asc`, token);
    if (Array.isArray(d)) setMeds(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nom) return;
    setSaving(true);
    await dbAPI.post('medicaments', { ...form, clinique_id: clinique.id, prix_unitaire: parseFloat(form.prix_unitaire) || 0, stock_actuel: parseInt(form.stock_actuel) || 0, stock_minimum: parseInt(form.stock_minimum) || 10 }, token);
    await load();
    setShowModal(false);
    setForm({ nom: '', forme: '', dosage: '', categorie: '', prix_unitaire: '', stock_actuel: '', stock_minimum: 10, date_expiration: '', fournisseur: '' });
    setSaving(false);
  };

  const filtered = meds.filter(m => m.nom.toLowerCase().includes(search.toLowerCase()));
  const alertes = meds.filter(m => m.stock_actuel <= m.stock_minimum);

  return (
    <div>
      {alertes.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          ⚠️ {alertes.length} médicament(s) en stock bas : {alertes.map(m => m.nom).join(', ')}
        </div>
      )}
      <div className="card">
        <div className="card-header">
          <span className="card-title">💊 Stock médicaments</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="form-input" style={{ width: 200 }} placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Ajouter</button>
          </div>
        </div>
        {loading ? <div className="loading"><span className="spinner spinner-dark" /> Chargement...</div> : (
          filtered.length === 0 ? <div className="empty"><div className="empty-icon">💊</div><p>Aucun médicament enregistré</p></div> : (
            <table className="table">
              <thead><tr><th>Médicament</th><th>Forme</th><th>Prix</th><th>Stock</th><th>Expiration</th><th>Statut</th></tr></thead>
              <tbody>{filtered.map(m => {
                const alerte = m.stock_actuel <= m.stock_minimum;
                const rupture = m.stock_actuel === 0;
                return (
                  <tr key={m.id}>
                    <td><strong>{m.nom}</strong>{m.dosage && <span style={{ color: 'var(--text3)', fontSize: 12 }}> {m.dosage}</span>}</td>
                    <td>{m.forme || '—'}</td>
                    <td>{m.prix_unitaire ? `${m.prix_unitaire.toLocaleString('fr-FR')} FCFA` : '—'}</td>
                    <td><strong style={{ color: rupture ? 'var(--danger)' : alerte ? 'var(--accent3)' : 'var(--accent)' }}>{m.stock_actuel}</strong> / min {m.stock_minimum}</td>
                    <td>{m.date_expiration ? new Date(m.date_expiration).toLocaleDateString('fr-FR') : '—'}</td>
                    <td>
                      {rupture ? <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>Rupture</span>
                        : alerte ? <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent3)' }}>Stock bas</span>
                          : <span className="badge" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--accent)' }}>OK</span>}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          )
        )}
      </div>

      {showModal && (
        <Modal title="Ajouter un médicament" onClose={() => setShowModal(false)} footer={
          <><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving && <span className="spinner" />}Enregistrer</button></>
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
            <div className="form-group"><label className="form-label">Stock actuel</label><input className="form-input" type="number" value={form.stock_actuel} onChange={e => setForm(f => ({ ...f, stock_actuel: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Stock minimum</label><input className="form-input" type="number" value={form.stock_minimum} onChange={e => setForm(f => ({ ...f, stock_minimum: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Date expiration</label><input className="form-input" type="date" value={form.date_expiration} onChange={e => setForm(f => ({ ...f, date_expiration: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Fournisseur</label><input className="form-input" value={form.fournisseur} onChange={e => setForm(f => ({ ...f, fournisseur: e.target.value }))} /></div>
        </Modal>
      )}
    </div>
  );
}

// ==================== ÉQUIPE ====================

function EquipePage({ session, clinique }) {
  const [equipe, setEquipe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', role: 'medecin', specialite: '', telephone: '', emailMembre: '', passwordMembre: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = session?.access_token;

  const load = async () => {
    setLoading(true);
    const d = await dbAPI.get('profils', `clinique_id=eq.${clinique.id}&order=nom.asc`, token);
    if (Array.isArray(d)) setEquipe(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nom || !form.emailMembre || !form.passwordMembre) { setError('Champs obligatoires manquants.'); return; }
    setSaving(true); setError('');
    try {
      const authRes = await authAPI.signUp(form.emailMembre, form.passwordMembre, { nom: `${form.prenom} ${form.nom}`.trim(), role: form.role });
      if (authRes?.error) { setError(authRes.error.message || 'Erreur création compte.'); setSaving(false); return; }
      const userId = authRes?.user?.id || authRes?.id;
      if (userId) {
        await dbAPI.post('profils', { id: userId, clinique_id: clinique.id, nom: form.nom, prenom: form.prenom, role: form.role, specialite: form.specialite, telephone: form.telephone }, token);
      }
      await load();
      setShowModal(false);
      setForm({ nom: '', prenom: '', role: 'medecin', specialite: '', telephone: '', emailMembre: '', passwordMembre: '' });
    } catch (e) { setError('Erreur inattendue.'); }
    setSaving(false);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">👨‍⚕️ Équipe médicale</span>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Ajouter membre</button>
        </div>
        {loading ? <div className="loading"><span className="spinner spinner-dark" /> Chargement...</div> : (
          equipe.length === 0 ? <div className="empty"><div className="empty-icon">👨‍⚕️</div><p>Aucun membre enregistré</p></div> : (
            <table className="table">
              <thead><tr><th>Membre</th><th>Rôle</th><th>Spécialité</th><th>Téléphone</th></tr></thead>
              <tbody>{equipe.map(m => {
                const roleInfo = ROLES[m.role] || { label: m.role, color: '#6b7280' };
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: roleInfo.color }}>{mkAvatar(`${m.nom} ${m.prenom || ''}`)}</div>
                        <div><div style={{ fontWeight: 600 }}>{m.prenom} {m.nom}</div></div>
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: `${roleInfo.color}22`, color: roleInfo.color }}>{roleInfo.label}</span></td>
                    <td>{m.specialite || '—'}</td>
                    <td>{m.telephone || '—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          )
        )}
      </div>

      {showModal && (
        <Modal title="Ajouter un membre" onClose={() => setShowModal(false)} footer={
          <><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving && <span className="spinner" />}Créer le compte</button></>
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

// ==================== APP PRINCIPAL ====================

export default function App() {
  const [session, setSession] = useState(null);
  const [profil, setProfil] = useState(null);
  const [clinique, setClinique] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [view, setView] = useState('login');

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

  const roleInfo = profil ? (ROLES[profil.role] || { label: profil.role, color: '#6b7280' }) : null;
  const navItems = NAV_ITEMS.filter(item => !profil || item.roles.includes(profil.role));

  const pageTitle = NAV_ITEMS.find(n => n.id === page)?.label || 'Tableau de bord';

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
                <div className="alert" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: 'var(--accent2)' }}>
                  ℹ️ Entrez votre email pour recevoir un lien de réinitialisation.
                </div>
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
              <div className="avatar" style={{ background: roleInfo?.color || 'var(--accent)' }}>{mkAvatar(`${profil.nom} ${profil.prenom || ''}`)}</div>
              <div className="user-info">
                <div className="user-name">{profil.prenom} {profil.nom}</div>
                <div className="user-role">{roleInfo?.label}</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>↪</span>
            </div>
          </div>
        </div>

        <div className="main">
          <div className="topbar">
            <span className="topbar-title">{NAV_ITEMS.find(n => n.id === page)?.icon} {pageTitle}</span>
            <span className="topbar-clinique">🏥 {clinique.nom}</span>
          </div>
          <div className="content">
            {page === 'dashboard' && <DashboardPage session={session} clinique={clinique} profil={profil} />}
            {page === 'patients' && <PatientsPage session={session} clinique={clinique} />}
            {page === 'pharmacie' && <PharmaciePage session={session} clinique={clinique} />}
            {page === 'equipe' && <EquipePage session={session} clinique={clinique} />}
            {(page === 'consultations' || page === 'rendez_vous' || page === 'facturation' || page === 'parametres') && (
              <div className="card"><div className="empty"><div className="empty-icon">{NAV_ITEMS.find(n => n.id === page)?.icon}</div><p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{pageTitle}</p><p>Module en construction — disponible prochainement</p></div></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
