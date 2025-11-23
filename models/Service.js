const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required']
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['Vidange', 'Freins', 'Pneus', 'Filtres', 'Batterie', 'Révision', 'Autre'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
    max: [Date.now, 'Date cannot be in the future']
  },
  kilometrage: {
    type: Number,
    required: [true, 'Kilométrage is required'],
    min: [0, 'Kilométrage must be positive']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes must not exceed 1000 characters']
  },
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
serviceSchema.index({ vehicle: 1 });
serviceSchema.index({ date: -1 });
serviceSchema.index({ type: 1 });

// Mettre à jour updatedAt avant de sauvegarder
serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Service || mongoose.model('Service', serviceSchema);

