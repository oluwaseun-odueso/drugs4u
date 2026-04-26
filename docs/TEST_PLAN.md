# Test Plan — Pharma4 Prescription Management System

**Module:** COMP70047  
**System:** Drugs 4U Pharmacy PMS  

---

## 1. Introduction

This document outlines the testing approach I took for the Pharma4 PMS. The system is a full-stack pharmacy management application built with a PHP REST API backend and a React frontend, backed by a MySQL database. Testing was done across three layers — backend logic, frontend components, and full end-to-end user flows.

The goal was to make sure everything I built actually works as intended, not just that it looks right on screen.

---

## 2. What I Was Testing For

The main things I wanted to verify were:

- Logging in and out works, and sessions are maintained correctly
- The two user roles (admin and pharmacist) see different parts of the system
- A pharmacist cannot get to Reports or Inventory even by typing the URL directly
- Customer records can be created, searched, edited, and removed (soft-delete)
- Prescriptions move through the right status transitions
- Stock goes down when medicines are dispensed
- Alerts fire automatically when a controlled drug or age-restricted medicine is on a prescription
- The frontend does not send wrong data to the API

---

## 3. Scope

### Included
- Authentication (login, logout, session, redirect guards)
- Role-based access control (admin vs pharmacist, frontend and backend)
- Customer CRUD and search
- Prescription creation, status transitions, and items
- Inventory batch management
- Alert generation for controlled/age-restricted drugs
- Reports (by date, by customer, by stock)
- Frontend API helper functions
- The MultiSelectField component (allergies/conditions dropdowns)

### Not Included
- Performance or load testing
- Cross-browser testing (only Chromium was used for E2E)
- Mobile layout
- Email or third-party integrations

---

## 4. Test Environment

| Item | Details |
|------|---------|
| OS | macOS |
| PHP version | 8.1 |
| Database | MySQL 9.2 |
| Test database | pharma4_test (separate from the real DB) |
| Node version | 18+ |
| Browser (E2E) | Chromium via Playwright (headless) |
| Frontend dev server | http://localhost:5173 |
| Backend dev server | http://localhost:8080 |

---

## 5. Testing Approach

I used three different types of tests, each serving a different purpose:

### Unit Tests
These test individual functions in isolation. For the backend I used **PHPUnit**, and for the frontend I used **Vitest** with React Testing Library.

- Backend unit tests cover: `intParam()`, `getBody()`, `requireAuth()`, `requireRole()`, and password hashing
- Frontend unit tests cover: the `api.js` helper functions and the `MultiSelectField` component logic (parse/build/summary)

### Integration Tests (Backend)
These test the full database layer — they hit a real MySQL test database (`pharma4_test`) that gets created and seeded automatically at the start of each test run. I wrote integration tests for:

- The login flow (valid credentials, invalid credentials, inactive users)
- Customer CRUD against the DB
- Prescription creation, status transitions, and alert generation
- Role enforcement via `requireRole()`

### End-to-End Tests
These use **Playwright** to control a real browser and simulate a real user clicking through the application. These are the most realistic tests because they exercise the full stack — React frontend talking to the PHP backend talking to MySQL.

E2E tests cover:
- Login and logout
- Role-based navigation (what each user type sees)
- Blocked routes (pharmacist trying to access /app/reports)
- Creating a customer and seeing them appear in the list
- Navigating to New Prescription
- Inventory modal (admin only)
- Reports page switching between report types

---

## 6. How to Run the Tests

### Backend Unit + Integration Tests (PHPUnit)

1. Copy the config file: `cp backend/phpunit.xml.example backend/phpunit.xml`
2. Edit `backend/phpunit.xml` and fill in your local MySQL credentials
3. Run:

```
cd backend
vendor/bin/phpunit --testdox
```

The bootstrap script automatically creates and seeds the `pharma4_test` database.

### Frontend Unit Tests (Vitest)

```
cd frontend
npm test
```

### E2E Tests (Playwright)

Start both servers first, then run:

```
# Terminal 1
cd backend && php -S localhost:8080 router.php

# Terminal 2
cd frontend && npm run dev

# Terminal 3
npx playwright test
```

View the HTML test report:

```
npx playwright show-report e2e/report
```

---

## 7. Test Cases

