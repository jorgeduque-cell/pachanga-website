import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute';
import { PageTransition } from '@/components/PageTransition';

// Public Pages
import { HomePage } from '@/pages/HomePage';
import { GaleriaPage } from '@/pages/GaleriaPage';
import { EventosPage } from '@/pages/EventosPage';
import { MenuPage } from '@/pages/MenuPage';
import { ContactoPage } from '@/pages/ContactoPage';
import { HistoriaPage } from '@/pages/HistoriaPage';
import { ReservasPage } from '@/pages/ReservasPage';
import { QrCapturePage } from '@/pages/QrCapturePage';

// Admin Pages
import { AdminLogin } from '@/pages/AdminLogin';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminReservations } from '@/pages/AdminReservations';
import { AdminCustomers } from '@/pages/AdminCustomers';

// Wrapper para transiciones de página
function AnimatedOutlet() {
  return (
    <AnimatePresence mode="wait">
      <PageTransition>
        <Outlet />
      </PageTransition>
    </AnimatePresence>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        element: <AnimatedOutlet />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'historia', element: <HistoriaPage /> },
          { path: 'galeria', element: <GaleriaPage /> },
          { path: 'eventos', element: <EventosPage /> },
          { path: 'menu', element: <MenuPage /> },
          { path: 'contacto', element: <ContactoPage /> },
          { path: 'reservas', element: <ReservasPage /> },
          { path: 'qr', element: <QrCapturePage /> },
        ],
      },
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'reservas', element: <AdminReservations /> },
      { path: 'clientes', element: <AdminCustomers /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
