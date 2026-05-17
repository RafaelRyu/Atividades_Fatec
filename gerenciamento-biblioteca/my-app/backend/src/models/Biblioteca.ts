import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Interface do Documento (Instância)
export interface IBiblioteca extends Document {
  nome: string;
}

// 2. Interface dos Métodos Estáticos
interface IBibliotecaModel extends Model<IBiblioteca> {
  criar(nome: string): Promise<IBiblioteca>;
  listarTodas(): Promise<IBiblioteca[]>;
  atualizar(id: string, nome: string): Promise<IBiblioteca | null>;
  excluir(id: string): Promise<IBiblioteca | null>;
}

// 3. Criação do Schema passando a interface do Modelo como segundo parâmetro genérico
const BibliotecaSchema = new Schema<IBiblioteca, IBibliotecaModel>({
  nome: { type: String, required: true, unique: true }
});

// 4. Definição dos métodos estáticos como objeto
BibliotecaSchema.statics = {
  async criar(this: IBibliotecaModel, nome: string): Promise<IBiblioteca> {
    return await this.create({ nome });
  },

  async listarTodas(this: IBibliotecaModel): Promise<IBiblioteca[]> {
    return await this.find();
  },

  async atualizar(this: IBibliotecaModel, id: string, nome: string): Promise<IBiblioteca | null> {
    return await this.findByIdAndUpdate(id, { nome }, { new: true });
  },

  async excluir(this: IBibliotecaModel, id: string): Promise<IBiblioteca | null> {
    return await this.findByIdAndDelete(id);
  }
};

// 5. Criação do Modelo tipado
const BibliotecaModel = mongoose.model<IBiblioteca, IBibliotecaModel>('Biblioteca', BibliotecaSchema);

export default BibliotecaModel;