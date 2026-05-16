const express = require('express');
const router = express.Router();
const Sala = require('../models/Sala');
const Residente = require('../models/Residente');

// GET todas salas
router.get('/', async (req, res) => {
  try {
    const { condominioId, apenasDisponiveis } = req.query;
    let filter = condominioId ? { condominioId } : {};
    
    if (apenasDisponiveis === 'true') {
      filter.disponivel = true;
    }
    
    const salas = await Sala.find(filter)
      .populate('condominioId', 'nome')
      .populate('reserva.residenteId', 'nome');
    
    // Verificar expiração de reservas
    const now = new Date();
    for (const sala of salas) {
      if (sala.reserva.dataExpiracao && sala.reserva.dataExpiracao < now) {
        await sala.liberar();
      }
    }
    
    // Recarregar após possíveis liberações
    const salasAtualizadas = await Sala.find(filter)
      .populate('condominioId', 'nome')
      .populate('reserva.residenteId', 'nome');
    
    res.json(salasAtualizadas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET uma sala específica
router.get('/:id', async (req, res) => {
  try {
    const sala = await Sala.findById(req.params.id)
      .populate('condominioId', 'nome')
      .populate('reserva.residenteId', 'nome');
    
    if (!sala) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    // Verificar expiração
    if (sala.reserva.dataExpiracao && sala.reserva.dataExpiracao < new Date()) {
      await sala.liberar();
      const salaAtualizada = await Sala.findById(req.params.id)
        .populate('condominioId', 'nome')
        .populate('reserva.residenteId', 'nome');
      return res.json(salaAtualizada);
    }
    
    res.json(sala);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST criar sala
router.post('/', async (req, res) => {
  try {
    // Verificar se já existe sala com mesmo nome no condomínio
    const salaExistente = await Sala.findOne({
      nome: req.body.nome,
      condominioId: req.body.condominioId
    });
    
    if (salaExistente) {
      return res.status(400).json({ 
        error: 'Sala já existe',
        mensagem: 'Já existe uma sala com este nome neste condomínio'
      });
    }
    
    const sala = new Sala(req.body);
    await sala.save();
    
    const salaPopulada = await Sala.findById(sala._id)
      .populate('condominioId', 'nome');
    
    res.status(201).json(salaPopulada);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST reservar sala
router.post('/:id/reservar', async (req, res) => {
  try {
    const { residenteId, horas = 2, motivo = null } = req.body;
    
    if (!residenteId) {
      return res.status(400).json({ error: 'Residente ID é obrigatório' });
    }
    
    const sala = await Sala.findById(req.params.id);
    if (!sala) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    // Verificar se sala está disponível
    if (sala.isReservada && sala.isReservada()) {
      return res.status(400).json({ 
        error: 'Sala indisponível',
        mensagem: `Sala está reservada para ${sala.reserva.residenteNome} até ${new Date(sala.reserva.dataExpiracao).toLocaleString()}`
      });
    }
    
    // Verificar se residente existe
    const residente = await Residente.findById(residenteId);
    if (!residente) {
      return res.status(404).json({ error: 'Residente não encontrado' });
    }
    
    // Verificar limite de horas (máximo 4 horas)
    if (horas > 4) {
      return res.status(400).json({ 
        error: 'Limite excedido',
        mensagem: 'O tempo máximo de reserva é de 4 horas'
      });
    }
    
    // Realizar reserva
    await sala.reservar(residenteId, residente.nome, horas, motivo);
    
    const salaAtualizada = await Sala.findById(req.params.id)
      .populate('condominioId', 'nome')
      .populate('reserva.residenteId', 'nome');
    
    res.json({
      success: true,
      mensagem: `Sala "${sala.nome}" reservada com sucesso para ${residente.nome} por ${horas} hora(s)`,
      sala: salaAtualizada
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST liberar sala
router.post('/:id/liberar', async (req, res) => {
  try {
    const sala = await Sala.findById(req.params.id);
    if (!sala) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    if (!sala.reserva.residenteId) {
      return res.status(400).json({ error: 'Sala não está reservada' });
    }
    
    const residenteNome = sala.reserva.residenteNome;
    await sala.liberar();
    
    const salaAtualizada = await Sala.findById(req.params.id)
      .populate('condominioId', 'nome');
    
    res.json({
      success: true,
      mensagem: `Sala "${sala.nome}" liberada com sucesso. Reserva anterior: ${residenteNome}`,
      sala: salaAtualizada
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT atualizar sala
router.put('/:id', async (req, res) => {
  try {
    // Se a sala estiver reservada, não permitir edição
    const salaExistente = await Sala.findById(req.params.id);
    if (salaExistente && salaExistente.isReservada && salaExistente.isReservada()) {
      return res.status(400).json({ 
        error: 'Sala reservada',
        mensagem: 'Não é possível editar uma sala que está reservada. Libere a reserva primeiro.'
      });
    }
    
    const sala = await Sala.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('condominioId', 'nome');
    
    if (!sala) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    res.json(sala);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE sala
router.delete('/:id', async (req, res) => {
  try {
    const sala = await Sala.findById(req.params.id);
    if (!sala) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    // Se a sala estiver reservada, não permitir exclusão
    if (sala.isReservada && sala.isReservada()) {
      return res.status(400).json({ 
        error: 'Sala reservada',
        mensagem: 'Não é possível excluir uma sala que está reservada. Libere a reserva primeiro.'
      });
    }
    
    await Sala.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sala deletada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;