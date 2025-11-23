const dbConnect = require('../../../../utils/dbConnect');
const Vehicle = require('../../../../models/Vehicle');
const authMiddleware = require('../../../../middlewares/authMiddleware');
const { generateVehicleHistoryPDF } = require('../../../../utils/pdfGenerator');

async function handler(req, res) {
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
    const { vehicleId } = req.query;

    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID is required'
      });
    }

    // Récupérer le véhicule avec ses services
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      owner: user._id
    }).populate('services');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Générer le PDF
    const pdfBuffer = await generateVehicleHistoryPDF(vehicle);

    // Définir les headers pour le téléchargement du PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="karhabti-${vehicle.immatriculation}-${new Date().toISOString().split('T')[0]}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Envoyer le PDF
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message
    });
  }
}

export default handler;

