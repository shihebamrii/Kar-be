const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

/**
 * Génère un PDF pour l'historique d'un véhicule
 * @param {Object} vehicle - Le véhicule avec ses services
 * @returns {Buffer} - Le buffer du PDF généré
 */
function generateVehicleHistoryPDF(vehicle) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20).text('Carnet d\'Entretien - Karhabti', { align: 'center' });
      doc.moveDown();

      // Informations du véhicule
      doc.fontSize(16).text('Informations du Véhicule', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Marque: ${vehicle.marque}`);
      doc.text(`Modèle: ${vehicle.modele}`);
      doc.text(`Année: ${vehicle.annee}`);
      doc.text(`Immatriculation: ${vehicle.immatriculation}`);
      doc.moveDown();

      // Historique des services
      if (vehicle.services && vehicle.services.length > 0) {
        doc.fontSize(16).text('Historique des Services', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);

        // Trier les services par date (plus récent en premier)
        const sortedServices = [...vehicle.services].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );

        sortedServices.forEach((service, index) => {
          doc.fontSize(12).text(`${index + 1}. ${service.type}`, { continued: false });
          doc.fontSize(10);
          doc.text(`   Date: ${format(new Date(service.date), 'dd/MM/yyyy')}`);
          doc.text(`   Kilométrage: ${service.kilometrage.toLocaleString('fr-FR')} km`);
          if (service.notes) {
            doc.text(`   Notes: ${service.notes}`);
          }
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(12).text('Aucun service enregistré pour ce véhicule.');
      }

      doc.moveDown();
      doc.fontSize(10).text(
        `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`,
        { align: 'right' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateVehicleHistoryPDF
};

