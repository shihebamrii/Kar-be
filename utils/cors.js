/**
 * CORS helper for Next.js API routes
 * Handles preflight OPTIONS requests and sets CORS headers
 */
function corsHandler(req, res) {
  // Set CORS headers for all responses
  const origin = req.headers.origin;

  // When credentials are true, we must specify the actual origin, not '*'
  // Allow localhost for development
  const allowedOrigins = [
    'http://localhost:5173',
    'https://kar-be.onrender.com',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];

  // Set origin - use the request origin if it's allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    // For other origins, allow them but without credentials
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // No origin header (e.g., same-origin request or Postman)
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

module.exports = { corsHandler };

