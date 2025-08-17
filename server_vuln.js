const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('db.sqlite');

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'dev-secret', resave: false, saveUninitialized: true }));

// tiny helper to render pseudo-templates
function render(view, vars = {}) {
  const layout = fs.readFileSync(path.join('views', 'layout.html'), 'utf8');
  let html = fs.readFileSync(path.join('views', view + '.html'), 'utf8');
  // partial include
  html = html.replace('{{> layout title="Login" heading="Login"}}', layout)
             .replace('{{> layout title="Register" heading="Register"}}', layout)
             .replace('{{> layout title="Home" heading="Home"}}', layout);
  // replace slots
  html = html.replace('{{title}}', vars.title || '');
  html = html.replace('{{heading}}', vars.heading || '');
  html = html.replace('{{content}}', vars.content || '');
  html = html.replace('{{username}}', vars.username || 'Guest');
  return html;
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.send(render('home', { title: 'Home', heading: 'Home', username: req.session.user.username }));
});

app.get('/login', (req, res) => {
  res.send(render('login', { title: 'Login', heading: 'Login' }));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // 🚨 INSECURE: string concatenation invites SQL Injection
  const sql = `SELECT id, username FROM users WHERE username = '${username}' AND password='${password}'`;
  db.get(sql, (err, row) => {
    if (row) {
      req.session.user = { id: row.id, username: row.username };
      return res.redirect('/');
    }
    res.status(401).send('<div class="warn">Login failed (this is intentionally insecure)</div>' + render('login', { title: 'Login', heading: 'Login' }));
  });
});

app.get('/register', (req, res) => {
  res.send(render('register', { title: 'Register', heading: 'Register' }));
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  // 🚨 INSECURE: storing plaintext passwords
  const sql = `INSERT INTO users(username, password) VALUES ('${username}','${password}')`;
  db.run(sql, function (err) {
    if (err) return res.status(400).send('<div class="warn">Username exists or error</div>' + render('register', { title: 'Register', heading: 'Register' }));
    res.redirect('/login');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.listen(3000, () => console.log('VULNERABLE server on http://localhost:3000'));