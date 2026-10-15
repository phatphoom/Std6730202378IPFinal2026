# SPEC.md — HR Manager & Salary Analytics System

Internet Programming Final Exam 2026 (updated: data stored in MySQL)

Related files: CLAUDE.md (rules), TASKS.md (work plan), backend/schema.sql (database)

## 1. Overview

Full-stack app with two parts that must work together:

- Backend: Express.js REST API, data stored in a **MySQL database**
- Frontend: React Native (Expo)

Phase 1: Login + Employee CRUD.
Phase 2: Salary clustering with 1D K-Means (k = 3).

Exam conditions: 3 hours, open-book, AI tools allowed. AI often misses edge cases, error handling, and input validation, so every rule below must be checked by hand.

## 2. Change from the original brief

- The original brief said "in-memory array". The teacher now wants the data stored in **MySQL**.
- Everything else (endpoints, JSON shapes, UI behavior) stays the same.
- Frontend does not change, because the API contract is the same.

## 3. Submission rules

- Public GitHub repo named `Std6xxxxxxIPFinal2026` (6xxxxxx = last 7 digits of the student ID)
- Structure:

```
Std6xxxxxxIPFinal2026/
├── backend/
│   ├── index.js
│   ├── db.js
│   ├── kmeans.js
│   ├── schema.sql
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── config/api.js
│   ├── screens/ (LoginScreen, DashboardScreen)
│   ├── components/
│   └── package.json
├── README.md
├── SPEC.md
├── TASKS.md
└── CLAUDE.md
```

- The examiner must be able to start both Node and Expo. README must explain: create the database, set `.env`, run backend, run frontend, set BASE_URL.
- Submit the repo URL in the LMS before the 3 hours end.

## 4. Database (MySQL)

File: `backend/schema.sql`

```sql
CREATE DATABASE IF NOT EXISTS hr_system CHARACTER SET utf8mb4;
USE hr_system;

CREATE TABLE IF NOT EXISTS employees (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  position  VARCHAR(100) NOT NULL,
  status    ENUM('Active','On Leave') NOT NULL DEFAULT 'Active',
  salary    DECIMAL(10,2) NOT NULL CHECK (salary > 0)
);
```

Seed data (at least 5 employees, run only when the table is empty):

| name | position | status | salary |
|---|---|---|---|
| John Doe | Software Engineer | Active | 45000 |
| Jane Smith | Product Manager | Active | 85000 |
| Somchai Jaidee | HR Officer | On Leave | 22000 |
| Mary Johnson | Designer | Active | 48000 |
| Anan Srisuk | Junior Developer | Active | 18500 |
| Nicha Wong | Senior Architect | Active | 90000 |

Config via `.env` (commit only `.env.example`):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=hr_system
PORT=3000
```

Rules:
- Use `mysql2/promise` with a connection pool in `db.js`.
- On startup: create the database/table if missing, seed if empty, print a clear error if MySQL is not reachable.
- All queries are parameterized with `?`.
- `DECIMAL` comes back as a string: convert with `Number(row.salary)`.
- `id` is INT in the DB but must be returned as a **string**: `String(row.id)`.

## 5. Backend API

Base: `http://<host>:3000`. JSON in, JSON out. Enable `cors()` and `express.json()`.

Error format: `{ "success": false, "message": "..." }`

### 5.1 POST /api/login

Body: `{ "username": "...", "password": "..." }`

- `admin` / `password123` -> 200 `{ "success": true, "token": "mock-jwt-token" }`
- anything else (wrong, missing, empty body) -> 401 `{ "success": false, "message": "Invalid username or password" }`
- Credentials stay hardcoded (see open questions).

### 5.2 GET /api/employees

200 -> array of employees:

```json
[{ "id": "1", "name": "John Doe", "position": "Software Engineer", "status": "Active", "salary": 45000 }]
```

### 5.3 POST /api/employees

Body: `{ "name", "position", "salary" }`

- name, position: string, trimmed, not empty
- salary: finite number > 0 (reject "abc", null, negative, NaN, empty)
- Invalid or missing -> 400 with message
- New employee gets `status = "Active"`
- Success -> 201 with the created employee (same shape as above)

### 5.4 PUT /api/employees/:id/status

- Toggle `Active` <-> `On Leave`
- Suggested SQL: `UPDATE employees SET status = IF(status='Active','On Leave','Active') WHERE id = ?`
- Then SELECT the row and return it (200)
- id not found (affectedRows = 0 or no row) -> 404

### 5.5 DELETE /api/employees/:id

- Success -> 200 `{ "success": true }`
- id not found -> 404

### 5.6 GET /api/employees/salary-clusters

