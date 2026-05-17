import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';                     // ✅ importa path
import connectDB from './database';
import bibliotecasRoutes from './routes/bibliotecas';
import usuariosRoutes from './routes/usuarios';
import livrosRoutes from './routes/livros';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// Rotas da API
app.use('/api/bibliotecas', bibliotecasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/livros', livrosRoutes);

// ------------------------------------------------
// ✅ SERVE OS ARQUIVOS DO FRONTEND EM PRODUÇÃO
// ------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  // Caminho para a pasta build do frontend a partir de backend/dist
  const frontendBuildPath = path.join(__dirname, '../../frontend/build');
  app.use(express.static(frontendBuildPath));

  // Para qualquer rota que não seja da API, serve o index.html (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));