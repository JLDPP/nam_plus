import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) =>
  res.json({
    ok: true,
    name: 'nam-plus-api'
  })
);

app.use('/api/auth', authRoutes);

const {
  PORT = 4000,
  MONGODB_URI
} = process.env;

mongoose
  .connect(MONGODB_URI, {
    dbName: 'BackPWA'
  })
  .then(() => {
    console.log(
      'Conectado a la base de datos',
      mongoose.connection.name
    );

    app.listen(PORT, () =>
      console.log(
        `API corriendo en http://localhost:${PORT}`
      )
    );
  })
  .catch((err) => {
    console.error(
      'Error al conectar a la base de datos',
      err
    );

    process.exit(1);
  });