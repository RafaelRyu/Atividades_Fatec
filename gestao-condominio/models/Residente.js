const mongoose = require('mongoose');

const residenteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  numeroVeiculos: {
    type: Number,
    required: true,
    min: 0
  },
  condominioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Condominio',
    required: true
  },
  isEspecial: {
    type: Boolean,
    default: false
  },
  tipoEspecial: {
    type: String,
    enum: ['sindico', 'gerente', 'zelador', 'outro'],
    default: null
  },
  vagaReservada: {
    type: Number,
    min: 1,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Residente', residenteSchema);