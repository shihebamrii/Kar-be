const dbConnect = require('../../../../utils/dbConnect');
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
    // GET - Lister tous les services
    if (req.method === 'GET') {
      const { type, vehicleId } = req.query;

      // Construire le filtre
      const filter = {};
      
      if (type) {
        filter.type = type;
      }
      
      if (vehicleId) {
        filter.vehicle = vehicleId;
      }

      const services = await Service.find(filter)
        .populate({
          path: 'vehicle',
          select: 'marque modele immatriculation owner',
          populate: {
            path: 'owner',
            select: 'username email'
          }
        })
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

    // Méthode non autorisée
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    console.error('Admin services API error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

export default handler;

