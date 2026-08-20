import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import { useLanguage } from '../../../context/LanguageContext';
import useAuthStore from '../../../store/authStore';
import api from '../../../services/api';
import toast from 'react-hot-toast';

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
}

export default function PurchaseInstruments() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const { t } = useLanguage();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'farmer') {
      router.replace('/dashboard/' + user?.role);
      return;
    }
    fetchProducts();
  }, [isAuthenticated, user, router]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products/');
      const instrumentCategories = [
        'tractors_vehicles',
        'tillage_preparation',
        'sowing_planting',
        'irrigation_water',
        'crop_care',
        'harvesting',
        'tools_accessories',
      ];
      const instrumentProducts = res.data.filter((p) =>
        instrumentCategories.includes(p.category_slug)
      );
      setProducts(instrumentProducts);
    } catch (error) {
      console.error('Failed to fetch instrument products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const instrumentCategories = [
    { key: 'all', label: 'All', icon: '🔧' },
    { key: 'tractors_vehicles', label: 'Tractors & Vehicles', icon: '🚜' },
    { key: 'tillage_preparation', label: 'Tillage & Land Preparation', icon: '🌱' },
    { key: 'sowing_planting', label: 'Sowing & Planting', icon: '🌾' },
    { key: 'irrigation_water', label: 'Irrigation & Water', icon: '💧' },
    { key: 'crop_care', label: 'Crop Care', icon: '🌿' },
    { key: 'harvesting', label: 'Harvesting', icon: '🌾' },
    { key: 'tools_accessories', label: 'Tools & Accessories', icon: '🧰' },
  ];

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter((p) => p.category_slug === activeCategory);

  return (
    <div className="home-page">
      <Header />

      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">🔧 {t('instruments.badge')}</div>
            <h1 className="hero-title">{t('instruments.title')}</h1>
            <p className="hero-desc">{t('instruments.description')}</p>

            <div className="hero-buttons">
              <a href="#products" className="btn-primary">
                🛒 {t('common.shopNow')}
              </a>
              <Link href="/dashboard/farmer" className="btn-primary" style={{ background: '#ffffff', color: '#1b4332' }}>
                🌾 Farm Products
              </Link>
              <Link href="/dashboard/farmer/purchase-medicine" className="btn-primary" style={{ background: '#ffffff', color: '#1b4332' }}>
                💊 Medicine
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-produce">🚜<span className="produce-name">Tractor</span></div>
            <div className="hero-produce">🌱<span className="produce-name">Tillage</span></div>
            <div className="hero-produce">💧<span className="produce-name">Irrigation</span></div>
            <div className="hero-produce">🌿<span className="produce-name">Crop Care</span></div>
            <div className="hero-produce">🌾<span className="produce-name">Harvesting</span></div>
            <div className="hero-produce">🧰<span className="produce-name">Tools</span></div>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTERS */}
      <div className="categories-wrapper" id="categories">
        <div className="categories">
          {instrumentCategories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`category-chip ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS */}
      <main className="main-content" id="products">
        <div className="section-header">
          <div>
            <div className="section-title">
              <span className="title-icon">🔧</span>
              {t('instruments.shopInstruments')}
            </div>
            <div className="section-subtitle">
              {filteredProducts.length} products available
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>
            Loading...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>
            No products in this category.
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCardWithBuy
                key={product.id}
                product={product}
                onBuySuccess={fetchProducts}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProductCardWithBuy({ product, onBuySuccess }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);

const handleBuy = () => {
  router.push(`/checkout?product_id=${product.id}&quantity=${quantity}`);
};

  return (
    <div
      onClick={() => router.push(`/product/${product.id}`)}
      style={{ cursor: 'pointer', border: '1px solid #e1ebe4', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}
    >
      {product.image ? (
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ width: '100%', height: '150px', background: '#edf6f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
          🔧
        </div>
      )}
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 5px', color: '#173b2a', fontSize: '16px', fontWeight: '800' }}>
          {product.name}
        </h3>
        <p style={{ margin: '0 0 10px', color: '#718078', fontSize: '12px' }}>
          {product.description || 'No description'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <strong style={{ color: '#2d6a4f', fontSize: '18px' }}>₹{product.price}</strong>
          <span style={{ color: '#89948e', fontSize: '12px' }}>
            {product.quantity} {product.unit} available
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            min="1"
            max={product.quantity}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(product.quantity, Number(e.target.value))))}
            style={{ width: '60px', height: '36px', border: '1px solid #dbe6de', borderRadius: '8px', padding: '0 8px' }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBuy();
            }}
            disabled={buying}
            style={{ flex: 1, background: '#2d6a4f', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
          >
            {buying ? 'Placing...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
}