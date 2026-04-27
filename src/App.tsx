import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

interface AppConfig {
  baseUrl: string;
  loginUrl: string;
  dataEndpoint: string;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');

  // ✅ ONLY change: correct API endpoint
  const apiConfig: AppConfig = {
    baseUrl: 'https://sejaya.finflux.io/fineract-provider',
    loginUrl: 'https://sejaya.finflux.io/fineract-provider/api/oauth/token',
    dataEndpoint: 'https://sejaya.finflux.io/fineract-provider/api/v1/accounttransfers',
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
      console.log('Token restored from localStorage:', savedToken.substring(0, 20) + '...');
    }
  }, []);

  const handleLoginSuccess = (newToken: string) => {
    console.log('Login successful');
    setToken(newToken);
    setIsLoggedIn(true);
    // Token already saved in localStorage by Login component
  };

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setToken('');
  };

  return (
    <div className="app">
      {!isLoggedIn ? (
        <Login
          onLoginSuccess={handleLoginSuccess}
          apiUrl={apiConfig.loginUrl}
        />
      ) : (
        <Dashboard
          token={token}
          apiConfig={apiConfig}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;