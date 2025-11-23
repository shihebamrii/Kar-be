const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware pour vérifier l'authentification JWT
 * Fonctionne avec Next.js API Routes
 */
const authMiddleware = async (req, res) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
      return null;
    }

    // Extraire le token
    const token = authHeader.substring(7); // Enlever "Bearer "

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
      return null;
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

      // Récupérer l'utilisateur depuis la base de données
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found. Token invalid.'
        });
        return null;
      }

      // Retourner l'utilisateur
      return user;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
        return null;
      }
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          message: 'Invalid token. Authorization denied.'
        });
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
    return null;
  }
};

module.exports = authMiddleware;

