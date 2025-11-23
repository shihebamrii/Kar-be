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

  // Seulement les requêtes GET sont autorisées
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  // Se connecter à la base de données
  await dbConnect();

  // Appliquer le middleware admin
  const admin = await adminMiddleware(req, res);
  if (!admin) {
    return; // La réponse a déjà été envoyée par le middleware
  }

  try {
    // Statistiques globales
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });
    const totalVehicles = await Vehicle.countDocuments();
    const totalServices = await Service.countDocuments();

    // Statistiques par type de service
    const servicesByType = await Service.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Statistiques des véhicules par marque
    const vehiclesByBrand = await Vehicle.aggregate([
      {
        $group: {
          _id: '$marque',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10 // Top 10 marques
      }
    ]);

    // Statistiques des services par mois (derniers 12 mois)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const servicesByMonth = await Service.aggregate([
      {
        $match: {
          date: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Utilisateurs avec le plus de véhicules
    const usersWithMostVehicles = await User.aggregate([
      {
        $project: {
          username: 1,
          email: 1,
          vehicleCount: { $size: { $ifNull: ['$vehicles', []] } }
        }
      },
      {
        $sort: { vehicleCount: -1 }
      },
      {
        $limit: 10 // Top 10 utilisateurs
      }
    ]);

    // Véhicules avec le plus de services
    const vehiclesWithMostServices = await Vehicle.aggregate([
      {
        $project: {
          marque: 1,
          modele: 1,
          immatriculation: 1,
          serviceCount: { $size: { $ifNull: ['$services', []] } }
        }
      },
      {
        $sort: { serviceCount: -1 }
      },
      {
        $limit: 10 // Top 10 véhicules
      }
    ]);

    // Services récents (derniers 10)
    const recentServices = await Service.find({})
      .sort({ date: -1 })
      .limit(10)
      .populate('vehicle', 'marque modele immatriculation');

    // Nouveaux utilisateurs (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Nouveaux véhicules (derniers 30 jours)
    const newVehiclesLastMonth = await Vehicle.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Nouveaux services (derniers 30 jours)
    const newServicesLastMonth = await Service.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    return res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        overview: {
          totalUsers,
          totalAdmins,
          totalRegularUsers,
          totalVehicles,
          totalServices,
          newUsersLastMonth,
          newVehiclesLastMonth,
          newServicesLastMonth
        },
        servicesByType,
        vehiclesByBrand,
        servicesByMonth,
        topUsers: usersWithMostVehicles,
        topVehicles: vehiclesWithMostServices,
        recentServices
      }
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

export default handler;

