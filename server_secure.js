const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const db = new sqlite3.Database('db.sqlite');

app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'change-this-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

// rate limit login & register to slow brute force
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

function render(view, vars = {}) {
  const layout = fs.readFileSync(path.join('views', 'layout.html'), 'utf8');
  let html = fs.readFileSync(path.join('views', view + '.html'), 'utf8');
  html = html.replace('{{> layout title="Login" heading="Login"}}', layout)
             .replace('{{> layout title="Register" heading="Register"}}', layout)
             .replace('{{> layout title="Home" heading="Home"}}', layout);
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

app.get('/', requireAuth, (req, res) => {
  res.send(render('home', { title: 'Home', heading: 'Home', username: req.session.user.username }));
});

app.get('/login', (req, res) => {
  res.send(render('login', { title: 'Login', heading: 'Login' }));
});

app.post('/login', authLimiter, (req, res) => {
  const { username, password } = req.body;
  // ✅ SECURE: parameterized query
  db.get('SELECT id, username, password FROM users WHERE username = ?', [username], async (err, row) => {
    if (err) return res.status(500).send('Server error');
    if (!row) return res.status(401).send('<div class="warn">Invalid credentials</div>' + render('login', { title: 'Login', heading: 'Login' }));
    const ok = await bcrypt.compare(password, row.password);
    if (!ok) return res.status(401).send('<div class="warn">Invalid credentials</div>' + render('login', { title: 'Login', heading: 'Login' }));
    req.session.user = { id: row.id, username: row.username };
    res.redirect('/');
  });
});

app.get('/register', (req, res) => {
  res.send(render('register', { title: 'Register', heading: 'Register' }));
});

app.post('/register', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).send('<div class="warn">Username must be 3-20 chars, alnum/underscore only</div>' + render('register', { title: 'Register', heading: 'Register' }));
  }
  if (password.length < 8) {
    return res.status(400).send('<div class="warn">Password must be at least 8 chars</div>' + render('register', { title: 'Register', heading: 'Register' }));
  }
  const hash = await bcrypt.hash(password, 12);
  db.run('INSERT INTO users(username, password) VALUES (?,?)', [username, hash], function (err) {
    if (err) return res.status(400).send('<div class="warn">Username exists or error</div>' + render('register', { title: 'Register', heading: 'Register' }));
    res.redirect('/login');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.listen(4000, () => console.log('SECURE server on http://localhost:4000'));