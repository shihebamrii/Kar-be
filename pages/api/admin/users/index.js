const dbConnect = require('../../../../utils/dbConnect');
const User = require('../../../../models/User');
const adminMiddleware = require('../../../../middlewares/adminMiddleware');
const { corsHandler } = require('../../../../utils/cors');

async function handler(req, res) {
  // Handle CORS preflight and set headers
  if (corsHandler(req, res)) {
    return; // OPTIONS request handled
  }

  // Se connecter à la base de données
  await dbConnect();

  // Appliquer le middleware admin
  const admin = await adminMiddleware(req, res);
  if (!admin) {
    return; // La réponse a déjà été envoyée par le middleware
  }

  try {
    // GET - Lister tous les utilisateurs
    if (req.method === 'GET') {
      const users = await User.find({})
        .select('-password')
        .populate('vehicles')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users,
          count: users.length
        }
      });
    }

    // Méthode non autorisée
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

export default handler;

