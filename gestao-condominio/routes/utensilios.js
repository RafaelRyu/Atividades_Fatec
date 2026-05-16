const express = require('express');
const router = express.Router();
const Utensilio = require('../models/Utensilio');
const Residente = require('../models/Residente');

// GET todos utensílios
router.get('/', async (req, res) => {
  try {
    const { condominioId, apenasDisponiveis } = req.query;
    let filter = condominioId ? { condominioId } : {};
    
    if (apenasDisponiveis === 'true') {
      filter.disponivel = true;
    }
    
    const utensilios = await Utensilio.find(filter)
      .populate('condominioId', 'nome')
      .populate('reserva.residenteId', 'nome');
    
    // Verificar expiração de reservas
    const now = new Date();
    let atualizado = false;
    for (const utensilio of utensilios) {
      if (utensilio.reserva.dataExpiracao && utensilio.reserva.dataExpiracao < now) {
        await utensilio.liberar();
        atualizado = true;
      }
    }
    
    // Recarregar após possíveis liberações
    let utensiliosAtualizados = utensilios;
    if (atualizado) {
      utensiliosAtualizados = await Utensilio.find(filter)
        .populate('condominioId', 'nome')
        .populate('reserva.residenteId', 'nome');
    }
    
    res.json(utensiliosAtualizados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET um utensílio específico
router.get('/:id', async (req, res) => {
  try {
    const utensilio = await Utensilio.findById(req.params.id)
      .populate('condominioId', 'nome')
      .populate('reserva.residenteId', 'nome');
    
    if (!utensilio) {
      return res.status(404).json({ error: 'Utensílio não encontrado' });
    }
    
    // Verificar expiração
    if (utensilio.reserva.dataExpiracao && utensilio.reserva.dataExpiracao < new Date()) {
      await utensilio.liberar();
      const utensilioAtualizado = await Utensilio.findById(req.params.id)
        .populate('condominioId', 'nome')
        .populate('reserva.residenteId', 'nome');
      return res.json(utensilioAtualizado);
    }
    
    res.json(utensilio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST criar utensílio
router.post('/', async (req, res) => {
  try {
    // Verificar se já existe utensílio com mesmo nome no condomínio
    const utensilioExistente = await Utensilio.findOne({
      nome: req.body.nome,
      condominioId: req.body.condominioId
    });
    
    if (utensilioExistente) {
      return res.status(400).json({ 
        error: 'Utensílio já existe',
        mensagem: 'Já existe um utensílio com este nome neste condomínio'
      });
    }
    
    const utensilio = new Utensilio(req.body);
    await utensilio.save();
    
    const utensilioPopulado = await Utensilio.findById(utensilio._id)
      .populate('condominioId', 'nome');
    
    res.status(201).json(utensilioPopulado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST reservar utensílio
router.post('/:id/reservar', async (req, res) => {
  try {
    const { residenteId, horas = 24, motivo = null } = req.body;
    
    if (!residenteId) {
      return res.status(400).json({ error: 'Residente ID é obrigatório' });
    }
    
    const utensilio = await Utensilio.findById(req.params.id);
    if (!utensilio) {
      return res.status(404).json({ error: 'Utensílio não encontrado' });
    }
    
    // Verificar se utensílio está disponível
    if (utensilio.isReservado && utensilio.isReservado()) {
      return res.status(400).json({ 
        error: 'Utensílio indisponível',
        mensagem: `Utensílio está reservado para ${utensilio.reserva.residenteNome} até ${new Date(utensilio.reserva.dataExpiracao).toLocaleString()}`
      });
    }
    
    // Verificar se residente existe
    const residente = await Residente.findById(residenteId);
    if (!residente) {
      return res.status(404).json({ error: 'Residente não encontrado' });
    }
    
    // Verificar se residente pertence ao mesmo condomínio
    if (residente.condominioId.toString() !== utensilio.condominioId.toString()) {
      return res.status(400).json({ 
        error: 'Residente inválido',
        mensagem: 'O residente deve pertencer ao mesmo condomínio do utensílio'
      });
    }
    
    // Verificar limite de horas (máximo 48 horas para utensílios)
    if (horas > 48) {
      return res.status(400).json({ 
        error: 'Limite excedido',
        mensagem: 'O tempo máximo de reserva para utensílios é de 48 horas'
      });
    }
    
    // Realizar reserva
    await utensilio.reservar(residenteId, residente.nome, horas, motivo);
    
    const utensilioAtualizado = await Utensilio.findById(req.params.id)
      .populate('condominioId', 'nome')
      .populate('reserva.residenteId', 'nome');
    
    res.json({
      success: true,
      mensagem: `Utensílio "${utensilio.nome}" reservado com sucesso para ${residente.nome} por ${horas} hora(s)`,
      utensilio: utensilioAtualizado
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST liberar utensílio
router.post('/:id/liberar', async (req, res) => {
  try {
    const utensilio = await Utensilio.findById(req.params.id);
    if (!utensilio) {
      return res.status(404).json({ error: 'Utensílio não encontrado' });
    }
    
    if (!utensilio.reserva.residenteId) {
      return res.status(400).json({ error: 'Utensílio não está reservado' });
    }
    
    const residenteNome = utensilio.reserva.residenteNome;
    await utensilio.liberar();
    
    const utensilioAtualizado = await Utensilio.findById(req.params.id)
      .populate('condominioId', 'nome');
    
    res.json({
      success: true,
      mensagem: `Utensílio "${utensilio.nome}" liberado com sucesso. Reserva anterior: ${residenteNome}`,
      utensilio: utensilioAtualizado
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT atualizar utensílio
router.put('/:id', async (req, res) => {
  try {
    // Se o utensílio estiver reservado, não permitir edição
    const utensilioExistente = await Utensilio.findById(req.params.id);
    if (utensilioExistente && utensilioExistente.isReservado && utensilioExistente.isReservado()) {
      return res.status(400).json({ 
        error: 'Utensílio reservado',
        mensagem: 'Não é possível editar um utensílio que está reservado. Libere a reserva primeiro.'
      });
    }
    
    const utensilio = await Utensilio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('condominioId', 'nome');
    
    if (!utensilio) {
      return res.status(404).json({ error: 'Utensílio não encontrado' });
    }
    res.json(utensilio);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE utensílio
router.delete('/:id', async (req, res) => {
  try {
    const utensilio = await Utensilio.findById(req.params.id);
    if (!utensilio) {
      return res.status(404).json({ error: 'Utensílio não encontrado' });
    }
    
    // Se o utensílio estiver reservado, não permitir exclusão
    if (utensilio.isReservado && utensilio.isReservado()) {
      return res.status(400).json({ 
        error: 'Utensílio reservado',
        mensagem: 'Não é possível excluir um utensílio que está reservado. Libere a reserva primeiro.'
      });
    }
    
    await Utensilio.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utensílio deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;