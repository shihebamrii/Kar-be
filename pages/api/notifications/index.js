const dbConnect = require('../../../utils/dbConnect');
const Vehicle = require('../../../models/Vehicle');
const Service = require('../../../models/Service');
const authMiddleware = require('../../../middlewares/authMiddleware');
const { corsHandler } = require('../../../utils/cors');
const { addDays, differenceInDays } = require('date-fns');

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

  // Appliquer le middleware d'authentification
  const user = await authMiddleware(req, res);
  if (!user) {
    return; // La réponse a déjà été envoyée par le middleware
  }

  try {
    // Récupérer tous les véhicules de l'utilisateur avec leurs services
    const vehicles = await Vehicle.find({ owner: user._id }).populate('services');

    const notifications = [];

    // Pour chaque véhicule, vérifier les services à venir
    for (const vehicle of vehicles) {
      if (!vehicle.services || vehicle.services.length === 0) {
        continue;
      }

      // Trier les services par date (plus récent en premier)
      const sortedServices = [...vehicle.services].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );

      // Récupérer le service le plus récent de chaque type
      const serviceTypes = ['Vidange', 'Freins', 'Pneus', 'Filtres', 'Batterie', 'Révision'];
      const lastServicesByType = {};

      sortedServices.forEach(service => {
        if (!lastServicesByType[service.type]) {
          lastServicesByType[service.type] = service;
        }
      });

      // Vérifier pour chaque type de service
      serviceTypes.forEach(type => {
        const lastService = lastServicesByType[type];
        
        if (lastService) {
          const lastServiceDate = new Date(lastService.date);
          const today = new Date();
          
          // Calculer les jours depuis le dernier service
          const daysSinceService = differenceInDays(today, lastServiceDate);
          
          // Définir les intervalles recommandés (en jours)
          const recommendedIntervals = {
            'Vidange': 365, // 1 an
            'Freins': 730, // 2 ans
            'Pneus': 1095, // 3 ans
            'Filtres': 365, // 1 an
            'Batterie': 1095, // 3 ans
            'Révision': 365 // 1 an
          };

          const interval = recommendedIntervals[type] || 365;
          const daysUntilNextService = interval - daysSinceService;

          // Si le prochain service est dans les 90 prochains jours, créer une notification
          if (daysUntilNextService <= 90 && daysUntilNextService >= 0) {
            notifications.push({
              type: 'upcoming_service',
              priority: daysUntilNextService <= 30 ? 'high' : daysUntilNextService <= 60 ? 'medium' : 'low',
              vehicle: {
                id: vehicle._id,
                marque: vehicle.marque,
                modele: vehicle.modele,
                immatriculation: vehicle.immatriculation
              },
              serviceType: type,
              daysUntilService: Math.ceil(daysUntilNextService),
              lastServiceDate: lastService.date,
              lastServiceKilometrage: lastService.kilometrage,
              message: `Service ${type} recommandé dans ${Math.ceil(daysUntilNextService)} jour(s) pour ${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`
            });
          }
          // Si le service est en retard
          else if (daysUntilNextService < 0) {
            notifications.push({
              type: 'overdue_service',
              priority: 'high',
              vehicle: {
                id: vehicle._id,
                marque: vehicle.marque,
                modele: vehicle.modele,
                immatriculation: vehicle.immatriculation
              },
              serviceType: type,
              daysOverdue: Math.abs(Math.ceil(daysUntilNextService)),
              lastServiceDate: lastService.date,
              lastServiceKilometrage: lastService.kilometrage,
              message: `Service ${type} en retard de ${Math.abs(Math.ceil(daysUntilNextService))} jour(s) pour ${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`
            });
          }
        }
      });
    }

    // Trier les notifications par priorité et date
    notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return (a.daysUntilService || a.daysOverdue) - (b.daysUntilService || b.daysOverdue);
    });

    return res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        count: notifications.length,
        summary: {
          high: notifications.filter(n => n.priority === 'high').length,
          medium: notifications.filter(n => n.priority === 'medium').length,
          low: notifications.filter(n => n.priority === 'low').length
        }
      }
    });
  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

export default handler;

