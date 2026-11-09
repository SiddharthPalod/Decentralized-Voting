import { Navigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { connected } = useWallet();

  if (!connected) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
