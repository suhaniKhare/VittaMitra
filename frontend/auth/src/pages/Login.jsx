import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        <div style={styles.logoContainer}>
          <div style={styles.logoBadge}>₹</div>
          <h2 style={styles.logoText}>VittaMitra</h2>
        </div>
        <h3 style={styles.title}>Welcome Back</h3>
        <p style={styles.subtitle}>Log in to manage your money story</p>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="e.g. suhani@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={isLoading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {isLoading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account? <Link to="/signup" style={styles.link}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    fontFamily: "'Inter', sans-serif",
    padding: '20px'
  },
  glassCard: {
    background: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '20px',
    padding: '40px 30px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '20px'
  },
  logoBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#6366f1',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '15px'
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#1e1b4b',
    margin: 0
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 5px 0'
  },
  subtitle: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0 0 25px 0'
  },
  errorAlert: {
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    color: '#b91c1c',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '12px',
    marginBottom: '20px',
    textAlign: 'left'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'left'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#4b5563'
  },
  input: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    outline: 'none',
    fontSize: '13px',
    background: '#fff',
    transition: 'border 0.2s',
    fontFamily: 'inherit'
  },
  button: {
    background: '#6366f1',
    color: '#fff',
    padding: '12px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginTop: '10px'
  },
  buttonDisabled: {
    background: '#a5b4fc',
    cursor: 'not-allowed'
  },
  footerText: {
    fontSize: '13px',
    color: '#4b5563',
    marginTop: '25px',
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: '600'
  }
};

export default Login;
