const dbConnect = require('../../../utils/dbConnect');
const Vehicle = require('../../../models/Vehicle');
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
    // GET - Lister tous les véhicules de l'utilisateur
    if (req.method === 'GET') {
      const vehicles = await Vehicle.find({ owner: user._id })
        .populate('services')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: 'Vehicles retrieved successfully',
        data: {
          vehicles,
          count: vehicles.length
        }
      });
    }

    // POST - Créer un nouveau véhicule
    if (req.method === 'POST') {
      const { marque, modele, annee, immatriculation } = req.body;

      // Validation des champs
      if (!marque || !modele || !annee || !immatriculation) {
        return res.status(400).json({
          success: false,
          message: 'Please provide marque, modele, annee, and immatriculation'
        });
      }

      // Vérifier si l'immatriculation existe déjà pour cet utilisateur
      const existingVehicle = await Vehicle.findOne({
        owner: user._id,
        immatriculation: immatriculation.toUpperCase()
      });

      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle with this immatriculation already exists'
        });
      }

      // Créer un nouveau véhicule
      const vehicle = new Vehicle({
        owner: user._id,
        marque,
        modele,
        annee,
        immatriculation: immatriculation.toUpperCase()
      });

      await vehicle.save();

      // Ajouter le véhicule à la liste des véhicules de l'utilisateur
      const User = require('../../../models/User');
      await User.findByIdAndUpdate(user._id, {
        $push: { vehicles: vehicle._id }
      });

      // Populate pour retourner les données complètes
      await vehicle.populate('services');

      return res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: { vehicle }
      });
    }

    // Méthode non autorisée
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    console.error('Vehicles API error:', error);

    // Gérer les erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
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

