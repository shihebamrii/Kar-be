const dbConnect = require('../../../utils/dbConnect');
const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
const { corsHandler } = require('../../../utils/cors');

export default async function handler(req, res) {
  // Handle CORS preflight and set headers
  if (corsHandler(req, res)) {
    return; // OPTIONS request handled
  }

  // Seulement les requêtes POST sont autorisées
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Se connecter à la base de données
    await dbConnect();

    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Trouver l'utilisateur par email et inclure le mot de passe
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Retourner la réponse (sans le mot de passe)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role || 'user'
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
}

