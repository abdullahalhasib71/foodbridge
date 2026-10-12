import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { LangProvider } from './lib/i18n.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Layout from './components/Layout.jsx';
import Protected from './components/Protected.jsx';
import { Spinner } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import { ForgotPassword, Login, Register } from './pages/Auth.jsx';
import NotFound from './pages/NotFound.jsx';

// Pages with maps load on demand to keep the first page fast on mobile data.
const Food = lazy(() => import('./pages/Food.jsx'));
const DonationDetail = lazy(() => import('./pages/DonationDetail.jsx'));
const NewDonation = lazy(() => import('./pages/DonationEditor.jsx').then((m) => ({ default: m.NewDonation })));
const EditDonation = lazy(() => import('./pages/DonationEditor.jsx').then((m) => ({ default: m.EditDonation })));
const Events = lazy(() => import('./pages/Events.jsx').then((m) => ({ default: m.Events })));
const EventDetail = lazy(() => import('./pages/Events.jsx').then((m) => ({ default: m.EventDetail })));
const EventEditor = lazy(() => import('./pages/Events.jsx').then((m) => ({ default: m.EventEditor })));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000 } } });
const POSTERS = ['donor', 'operator', 'admin'];

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<div className="wrap"><Spinner /></div>}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="food" element={<Food />} />
                    <Route path="food/new" element={<Protected roles={POSTERS}><NewDonation /></Protected>} />
                    <Route path="food/:id" element={<DonationDetail />} />
                    <Route path="food/:id/edit" element={<Protected roles={POSTERS}><EditDonation /></Protected>} />
                    <Route path="events" element={<Protected><Events /></Protected>} />
                    <Route path="events/new" element={<Protected roles={POSTERS}><EventEditor /></Protected>} />
                    <Route path="events/:id" element={<Protected><EventDetail /></Protected>} />
                    <Route path="events/:id/edit" element={<Protected roles={POSTERS}><EventEditor /></Protected>} />
                    <Route path="dashboard" element={<Protected><Dashboard /></Protected>} />
                    <Route path="profile" element={<Protected><Profile /></Protected>} />
                    <Route path="admin" element={<Protected roles={['admin']}><Admin /></Protected>} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </LangProvider>
    </QueryClientProvider>
  </StrictMode>,
);
