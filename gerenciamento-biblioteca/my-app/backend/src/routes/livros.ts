import { Router, Request, Response } from 'express';
import LivroModel from '../models/Livro';

const router = Router();

// Lista todos os livros com status atualizado
router.get('/', async (req: Request, res: Response) => {
  try {
    const livros = await (LivroModel as any).listarTodos();
    res.json(livros);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

// Catálogo paginado de uma biblioteca
router.get('/catalogo/:bibliotecaId', async (req: Request, res: Response) => {
  try {
    const pagina = parseInt(req.query.pagina as string) || 1;
    const limite = parseInt(req.query.limite as string) || 5;
    const resultado = await (LivroModel as any).listarPorBiblioteca(req.params.bibliotecaId, pagina, limite);
    res.json(resultado);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const livro = await (LivroModel as any).criar(req.body);
    res.status(201).json(livro);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
});

// Alugar livro
router.post('/:id/alugar', async (req: Request, res: Response) => {
  try {
    const { usuarioId, dias } = req.body;
    const livro = await (LivroModel as any).alugar(req.params.id, usuarioId, dias);
    res.json(livro);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
});

// Devolver livro
router.post('/:id/devolver', async (req: Request, res: Response) => {
  try {
    const livro = await (LivroModel as any).devolver(req.params.id);
    res.json(livro);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const livro = await (LivroModel as any).atualizar(req.params.id, req.body);
    if (!livro) return res.status(404).json({ erro: 'Livro não encontrado' });
    res.json(livro);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const livro = await (LivroModel as any).excluir(req.params.id);
    if (!livro) return res.status(404).json({ erro: 'Livro não encontrado' });
    res.json({ mensagem: 'Livro excluído' });
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
});

export default router;