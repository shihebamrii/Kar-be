const dbConnect = require('../../../../utils/dbConnect');
const User = require('../../../../models/User');
const Vehicle = require('../../../../models/Vehicle');
const Service = require('../../../../models/Service');
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
    const { id } = req.query;

    // GET - Récupérer un utilisateur par ID
    if (req.method === 'GET') {
      const user = await User.findById(id)
        .select('-password')
        .populate('vehicles');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: { user }
      });
    }

    // PUT - Modifier un utilisateur (changer le rôle, etc.)
    if (req.method === 'PUT') {
      const { username, email, role } = req.body;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Empêcher l'auto-suppression du rôle admin
      if (id === admin._id.toString() && role && role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'You cannot remove your own admin role'
        });
      }

      // Mettre à jour les champs
      if (username) user.username = username;
      if (email) user.email = email;
      if (role && ['user', 'admin'].includes(role)) user.role = role;

      await user.save();
      await user.populate('vehicles');

      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user: { ...user.toObject(), password: undefined } }
      });
    }

    // DELETE - Supprimer un utilisateur
    if (req.method === 'DELETE') {
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Empêcher l'auto-suppression
      if (id === admin._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account'
        });
      }

      // Supprimer tous les véhicules de l'utilisateur
      const vehicles = await Vehicle.find({ owner: id });
      const vehicleIds = vehicles.map(v => v._id);

      // Supprimer tous les services associés
      await Service.deleteMany({ vehicle: { $in: vehicleIds } });

      // Supprimer tous les véhicules
      await Vehicle.deleteMany({ owner: id });

      // Supprimer l'utilisateur
      await User.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'User and all associated data deleted successfully'
      });
    }

    // Méthode non autorisée
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    console.error('Admin user API error:', error);

    // Gérer les erreurs ObjectId invalides
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

export default handler;

