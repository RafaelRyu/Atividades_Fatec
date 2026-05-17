import mongoose, { Schema, Document, Types, Model } from 'mongoose';
import EmprestimoModel from './Emprestimo';

// 1. Interface do Documento (Instância)
export interface ILivro extends Document {
  nome: string;
  genero: string;
  numeroPaginas: number;
  autor: string;
  editora: string;
  status: 'disponivel' | 'emprestado' | 'expirado';
  biblioteca: Types.ObjectId;
}

// 2. Interface dos Métodos Estáticos (Modelo)
interface ILivroModel extends Model<ILivro> {
  criar(dados: {
    nome: string; genero: string; numeroPaginas: number;
    autor: string; editora: string; bibliotecaId: string;
  }): Promise<ILivro>;
  listarTodos(): Promise<ILivro[]>;
  alugar(livroId: string, usuarioId: string, dias: 1 | 3 | 7): Promise<ILivro | null>;
  devolver(livroId: string): Promise<ILivro | null>;
  atualizar(id: string, dados: Partial<ILivro>): Promise<ILivro | null>;
  excluir(id: string): Promise<ILivro | null>;
  listarPorBiblioteca(bibliotecaId: string, pagina: number, limite: number): Promise<{
    livros: ILivro[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }>;
}

// 3. Configuração do Schema
const LivroSchema = new Schema<ILivro, ILivroModel>({
  nome: { type: String, required: true },
  genero: { type: String, required: true },
  numeroPaginas: { type: Number, required: true },
  autor: { type: String, required: true },
  editora: { type: String, required: true },
  status: { type: String, enum: ['disponivel', 'emprestado', 'expirado'], default: 'disponivel' },
  biblioteca: { type: Schema.Types.ObjectId, ref: 'Biblioteca', required: true }
});

// 4. Métodos Estáticos como Objeto Literal
LivroSchema.statics = {
  async criar(this: ILivroModel, dados): Promise<ILivro> {
    return await this.create({
      nome: dados.nome,
      genero: dados.genero,
      numeroPaginas: dados.numeroPaginas,
      autor: dados.autor,
      editora: dados.editora,
      biblioteca: dados.bibliotecaId,
      status: 'disponivel'
    });
  },

  async listarTodos(this: ILivroModel): Promise<ILivro[]> {
    await EmprestimoModel.verificarExpirados();
    const livros = await this.find().populate('biblioteca');
    
    // Otimizado com Promise.all para processar os livros em paralelo
    await Promise.all(
      livros.map(async (livro) => {
        const emp = await EmprestimoModel.buscarAtivoPorLivro(livro._id as string);
        if (emp) {
          livro.status = emp.status === 'expirado' ? 'expirado' : 'emprestado';
        } else {
          livro.status = 'disponivel';
        }
      })
    );
    
    return livros;
  },

  async alugar(this: ILivroModel, livroId: string, usuarioId: string, dias: 1 | 3 | 7): Promise<ILivro | null> {
    await EmprestimoModel.verificarExpirados();
    const empAtivo = await EmprestimoModel.buscarAtivoPorLivro(livroId);
    if (empAtivo) throw new Error('Livro já está emprestado ou expirado.');

    const emprestimo = await EmprestimoModel.criarEmprestimo(livroId, usuarioId, dias);
    await this.findByIdAndUpdate(livroId, { status: 'emprestado' });
    
    // Import dinâmico mantido para evitar dependência circular entre arquivos
    const UsuarioModel = (await import('./Usuario')).default;
    await UsuarioModel.findByIdAndUpdate(usuarioId, {
      $push: { historicoLivros: emprestimo._id }
    });
    
    return await this.findById(livroId).populate('biblioteca');
  },

  async devolver(this: ILivroModel, livroId: string): Promise<ILivro | null> {
    const empAtivo = await EmprestimoModel.buscarAtivoPorLivro(livroId);
    if (!empAtivo) throw new Error('Nenhum empréstimo ativo para este livro.');

    await EmprestimoModel.devolver(empAtivo._id as string);
    await this.findByIdAndUpdate(livroId, { status: 'disponivel' });
    return await this.findById(livroId).populate('biblioteca');
  },

  async atualizar(this: ILivroModel, id: string, dados: Partial<ILivro>): Promise<ILivro | null> {
    if (dados.biblioteca) {
      dados.biblioteca = new mongoose.Types.ObjectId(dados.biblioteca as any);
    }
    return await this.findByIdAndUpdate(id, dados, { new: true }).populate('biblioteca');
  },

  async excluir(this: ILivroModel, id: string): Promise<ILivro | null> {
    return await this.findByIdAndDelete(id);
  },

  async listarPorBiblioteca(this: ILivroModel, bibliotecaId: string, pagina: number, limite: number) {
    const skip = (pagina - 1) * limite;
    const [livros, total] = await Promise.all([
      this.find({ biblioteca: bibliotecaId }).skip(skip).limit(limite).populate('biblioteca'),
      this.countDocuments({ biblioteca: bibliotecaId })
    ]);
    return { livros, total, pagina, totalPaginas: Math.ceil(total / limite) };
  }
};

// 5. Instanciação e Exportação do Modelo
const LivroModel = mongoose.model<ILivro, ILivroModel>('Livro', LivroSchema);
export default LivroModel;