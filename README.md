# Cyber-Login : SQL Injection Demo with Node.js & Express

This project demonstrates how SQL injection works and how to prevent it using parameterized queries.

## Features
- `server_vuln.js` → Vulnerable server (unsafe queries, prone to SQL Injection).
- `server_secure.js` → Secure server (uses parameterized queries).
- `schema.sql` → Sample database schema with `users` table.

## Setup
1. Clone the repo
    ```bash
    git clone https://github.com/your-username/sql-injection-demo.git
    cd cyber-login
    ```

2. Install dependencies
    ```bash
    npm install
    ```
    Or
    ```bash 
    npm init -y
    npm install express sqlite3 express-session bcrypt express-rate-limit helmet
    ```

3. Seed database
    ```bash
    node -e "require('fs').writeFileSync('schema.sql', `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL);`); console.log('schema.sql written')"
    node -e "const sqlite3=require('sqlite3').verbose();const db=new sqlite3.Database('db.sqlite');const fs=require('fs');db.exec(fs.readFileSync('schema.sql','utf8'),()=>{console.log('DB ready');db.close();});"
    ```


## How to use ?

1. Run Vulnerable Server (localhost:3000)
```bash
node server_vuln.js
```

2. Register a user
```bash 
username: admin
password: admin123
```

3. Login normally from the same username and password or visit
```bash
http://localhost:3000/login?username=admin&password=admin123
```
You'll see a welcome pagw, now logout.

4. Try SQL Injection. Put these query in the password field, and type anything on the username (doesn't matter).
```sql
' OR '1'='1
```

👉 Because the query in `server_vuln.js` doesn’t sanitize input, it becomes something like:
```sql
SELECT * FROM users WHERE username = 'whatever' AND password = '' OR '1'='1';
```

5. On the other hand, if you try the same `' OR '1'='1` on the secure server `(localhost:4000)`, it should block you with something like “Invalid login.”

---

⚠️ **Important:** Mention that it’s only for **educational purposes** (since GitHub has rules about security tools). Add this line at the end of README: