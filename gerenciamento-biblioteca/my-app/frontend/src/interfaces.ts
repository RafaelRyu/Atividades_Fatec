export interface Biblioteca {
  _id: string;
  nome: string;
}

export interface Usuario {
  _id: string;
  nome: string;
  idade: number;
  historicoLivros?: any[];
}

export interface Livro {
  _id: string;
  nome: string;
  genero: string;
  numeroPaginas: number;
  autor: string;
  editora: string;
  status: 'disponivel' | 'emprestado' | 'expirado';
  biblioteca: Biblioteca;
}

export interface CatalogoResponse {
  livros: Livro[];
  total: number;
  pagina: number;
  totalPaginas: number;
}