### 7.1 Authentication

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| TC-AUTH-01 | Login with valid admin credentials | E2E | Redirected to dashboard |
| TC-AUTH-02 | Login with valid pharmacist credentials | E2E | Redirected to dashboard, restricted nav |
| TC-AUTH-03 | Login with wrong password | E2E | Error message shown |
| TC-AUTH-04 | Login with empty fields | E2E | Stays on login page |
| TC-AUTH-05 | Logout | E2E | Redirected to /login |
| TC-AUTH-06 | Access /app without being logged in | E2E | Redirected to /login |
| TC-AUTH-07 | Access /app/customers without being logged in | E2E | Redirected to /login |
| TC-AUTH-08 | Valid credentials accepted by DB query | Integration | password_verify() = true |
| TC-AUTH-09 | Wrong password rejected | Integration | password_verify() = false |
| TC-AUTH-10 | Inactive user is excluded from login query | Integration | No row returned |
| TC-AUTH-11 | Admin role stored correctly | Integration | role = 'admin' |
| TC-AUTH-12 | Pharmacist role stored correctly | Integration | role = 'pharmacist' |
| TC-AUTH-13 | password_verify matches correct hash | Unit | true |
| TC-AUTH-14 | password_verify fails for wrong password | Unit | false |
| TC-AUTH-15 | password_verify fails for empty string | Unit | false |

### 7.2 Role-Based Access Control

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| TC-ROLE-01 | Admin sees Dashboard in nav | E2E | Link visible |
| TC-ROLE-02 | Admin sees Customers in nav | E2E | Link visible |
| TC-ROLE-03 | Admin sees Medicines in nav | E2E | Link visible |
| TC-ROLE-04 | Admin sees Inventory in nav | E2E | Link visible |
| TC-ROLE-05 | Admin sees Prescriptions in nav | E2E | Link visible |
| TC-ROLE-06 | Admin sees Reports in nav | E2E | Link visible |
| TC-ROLE-07 | Admin sees Alerts in nav | E2E | Link visible |
| TC-ROLE-08 | Admin can navigate to Reports | E2E | URL = /app/reports |
| TC-ROLE-09 | Admin can navigate to Inventory | E2E | URL = /app/inventory |
| TC-ROLE-10 | Pharmacist does NOT see Inventory in nav | E2E | Link not visible |
| TC-ROLE-11 | Pharmacist does NOT see Reports in nav | E2E | Link not visible |
| TC-ROLE-12 | Pharmacist typing /app/reports directly is blocked | E2E | Redirected away |
| TC-ROLE-13 | Pharmacist typing /app/inventory directly is blocked | E2E | Redirected away |
| TC-ROLE-14 | requireAuth() returns user when session exists | Unit | Returns id, name, role |
| TC-ROLE-15 | requireAuth() blocks unauthenticated requests | Unit | Outputs Unauthenticated |
| TC-ROLE-16 | Admin passes requireRole('pharmacist') | Unit | Returns user |
| TC-ROLE-17 | Pharmacist passes requireRole('pharmacist') | Unit | Returns user |
| TC-ROLE-18 | Pharmacist blocked by requireRole('admin') | Integration | Outputs Forbidden |
| TC-ROLE-19 | DB ENUM rejects invalid role value | Integration | PDOException |

### 7.3 Customer Management

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| TC-CUST-01 | Customers list page loads | E2E | Heading visible |
| TC-CUST-02 | Open Add Customer modal | E2E | Modal visible |
| TC-CUST-03 | Create a customer with valid data | E2E | Customer appears in list |
| TC-CUST-04 | Search by last name | E2E | Matching row shown |
| TC-CUST-05 | Cancel modal without saving | E2E | Modal closes, no new record |
| TC-CUST-06 | Submit form with missing required fields | E2E | Modal stays open |
| TC-CUST-07 | Customer created in DB | Integration | lastInsertId() > 0 |
| TC-CUST-08 | New customer is_active defaults to 1 | Integration | is_active = 1 |
| TC-CUST-09 | Customer names stored correctly | Integration | first_name, last_name match |
| TC-CUST-10 | Allergies stored as text | Integration | allergies column matches |
| TC-CUST-11 | Drug allergies stored as text | Integration | drug_allergies column matches |
| TC-CUST-12 | Medical conditions stored as text | Integration | medical_conditions column matches |
| TC-CUST-13 | Customer retrievable by ID | Integration | Row returned |
| TC-CUST-14 | Inactive customer hidden from active list | Integration | No row returned |
| TC-CUST-15 | Search by last name returns correct row | Integration | 1 matching result |
| TC-CUST-16 | Age calculated from date of birth | Integration | TIMESTAMPDIFF = expected age |
| TC-CUST-17 | Customer details can be updated | Integration | New value in DB |
| TC-CUST-18 | Soft delete sets is_active = 0 | Integration | is_active = 0 |
| TC-CUST-19 | Soft-deleted customer absent from active query | Integration | COUNT = 0 |

