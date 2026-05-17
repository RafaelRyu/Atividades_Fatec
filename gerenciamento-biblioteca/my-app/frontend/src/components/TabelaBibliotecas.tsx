import React, { useState } from 'react';
import { Biblioteca } from '../interfaces';
import { api } from '../api';
import ModalCatalogo from './ModalCatalogo';
import ModalConfirmacao from './ModalConfirmacao';

interface Props {
  bibliotecas: Biblioteca[];
  onAtualizar: () => void;
  onError: (msg: string) => void;
}

const TabelaBibliotecas: React.FC<Props> = ({ bibliotecas, onAtualizar, onError }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [erroNome, setErroNome] = useState('');
  const [catalogoId, setCatalogoId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const validar = (): boolean => {
    if (!nome.trim()) {
      setErroNome('O nome da biblioteca é obrigatório.');
      return false;
    }
    setErroNome('');
    return true;
  };

  const handleSalvar = async () => {
    if (!validar()) return;
    try {
      if (editId) {
        await api.bibliotecas.atualizar(editId, nome);
      } else {
        await api.bibliotecas.criar(nome);
      }
      setShowForm(false);
      setEditId(null);
      setNome('');
      onAtualizar();
    } catch (e: any) {
      onError(e.message);
    }
  };

  const abrirEdicao = (bib: Biblioteca) => {
    setEditId(bib._id);
    setNome(bib.nome);
    setShowForm(true);
  };

  const confirmarExclusao = async () => {
    if (deleteId) {
      try {
        await api.bibliotecas.excluir(deleteId);
        setDeleteId(null);
        onAtualizar();
      } catch (e: any) {
        onError(e.message);
      }
    }
  };

  return (
    <div className="tabela-container">
      <h2 style={{ color: 'var(--blue)' }}>Bibliotecas</h2>
      <button className="btn-primary" onClick={() => { setEditId(null); setNome(''); setShowForm(true); }}>
        Nova Biblioteca
      </button>
      <table>
        <thead>
          <tr><th>Nome</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {bibliotecas.map(bib => (
            <tr key={bib._id}>
              <td>{bib.nome}</td>
              <td>
                <button className="btn-primary" onClick={() => setCatalogoId(bib._id)}>Catálogo</button>
                <button className="btn-success" onClick={() => abrirEdicao(bib)}>Editar</button>
                <button className="btn-danger" onClick={() => setDeleteId(bib._id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editId ? 'Editar' : 'Nova'} Biblioteca</h3>
            <input
              placeholder="Nome da biblioteca"
              value={nome}
              onChange={e => { setNome(e.target.value); setErroNome(''); }}
              required
            />
            {erroNome && <span className="erro-form">{erroNome}</span>}
            <div style={{ marginTop: 10 }}>
              <button className="btn-primary" onClick={handleSalvar}>Salvar</button>
              <button onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {catalogoId && (
        <ModalCatalogo
          bibliotecaId={catalogoId}
          onClose={() => setCatalogoId(null)}
          onError={onError}
        />
      )}

      {deleteId && (
        <ModalConfirmacao
          mensagem="Tem certeza que deseja excluir esta biblioteca?"
          onConfirm={confirmarExclusao}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default TabelaBibliotecas;