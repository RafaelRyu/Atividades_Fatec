import React, { useState } from 'react';
import { Usuario } from '../interfaces';
import { api } from '../api';
import ModalConfirmacao from './ModalConfirmacao';

interface Props {
  usuarios: Usuario[];
  onAtualizar: () => void;
  onError: (msg: string) => void;
}

const TabelaUsuarios: React.FC<Props> = ({ usuarios, onAtualizar, onError }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState<number>(0);
  const [erroNome, setErroNome] = useState('');
  const [erroIdade, setErroIdade] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const validar = (): boolean => {
    let valido = true;
    if (!nome.trim()) {
      setErroNome('O nome é obrigatório.');
      valido = false;
    } else setErroNome('');
    if (idade <= 0) {
      setErroIdade('A idade deve ser maior que zero.');
      valido = false;
    } else setErroIdade('');
    return valido;
  };

  const handleSalvar = async () => {
    if (!validar()) return;
    try {
      if (editId) {
        await api.usuarios.atualizar(editId, nome, idade);
      } else {
        await api.usuarios.criar(nome, idade);
      }
      setShowForm(false);
      setEditId(null);
      setNome('');
      setIdade(0);
      onAtualizar();
    } catch (e: any) {
      onError(e.message);
    }
  };

  const abrirEdicao = (u: Usuario) => {
    setEditId(u._id);
    setNome(u.nome);
    setIdade(u.idade);
    setShowForm(true);
  };

  const confirmarExclusao = async () => {
    if (deleteId) {
      try {
        await api.usuarios.excluir(deleteId);
        setDeleteId(null);
        onAtualizar();
      } catch (e: any) {
        onError(e.message);
      }
    }
  };

  return (
    <div className="tabela-container">
      <h2 style={{ color: 'var(--brown)' }}>Usuários</h2>
      <button className="btn-primary" onClick={() => { setEditId(null); setNome(''); setIdade(0); setShowForm(true); }}>
        Novo Usuário
      </button>
      <table>
        <thead>
          <tr><th>Nome</th><th>Idade</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u._id}>
              <td>{u.nome}</td>
              <td>{u.idade}</td>
              <td>
                <button className="btn-success" onClick={() => abrirEdicao(u)}>Editar</button>
                <button className="btn-danger" onClick={() => setDeleteId(u._id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editId ? 'Editar' : 'Novo'} Usuário</h3>
            <input
              placeholder="Nome"
              value={nome}
              onChange={e => { setNome(e.target.value); setErroNome(''); }}
              required
            />
            {erroNome && <span className="erro-form">{erroNome}</span>}
            <input
              type="number"
              placeholder="Idade"
              value={idade || ''}
              onChange={e => {
                const val = Number(e.target.value);
                setIdade(isNaN(val) ? 0 : val);
                setErroIdade('');
              }}
              min="1"
              required
            />
            {erroIdade && <span className="erro-form">{erroIdade}</span>}
            <div style={{ marginTop: 10 }}>
              <button className="btn-primary" onClick={handleSalvar}>Salvar</button>
              <button onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ModalConfirmacao
          mensagem="Tem certeza que deseja excluir este usuário?"
          onConfirm={confirmarExclusao}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default TabelaUsuarios;