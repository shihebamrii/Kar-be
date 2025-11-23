const dbConnect = require('../../../../utils/dbConnect');
const Vehicle = require('../../../../models/Vehicle');
const Service = require('../../../../models/Service');
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
    const { id } = req.query;

    // GET - Récupérer un véhicule par ID
    if (req.method === 'GET') {
      const vehicle = await Vehicle.findById(id)
        .populate('owner', 'username email')
        .populate('services');

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

    // PUT - Modifier un véhicule (admin peut modifier n'importe quel véhicule)
    if (req.method === 'PUT') {
      const { marque, modele, annee, immatriculation, owner } = req.body;

      const vehicle = await Vehicle.findById(id);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Vérifier si le nouveau propriétaire existe (si changement de propriétaire)
      if (owner) {
        const newOwner = await User.findById(owner);
        if (!newOwner) {
          return res.status(404).json({
            success: false,
            message: 'New owner not found'
          });
        }

        // Retirer le véhicule de l'ancien propriétaire
        await User.findByIdAndUpdate(vehicle.owner, {
          $pull: { vehicles: id }
        });

        // Ajouter le véhicule au nouveau propriétaire
        await User.findByIdAndUpdate(owner, {
          $addToSet: { vehicles: id }
        });

        vehicle.owner = owner;
      }

      // Vérifier si l'immatriculation existe déjà (si modification)
      if (immatriculation && immatriculation.toUpperCase() !== vehicle.immatriculation) {
        const existingVehicle = await Vehicle.findOne({
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
      await vehicle.populate('owner', 'username email');
      await vehicle.populate('services');

      return res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: { vehicle }
      });
    }

    // DELETE - Supprimer un véhicule (admin peut supprimer n'importe quel véhicule)
    if (req.method === 'DELETE') {
      const vehicle = await Vehicle.findById(id);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Supprimer tous les services associés
      await Service.deleteMany({ vehicle: id });

      // Retirer le véhicule de la liste des véhicules du propriétaire
      await User.findByIdAndUpdate(vehicle.owner, {
        $pull: { vehicles: id }
      });

      // Supprimer le véhicule
      await Vehicle.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Vehicle and all associated services deleted successfully'
      });
    }

    // Méthode non autorisée
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    console.error('Admin vehicle API error:', error);

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

