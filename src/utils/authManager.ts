/**
 * Authentication Manager
 * Handles automatic re-login when token expires
 */

import axios from 'axios';

/**
 * Store credentials temporarily (in sessionStorage for security)
 */
export function storeCredentials(username: string, password: string): void {
  try {
    sessionStorage.setItem('temp_credentials', JSON.stringify({ username, password }));
    console.log('✓ Credentials stored for auto-login');
  } catch (error) {
    console.warn('Could not store credentials:', error);
  }
}

/**
 * Retrieve stored credentials
 */
export function getStoredCredentials(): { username: string; password: string } | null {
  try {
    const stored = sessionStorage.getItem('temp_credentials');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Could not retrieve credentials:', error);
    return null;
  }
}

/**
 * Clear stored credentials
 */
export function clearStoredCredentials(): void {
  try {
    sessionStorage.removeItem('temp_credentials');
  } catch (error) {
    console.warn('Could not clear credentials:', error);
  }
}

/**
 * Auto-login when token expires
 */
export async function autoLogin(loginUrl: string): Promise<string | null> {
  try {
    const credentials = getStoredCredentials();

    if (!credentials) {
      console.error('No stored credentials for auto-login');
      return null;
    }

    console.log('🔄 Attempting automatic re-login...');

    const oauthPayload = {
      username: credentials.username,
      password: credentials.password,
      client_id: 'community-app',
      grant_type: 'password',
      isPasswordEncrypted: 'false',
    };

    const response = await axios.post(loginUrl, oauthPayload);

    let newToken: string | null = null;

    if (response.data?.access_token) {
      newToken = response.data.access_token;
    } else if (response.data?.token) {
      newToken = response.data.token;
    } else if (typeof response.data === 'string') {
      newToken = response.data;
    }

    if (newToken) {
      console.log('✓ Auto-login successful! New token obtained');
      localStorage.setItem('authToken', newToken);
      return newToken;
    } else {
      console.error('Auto-login failed: No token in response');
      return null;
    }
  } catch (error: any) {
    console.error('Auto-login error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return null;
  }
}
