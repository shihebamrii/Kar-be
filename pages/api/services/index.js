const dbConnect = require('../../../utils/dbConnect');
const Service = require('../../../models/Service');
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
    // GET - Lister tous les services de l'utilisateur
    if (req.method === 'GET') {
      const { type, vehicleId } = req.query;

      // Récupérer tous les véhicules de l'utilisateur
      const userVehicles = await Vehicle.find({ owner: user._id }).select('_id');
      const vehicleIds = userVehicles.map(v => v._id);

      // Construire le filtre
      const filter = { vehicle: { $in: vehicleIds } };
      
      if (type) {
        filter.type = type;
      }
      
      if (vehicleId) {
        // Vérifier que le véhicule appartient à l'utilisateur
        const vehicle = await Vehicle.findOne({
          _id: vehicleId,
          owner: user._id
        });
        
        if (!vehicle) {
          return res.status(404).json({
            success: false,
            message: 'Vehicle not found'
          });
        }
        
        filter.vehicle = vehicleId;
      }

      const services = await Service.find(filter)
        .populate('vehicle')
        .sort({ date: -1 });

      return res.status(200).json({
        success: true,
        message: 'Services retrieved successfully',
        data: {
          services,
          count: services.length
        }
      });
    }

    // POST - Créer un nouveau service
    if (req.method === 'POST') {
      const { vehicle: vehicleId, type, date, kilometrage, notes } = req.body;

      // Validation des champs
      if (!vehicleId || !type || !date || kilometrage === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Please provide vehicle, type, date, and kilometrage'
        });
      }

      // Vérifier que le véhicule appartient à l'utilisateur
      const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        owner: user._id
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Créer un nouveau service
      const service = new Service({
        vehicle: vehicleId,
        type,
        date: new Date(date),
        kilometrage,
        notes: notes || ''
      });

      await service.save();

      // Ajouter le service à la liste des services du véhicule
      await Vehicle.findByIdAndUpdate(vehicleId, {
        $push: { services: service._id }
      });

      // Populate pour retourner les données complètes
      await service.populate('vehicle');

      return res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: { service }
      });
    }

    // Méthode non autorisée
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    console.error('Services API error:', error);

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
        message: 'Invalid ID format'
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

