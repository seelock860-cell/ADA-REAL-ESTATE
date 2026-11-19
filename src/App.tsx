import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SupabaseProvider } from './context/SupabaseContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PumpingWhatsApp } from './components/PumpingWhatsApp';
import { ToastContainer } from './components/ToastContainer';
import { HomePage } from './pages/HomePage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyDetailsPage } from './pages/PropertyDetailsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.replace('#', ''));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-950">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <PumpingWhatsApp />
    </div>
  );
}

export default function App() {
  return (
    <SupabaseProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ToastContainer />
        <Routes>
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
          <Route
            path="/properties"
            element={
              <PublicLayout>
                <PropertiesPage />
              </PublicLayout>
            }
          />
          <Route
            path="/properties/:id"
            element={
              <PublicLayout>
                <PropertyDetailsPage />
              </PublicLayout>
            }
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <AboutPage />
              </PublicLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <PublicLayout>
                <ContactPage />
              </PublicLayout>
            }
          />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route
            path="*"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </SupabaseProvider>
  );
}
