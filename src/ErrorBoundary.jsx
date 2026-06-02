import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>⚠️ เกิดข้อผิดพลาด</h1>
          <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '500px' }}>
            แอปพลิเคชันเกิดข้อผิดพลาด กรุณารีเฟรชหน้าเว็บ
          </p>
          <pre style={{
            background: '#f1f5f9',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#dc2626',
            maxWidth: '600px',
            overflow: 'auto',
            marginBottom: '24px',
          }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            🔄 รีเฟรชหน้าเว็บ
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
