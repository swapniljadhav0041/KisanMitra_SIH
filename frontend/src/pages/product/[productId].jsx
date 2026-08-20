import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/common/Header';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineShoppingCart } from 'react-icons/hi';

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { productId } = router.query;
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (productId) {
      fetchProduct();
    }
  }, [isAuthenticated, productId, router]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/products/${productId}`);
      setProduct(res.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      router.push('/dashboard/farmer');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => {
    if (!product) return;
    // Redirect to checkout instead of creating order directly
    router.push(`/checkout?product_id=${product.id}&quantity=${quantity}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={styles.page}>
          <div style={styles.loading}>Loading product...</div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main style={styles.page}>
          <div style={styles.loading}>Product not found.</div>
        </main>
      </>
    );
  }

  const imageUrl = product.image || product.media?.find(m => m.media_type === 'image')?.url;

  return (
    <>
      <Header />
      <main style={styles.page}>
        <div style={styles.container}>
          <button onClick={() => router.back()} style={styles.backButton}>
            <HiOutlineArrowLeft size={18} />
            Back
          </button>

          <div style={styles.card}>
            <div style={styles.imageSection}>
              {imageUrl ? (
                <img
                  src={getImageUrl(imageUrl)}
                  alt={product.name}
                  style={styles.image}
                />
              ) : (
                <div style={styles.imagePlaceholder}>🌿</div>
              )}
            </div>

            <div style={styles.details}>
              <h1 style={styles.title}>{product.name}</h1>
              <p style={styles.category}>{product.category_slug || product.category?.slug}</p>
              <p style={styles.description}>
                {product.description || 'No description available.'}
              </p>

              <div style={styles.meta}>
                <span><strong>Price:</strong> ₹{product.price}</span>
                <span><strong>Available:</strong> {product.quantity} {product.unit}</span>
              </div>

              {product.farmer_name && (
                <div style={styles.meta}>
                  <span><strong>Farmer:</strong> {product.farmer_name}</span>
                </div>
              )}

              {product.location && (
                <div style={styles.meta}>
                  <span><strong>Location:</strong> {product.location}</span>
                </div>
              )}

              {product.status === 'active' && (
                <div style={styles.buySection}>
                  <input
                    type="number"
                    min="1"
                    max={product.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.quantity, Number(e.target.value))))}
                    style={styles.quantityInput}
                  />
                  <button onClick={handleBuy} style={styles.buyButton}>
                    <HiOutlineShoppingCart size={18} />
                    Buy Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    paddingTop: '100px',
    paddingBottom: '60px',
    background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)',
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078' },
  backButton: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent',
    border: 'none', color: '#2d6a4f', fontWeight: '700', cursor: 'pointer', marginBottom: '20px', fontSize: '14px',
  },
  card: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', background: '#fff',
    borderRadius: '20px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4', overflow: 'hidden', padding: '20px',
  },
  imageSection: {
    background: '#f9fbfa', borderRadius: '16px', overflow: 'hidden', minHeight: '400px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  image: { width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' },
  imagePlaceholder: { fontSize: '64px' },
  details: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px' },
  title: { margin: 0, color: '#173b2a', fontSize: '28px', fontWeight: '850' },
  category: { margin: 0, color: '#198754', fontSize: '14px', fontWeight: '700', textTransform: 'capitalize' },
  description: { margin: 0, color: '#526058', fontSize: '15px', lineHeight: 1.6 },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#526058', fontSize: '14px' },
  buySection: { display: 'flex', gap: '12px', marginTop: '20px' },
  quantityInput: {
    width: '70px', height: '42px', border: '1px solid #dbe6de', borderRadius: '10px',
    padding: '0 8px', textAlign: 'center', fontSize: '14px', outline: 'none',
  },
  buyButton: {
    display: 'flex', alignItems: 'center', gap: '8px', background: '#2d6a4f', color: '#fff',
    border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px',
  },
  '@media (max-width: 900px)': { card: { gridTemplateColumns: '1fr' } },
};