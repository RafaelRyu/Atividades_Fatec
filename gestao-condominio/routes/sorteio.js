const express = require('express');
const router = express.Router();
const Residente = require('../models/Residente');
const Condominio = require('../models/Condominio');

router.post('/vagas/:condominioId', async (req, res) => {
  try {
    const { condominioId } = req.params;
    
    const condominio = await Condominio.findById(condominioId);
    if (!condominio) {
      return res.status(404).json({ error: 'Condomínio não encontrado' });
    }
    
    const residentes = await Residente.find({ condominioId });
    
    if (residentes.length === 0) {
      return res.status(400).json({ error: 'Não há residentes cadastrados' });
    }
    
    // Separar residentes especiais e comuns
    const residentesEspeciais = residentes.filter(r => r.isEspecial && r.vagaReservada);
    const residentesComuns = residentes.filter(r => !r.isEspecial);
    
    // Verificar conflitos de vagas reservadas
    const vagasReservadas = new Map();
    const conflitos = [];
    
    for (const especial of residentesEspeciais) {
      const vagaNum = especial.vagaReservada;
      if (vagaNum < 1 || vagaNum > condominio.numeroVagas) {
        conflitos.push({
          residente: especial.nome,
          erro: `Vaga ${vagaNum} é inválida (vagas disponíveis: 1 a ${condominio.numeroVagas})`
        });
      } else if (vagasReservadas.has(vagaNum)) {
        conflitos.push({
          residente: especial.nome,
          erro: `Vaga ${vagaNum} já está reservada para ${vagasReservadas.get(vagaNum)}`
        });
      } else {
        vagasReservadas.set(vagaNum, especial.nome);
      }
    }
    
    if (conflitos.length > 0) {
      return res.status(400).json({
        error: 'Conflito nas vagas especiais',
        conflitos: conflitos,
        mensagem: 'Existem conflitos nas vagas reservadas. Por favor, resolva-os antes de realizar o sorteio.'
      });
    }
    
    // Calcular total de veículos dos residentes comuns
    const totalVeiculosComuns = residentesComuns.reduce((sum, r) => sum + r.numeroVeiculos, 0);
    const vagasDisponiveisParaSorteio = condominio.numeroVagas - vagasReservadas.size;
    
    // Verificar se há vagas suficientes para residentes comuns
    if (totalVeiculosComuns > vagasDisponiveisParaSorteio) {
      return res.status(400).json({
        error: 'Vagas insuficientes para residentes comuns',
        mensagem: `Após reservar ${vagasReservadas.size} vaga(s) para moradores especiais, restam ${vagasDisponiveisParaSorteio} vaga(s) para ${totalVeiculosComuns} veículos de residentes comuns.`,
        totalVeiculosComuns,
        vagasDisponiveisParaSorteio,
        deficit: totalVeiculosComuns - vagasDisponiveisParaSorteio,
        vagasReservadas: Array.from(vagasReservadas.entries()).map(([num, nome]) => ({ numero: num, residente: nome }))
      });
    }
    
    // Criar resultado das vagas especiais
    const resultadoEspeciais = [];
    for (const [vagaNum, residenteNome] of vagasReservadas.entries()) {
      const residente = residentesEspeciais.find(r => r.nome === residenteNome);
      resultadoEspeciais.push({
        numeroVaga: vagaNum,
        residenteNome: residenteNome,
        veiculos: residente.numeroVeiculos,
        residenteId: residente._id.toString(),
        especial: true,
        tipoEspecial: residente.tipoEspecial
      });
    }
    
    // Criar array de participantes comuns (baseado no número de veículos)
    let participantesComuns = [];
    residentesComuns.forEach(residente => {
      for (let i = 0; i < residente.numeroVeiculos; i++) {
        participantesComuns.push({
          residenteId: residente._id.toString(),
          residenteNome: residente.nome,
          veiculos: residente.numeroVeiculos
        });
      }
    });
    
    // Embaralhar participantes comuns
    for (let i = participantesComuns.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participantesComuns[i], participantesComuns[j]] = [participantesComuns[j], participantesComuns[i]];
    }
    
    // Listar vagas disponíveis (excluindo as reservadas)
    const vagasDisponiveis = [];
    for (let i = 1; i <= condominio.numeroVagas; i++) {
      if (!vagasReservadas.has(i)) {
        vagasDisponiveis.push(i);
      }
    }
    
    // Sortear vagas para residentes comuns
    const numeroVagasSorteio = Math.min(vagasDisponiveis.length, participantesComuns.length);
    const resultadoComuns = [];
    
    for (let i = 0; i < numeroVagasSorteio; i++) {
      const participante = participantesComuns[i];
      resultadoComuns.push({
        numeroVaga: vagasDisponiveis[i],
        residenteNome: participante.residenteNome,
        veiculos: participante.veiculos,
        residenteId: participante.residenteId,
        especial: false
      });
    }
    
    // Agrupar não contemplados (apenas residentes comuns)
    const naoContempladosMap = new Map();
    for (let i = numeroVagasSorteio; i < participantesComuns.length; i++) {
      const participante = participantesComuns[i];
      if (!naoContempladosMap.has(participante.residenteId)) {
        naoContempladosMap.set(participante.residenteId, {
          nome: participante.residenteNome,
          veiculos: participante.veiculos,
          veiculosNaoContemplados: 1
        });
      } else {
        const existing = naoContempladosMap.get(participante.residenteId);
        existing.veiculosNaoContemplados++;
      }
    }
    
    const naoContemplados = Array.from(naoContempladosMap.values());
    
    // Combinar resultados
    const todosResultados = [...resultadoEspeciais, ...resultadoComuns].sort((a, b) => a.numeroVaga - b.numeroVaga);
    
    // Estatísticas do sorteio
    const residentesContempladosComuns = new Set();
    resultadoComuns.forEach(r => residentesContempladosComuns.add(r.residenteId));
    
    const estatisticas = {
      totalResidentes: residentes.length,
      residentesEspeciais: residentesEspeciais.length,
      residentesComuns: residentesComuns.length,
      totalVeiculos: residentes.reduce((sum, r) => sum + r.numeroVeiculos, 0),
      veiculosEspeciais: residentesEspeciais.reduce((sum, r) => sum + r.numeroVeiculos, 0),
      veiculosComuns: totalVeiculosComuns,
      residentesContemplados: residentesContempladosComuns.size + residentesEspeciais.length,
      residentesNaoContemplados: residentesComuns.length - residentesContempladosComuns.size,
      vagasOcupadas: todosResultados.length,
      vagasReservadas: vagasReservadas.size,
      vagasSorteadas: resultadoComuns.length,
      vagasRestantes: condominio.numeroVagas - todosResultados.length,
      taxaOcupacao: ((todosResultados.length / condominio.numeroVagas) * 100).toFixed(2)
    };
    
    res.json({
      success: true,
      condominio: condominio.nome,
      condominioId: condominio._id,
      totalVagas: condominio.numeroVagas,
      vagasReservadas: vagasReservadas.size,
      vagasDisponiveisParaSorteio: vagasDisponiveisParaSorteio,
      totalParticipantesComuns: participantesComuns.length,
      totalVeiculos: estatisticas.totalVeiculos,
      resultado: todosResultados,
      resultadoEspeciais: resultadoEspeciais,
      resultadoComuns: resultadoComuns,
      naoContemplados: naoContemplados,
      vagasRestantes: estatisticas.vagasRestantes,
      vagasNaoUtilizadas: vagasDisponiveis.slice(numeroVagasSorteio),
      estatisticas: estatisticas,
      data: new Date()
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para obter vagas disponíveis para um condomínio
router.get('/vagas-disponiveis/:condominioId', async (req, res) => {
  try {
    const { condominioId } = req.params;
    
    const condominio = await Condominio.findById(condominioId);
    if (!condominio) {
      return res.status(404).json({ error: 'Condomínio não encontrado' });
    }
    
    const residentes = await Residente.find({ 
      condominioId, 
      isEspecial: true, 
      vagaReservada: { $ne: null } 
    });
    
    const vagasReservadas = residentes.map(r => r.vagaReservada);
    const vagasDisponiveis = [];
    
    for (let i = 1; i <= condominio.numeroVagas; i++) {
      if (!vagasReservadas.includes(i)) {
        vagasDisponiveis.push(i);
      }
    }
    
    res.json({
      totalVagas: condominio.numeroVagas,
      vagasReservadas: vagasReservadas.sort((a, b) => a - b),
      vagasDisponiveis: vagasDisponiveis,
      residentesEspeciais: residentes.map(r => ({
        nome: r.nome,
        tipo: r.tipoEspecial,
        vaga: r.vagaReservada
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;