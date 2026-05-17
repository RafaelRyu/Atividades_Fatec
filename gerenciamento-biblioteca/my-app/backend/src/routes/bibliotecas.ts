import { Router, Request, Response } from 'express';
import BibliotecaModel from '../models/Biblioteca';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const bibliotecas = await (BibliotecaModel as any).listarTodas();
    res.json(bibliotecas);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { nome } = req.body;
    const nova = await (BibliotecaModel as any).criar(nome);
    res.status(201).json(nova);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { nome } = req.body;
    const atualizada = await (BibliotecaModel as any).atualizar(req.params.id, nome);
    if (!atualizada) return res.status(404).json({ erro: 'Biblioteca não encontrada' });
    res.json(atualizada);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const excluida = await (BibliotecaModel as any).excluir(req.params.id);
    if (!excluida) return res.status(404).json({ erro: 'Biblioteca não encontrada' });
    res.json({ mensagem: 'Biblioteca excluída' });
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
});

export default router;