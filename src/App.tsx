import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Disclaimer } from './components/Disclaimer';
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
import { AboutMarma } from './pages/AboutMarma';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { ProtocolPage, SessionPage, StepPage } from './pages/ProtocolRoutes';
import { Protocols } from './pages/Protocols';
import { SettingsProvider } from './lib/settings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function Shell() {
  const { pathname } = useLocation();
  // Loading screen on a cold start of the home route (~2 s, or until fonts are ready).
  const [loading, setLoading] = useState(() => pathname === '/');
  useEffect(() => {
    if (!loading) return;
    const min = new Promise((r) => setTimeout(r, 2000));
    const fonts = document.fonts?.ready ?? Promise.resolve();
    let alive = true;
    Promise.all([min, fonts]).then(() => alive && setLoading(false));
    const cap = setTimeout(() => setLoading(false), 3500);
    return () => {
      alive = false;
      clearTimeout(cap);
    };
  }, [loading]);

  return (
    <>
      <ScrollToTop />
      <AnimatePresence>{loading && <LoadingScreen key="loading" />}</AnimatePresence>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/about-marma" element={<Layout><AboutMarma /></Layout>} />
        <Route path="/protocols" element={<Layout><Protocols /></Layout>} />
        <Route path="/protocols/:slug" element={<ProtocolPage />} />
        <Route path="/protocols/:slug/session" element={<SessionPage />} />
        <Route path="/protocols/:slug/step/:n" element={<StepPage />} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
      {!loading && <Disclaimer />}
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      {/* BASE_URL is "/" normally and "/<repo>/" on GitHub Pages. */}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Shell />
      </BrowserRouter>
    </SettingsProvider>
  );
}
