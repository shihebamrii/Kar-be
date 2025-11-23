const dbConnect = require('../../../../utils/dbConnect');
const Service = require('../../../../models/Service');
const Vehicle = require('../../../../models/Vehicle');
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

    // GET - Récupérer un service par ID
    if (req.method === 'GET') {
      const service = await Service.findById(id)
        .populate('vehicle');

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Service retrieved successfully',
        data: { service }
      });
    }

    // PUT - Modifier un service (admin peut modifier n'importe quel service)
    if (req.method === 'PUT') {
      const { type, date, kilometrage, notes, vehicle } = req.body;

      const service = await Service.findById(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Si changement de véhicule, vérifier que le nouveau véhicule existe
      if (vehicle && vehicle !== service.vehicle.toString()) {
        const newVehicle = await Vehicle.findById(vehicle);
        if (!newVehicle) {
          return res.status(404).json({
            success: false,
            message: 'Vehicle not found'
          });
        }

        // Retirer le service de l'ancien véhicule
        await Vehicle.findByIdAndUpdate(service.vehicle, {
          $pull: { services: id }
        });

        // Ajouter le service au nouveau véhicule
        await Vehicle.findByIdAndUpdate(vehicle, {
          $addToSet: { services: id }
        });

        service.vehicle = vehicle;
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

    // DELETE - Supprimer un service (admin peut supprimer n'importe quel service)
    if (req.method === 'DELETE') {
      const service = await Service.findById(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Retirer le service de la liste des services du véhicule
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
    console.error('Admin service API error:', error);

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

