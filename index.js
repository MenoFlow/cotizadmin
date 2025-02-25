import express from 'express';
import path from 'path';
import cors from 'cors';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Charge les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist')); // Dossier de build du frontend

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const pool = mysql.createPool(dbConfig);

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Exemple de route protégée
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Route protégée, vous êtes authentifié', user: req.user });
});


// Route d'authentification
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];

    if (!user || user.password !== password) { // En production, utiliser bcrypt pour le hash
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Routes des membres
app.get('/api/members', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM members');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/members', authenticateToken, async (req, res) => {
  const { firstName, lastName, cin, phone, email, birthDate, facebookName, profession, height } = req.body;

  try {
    // Vérifier si un membre avec le même cin ou email existe déjà
    const [existingMember] = await pool.query(
      'SELECT * FROM members WHERE cin = ? OR email = ?',
      [cin, email]
    );

    if (existingMember.length > 0) {
      return res.status(400).json({ message: 'Le CIN ou l\'email existe déjà' });
    }

    // Insertion du nouveau membre
    const [result] = await pool.query(
      'INSERT IGNORE INTO members (firstName, lastName, cin, phone, email, birthDate, facebookName, profession, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [firstName, lastName, cin, phone, email, birthDate, facebookName, profession, height]
    );    

    res.status(201).json({ id: result.insertId, ...req.body });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/members/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, cin, phone, email, birthDate, facebookName, profession, height } = req.body;

  try {
    // Vérifier si un membre avec le même cin ou email existe déjà, à l'exception du membre actuel
    const [existingMember] = await pool.query(
      'SELECT * FROM members WHERE (cin = ? OR email = ?) AND id != ?',
      [cin, email, id]
    );

    if (existingMember.length > 0) {
      return res.status(400).json({ message: 'Le CIN ou l\'email existe déjà' });
    }

    // Mise à jour du membre
    const [results, fields] = await pool.query(
      'UPDATE members SET firstName=?, lastName=?, cin=?, phone=?, email=?, birthDate=?, facebookName=?, profession=?, height=? WHERE id=?',
      [firstName, lastName, cin, phone, email, birthDate, facebookName, profession, height, id]
    );

    // Si aucune ligne n'a été affectée, cela signifie qu'aucun membre n'a été trouvé avec l'id spécifié
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    res.json({ id, ...req.body });

  } catch (error) {
    console.error('Erreur de la requête:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/members/count', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(id) as counts FROM members
    `);
    const count = rows[0]
    res.json(count);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
})


app.delete('/api/members/:id', authenticateToken, async (req, res) => {
  console.log(22);

  const { id } = req.params;
  try {
    await pool.query('DELETE FROM members WHERE id = ?', [id]);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Routes des cotisations
app.get('/api/contributions', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, m.firstName, m.lastName 
      FROM contributions c
      JOIN members m ON c.memberId = m.id
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/contributions/member/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT * FROM contributions WHERE memberId = ?`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/contributions', authenticateToken, async (req, res) => {
  const { memberId, month, year, amount, paidAt } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO contributions (memberId, month, year, amount, paidAt) VALUES (?, ?, ?, ?, ?)',
      [memberId, month, year, amount, paidAt]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/contributions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount, paidAt } = req.body;
  try {
    await pool.query(
      'UPDATE contributions SET amount = ?, paidAt = ? WHERE id = ?',
      [amount, paidAt, id]
    );
    res.json({ id, ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/contributions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM contributions WHERE id = ?', [id]);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir les statistiques
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const [memberCount] = await pool.query('SELECT COUNT(*) as count FROM members');
    const [contributionsTotal] = await pool.query('SELECT SUM(amount) as total FROM contributions');
    const [monthlyStats] = await pool.query(`
      SELECT 
        CONCAT(year, '-', month) as period,
        COUNT(*) as count,
        SUM(amount) as total
      FROM contributions
      GROUP BY year, month
      ORDER BY year DESC, month DESC
      LIMIT 12
    `);

    res.json({
      memberCount: memberCount[0].count,
      contributionsTotal: contributionsTotal[0].total || 0,
      monthlyStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Routes des utilisateurs (admin seulement)
app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  try {
    const [rows] = await pool.query('SELECT id, username, role FROM users');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { username, password, role } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, password, role] // En production, hasher le mot de passe
    );
    res.status(201).json({ id: result.insertId, username, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/users/:id/role', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { id } = req.params;
  const { role } = req.body;
  try {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ id, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour servir l'application React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
