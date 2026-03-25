import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]     = useState({ username: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Left panel ── */}
      <div className="login-left">
        <div className="login-left-shapes">
          <div className="ls ls1" />
          <div className="ls ls2" />
          <div className="ls ls3" />
        </div>

        <div className="login-left-content animate-slideRight">
          <div className="login-brand">
            <div className="login-brand-icon">D4</div>
            <span>Drugs 4U</span>
          </div>

          <h2>Prescription Management System</h2>
          <p>
            A secure, modern platform for managing patient prescriptions,
            inventory and compliance — built for UK pharmacies.
          </p>

          <div className="login-features">
            {[
              ['💊', 'Prescription tracking & dispensing'],
              ['📦', 'Real-time inventory management'],
              ['🔔', 'Automated risk & alert system'],
              ['📊', 'Reports and audit trails'],
            ].map(([icon, text]) => (
              <div className="login-feature" key={text}>
                <div className="login-feature-icon">{icon}</div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="login-right">
        <div className="login-form-box">
          <button
            onClick={() => navigate('/')}
            style={{ background:'none',border:'none',color:'var(--text-muted)',fontSize:13,cursor:'pointer',marginBottom:28,display:'flex',alignItems:'center',gap:6 }}
          >
            ← Back to home
          </button>

          <h3>Welcome back</h3>
          <p className="sub">Sign in with your staff credentials to continue</p>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom:20 }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom:16 }}>
              <label>Username <span className="req">*</span></label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Enter your username"
                autoFocus
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom:24, position:'relative' }}>
              <label>Password <span className="req">*</span></label>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Enter your password"
                required
                style={{ paddingRight:44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position:'absolute',right:12,bottom:10,
                  background:'none',border:'none',
                  color:'var(--text-muted)',cursor:'pointer',fontSize:16,
                }}
                tabIndex={-1}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width:'100%' }}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" style={{width:14,height:14}} /> Signing in…</>
                : 'Sign in →'}
            </button>
          </form>

          <p style={{ marginTop:28,fontSize:12,color:'var(--text-muted)',textAlign:'center',lineHeight:1.6 }}>
            For staff access only. Contact your administrator<br />if you need an account.
          </p>
        </div>
      </div>
    </div>
  );
}
