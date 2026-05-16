const express = require('express');
const router = express.Router();
const Residente = require('../models/Residente');
const Condominio = require('../models/Condominio');

// GET todos residentes
router.get('/', async (req, res) => {
  try {
    const { condominioId } = req.query;
    const filter = condominioId ? { condominioId } : {};
    const residentes = await Residente.find(filter).populate('condominioId', 'nome');
    res.json(residentes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET um residente
router.get('/:id', async (req, res) => {
  try {
    const residente = await Residente.findById(req.params.id).populate('condominioId', 'nome');
    if (!residente) {
      return res.status(404).json({ error: 'Residente não encontrado' });
    }
    res.json(residente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST criar residente
router.post('/', async (req, res) => {
  try {
    // Verificar se a vaga reservada já está sendo usada
    if (req.body.isEspecial && req.body.vagaReservada) {
      const residenteExistente = await Residente.findOne({
        condominioId: req.body.condominioId,
        vagaReservada: req.body.vagaReservada,
        isEspecial: true
      });
      
      if (residenteExistente) {
        return res.status(400).json({ 
          error: 'Vaga já reservada',
          mensagem: `A vaga ${req.body.vagaReservada} já está reservada para ${residenteExistente.nome}`
        });
      }
      
      // Verificar se a vaga existe no condomínio
      const condominio = await Condominio.findById(req.body.condominioId);
      if (condominio && (req.body.vagaReservada < 1 || req.body.vagaReservada > condominio.numeroVagas)) {
        return res.status(400).json({ 
          error: 'Vaga inválida',
          mensagem: `A vaga deve ser entre 1 e ${condominio.numeroVagas}`
        });
      }
    }
    
    const residente = new Residente(req.body);
    await residente.save();
    res.status(201).json(residente);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT atualizar residente
router.put('/:id', async (req, res) => {
  try {
    // Se estiver tornando especial com vaga reservada, verificar conflitos
    if (req.body.isEspecial && req.body.vagaReservada) {
      const residenteExistente = await Residente.findOne({
        condominioId: req.body.condominioId,
        vagaReservada: req.body.vagaReservada,
        isEspecial: true,
        _id: { $ne: req.params.id }
      });
      
      if (residenteExistente) {
        return res.status(400).json({ 
          error: 'Vaga já reservada',
          mensagem: `A vaga ${req.body.vagaReservada} já está reservada para ${residenteExistente.nome}`
        });
      }
      
      // Verificar se a vaga existe no condomínio
      const condominio = await Condominio.findById(req.body.condominioId);
      if (condominio && (req.body.vagaReservada < 1 || req.body.vagaReservada > condominio.numeroVagas)) {
        return res.status(400).json({ 
          error: 'Vaga inválida',
          mensagem: `A vaga deve ser entre 1 e ${condominio.numeroVagas}`
        });
      }
    }
    
    const residente = await Residente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!residente) {
      return res.status(404).json({ error: 'Residente não encontrado' });
    }
    res.json(residente);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE residente
router.delete('/:id', async (req, res) => {
  try {
    const residente = await Residente.findByIdAndDelete(req.params.id);
    if (!residente) {
      return res.status(404).json({ error: 'Residente não encontrado' });
    }
    res.json({ message: 'Residente deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;