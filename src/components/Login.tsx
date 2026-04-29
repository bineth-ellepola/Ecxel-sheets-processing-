import React, { useState } from 'react';
import axios from 'axios';
import { storeCredentials } from '../utils/authManager';
import type { LoginCredentials } from '../types';
import '../styles/Login.css';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
  apiUrl: string;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, apiUrl }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Prepare OAuth request payload
      const oauthPayload = {
        username: credentials.username,
        password: credentials.password,
        client_id: 'community-app',
        grant_type: 'password',
        isPasswordEncrypted: 'false'
      };

      console.log('Sending login request to:', apiUrl);
      console.log('Payload:', oauthPayload);

      const response = await axios.post(`${apiUrl}`, oauthPayload);
      
      console.log('Login response:', response.data);

      // Extract token from response - OAuth typically returns access_token
      let token: string | null = null;
      
      if (response.data?.access_token) {
        token = response.data.access_token;
      } else if (response.data?.token) {
        token = response.data.token;
      } else if (typeof response.data === 'string') {
        token = response.data;
      }

      if (token) {
        console.log('Token extracted:', token.substring(0, 20) + '...');
        localStorage.setItem('authToken', token);
        storeCredentials(credentials.username, credentials.password);
        onLoginSuccess(token);
      } else {
        console.error('No token found in response:', response.data);
        setError('Invalid response from login server - no token received');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      setError(
        err.response?.data?.error_description || 
        err.response?.data?.message || 
        err.message ||
        'Login failed. Please check your username and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Excel Data Processor</h1>
        <p className="subtitle">Upload and process Excel files with API integration</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder=""
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="      "
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
