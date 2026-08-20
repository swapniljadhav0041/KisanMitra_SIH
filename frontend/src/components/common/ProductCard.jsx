import { useRouter } from 'next/router';

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
}

export default function ProductCard({ product }) {
  const router = useRouter();

  // Use `product.image` (the new API returns `image` field) or first media
  const imageUrl = product.image || product.media?.find(m => m.media_type === 'image')?.url;

  const emojiMap = {
    vegetables: '🥬',
    fruits: '🍎',
    grains: '🌾',
    pulses: '🫘',
    herbs: '🌿',
  };
  const fallbackEmoji = emojiMap[product.category_slug] || '🌾';

  return (
    <div
      className="product-card"
      onClick={() => router.push(`/product/${product.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="product-image">
        {imageUrl ? (
          <img
            src={getImageUrl(imageUrl)}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span className="product-emoji">{fallbackEmoji}</span>
        )}
      </div>
      <div className="product-info">
        <div className="product-category">{product.category_slug}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-rating">
          <span className="stars">★</span>
          <span>{product.rating || 0}</span>
        </div>
        <div className="product-bottom">
          <div>
            <span className="product-price">₹{product.price}</span>
            <span className="unit"> / {product.unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}