### 7.4 Prescription Management

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| TC-PRESC-01 | Prescriptions list page loads | E2E | Heading visible |
| TC-PRESC-02 | Can navigate to New Prescription page | E2E | URL = /app/prescriptions/new |
| TC-PRESC-03 | New prescription form shows required fields | E2E | Customer and prescribed_by visible |
| TC-PRESC-04 | Pharmacist can view prescriptions | E2E | Page accessible |
| TC-PRESC-05 | Prescription created in DB | Integration | lastInsertId() > 0 |
| TC-PRESC-06 | New prescription has pending status | Integration | status = 'pending' |
| TC-PRESC-07 | Status updates to dispensed | Integration | status = 'dispensed' |
| TC-PRESC-08 | Status updates to cancelled | Integration | status = 'cancelled' |
| TC-PRESC-09 | Item linked to correct batch and medication | Integration | COUNT = 1 |
| TC-PRESC-10 | Stock quantity decreases after dispensing | Integration | quantity = 95 after dispensing 5 |
| TC-PRESC-11 | Alert logged for controlled drug | Integration | Row in alerts_log |
| TC-PRESC-12 | Alert logged for age-restricted medicine | Integration | Row in alerts_log |
| TC-PRESC-13 | Quantity cannot go below zero | Integration | PDOException (CHECK constraint) |

### 7.5 Inventory

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| TC-INV-01 | Inventory page loads for admin | E2E | Heading and table visible |
| TC-INV-02 | Admin can open Add Batch modal | E2E | Modal visible |
| TC-INV-03 | Add Batch form has required fields | E2E | Medicine, qty, expiry shown |
| TC-INV-04 | Cancel closes modal | E2E | Modal not visible |
| TC-INV-05 | Pharmacist blocked from /app/inventory | E2E | Redirected |

### 7.6 Reports

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| TC-REP-01 | Reports page loads for admin | E2E | Heading visible |
| TC-REP-02 | Report type dropdown visible | E2E | Combobox present |
| TC-REP-03 | Date range inputs visible | E2E | Date inputs present |
| TC-REP-04 | Switch to By Customer report | E2E | Customer column visible |
| TC-REP-05 | Switch to By Stock report | E2E | Stock column visible |
| TC-REP-06 | Pharmacist blocked from /app/reports | E2E | Redirected |

### 7.7 API Helpers (Frontend)

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| TC-API-01 | auth.login sends POST to /api/auth/login | Unit | Correct URL and method |
| TC-API-02 | auth.login throws on 401 | Unit | Error with server message |
| TC-API-03 | auth.me sends GET to /api/auth/me | Unit | Correct URL |
| TC-API-04 | customers.list appends search param | Unit | URL contains search=Smith |
| TC-API-05 | customers.get sends id param | Unit | URL contains id=5 |
| TC-API-06 | customers.create sends POST with body | Unit | Method = POST |
| TC-API-07 | customers.update sends PUT with id | Unit | Method = PUT, id in URL |
| TC-API-08 | customers.remove sends DELETE with id | Unit | Method = DELETE |
| TC-API-09 | inventory.add sends POST | Unit | Correct URL and method |
| TC-API-10 | reports.get appends all params | Unit | type, date_from, date_to in URL |
| TC-API-11 | prescriptions.updateStatus sends PUT | Unit | Status in body, id in URL |

### 7.8 MultiSelectField Component

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| TC-MSF-01 | parseValue returns empty for null | Unit | checked.size = 0 |
| TC-MSF-02 | parseValue returns empty for empty string | Unit | checked.size = 0 |
| TC-MSF-03 | parseValue adds known options to Set | Unit | Peanuts, Milk in Set |
| TC-MSF-04 | parseValue puts unknown values in otherText | Unit | otherText = 'TreePollen' |
| TC-MSF-05 | parseValue handles all-unknown input | Unit | checked empty, otherText set |
| TC-MSF-06 | buildValue returns empty for nothing selected | Unit | '' |
| TC-MSF-07 | buildValue serialises in declaration order | Unit | 'Peanuts, Eggs' |
| TC-MSF-08 | buildValue appends otherText after options | Unit | 'Milk, Latex' |
| TC-MSF-09 | buildValue ignores whitespace-only otherText | Unit | 'Milk' |
| TC-MSF-10 | buildValue returns only otherText if nothing checked | Unit | 'Latex' |
| TC-MSF-11 | Summary shows "None selected" for empty | Unit | 'None selected' |
| TC-MSF-12 | Summary shows single item | Unit | 'Peanuts' |
| TC-MSF-13 | Summary shows two items | Unit | 'Peanuts, Milk' |
| TC-MSF-14 | Summary shows overflow count for 3+ | Unit | 'Peanuts, Milk, +1 more' |
| TC-MSF-15 | otherText contributes to overflow count | Unit | '+1 more' shown |

