const authMiddleware = require('./authMiddleware');

/**
 * Middleware pour vérifier que l'utilisateur est un administrateur
 * Fonctionne avec Next.js API Routes
 * Doit être utilisé après authMiddleware
 */
const adminMiddleware = async (req, res) => {
  try {
    // Appliquer d'abord le middleware d'authentification
    const user = await authMiddleware(req, res);
    
    if (!user) {
      return null; // La réponse a déjà été envoyée par authMiddleware
    }

    // Vérifier que l'utilisateur est un administrateur
    if (user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Accès interdit. Droits administrateur requis.'
      });
      return null;
    }

    // Retourner l'utilisateur admin
    return user;
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in admin authentication'
    });
    return null;
  }
};

module.exports = adminMiddleware;

