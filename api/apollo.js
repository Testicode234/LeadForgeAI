const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const { path, method, query, body, headers } = req;
    const endpoint = path.replace('/api', '');
    const apiKey = headers['api-key'] || process.env.VITE_APOLLO_API_KEY;
    const oauthToken = headers['authorization']?.replace('Bearer ', '');

    console.log('Vercel Function Called:', { endpoint, method, query });

    const response = await fetch(`https://api.apollo.io${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(oauthToken ? { Authorization: `Bearer ${oauthToken}` } : { 'Api-Key': apiKey }),
      },
      body: body ? JSON.stringify(body) : null,
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      res.status(response.status).json({ success: response.ok, data, error: response.ok ? null : data.error || 'Request failed' });
    } catch (jsonError) {
      console.error('JSON Parse Error:', text.slice(0, 200));
      res.status(500).json({ success: false, error: `Invalid JSON response: ${text.slice(0, 100)}` });
    }
  } catch (error) {
    console.error('Vercel Function Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};