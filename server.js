const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к базе
const dbPath = path.resolve(__dirname, 'db', 'vessels.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Ошибка подключения к базе:', err.message);
  else console.log('Подключено к SQLite базе');
});

// Инициализация таблиц
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS vessels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    type TEXT,
    last_repair_date TEXT,
    status TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS repairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vessel_name TEXT,
    date TEXT,
    description TEXT,
    FOREIGN KEY(vessel_name) REFERENCES vessels(name)
  )`);
});

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

// Получить все суда
app.get('/api/vessels', (req, res) => {
  db.all("SELECT * FROM vessels", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Добавить судно
app.post('/api/vessels', express.json(), (req, res) => {
  const { name, type, last_repair_date, status } = req.body;
  db.run(
    "INSERT INTO vessels (name, type, last_repair_date, status) VALUES (?, ?, ?, ?)",
    [name, type, last_repair_date, status],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, type, last_repair_date, status });
    }
  );
});

// Добавить ремонт
app.post('/api/vessels/:name/repairs', express.json(), (req, res) => {
  const { name } = req.params;
  const { date, description } = req.body;
  db.run(
    "INSERT INTO repairs (vessel_name, date, description) VALUES (?, ?, ?)",
    [name, date, description],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, vessel_name: name, date, description });
    }
  );
});

// Получить ремонты
app.get('/api/vessels/:name/repairs', (req, res) => {
  const { name } = req.params;
  db.all("SELECT * FROM repairs WHERE vessel_name = ?", [name], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});