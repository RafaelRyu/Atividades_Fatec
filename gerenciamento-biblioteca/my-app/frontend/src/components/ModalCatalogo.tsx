import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { CatalogoResponse, Livro } from '../interfaces';

interface Props {
  bibliotecaId: string;
  onClose: () => void;
  onError: (msg: string) => void;
}

const ModalCatalogo: React.FC<Props> = ({ bibliotecaId, onClose, onError }) => {
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState<CatalogoResponse | null>(null);

  const carregar = async () => {
    try {
      const res = await api.livros.catalogo(bibliotecaId, pagina, 5);
      setDados(res);
    } catch (e: any) {
      onError(e.message);
    }
  };

  useEffect(() => {
    carregar();
  }, [pagina, bibliotecaId]);

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Catálogo da Biblioteca</h3>
        {dados && (
          <>
            <table>
              <thead>
                <tr><th>Nome</th><th>Autor</th><th>Status</th></tr>
              </thead>
              <tbody>
                {dados.livros.map(l => (
                  <tr key={l._id}>
                    <td>{l.nome}</td>
                    <td>{l.autor}</td>
                    <td>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <button disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</button>
              <span>Página {dados.pagina} de {dados.totalPaginas}</span>
              <button disabled={pagina >= dados.totalPaginas} onClick={() => setPagina(p => p + 1)}>Próxima</button>
            </div>
          </>
        )}
        <button style={{ marginTop: 15 }} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
};

export default ModalCatalogo;