### 7.9 Response Helpers (Backend)

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| TC-RESP-01 | getBody() returns empty array with no input | Unit | [] |
| TC-RESP-02 | intParam() returns int for numeric string | Unit | 42 |
| TC-RESP-03 | intParam() returns null for missing key | Unit | null |
| TC-RESP-04 | intParam() returns null for non-numeric | Unit | null |
| TC-RESP-05 | intParam() returns null for negative value | Unit | null |
| TC-RESP-06 | intParam() returns null for float string | Unit | null |
| TC-RESP-07 | intParam() returns 0 for '0' | Unit | 0 |

---

## 8. Requirements Traceability Matrix

| Requirement | Description | Test IDs |
|-------------|-------------|----------|
| REQ-01 | Users can log in with username and password | TC-AUTH-01 to TC-AUTH-09 |
| REQ-02 | Users can log out | TC-AUTH-05 |
| REQ-03 | Unauthenticated access is blocked | TC-AUTH-06, TC-AUTH-07, TC-ROLE-14, TC-ROLE-15 |
| REQ-04 | Admin has access to all features | TC-ROLE-01 to TC-ROLE-09 |
| REQ-05 | Pharmacist cannot access Reports | TC-ROLE-10, TC-ROLE-11, TC-ROLE-12, TC-REP-06 |
| REQ-06 | Pharmacist cannot access Inventory | TC-ROLE-10, TC-ROLE-11, TC-ROLE-13, TC-INV-05 |
| REQ-07 | Customers can be created | TC-CUST-03, TC-CUST-07 |
| REQ-08 | Customers can be searched | TC-CUST-04, TC-CUST-15 |
| REQ-09 | Customers can be updated | TC-CUST-17 |
| REQ-10 | Customers can be soft-deleted | TC-CUST-18, TC-CUST-19 |
| REQ-11 | Customer allergies and conditions recorded | TC-CUST-10, TC-CUST-11, TC-CUST-12 |
| REQ-12 | Prescriptions can be created | TC-PRESC-05, TC-PRESC-06 |
| REQ-13 | Prescription status can be updated | TC-PRESC-07, TC-PRESC-08 |
| REQ-14 | Stock is reduced when a prescription is dispensed | TC-PRESC-10 |
| REQ-15 | Alerts are generated for controlled drugs | TC-PRESC-11 |
| REQ-16 | Alerts are generated for age-restricted medicines | TC-PRESC-12 |
| REQ-17 | Inventory batches can be added by admin | TC-INV-02, TC-INV-03 |
| REQ-18 | Stock quantity cannot go below zero | TC-PRESC-13 |
| REQ-19 | Reports available by date, customer, and stock | TC-REP-04, TC-REP-05 |
| REQ-20 | Only valid roles can be stored | TC-ROLE-19, TC-AUTH-11, TC-AUTH-12 |

---

## 9. Entry and Exit Criteria

**Before testing starts:**
- pharma4_test database accessible with credentials in phpunit.xml
- Frontend and backend dev servers running for E2E tests
- PHPUnit, Vitest, and Playwright dependencies installed

**Testing is complete when:**
- All test cases have been executed
- Any failures are documented with an explanation
- The Playwright HTML report has been generated

---

## 10. Risks and How I Handled Them

| Risk | What I Did |
|------|-----------|
| Cross-origin cookies blocking session in production | Set SameSite=None; Secure on the PHP session cookie in cors.php |
| Railway MySQL using a non-standard port | Added DB_PORT env var support to database.php |
| phpunit.xml contains local DB credentials | Added to .gitignore, provided phpunit.xml.example instead |
| E2E tests relying on specific seed data | Tests create their own records where possible and clean up after |
