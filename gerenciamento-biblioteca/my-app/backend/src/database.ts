import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/biblioteca');
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Erro ao conectar no MongoDB', err);
    process.exit(1);
  }
};

export default connectDB;