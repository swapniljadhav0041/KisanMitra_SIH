import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';

export default function FarmerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hydrate } = useAuthStore();

  useEffect(() => {
    hydrate(); // ensure auth state is loaded from localStorage
  }, [hydrate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          api.get('/api/orders/my'),
          api.get('/api/products/my'),
        ]);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        console.error('Failed to load orders:', error);
        if (error.response?.status === 401) {
          toast.error('Please login to view your orders');
          router.push('/login');
        } else {
          toast.error('Failed to load orders');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : `Product #${productId}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { bg: '#fff3cd', text: '#856404' };
      case 'accepted':
        return { bg: '#d1ecf1', text: '#0c5460' };
      case 'shipped':
        return { bg: '#cce5ff', text: '#004085' };
      case 'delivered':
        return { bg: '#d4edda', text: '#155724' };
      case 'cancelled':
        return { bg: '#f8d7da', text: '#721c24' };
      default:
        return { bg: '#e9ecef', text: '#495057' };
    }
  };

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
          {/* Back Button */}
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '18px' }}>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '50px',
                color: '#2d6a4f',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'}
              onMouseLeave={(e) => e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
            >
              ← Back to Home
            </button>
          </Link>

          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1b4332', marginBottom: '24px' }}>
            My Orders
          </h1>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              color: '#636e72'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <p style={{ fontSize: '16px' }}>No orders yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((order) => {
                const statusStyle = getStatusColor(order.status);
                return (
                  <div key={order.id} style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2d3436', margin: 0 }}>
                          {getProductName(order.product_id)}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#636e72', margin: '4px 0 0' }}>
                          Order ID: #{order.id}
                        </p>
                      </div>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '50px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: statusStyle.bg,
                        color: statusStyle.text,
                      }}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid #e9ecef'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#636e72' }}>Quantity</div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{order.quantity}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#636e72' }}>Total Price</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d6a4f' }}>₹{order.total_price}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#636e72' }}>Payment</div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{order.payment_status}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#636e72' }}>Date</div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                          {new Date(order.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}