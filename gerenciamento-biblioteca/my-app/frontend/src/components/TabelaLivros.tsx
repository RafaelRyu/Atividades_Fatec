import React, { useState } from 'react';
import { Livro, Biblioteca, Usuario } from '../interfaces';
import { api } from '../api';
import ModalEmprestimo from './ModalEmpresitmo';
import ModalConfirmacao from './ModalConfirmacao';

interface Props {
  livros: Livro[];
  bibliotecas: Biblioteca[];
  usuarios: Usuario[];
  onAtualizar: () => void;
  onError: (msg: string) => void;
}

const TabelaLivros: React.FC<Props> = ({ livros, bibliotecas, usuarios, onAtualizar, onError }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState('');
  const [numeroPaginas, setNumeroPaginas] = useState<number>(0);
  const [autor, setAutor] = useState('');
  const [editora, setEditora] = useState('');
  const [bibliotecaId, setBibliotecaId] = useState('');
  const [emprestimoLivroId, setEmprestimoLivroId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Erros
  const [erroNome, setErroNome] = useState('');
  const [erroGenero, setErroGenero] = useState('');
  const [erroPaginas, setErroPaginas] = useState('');
  const [erroAutor, setErroAutor] = useState('');
  const [erroEditora, setErroEditora] = useState('');
  const [erroBiblioteca, setErroBiblioteca] = useState('');

  const resetForm = () => {
    setNome(''); setGenero(''); setNumeroPaginas(0);
    setAutor(''); setEditora(''); setBibliotecaId('');
    setErroNome(''); setErroGenero(''); setErroPaginas('');
    setErroAutor(''); setErroEditora(''); setErroBiblioteca('');
  };

  const validar = (): boolean => {
    let valido = true;
    if (!nome.trim()) { setErroNome('O nome do livro é obrigatório.'); valido = false; } else setErroNome('');
    if (!genero.trim()) { setErroGenero('O gênero é obrigatório.'); valido = false; } else setErroGenero('');
    if (numeroPaginas <= 0) { setErroPaginas('Número de páginas deve ser maior que zero.'); valido = false; } else setErroPaginas('');
    if (!autor.trim()) { setErroAutor('O autor é obrigatório.'); valido = false; } else setErroAutor('');
    if (!editora.trim()) { setErroEditora('A editora é obrigatória.'); valido = false; } else setErroEditora('');
    if (!bibliotecaId) { setErroBiblioteca('Selecione uma biblioteca.'); valido = false; } else setErroBiblioteca('');
    return valido;
  };

  const handleSalvar = async () => {
    if (!validar()) return;
    try {
      const dados = { nome, genero, numeroPaginas, autor, editora, bibliotecaId };
      if (editId) {
        await api.livros.atualizar(editId, dados);
      } else {
        await api.livros.criar(dados);
      }
      setShowForm(false);
      setEditId(null);
      resetForm();
      onAtualizar();
    } catch (e: any) {
      onError(e.message);
    }
  };

  const abrirEdicao = (livro: Livro) => {
    setEditId(livro._id);
    setNome(livro.nome);
    setGenero(livro.genero);
    setNumeroPaginas(livro.numeroPaginas);
    setAutor(livro.autor);
    setEditora(livro.editora);
    setBibliotecaId(livro.biblioteca._id);
    setShowForm(true);
  };

  const handleDevolver = async (livroId: string) => {
    try {
      await api.livros.devolver(livroId);
      onAtualizar();
    } catch (e: any) {
      onError(e.message);
    }
  };

  const confirmarExclusao = async () => {
    if (deleteId) {
      try {
        await api.livros.excluir(deleteId);
        setDeleteId(null);
        onAtualizar();
      } catch (e: any) {
        onError(e.message);
      }
    }
  };

  return (
    <div className="tabela-container">
      <h2 style={{ color: 'var(--teal)' }}>Livros</h2>
      <button className="btn-primary" onClick={() => { setEditId(null); resetForm(); setShowForm(true); }}>
        Novo Livro
      </button>
      <table>
        <thead>
          <tr>
            <th>Nome</th><th>Gênero</th><th>Páginas</th><th>Autor</th>
            <th>Editora</th><th>Biblioteca</th><th>Status</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {livros.map(livro => (
            <tr key={livro._id}>
              <td>{livro.nome}</td>
              <td>{livro.genero}</td>
              <td>{livro.numeroPaginas}</td>
              <td>{livro.autor}</td>
              <td>{livro.editora}</td>
              <td>{livro.biblioteca.nome}</td>
              <td>
                <span style={{
                  color: livro.status === 'disponivel' ? 'var(--teal)' :
                         livro.status === 'emprestado' ? 'var(--blue)' : '#e67e22',
                  fontWeight: 'bold'
                }}>
                  {livro.status === 'expirado' ? 'EXPIRADO' : livro.status}
                </span>
              </td>
              <td>
                {livro.status === 'disponivel' ? (
                  <button className="btn-primary" onClick={() => setEmprestimoLivroId(livro._id)}>Alugar</button>
                ) : (
                  <button className="btn-warning" onClick={() => handleDevolver(livro._id)}>Devolver</button>
                )}
                <button className="btn-success" onClick={() => abrirEdicao(livro)}>Editar</button>
                <button className="btn-danger" onClick={() => setDeleteId(livro._id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editId ? 'Editar' : 'Novo'} Livro</h3>
            <input placeholder="Nome" value={nome} onChange={e => { setNome(e.target.value); setErroNome(''); }} />
            {erroNome && <span className="erro-form">{erroNome}</span>}

            <input placeholder="Gênero" value={genero} onChange={e => { setGenero(e.target.value); setErroGenero(''); }} />
            {erroGenero && <span className="erro-form">{erroGenero}</span>}

            <input
              type="number"
              placeholder="Número de páginas"
              value={numeroPaginas || ''}
              onChange={e => {
                const val = Number(e.target.value);
                setNumeroPaginas(isNaN(val) ? 0 : val);
                setErroPaginas('');
              }}
              min="1"
            />
            {erroPaginas && <span className="erro-form">{erroPaginas}</span>}

            <input placeholder="Autor" value={autor} onChange={e => { setAutor(e.target.value); setErroAutor(''); }} />
            {erroAutor && <span className="erro-form">{erroAutor}</span>}

            <input placeholder="Editora" value={editora} onChange={e => { setEditora(e.target.value); setErroEditora(''); }} />
            {erroEditora && <span className="erro-form">{erroEditora}</span>}

            <select value={bibliotecaId} onChange={e => { setBibliotecaId(e.target.value); setErroBiblioteca(''); }} required>
              <option value="">Selecione a biblioteca</option>
              {bibliotecas.map(bib => <option key={bib._id} value={bib._id}>{bib.nome}</option>)}
            </select>
            {erroBiblioteca && <span className="erro-form">{erroBiblioteca}</span>}

            <div style={{ marginTop: 10 }}>
              <button className="btn-primary" onClick={handleSalvar}>Salvar</button>
              <button onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {emprestimoLivroId && (
        <ModalEmprestimo
          livroId={emprestimoLivroId}
          usuarios={usuarios}
          onClose={() => setEmprestimoLivroId(null)}
          onSuccess={() => { setEmprestimoLivroId(null); onAtualizar(); }}
          onError={onError}
        />
      )}

      {deleteId && (
        <ModalConfirmacao
          mensagem="Tem certeza que deseja excluir este livro?"
          onConfirm={confirmarExclusao}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default TabelaLivros;