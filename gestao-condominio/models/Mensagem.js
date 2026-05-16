const mongoose = require('mongoose');

const mensagemSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  mensagem: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Mensagem', mensagemSchema);