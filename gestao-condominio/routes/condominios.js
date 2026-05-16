const express = require('express');
const router = express.Router();
const Condominio = require('../models/Condominio');

// GET todos condomínios
router.get('/', async (req, res) => {
  try {
    const condominios = await Condominio.find();
    res.json(condominios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET um condomínio
router.get('/:id', async (req, res) => {
  try {
    const condominio = await Condominio.findById(req.params.id);
    if (!condominio) {
      return res.status(404).json({ error: 'Condomínio não encontrado' });
    }
    res.json(condominio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST criar condomínio
router.post('/', async (req, res) => {
  try {
    const condominio = new Condominio(req.body);
    await condominio.save();
    res.status(201).json(condominio);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT atualizar condomínio
router.put('/:id', async (req, res) => {
  try {
    const condominio = await Condominio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!condominio) {
      return res.status(404).json({ error: 'Condomínio não encontrado' });
    }
    res.json(condominio);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE condomínio
router.delete('/:id', async (req, res) => {
  try {
    const condominio = await Condominio.findByIdAndDelete(req.params.id);
    if (!condominio) {
      return res.status(404).json({ error: 'Condomínio não encontrado' });
    }
    res.json({ message: 'Condomínio deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;