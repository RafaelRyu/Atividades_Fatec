import { Router, Request, Response } from 'express';
import UsuarioModel from '../models/Usuario';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const usuarios = await (UsuarioModel as any).listarTodos();
    res.json(usuarios);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { nome, idade } = req.body;
    const novo = await (UsuarioModel as any).criar(nome, idade);
    res.status(201).json(novo);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { nome, idade } = req.body;
    const atualizado = await (UsuarioModel as any).atualizar(req.params.id, nome, idade);
    if (!atualizado) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(atualizado);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const excluido = await (UsuarioModel as any).excluir(req.params.id);
    if (!excluido) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json({ mensagem: 'Usuário excluído' });
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
});

export default router;