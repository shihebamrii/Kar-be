const dbConnect = require('../../../utils/dbConnect');
const Vehicle = require('../../../models/Vehicle');
const Service = require('../../../models/Service');
const authMiddleware = require('../../../middlewares/authMiddleware');
const { corsHandler } = require('../../../utils/cors');

async function handler(req, res) {
  // Handle CORS preflight and set headers
  if (corsHandler(req, res)) {
    return; // OPTIONS request handled
  }

  // Se connecter à la base de données
  await dbConnect();

  // Appliquer le middleware d'authentification
  const user = await authMiddleware(req, res);
  if (!user) {
    return; // La réponse a déjà été envoyée par le middleware
  }

  try {
    const { id } = req.query;

    // GET - Récupérer un véhicule par ID
    if (req.method === 'GET') {
      const vehicle = await Vehicle.findOne({
        _id: id,
        owner: user._id
      }).populate('services');

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Vehicle retrieved successfully',
        data: { vehicle }
      });
    }

    // PUT - Modifier un véhicule
    if (req.method === 'PUT') {
      const { marque, modele, annee, immatriculation } = req.body;

      const vehicle = await Vehicle.findOne({
        _id: id,
        owner: user._id
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Vérifier si l'immatriculation existe déjà pour un autre véhicule
      if (immatriculation && immatriculation.toUpperCase() !== vehicle.immatriculation) {
        const existingVehicle = await Vehicle.findOne({
          owner: user._id,
          immatriculation: immatriculation.toUpperCase(),
          _id: { $ne: id }
        });

        if (existingVehicle) {
          return res.status(400).json({
            success: false,
            message: 'Vehicle with this immatriculation already exists'
          });
        }
      }

      // Mettre à jour les champs
      if (marque) vehicle.marque = marque;
      if (modele) vehicle.modele = modele;
      if (annee) vehicle.annee = annee;
      if (immatriculation) vehicle.immatriculation = immatriculation.toUpperCase();

      await vehicle.save();
      await vehicle.populate('services');

      return res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: { vehicle }
      });
    }

    // DELETE - Supprimer un véhicule
    if (req.method === 'DELETE') {
      const vehicle = await Vehicle.findOne({
        _id: id,
        owner: user._id
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Supprimer tous les services associés
      await Service.deleteMany({ vehicle: id });

      // Supprimer le véhicule de la liste des véhicules de l'utilisateur
      const User = require('../../../models/User');
      await User.findByIdAndUpdate(user._id, {
        $pull: { vehicles: id }
      });

      // Supprimer le véhicule
      await Vehicle.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Vehicle deleted successfully'
      });
    }

    // Méthode non autorisée
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    console.error('Vehicle API error:', error);

    // Gérer les erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Gérer les erreurs ObjectId invalides
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
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

