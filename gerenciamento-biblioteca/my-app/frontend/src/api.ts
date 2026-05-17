const BASE_URL = 'http://localhost:5000/api';

async function request(url: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.erro || 'Erro na requisição');
  }
  return res.json();
}

export const api = {
  bibliotecas: {
    listar: () => request('/bibliotecas'),
    criar: (nome: string) => request('/bibliotecas', { method: 'POST', body: JSON.stringify({ nome }) }),
    atualizar: (id: string, nome: string) => request(`/bibliotecas/${id}`, { method: 'PUT', body: JSON.stringify({ nome }) }),
    excluir: (id: string) => request(`/bibliotecas/${id}`, { method: 'DELETE' }),
  },
  usuarios: {
    listar: () => request('/usuarios'),
    criar: (nome: string, idade: number) => request('/usuarios', { method: 'POST', body: JSON.stringify({ nome, idade }) }),
    atualizar: (id: string, nome: string, idade: number) => request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify({ nome, idade }) }),
    excluir: (id: string) => request(`/usuarios/${id}`, { method: 'DELETE' }),
  },
  livros: {
    listar: () => request('/livros'),
    criar: (dados: any) => request('/livros', { method: 'POST', body: JSON.stringify(dados) }),
    alugar: (id: string, usuarioId: string, dias: 1 | 3 | 7) =>
      request(`/livros/${id}/alugar`, { method: 'POST', body: JSON.stringify({ usuarioId, dias }) }),
    devolver: (id: string) => request(`/livros/${id}/devolver`, { method: 'POST' }),
    atualizar: (id: string, dados: any) => request(`/livros/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
    excluir: (id: string) => request(`/livros/${id}`, { method: 'DELETE' }),
    catalogo: (bibliotecaId: string, pagina: number, limite: number) =>
      request(`/livros/catalogo/${bibliotecaId}?pagina=${pagina}&limite=${limite}`),
  },
};