import { useState } from "react";

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
  signUp: (email, password, data) => sbFetch('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, data })
  }),
  signIn: (email, password) => sbFetch('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  resetPassword: (email) => sbFetch('/auth/v1/recover', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
};

const dbAPI = {
  get: (table, filter, token) => sbFetch(`/rest/v1/${table}?${filter}&select=*`, {}, token),
  post: (table, body, token) => sbFetch(`/rest/v1/${table}`, {
    method: 'POST',
    body: JSON.stringify(body)
  }, token),
  patch: (table, filter, body, token) => sbFetch(`/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  }, token),
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#f0f4f8;--surface:#ffffff;--surface2:#f8fafc;
    --border:#e2e8f0;--accent:#00c896;--accent2:#0ea5e9;
    --danger:#ef4444;--text:#1a202c;--text2:#4a5568;--text3:#a0aec0;
    --font-display:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;
    --radius:12px;--shadow:0 4px 24px rgba(0,0,0,0.08);
  }
  body{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh;}
  .login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f0f4f8 0%,#e8f5f0 100%);padding:20px;}
  .login-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:40px;width:100%;max-width:480px;box-shadow:var(--shadow);}
  .logo-wrap{text-align:center;margin-bottom:32px;}
  .logo-icon{width:56px;height:56px;background:var(--accent);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;color:#fff;font-size:22px;margin-bottom:12px;}
  .logo-name{font-family:var(--font-display);font-size:24px;font-weight:800;color:var(--text);}
  .logo-sub{font-size:12px;color:var(--text3);margin-top:4px;}
  .tabs{display:flex;gap:4px;background:var(--surface2);padding:4px;border-radius:10px;margin-bottom:24px;}
  .tab{flex:1;padding:9px;border-radius:7px;border:none;background:none;color:var(--text2);font-size:13px;cursor:pointer;font-family:var(--font-body);font-weight:500;transition:all 0.15s;}
  .tab.active{background:var(--surface);color:var(--accent);font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,0.1);}
  .form-group{margin-bottom:16px;}
  .form-label{display:block;font-size:12px;color:var(--text2);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;}
  .form-input,.form-select{width:100%;padding:11px 14px;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;font-family:var(--font-body);transition:border-color 0.15s;}
  .form-input:focus,.form-select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,200,150,0.1);}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .btn{width:100%;padding:12px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:var(--font-body);transition:all 0.15s;margin-top:8px;}
  .btn:disabled{opacity:0.6;cursor:not-allowed;}
  .btn-primary{background:var(--accent);color:#fff;}
  .btn-primary:hover:not(:disabled){background:#00b085;transform:translateY(-1px);}
  .alert{padding:12px 16px;border-radius:8px;font-size:13px;margin-bottom:16px;}
  .alert-error{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:var(--danger);}
  .alert-success{background:rgba(0,200,150,0.08);border:1px solid rgba(0,200,150,0.2);color:var(--accent);}
  .alert-info{background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.2);color:var(--accent2);}
  .divider{text-align:center;color:var(--text3);font-size:12px;margin:16px 0;position:relative;}
  .divider::before,.divider::after{content:'';position:absolute;top:50%;width:42%;height:1px;background:var(--border);}
  .divider::before{left:0;}.divider::after{right:0;}
  .link-btn{background:none;border:none;color:var(--accent);font-size:13px;cursor:pointer;font-family:var(--font-body);text-decoration:underline;}
  .plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}
  .plan-card{border:2px solid var(--border);border-radius:10px;padding:14px;cursor:pointer;transition:all 0.15s;}
  .plan-card:hover{border-color:var(--accent2);}
  .plan-card.selected{border-color:var(--accent);background:rgba(0,200,150,0.04);}
  .plan-name{font-weight:700;font-size:13px;margin-bottom:2px;}
  .plan-prix{color:var(--accent);font-size:12px;font-weight:600;}
  .plan-desc{color:var(--text3);font-size:11px;margin-top:4px;}
  .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;margin-right:8px;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .step-indicator{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:24px;}
  .step{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;}
  .step.active{background:var(--accent);color:#fff;}
  .step.done{background:var(--accent);color:#fff;}
  .step.inactive{background:var(--border);color:var(--text3);}
  .step-line{flex:1;height:2px;background:var(--border);max-width:40px;}
  .step-line.done{background:var(--accent);}
  .dashboard{min-height:100vh;background:var(--bg);display:flex;align-items:center;justify-content:center;}
  .dashboard-card{background:var(--surface);border-radius:20px;padding:40px;text-align:center;box-shadow:var(--shadow);}
`;

const plans = [
  { id: 'starter', nom: 'Starter', prix: '20 000 FCFA/mois', desc: 'Cabinets & petites cliniques' },
  { id: 'pro', nom: 'Pro', prix: '60 000 FCFA/mois', desc: 'Cliniques & polycliniques' },
  { id: 'institution', nom: 'Institution', prix: '120 000 FCFA/mois', desc: 'Hôpitaux & réseaux' },
  { id: 'pilote', nom: 'Pilote', prix: 'Gratuit 3 mois', desc: 'Clinique pilote partenaire' },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [profil, setProfil] = useState(null);
  const [view, setView] = useState('login'); // login | register | reset | sent

  const handleLogin = async (sessionData) => {
    const token = sessionData.access_token;
    const userId = sessionData.user?.id;
    setSession(sessionData);
    // Charger le profil
    const p = await dbAPI.get('profils', `id=eq.${userId}`, token);
    if (Array.isArray(p) && p.length > 0) setProfil(p[0]);
  };

  if (session && profil) {
    return (
      <>
        <style>{STYLES}</style>
        <Dashboard session={session} profil={profil} onLogout={() => { setSession(null); setProfil(null); }} />
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="login-page">
        <div className="login-card">
          <div className="logo-wrap">
            <div className="logo-icon">C+</div>
            <div className="logo-name">CliniPlus</div>
            <div className="logo-sub">Gestion clinique intelligente</div>
          </div>

          {view === 'login' && <LoginForm onLogin={handleLogin} onRegister={() => setView('register')} onReset={() => setView('reset')} />}
          {view === 'register' && <RegisterForm onLogin={handleLogin} onBack={() => setView('login')} />}
          {view === 'reset' && <ResetForm onBack={() => setView('login')} onSent={() => setView('sent')} />}
          {view === 'sent' && (
            <div>
              <div className="alert alert-success">✅ Lien envoyé ! Vérifiez votre boîte mail.</div>
              <button className="link-btn" onClick={() => setView('login')}>← Retour à la connexion</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

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
    else setError(d?.error_description || d?.msg || 'Email ou mot de passe incorrect.');
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
      <button className="btn btn-primary" onClick={doLogin} disabled={loading}>
        {loading && <span className="spinner" />}
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
      <div className="divider">ou</div>
      <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <button className="link-btn" onClick={onReset}>Mot de passe oublié ?</button>
        <button className="link-btn" onClick={onRegister}>Créer une clinique</button>
      </div>
    </div>
  );
}

function ResetForm({ onBack, onSent }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const doReset = async () => {
    if (!email) return;
    setLoading(true);
    await authAPI.resetPassword(email);
    setLoading(false);
    onSent();
  };

  return (
    <div>
      <div className="alert alert-info">ℹ️ Entrez votre email pour recevoir un lien de réinitialisation.</div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={doReset} disabled={loading}>
        {loading && <span className="spinner" />}
        {loading ? 'Envoi...' : 'Envoyer le lien'}
      </button>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button className="link-btn" onClick={onBack}>← Retour</button>
      </div>
    </div>
  );
}

function RegisterForm({ onLogin, onBack }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reg, setReg] = useState({
    // Clinique
    nomClinique: '', typeClinique: 'clinique', ville: '', pays: 'Bénin',
    adresse: '', telephone: '', email: '', ifu: '', plan: 'starter',
    // Admin
    nomAdmin: '', prenomAdmin: '', emailAdmin: '', passwordAdmin: '', confirmPwd: '',
  });

  const set = (k, v) => setReg(r => ({ ...r, [k]: v }));

  const validerEtape1 = () => {
    if (!reg.nomClinique || !reg.ville || !reg.email) {
      setError('Remplissez les champs obligatoires (*).');
      return false;
    }
    setError('');
    return true;
  };

  const validerEtape2 = () => {
    if (!reg.nomAdmin || !reg.emailAdmin || !reg.passwordAdmin) {
      setError('Remplissez les champs obligatoires (*).');
      return false;
    }
    if (reg.passwordAdmin !== reg.confirmPwd) {
      setError('Les mots de passe ne correspondent pas.');
      return false;
    }
    if (reg.passwordAdmin.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return false;
    }
    setError('');
    return true;
  };

  const doRegister = async () => {
    if (!validerEtape2()) return;
    setLoading(true); setError('');
    try {
      // 1. Créer le compte Auth
      const authRes = await authAPI.signUp(reg.emailAdmin, reg.passwordAdmin, {
        nom: `${reg.prenomAdmin} ${reg.nomAdmin}`.trim(),
        role: 'admin'
      });

      if (authRes?.error) {
        setError(authRes.error.message || 'Erreur lors de la création du compte.');
        setLoading(false); return;
      }

      // 2. Connexion pour obtenir le token
      const loginRes = await authAPI.signIn(reg.emailAdmin, reg.passwordAdmin);
      if (!loginRes?.access_token) {
        setError('Compte créé mais connexion impossible. Réessayez.');
        setLoading(false); return;
      }

      const token = loginRes.access_token;
      const userId = loginRes.user?.id;

      // 3. Créer la clinique
      const cliniqueRes = await dbAPI.post('cliniques', {
        nom: reg.nomClinique,
        type: reg.typeClinique,
        ville: reg.ville,
        pays: reg.pays,
        adresse: reg.adresse,
        telephone: reg.telephone,
        email: reg.email,
        ifu: reg.ifu,
        plan: reg.plan,
      }, token);

      const clinique = Array.isArray(cliniqueRes) ? cliniqueRes[0] : cliniqueRes;

      if (!clinique?.id) {
        setError('Erreur lors de la création de la clinique. Réessayez.');
        setLoading(false); return;
      }

      // 4. Créer le profil admin
      await dbAPI.post('profils', {
        id: userId,
        clinique_id: clinique.id,
        nom: reg.nomAdmin,
        prenom: reg.prenomAdmin,
        role: 'admin',
      }, token);

      // 5. Connexion automatique
      onLogin(loginRes);

    } catch (e) {
      setError('Erreur inattendue. Réessayez.');
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Indicateur d'étapes */}
      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : 'inactive'}`}>1</div>
        <div className={`step-line ${step >= 2 ? 'done' : ''}`} />
        <div className={`step ${step >= 2 ? 'active' : 'inactive'}`}>2</div>
        <div className={`step-line ${step >= 3 ? 'done' : ''}`} />
        <div className={`step ${step >= 3 ? 'active' : 'inactive'}`}>3</div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* ÉTAPE 1 : Infos clinique */}
      {step === 1 && (
        <div>
          <div className="form-group">
            <label className="form-label">Nom de la clinique *</label>
            <input className="form-input" placeholder="Ex: Clinique Espoir" value={reg.nomClinique} onChange={e => set('nomClinique', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select className="form-select" value={reg.typeClinique} onChange={e => set('typeClinique', e.target.value)}>
                <option value="clinique">Clinique</option>
                <option value="hopital">Hôpital</option>
                <option value="cabinet">Cabinet médical</option>
                <option value="polyclinique">Polyclinique</option>
                <option value="centre_sante">Centre de santé</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ville *</label>
              <input className="form-input" placeholder="Ex: Cotonou" value={reg.ville} onChange={e => set('ville', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pays</label>
              <input className="form-input" value={reg.pays} onChange={e => set('pays', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-input" placeholder="+229..." value={reg.telephone} onChange={e => set('telephone', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email de la clinique *</label>
            <input className="form-input" type="email" placeholder="clinique@email.com" value={reg.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">IFU (optionnel)</label>
            <input className="form-input" placeholder="Identifiant fiscal" value={reg.ifu} onChange={e => set('ifu', e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => { if (validerEtape1()) setStep(2); }}>
            Suivant →
          </button>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button className="link-btn" onClick={onBack}>← Retour</button>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 : Choix du plan */}
      {step === 2 && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            Choisissez le plan adapté à votre structure :
          </p>
          <div className="plan-grid">
            {plans.map(p => (
              <div key={p.id} className={`plan-card ${reg.plan === p.id ? 'selected' : ''}`} onClick={() => set('plan', p.id)}>
                <div className="plan-name">{p.nom}</div>
                <div className="plan-prix">{p.prix}</div>
                <div className="plan-desc">{p.desc}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setStep(3)}>Suivant →</button>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button className="link-btn" onClick={() => setStep(1)}>← Retour</button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 : Compte administrateur */}
      {step === 3 && (
        <div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prénom *</label>
              <input className="form-input" placeholder="Jean" value={reg.prenomAdmin} onChange={e => set('prenomAdmin', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input className="form-input" placeholder="DUPONT" value={reg.nomAdmin} onChange={e => set('nomAdmin', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email de connexion *</label>
            <input className="form-input" type="email" placeholder="admin@email.com" value={reg.emailAdmin} onChange={e => set('emailAdmin', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mot de passe *</label>
              <input className="form-input" type="password" placeholder="••••••••" value={reg.passwordAdmin} onChange={e => set('passwordAdmin', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer *</label>
              <input className="form-input" type="password" placeholder="••••••••" value={reg.confirmPwd} onChange={e => set('confirmPwd', e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={doRegister} disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Création en cours...' : '🏥 Créer ma clinique'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button className="link-btn" onClick={() => setStep(2)}>← Retour</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ session, profil, onLogout }) {
  return (
    <div className="dashboard">
      <div className="dashboard-card">
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏥</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, marginBottom: 8 }}>
          Bienvenue, {profil?.prenom || profil?.nom || 'Admin'} !
        </h1>
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
          Tableau de bord en construction...
        </p>
        <button onClick={onLogout} style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
