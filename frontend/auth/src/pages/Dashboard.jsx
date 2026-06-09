import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>₹</div>
          <h2 style={styles.logoText}>VittaMitra</h2>
        </div>

        <div style={styles.profileSection}>
          <div style={styles.avatar}>
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <h3 style={styles.welcomeTitle}>Welcome back, {user?.name}!</h3>
          <p style={styles.emailText}>{user?.email}</p>
        </div>

        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>Session Information</h4>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>User ID:</span>
            <span style={styles.infoVal}>{user?.id}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Role Status:</span>
            <span style={styles.infoValBadge}>✓ Authenticated</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Joined At:</span>
            <span style={styles.infoVal}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        <button onClick={logout} style={styles.logoutButton}>
          Sign Out
        </button>
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
    maxWidth: '450px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '30px',
    justifyContent: 'center'
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
  profileSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '25px',
    textAlign: 'center'
  },
  avatar: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    background: '#e0e7ff',
    color: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '15px',
    border: '2px solid #6366f1'
  },
  welcomeTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 4px 0'
  },
  emailText: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0
  },
  infoBox: {
    background: 'rgba(249, 250, 251, 0.6)',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '25px'
  },
  infoTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 12px 0'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '8px 0',
    borderBottom: '1px solid #ede9fe',
    alignItems: 'center'
  },
  infoLabel: {
    color: '#6b7280',
    fontWeight: '500'
  },
  infoVal: {
    color: '#1f2937',
    fontWeight: '600'
  },
  infoValBadge: {
    color: '#047857',
    fontWeight: '600',
    background: '#d1fae5',
    padding: '3px 8px',
    borderRadius: '99px',
    fontSize: '11px'
  },
  logoutButton: {
    background: '#ef4444',
    color: '#fff',
    padding: '12px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
    textAlign: 'center'
  }
};

export default Dashboard;
