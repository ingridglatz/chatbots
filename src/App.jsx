import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bots = lazy(() => import('./pages/Bots'));
const BotConfig = lazy(() => import('./pages/BotConfig'));
const Planos = lazy(() => import('./pages/Planos'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Conversations = lazy(() => import('./pages/Conversations'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  return !token ? children : <Navigate to="/dashboard" replace />;
};

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-96">
    <Loader size={24} className="animate-spin text-brand-500" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="bots" element={<Bots />} />
            <Route path="bots/:id" element={<BotConfig />} />
            <Route path="bots/:botId/conversations" element={<Conversations />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="planos" element={<Planos />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
