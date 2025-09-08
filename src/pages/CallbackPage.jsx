import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

const CallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      if (!code) {
        console.error('No code found in URL');
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

        // Store token in user_tokens table
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

        navigate('/campaigns?success=auth_completed');
      } catch (error) {
        console.error('OAuth Callback Error:', error);
        navigate(`/campaigns?error=${encodeURIComponent(error.message)}`);
      }
    };

    if (user) {
      handleOAuthCallback();
    }
  }, [user, searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-foreground">Processing Apollo authentication...</div>
    </div>
  );
};

export default CallbackPage;