- Declare this route **before** any route with `/:id`.
- `SELECT salary FROM employees`, convert to numbers, run 1D K-Means with k = 3.
- 200:

```json
{
  "success": true,
  "clusters": [
    { "group": "Tier 1", "centroid": 18500, "count": 5 },
    { "group": "Tier 2", "centroid": 45000, "count": 3 },
    { "group": "Tier 3", "centroid": 85000, "count": 2 }
  ]
}
```

(the numbers above are an example only)

### 5.7 General backend rules

- Every route has try/catch. A DB error returns 500 JSON, the server never crashes.
- Validate on the server even if the frontend validates.
- `req.body` may be undefined or empty: handle it.
- Non-numeric `:id` -> 404 (or 400), never a crash.

## 6. K-Means (1D, k = 3)

File: `backend/kmeans.js`, exported as a pure function `kmeans1D(values, k = 3)`.

Algorithm:
1. Initial centroids: deterministic (min, median, max of the sorted values). No random.
2. Assign each value to the nearest centroid.
3. Recompute each centroid as the mean of its members.
4. Repeat until centroids do not change or 100 iterations.
5. Sort clusters by centroid ascending. Name them Tier 1 (lowest), Tier 2, Tier 3.
6. Round centroid to 2 decimals. `count` is an integer. Sum of counts = number of employees.

Edge cases that must not crash:
- 0 employees: return 3 tiers with count 0 and centroid 0 (or an empty list with success true; pick one and keep it consistent)
- fewer than 3 employees, or fewer than 3 distinct salaries: still return a valid response (empty cluster -> count 0, no division by zero)
- all salaries equal
- A cluster becomes empty during iteration: keep its previous centroid

## 7. Frontend

### 7.1 General

- API base URL only in `frontend/config/api.js`. Android emulator: `10.0.2.2`. Real phone: computer's LAN IP.
- Every API call has try/catch and shows an Alert on network/server error.
- Navigation: Login -> Dashboard. Dashboard must not be reachable without a successful login.
- `Alert.alert` does not work on Expo web: test on a phone or emulator (or add a `window.confirm` fallback).

### 7.2 Login Screen

- Inputs: username, password (secure entry)
- Submit calls POST /api/login
- Failure (401 or network): show Alert
- Success: navigate to Dashboard

### 7.3 Dashboard Screen

Employee list (FlatList), each item shows: name, position, status, salary.

Add Employee form:
- Inputs: name, position, salary (numeric keyboard)
- Client-side validation: no empty fields (trim), salary must be a number > 0. If invalid, do not call the API and show a message.
- Convert salary from string to number before sending.
- After success: clear the form and update the list.

Per item buttons:
- **Toggle Status**: calls PUT, list updates.
- **Delete**: first `Alert.alert("Are you sure?", ...)` with Cancel/Delete. Call DELETE only after the user confirms.

After any add / toggle / delete the list must update immediately (update state or refetch), without a manual refresh.

### 7.4 Salary Analysis (Phase 2)

- Button "Analyze Salary Structure" on the Dashboard.
- On press: show `ActivityIndicator` while waiting. Use `finally { setLoading(false) }`.
- On success: show 3 summary cards: tier name, employee count, average base salary (centroid, formatted with thousands separator).
- On error: Alert, and the loading indicator disappears.

## 8. Grading rubric (100 points)

| Points | Item |
|---|---|
| 15 | Login works and blocks unauthorized access |
| 20 | Backend CRUD works and handles bad requests (400) |
| 15 | Dashboard integrates with API, UI updates automatically |
| 10 | Client-side validation and delete confirmation |
| 15 | K-Means implemented, valid results, no crash |
| 15 | RN fetches clusters, handles loading, renders cards |
| 10 | Folder structure, repo name, both servers start for the examiner |

## 9. Definition of done

- [ ] All endpoints tested with curl (valid and invalid input)
- [ ] Data survives a backend restart (it is in MySQL)
- [ ] Frontend tested on emulator or real phone
- [ ] `schema.sql`, `.env.example`, and README are in the repo
- [ ] A fresh clone can run: `npm install`, create DB, set `.env`, start backend and Expo
- [ ] Repo name correct, pushed, URL submitted

## 10. Open questions (ask the teacher, defaults in brackets)

1. Login: is hardcoded `admin` / `password123` still OK, or must users be in a database table? [hardcoded]
2. Will the examiner create the database, or should the backend create it on startup? [backend creates it, and `schema.sql` is also provided]
3. Which MySQL setup will the examiner use (XAMPP / MySQL Server / Docker)? [standard MySQL on port 3306, root user, password from `.env`]
4. Is `mysql2` allowed, or must a specific library be used? [mysql2]