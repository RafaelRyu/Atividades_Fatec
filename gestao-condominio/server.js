require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Importar rotas
const condominioRoutes = require('./routes/condominios');
const salaRoutes = require('./routes/salas');
const residenteRoutes = require('./routes/residentes');
const utensilioRoutes = require('./routes/utensilios');
const sorteioRoutes = require('./routes/sorteio');
const chatRoutes = require('./routes/chat');

// Usar rotas
app.use('/api/condominios', condominioRoutes);
app.use('/api/salas', salaRoutes);
app.use('/api/residentes', residenteRoutes);
app.use('/api/utensilios', utensilioRoutes);
app.use('/api/sorteio', sorteioRoutes);
app.use('/api/chat', chatRoutes);

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Conectado ao MongoDB'))
.catch(err => console.error('Erro ao conectar MongoDB:', err));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});