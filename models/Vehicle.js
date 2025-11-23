const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },
  marque: {
    type: String,
    required: [true, 'Marque is required'],
    trim: true,
    maxlength: [50, 'Marque must not exceed 50 characters']
  },
  modele: {
    type: String,
    required: [true, 'Modele is required'],
    trim: true,
    maxlength: [50, 'Modele must not exceed 50 characters']
  },
  annee: {
    type: Number,
    required: [true, 'Année is required'],
    min: [1900, 'Année must be valid'],
    max: [new Date().getFullYear() + 1, 'Année cannot be in the future']
  },
  immatriculation: {
    type: String,
    required: [true, 'Immatriculation is required'],
    trim: true,
    uppercase: true,
    maxlength: [20, 'Immatriculation must not exceed 20 characters']
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour améliorer les performances des requêtes
vehicleSchema.index({ owner: 1 });
vehicleSchema.index({ immatriculation: 1 });

// Mettre à jour updatedAt avant de sauvegarder
vehicleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);

