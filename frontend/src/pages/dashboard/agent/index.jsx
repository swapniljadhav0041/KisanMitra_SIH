import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../../../components/common/Header';
import useAuthStore from '../../../store/authStore';

export default function AgentHome() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'agent') {
      router.replace('/dashboard/' + user?.role);
    }
  }, [isAuthenticated, user, router]);

  return (
    <div>
      <Header />
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        padding: '120px 20px 40px',
        fontFamily: "'Segoe UI', system-ui, sans-serif"
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
            borderRadius: '20px',
            padding: '30px',
            color: 'white',
            marginBottom: '24px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
          }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>
              🤝 Welcome, {user?.name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: '8px' }}>
              Inspect products, create auctions, and manage deliveries.
            </p>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1b4332', marginBottom: '16px' }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px'
          }}>
            {[
              { label: 'Pending Inspections', icon: '🔍', href: '/dashboard/agent/inspections' },
              { label: 'Create Auction', icon: '📅', href: '/dashboard/agent/auction' },
              { label: 'My Tasks', icon: '📋', href: '/dashboard/agent/tasks' },
              { label: 'Commissions', icon: '💰', href: '/dashboard/agent/commissions' },
              { label: 'Profile', icon: '👤', href: '/dashboard/agent/profile' },
              { label: 'Help', icon: '❓', href: '/help' },
            ].map((action) => (
              <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{action.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#2d3436' }}>{action.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}