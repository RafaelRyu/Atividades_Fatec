import React, { useState } from 'react';
import { Usuario } from '../interfaces';
import { api } from '../api';

interface Props {
  livroId: string;
  usuarios: Usuario[];
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

const ModalEmprestimo: React.FC<Props> = ({ livroId, usuarios, onClose, onSuccess, onError }) => {
  const [usuarioId, setUsuarioId] = useState('');
  const [dias, setDias] = useState<1 | 3 | 7>(1);

  const handleAlugar = async () => {
    try {
      await api.livros.alugar(livroId, usuarioId, dias);
      onSuccess();
    } catch (e: any) {
      onError(e.message);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Alugar Livro</h3>
        <select value={usuarioId} onChange={e => setUsuarioId(e.target.value)} required>
          <option value="">Selecione o usuário</option>
          {usuarios.map(u => <option key={u._id} value={u._id}>{u.nome} ({u.idade} anos)</option>)}
        </select>
        <select value={dias} onChange={e => setDias(Number(e.target.value) as 1 | 3 | 7)}>
          <option value={1}>1 dia</option>
          <option value={3}>3 dias</option>
          <option value={7}>7 dias</option>
        </select>
        <button className="btn-primary" onClick={handleAlugar} disabled={!usuarioId}>Confirmar</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
};

export default ModalEmprestimo;