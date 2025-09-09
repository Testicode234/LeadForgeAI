import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

const CallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('Processing Apollo authentication...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      if (!code) {
        console.error('No code found in URL');
        setStatus('Error: No authorization code found.');
        navigate('/campaigns?error=no_code');
        return;
      }

      try {
        const response = await fetch('https://api.apollo.io/v1/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: import.meta.env.VITE_APOLLO_CLIENT_ID,
            client_secret: import.meta.env.VITE_APOLLO_CLIENT_SECRET,
            code,
            redirect_uri: import.meta.env.VITE_APOLLO_REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch access token');
        }

        const accessToken = data.access_token;
        if (!accessToken) {
          throw new Error('No access token received');
        }

        const { error } = await supabase
          .from('user_tokens')
          .upsert({
            user_id: user.id,
            apollo_access_token: accessToken,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          throw new Error('Failed to store token: ' + error.message);
        }

        setStatus('Authentication successful! Redirecting to campaigns...');
        navigate('/campaigns?success=auth_completed');
      } catch (error) {
        console.error('OAuth Callback Error:', error);
        setStatus(`Error: ${error.message}`);
        navigate(`/campaigns?error=${encodeURIComponent(error.message)}`);
      }
    };

    if (user) {
      handleOAuthCallback();
    }
  }, [user, searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
      <div className="text-foreground">{status}</div>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default CallbackPage;