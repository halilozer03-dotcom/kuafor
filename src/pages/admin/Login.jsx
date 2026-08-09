import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { session, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  if (!loading && session) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/admin');
    } catch (e2) {
      setErr(e2.message || String(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Espace admin</h1>
        <div className="login-toggle">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={function () { setMode('login'); }}>Connexion</button>
          <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={function () { setMode('signup'); }}>Créer un compte</button>
        </div>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" required value={email} onChange={function (e) { setEmail(e.target.value); }} />
        </div>
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" required minLength={6} value={password} onChange={function (e) { setPassword(e.target.value); }} />
        </div>
        {err && <div className="err-banner">{err}</div>}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Patientez...' : mode === 'login' ? 'Connexion' : 'Créer un compte'}
        </button>
        {mode === 'signup' && (
          <p className="muted" style={{ fontSize: '.8rem' }}>
            Créer un compte ne donne pas accès au panneau à lui seul ; votre prestataire doit d'abord autoriser ce compte.
          </p>
        )}
      </form>
    </div>
  );
}
