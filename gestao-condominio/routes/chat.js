const express = require('express');
const router = express.Router();
const Mensagem = require('../models/Mensagem');

// GET últimas mensagens (polling)
router.get('/mensagens', async (req, res) => {
  try {
    const { since } = req.query;
    const query = since ? { timestamp: { $gt: new Date(since) } } : {};
    const mensagens = await Mensagem.find(query)
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(mensagens.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST nova mensagem
router.post('/mensagens', async (req, res) => {
  try {
    const { nome, mensagem } = req.body;
    if (!nome || !mensagem) {
      return res.status(400).json({ error: 'Nome e mensagem são obrigatórios' });
    }
    
    const novaMensagem = new Mensagem({ nome, mensagem });
    await novaMensagem.save();
    res.status(201).json(novaMensagem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;