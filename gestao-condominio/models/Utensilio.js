const mongoose = require('mongoose');

const utensilioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  condominioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Condominio',
    required: true
  },
  disponivel: {
    type: Boolean,
    default: true
  },
  reserva: {
    residenteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Residente',
      default: null
    },
    residenteNome: {
      type: String,
      default: null
    },
    dataReserva: {
      type: Date,
      default: null
    },
    dataExpiracao: {
      type: Date,
      default: null
    },
    motivo: {
      type: String,
      trim: true,
      default: null
    }
  }
}, {
  timestamps: true
});

// Método para verificar se o utensílio está reservado
utensilioSchema.methods.isReservado = function() {
  if (!this.reserva.dataExpiracao) return false;
  return this.reserva.dataExpiracao > new Date();
};

// Método para reservar utensílio
utensilioSchema.methods.reservar = async function(residenteId, residenteNome, horas = 24, motivo = null) {
  if (this.isReservado()) {
    throw new Error('Utensílio já está reservado');
  }
  
  const dataExpiracao = new Date();
  dataExpiracao.setHours(dataExpiracao.getHours() + horas);
  
  this.reserva = {
    residenteId,
    residenteNome,
    dataReserva: new Date(),
    dataExpiracao,
    motivo
  };
  this.disponivel = false;
  
  await this.save();
  return this;
};

// Método para liberar utensílio
utensilioSchema.methods.liberar = async function() {
  this.reserva = {
    residenteId: null,
    residenteNome: null,
    dataReserva: null,
    dataExpiracao: null,
    motivo: null
  };
  this.disponivel = true;
  
  await this.save();
  return this;
};

module.exports = mongoose.model('Utensilio', utensilioSchema);