import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import ProductCard from '../../../components/common/ProductCard';
import { useLanguage } from '../../../context/LanguageContext';
import useAuthStore from '../../../store/authStore';
import api from '../../../services/api';

const produceCategories = [
  'vegetables',
  'fruits',
  'grains',
  'pulses',
  'herbs',
];

export default function FarmerHome() {
  const router = useRouter();
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, tFormat } = useLanguage();
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

    const fetchProducts = async () => {
      try {
        const res = await api.get('/api/products/');
        const filteredProducts = res.data.filter((p) =>
          produceCategories.includes(p.category_slug)
        );
        setProducts(filteredProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isAuthenticated, user, router]);

  const filtered = products.filter((p) => {
    const matchCategory = category === 'all' || p.category_slug === category;
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category_slug && p.category_slug.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const categories = [
    { key: 'all', label: `🌿 ${t('home.allProducts')}` },
    { key: 'vegetables', label: `🥬 ${t('home.vegetables')}` },
    { key: 'fruits', label: `🍎 ${t('home.fruits')}` },
    { key: 'grains', label: `🌾 ${t('home.grains')}` },
    { key: 'pulses', label: `🫘 ${t('home.pulses')}` },
    { key: 'herbs', label: `🌿 ${t('home.herbs')}` },
  ];

  return (
    <div className="home-page">
      <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">🌱 {t('home.heroBadge')}</div>
            <h1 className="hero-title">{t('home.heroTitle')}</h1>
            <p className="hero-desc">{t('home.heroDesc')}</p>

            <div className="hero-buttons">
              <a href="#products" className="btn-primary">
                🛒 {t('home.shopNow')}
              </a>
              <Link href="/dashboard/farmer/purchase-medicine" className="btn-primary" style={{ background: '#ffffff', color: '#1b4332' }}>
                💊 Purchase Medicine
              </Link>
              <Link href="/dashboard/farmer/purchase-instruments" className="btn-primary" style={{ background: '#ffffff', color: '#1b4332' }}>
                🔧 Purchase Instruments
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-produce">🥕<span className="produce-name">Carrots</span></div>
            <div className="hero-produce">🍅<span className="produce-name">Tomatoes</span></div>
            <div className="hero-produce">🌾<span className="produce-name">Wheat</span></div>
            <div className="hero-produce">🥬<span className="produce-name">Lettuce</span></div>
            <div className="hero-produce">🍚<span className="produce-name">Rice</span></div>
            <div className="hero-produce">🥔<span className="produce-name">Potatoes</span></div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <div className="categories-wrapper" id="categories">
        <div className="categories">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`category-chip ${category === cat.key ? 'active' : ''}`}
              onClick={() => setCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS */}
      <main className="main-content" id="products">
        <div className="section-header">
          <div>
            <div className="section-title">
              <span className="title-icon">🛒</span>
              {t('home.shopFreshProduce')}
            </div>
            <div className="section-subtitle">
              {tFormat('home.showingProducts', { count: filtered.length })}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>Loading products...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>No products available.</div>
        ) : (
          <div className="product-grid">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}