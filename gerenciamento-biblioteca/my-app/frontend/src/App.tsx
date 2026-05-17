import React, { useEffect, useState } from 'react';
import './style.css';
import { api } from './api';
import { Biblioteca, Usuario, Livro } from './interfaces';
import TabelaBibliotecas from './components/TabelaBibliotecas';
import TabelaUsuarios from './components/TabelaUsuario';
import TabelaLivros from './components/TabelaLivros';

const App: React.FC = () => {
  const [bibliotecas, setBibliotecas] = useState<Biblioteca[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [livros, setLivros] = useState<Livro[]>([]);
  const [tab, setTab] = useState<'bibliotecas' | 'usuarios' | 'livros'>('bibliotecas');
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);

  const carregarDados = async () => {
    try {
      const [resBib, resUsu, resLiv] = await Promise.all([
        api.bibliotecas.listar(),
        api.usuarios.listar(),
        api.livros.listar()
      ]);
      setBibliotecas(resBib);
      setUsuarios(resUsu);
      setLivros(resLiv);
    } catch (err: any) {
      setErroGlobal(err.message || 'Erro ao carregar dados');
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const mostrarErro = (msg: string) => setErroGlobal(msg);
  const fecharErro = () => setErroGlobal(null);

  return (
    <div className="container">
      <header>
        <h1>📚 Gerenciamento de Biblioteca</h1>
        <nav>
          <button
            className={`btn-tab ${tab === 'bibliotecas' ? 'ativo' : ''}`}
            onClick={() => setTab('bibliotecas')}
          >
            Bibliotecas
          </button>
          <button
            className={`btn-tab ${tab === 'usuarios' ? 'ativo' : ''}`}
            onClick={() => setTab('usuarios')}
          >
            Usuários
          </button>
          <button
            className={`btn-tab ${tab === 'livros' ? 'ativo' : ''}`}
            onClick={() => setTab('livros')}
          >
            Livros
          </button>
        </nav>
      </header>

      <main>
        {tab === 'bibliotecas' && (
          <TabelaBibliotecas
            bibliotecas={bibliotecas}
            onAtualizar={carregarDados}
            onError={mostrarErro}
          />
        )}
        {tab === 'usuarios' && (
          <TabelaUsuarios
            usuarios={usuarios}
            onAtualizar={carregarDados}
            onError={mostrarErro}
          />
        )}
        {tab === 'livros' && (
          <TabelaLivros
            livros={livros}
            bibliotecas={bibliotecas}
            usuarios={usuarios}
            onAtualizar={carregarDados}
            onError={mostrarErro}
          />
        )}
      </main>

      {erroGlobal && (
        <div className="modal-erro-overlay" onClick={fecharErro}>
          <div className="modal-erro" onClick={e => e.stopPropagation()}>
            <h3>❌ Erro</h3>
            <p>{erroGlobal}</p>
            <button className="btn-primary" onClick={fecharErro}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;