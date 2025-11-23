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
    const { id } = req.query;

    // GET - Récupérer un service par ID
    if (req.method === 'GET') {
      const service = await Service.findById(id).populate('vehicle');

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Vérifier que le véhicule associé appartient à l'utilisateur
      const vehicle = await Vehicle.findOne({
        _id: service.vehicle._id,
        owner: user._id
      });

      if (!vehicle) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this service'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Service retrieved successfully',
        data: { service }
      });
    }

    // PUT - Modifier un service
    if (req.method === 'PUT') {
      const { type, date, kilometrage, notes } = req.body;

      const service = await Service.findById(id).populate('vehicle');

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Vérifier que le véhicule associé appartient à l'utilisateur
      const vehicle = await Vehicle.findOne({
        _id: service.vehicle._id || service.vehicle,
        owner: user._id
      });

      if (!vehicle) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this service'
        });
      }

      // Mettre à jour les champs
      if (type) service.type = type;
      if (date) service.date = new Date(date);
      if (kilometrage !== undefined) service.kilometrage = kilometrage;
      if (notes !== undefined) service.notes = notes;

      await service.save();
      await service.populate('vehicle');

      return res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: { service }
      });
    }

    // DELETE - Supprimer un service
    if (req.method === 'DELETE') {
      const service = await Service.findById(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Vérifier que le véhicule associé appartient à l'utilisateur
      const vehicle = await Vehicle.findOne({
        _id: service.vehicle,
        owner: user._id
      });

      if (!vehicle) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this service'
        });
      }

      // Supprimer le service de la liste des services du véhicule
      await Vehicle.findByIdAndUpdate(service.vehicle, {
        $pull: { services: id }
      });

      // Supprimer le service
      await Service.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Service deleted successfully'
      });
    }

    // Méthode non autorisée
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    console.error('Service API error:', error);

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
        message: 'Invalid service ID'
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

