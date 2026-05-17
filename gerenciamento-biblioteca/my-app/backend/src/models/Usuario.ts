import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// 1. Interface do Documento (Instância)
export interface IUsuario extends Document {
  nome: string;
  idade: number;
  historicoLivros: Types.ObjectId[]; // referências a Emprestimo
}

// 2. Interface dos Métodos Estáticos (Modelo)
interface IUsuarioModel extends Model<IUsuario> {
  criar(nome: string, idade: number): Promise<IUsuario>;
  listarTodos(): Promise<IUsuario[]>;
  atualizar(id: string, nome: string, idade: number): Promise<IUsuario | null>;
  excluir(id: string): Promise<IUsuario | null>;
}

// 3. Schema configurado com ambas as interfaces
const UsuarioSchema = new Schema<IUsuario, IUsuarioModel>({
  nome: { type: String, required: true },
  idade: { type: Number, required: true },
  historicoLivros: [{ type: Schema.Types.ObjectId, ref: 'Emprestimo' }]
});

// 4. Métodos estáticos declarados como objeto literal
UsuarioSchema.statics = {
  async criar(this: IUsuarioModel, nome: string, idade: number): Promise<IUsuario> {
    // Usamos 'this' porque no contexto de um método estático do Mongoose, 'this' é o próprio Modelo
    return await this.create({ nome, idade, historicoLivros: [] });
  },

  async listarTodos(this: IUsuarioModel): Promise<IUsuario[]> {
    return await this.find().populate('historicoLivros');
  },

  async atualizar(this: IUsuarioModel, id: string, nome: string, idade: number): Promise<IUsuario | null> {
    return await this.findByIdAndUpdate(id, { nome, idade }, { new: true });
  },

  async excluir(this: IUsuarioModel, id: string): Promise<IUsuario | null> {
    return await this.findByIdAndDelete(id);
  }
};

// 5. Criação e exportação do Modelo
const UsuarioModel = mongoose.model<IUsuario, IUsuarioModel>('Usuario', UsuarioSchema);
export default UsuarioModel;