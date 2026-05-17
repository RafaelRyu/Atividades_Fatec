import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// 1. Interface do Documento (Instância)
export interface IEmprestimo extends Document {
  livro: Types.ObjectId;
  usuario: Types.ObjectId;
  dataEmprestimo: Date;
  dataDevolucaoPrevista: Date;
  dataDevolucaoReal?: Date;
  status: 'ativo' | 'devolvido' | 'expirado';
}

// 2. Interface dos Métodos Estáticos (Modelo)
interface IEmprestimoModel extends Model<IEmprestimo> {
  criarEmprestimo(livroId: string, usuarioId: string, dias: 1 | 3 | 7): Promise<IEmprestimo>;
  devolver(emprestimoId: string): Promise<IEmprestimo | null>;
  verificarExpirados(): Promise<void>;
  buscarAtivoPorLivro(livroId: string): Promise<IEmprestimo | null>;
}

// 3. Definição do Schema com as tipagens configuradas
const EmprestimoSchema = new Schema<IEmprestimo, IEmprestimoModel>({
  livro: { type: Schema.Types.ObjectId, ref: 'Livro', required: true },
  usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  dataEmprestimo: { type: Date, default: Date.now },
  dataDevolucaoPrevista: { type: Date, required: true },
  dataDevolucaoReal: { type: Date },
  status: { type: String, enum: ['ativo', 'devolvido', 'expirado'], default: 'ativo' }
});

// 4. Métodos estáticos mapeados como objeto literal
EmprestimoSchema.statics = {
  async criarEmprestimo(
    this: IEmprestimoModel,
    livroId: string,
    usuarioId: string,
    dias: 1 | 3 | 7
  ): Promise<IEmprestimo> {
    const dataEmprestimo = new Date();
    const dataPrevista = new Date(dataEmprestimo.getTime() + dias * 24 * 60 * 60 * 1000);
    
    // 'this' referencia o próprio modelo Mongoose aqui dentro
    const emprestimo = await this.create({
      livro: livroId,
      usuario: usuarioId,
      dataEmprestimo,
      dataDevolucaoPrevista: dataPrevista,
      status: 'ativo'
    });
    return emprestimo;
  },

  async devolver(this: IEmprestimoModel, emprestimoId: string): Promise<IEmprestimo | null> {
    return await this.findByIdAndUpdate(
      emprestimoId,
      { dataDevolucaoReal: new Date(), status: 'devolvido' },
      { new: true }
    );
  },

  async verificarExpirados(this: IEmprestimoModel): Promise<void> {
    const agora = new Date();
    await this.updateMany(
      { status: 'ativo', dataDevolucaoPrevista: { $lt: agora } },
      { status: 'expirado' }
    );
  },

  async buscarAtivoPorLivro(this: IEmprestimoModel, livroId: string): Promise<IEmprestimo | null> {
    return await this.findOne({
      livro: livroId,
      status: { $in: ['ativo', 'expirado'] }
    });
  }
};

// 5. Compilação e exportação do Modelo final
const EmprestimoModel = mongoose.model<IEmprestimo, IEmprestimoModel>('Emprestimo', EmprestimoSchema);
export default EmprestimoModel;