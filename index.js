import express from 'express';
import mysql2 from 'mysql2';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config(); // Charger les variables d'environnement

const app = express();
const port = process.env.PORT || 3000;

// Activer CORS pour permettre les requêtes depuis le frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Configurer la connexion MySQL avec un pool
const con = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Limite de connexions simultanées
  queueLimit: 0,
});

// Vérifier la connexion à la base de données
con.getConnection((err) => {
  if (err) {
    console.error('Erreur de connexion à MySQL:', err.message);
    process.exit(1); // Arrêter le serveur si la connexion échoue
  } else {
    console.log('Connecté à MySQL');
  }
});

// Middleware pour analyser les requêtes JSON
app.use(express.json());

// Route pour récupérer tous les membres
app.get('/read_member', async (req, res) => {
  try {
    const [results] = await con.promise().query('SELECT * FROM member');
    res.status(200).json(results);
  } catch (err) {
    console.error('Erreur lors de la récupération des membres:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// Gestion des routes inexistantes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Lancer le serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
