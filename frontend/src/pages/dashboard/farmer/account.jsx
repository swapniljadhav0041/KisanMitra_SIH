import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCurrencyRupee,
  HiOutlineTrendingUp,
} from 'react-icons/hi';
import { useLanguage } from '../../../context/LanguageContext';

export default function FarmerWallet() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const { t } = useLanguage();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'farmer') {
      router.push('/login');
      return;
    }

    fetchTransactions();
  }, [isAuthenticated, user, router]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/farmer/transactions');
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load wallet:', error);
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const completedTransactions = transactions.filter(
    (tx) =>
      tx.status === 'processed' ||
      tx.status === 'captured' ||
      tx.status === 'completed' ||
      tx.status === 'success'
  );

  const pendingTransactions = transactions.filter(
    (tx) => tx.status === 'pending' || tx.status === 'processing'
  );

  const totalReceived = completedTransactions
    .filter((tx) => tx.type !== 'payment')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalPaid = completedTransactions
    .filter((tx) => tx.type === 'payment')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const pendingAmount = pendingTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0
  );

  const availableBalance = Math.max(totalReceived - totalPaid, 0);

  return (
    <div>
      <Header />
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #f3fff7 0%, #f7faf8 45%, #ffffff 100%)',
          paddingTop: '105px',
          paddingBottom: '60px',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
          <Link
            href="/dashboard/farmer"
            style={{
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: '22px',
            }}
          >
            <button
              style={{
                background: '#ffffff',
                border: '1px solid #dcefe3',
                borderRadius: '50px',
                padding: '10px 18px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                color: '#176b45',
                boxShadow: '0 4px 14px rgba(30, 100, 65, 0.08)',
              }}
            >
              ← Back
            </button>
          </Link>

          <div style={{ marginBottom: '25px' }}>
            <p
              style={{
                margin: '0 0 5px',
                color: '#4b8b68',
                fontSize: '14px',
                fontWeight: '700',
                letterSpacing: '0.5px',
              }}
            >
              KISAN MITRA
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: '800',
                color: '#123b28',
              }}
            >
              My Wallet
            </h1>
            <p
              style={{
                margin: '7px 0 0',
                color: '#6b7f74',
                fontSize: '14px',
              }}
            >
              Manage your earnings and transaction history
            </p>
          </div>

          {/* Main Wallet Card */}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '28px',
              padding: '30px',
              marginBottom: '22px',
              background: 'linear-gradient(135deg, #0d6b42 0%, #198754 55%, #42b883 100%)',
              color: 'white',
              boxShadow: '0 18px 40px rgba(20, 110, 70, 0.22)',
            }}
          >
            <div style={{ position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', right: '-55px', top: '-70px' }} />
            <div style={{ position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', right: '100px', bottom: '-70px' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '14px', opacity: 0.85, marginBottom: '10px' }}>Available Balance</div>
                  <div style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1px' }}>₹{availableBalance.toLocaleString('en-IN')}</div>
                  <div style={{ marginTop: '7px', fontSize: '13px', opacity: 0.8 }}>Your available earnings</div>
                </div>
                <div style={{ width: '54px', height: '54px', borderRadius: '17px', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiOutlineCurrencyRupee size={30} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '27px', flexWrap: 'wrap' }}>
                <button style={{ border: 'none', background: '#ffffff', color: '#12633d', padding: '12px 22px', borderRadius: '50px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HiOutlineArrowDown size={18} /> Add Money
                </button>
                <button style={{ border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)', color: '#ffffff', padding: '12px 22px', borderRadius: '50px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HiOutlineArrowUp size={18} /> Withdraw
                </button>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '25px' }}>
            <StatCard icon={<HiOutlineTrendingUp />} title="Total Earned" value={`₹${totalReceived.toLocaleString('en-IN')}`} subtitle="Completed earnings" />
            <StatCard icon={<HiOutlineClock />} title="Pending" value={`₹${pendingAmount.toLocaleString('en-IN')}`} subtitle="Awaiting payment" />
            <StatCard icon={<HiOutlineArrowUp />} title="Total Paid" value={`₹${totalPaid.toLocaleString('en-IN')}`} subtitle="Completed payments" />
          </div>

          {/* Transactions */}
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '25px', border: '1px solid #e4f1e9', boxShadow: '0 8px 25px rgba(30, 80, 50, 0.06)' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#173d2b', fontSize: '19px', fontWeight: '800' }}>Recent Transactions</h2>
              <p style={{ margin: '5px 0 0', color: '#829188', fontSize: '13px' }}>Your latest wallet activity</p>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#789184' }}>Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '45px 10px' }}>
                <div style={{ width: '58px', height: '58px', borderRadius: '18px', background: '#eef9f3', color: '#198754', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <HiOutlineCurrencyRupee size={28} />
                </div>
                <div style={{ fontWeight: '800', color: '#365344', marginBottom: '5px' }}>No transactions yet</div>
                <div style={{ color: '#8a9991', fontSize: '13px' }}>Your wallet transactions will appear here.</div>
              </div>
            ) : (
              <div>
                {transactions.map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '20px', border: '1px solid #e4f1e9', boxShadow: '0 7px 22px rgba(30, 80, 50, 0.05)' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#e9f8ef', color: '#198754', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
        {icon}
      </div>
      <div style={{ color: '#809188', fontSize: '12px', fontWeight: '600', marginBottom: '5px' }}>{title}</div>
      <div style={{ color: '#173d2b', fontSize: '22px', fontWeight: '800' }}>{value}</div>
      <div style={{ color: '#9aa79f', fontSize: '11px', marginTop: '4px' }}>{subtitle}</div>
    </div>
  );
}

function TransactionItem({ tx }) {
  const isPayout = tx.type === 'payout';
  const isSuccess =
    tx.status === 'processed' ||
    tx.status === 'captured' ||
    tx.status === 'completed' ||
    tx.status === 'success';
  const isFailed = tx.status === 'failed';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', padding: '16px 5px', borderBottom: '1px solid #edf2ef' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '13px', minWidth: 0 }}>
        <div style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '14px', background: isPayout ? '#e9f8ef' : '#eef7ff', color: isPayout ? '#198754' : '#3779b5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPayout ? <HiOutlineArrowDown size={21} /> : <HiOutlineArrowUp size={21} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: '750', color: '#274535', fontSize: '14px', marginBottom: '4px' }}>
            {isPayout ? 'Payment Received' : 'Payment Made'}
          </div>
          <div style={{ color: '#8a9991', fontSize: '11px' }}>
            {tx.order_id ? `Order #${tx.order_id} • ` : ''}
            {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN') : ''}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: '800', fontSize: '15px', color: isPayout ? '#198754' : '#d35454', marginBottom: '5px' }}>
          {isPayout ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN')}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: isSuccess ? '#e7f8ed' : isFailed ? '#fdeaea' : '#fff5d9', color: isSuccess ? '#198754' : isFailed ? '#c0392b' : '#a47700' }}>
          {isSuccess ? <HiOutlineCheckCircle size={12} /> : isFailed ? <HiOutlineXCircle size={12} /> : <HiOutlineClock size={12} />}
          {tx.status}
        </div>
      </div>
    </div>
  );
}