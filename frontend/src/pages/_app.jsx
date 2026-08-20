import { useEffect, useState } from 'react';
import '../styles/globals.css';
import useAuthStore from '../store/authStore';
import { LanguageProvider } from '../context/LanguageContext';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  const hydrate = useAuthStore((state) => state.hydrate);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  return (
    <LanguageProvider>
      <Component {...pageProps} />
      {mounted && <Toaster position="bottom-center" />}
    </LanguageProvider>
  );
}