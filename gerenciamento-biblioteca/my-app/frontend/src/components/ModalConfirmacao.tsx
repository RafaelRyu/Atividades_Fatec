import React from 'react';

interface Props {
  mensagem: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ModalConfirmacao: React.FC<Props> = ({ mensagem, onConfirm, onCancel }) => (
  <div className="modal">
    <div className="modal-content">
      <p>{mensagem}</p>
      <button className="btn-danger" onClick={onConfirm}>Confirmar</button>
      <button onClick={onCancel}>Cancelar</button>
    </div>
  </div>
);

export default ModalConfirmacao;