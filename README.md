# Node.js Policy Management Assessment

A Node.js backend application developed as part of a technical assessment.

The application provides APIs for importing policy data from a CSV file, searching policies by username, aggregating policies by user, monitoring CPU utilization, and scheduling posts for a future date and time.

---

## Features

### Task 1 - Policy Management

* Upload CSV policy data
* Process CSV data using Node.js Worker Threads
* Store data in separate MongoDB collections
* Maintain references between related collections
* Search policies using username
* Aggregate policies by user
* Prevent duplicate records using unique fields and upsert operations

### Task 2 - System Monitoring & Scheduled Posts

* Monitor real-time Node.js server CPU utilization
* Restart the application when CPU usage reaches 70%
* Schedule posts for a specific date and time
* Store scheduled posts in MongoDB
* Automatically process due posts using a background scheduler
* Prevent duplicate post creation using an atomic status update and unique reference

---

# Technology Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* Worker Threads
* CSV Parser
* Multer
* Node-Cron
* PM2
* dotenv

---

# Project Structure

node-policy-assessment/
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── Agent.js
│   │   ├── User.js
│   │   ├── Account.js
│   │   ├── Lob.js
│   │   ├── Carrier.js
│   │   ├── Policy.js
│   │   ├── ScheduledPost.js
│   │   └── Post.js
│   │
│   ├── controllers/
│   │   ├── upload.controller.js
│   │   ├── policy.controller.js
│   │   └── post.controller.js
│   │
│   ├── routes/
│   │   ├── upload.routes.js
│   │   ├── policy.routes.js
│   │   └── post.routes.js
│   │
│   ├── workers/
│   │   └── csv.worker.js
│   │
│   ├── services/
│   │   ├── cpuMonitor.service.js
│   │   └── scheduler.service.js
│   │
│   ├── app.js
│   └── server.js
│
├── uploads/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md

# Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB
* Git

Optional:

* PM2
* Postman

---

# Installation

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Navigate to the project:

```bash
cd node-policy-assessment
```

Install dependencies:

```bash
npm install
```

---

# Environment Configuration

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/node_policy_assessment
```

An example configuration is also provided in:

```text
.env.example
```

---

# Running the Application

## Development

```bash
npm run dev
```

## Normal execution

```bash
npm start
```

The server runs on:

```text
http://localhost:5000
```

---

# Health Check

### Request

GET /health

### Example

```bash
curl http://localhost:5000/health
```

### Response

```json
{
  "status": "OK"
}
```

---

# Task 1 - Policy Management APIs

## 1. Upload Policy Data

### Endpoint

```http
POST /api/upload
```

### Request

Use `multipart/form-data`.

Field name:

```text
file
```

Upload the provided CSV file using Postman.

### Example Response

```json
{
  "message": "File uploaded successfully",
  "totalRows": 1198,
  "importedPolicies": 1198
}
```

### Implementation

The uploaded CSV file is processed using a Node.js Worker Thread.

The worker:

1. Reads the CSV file.
2. Parses the records.
3. Connects to MongoDB.
4. Creates or finds related Agent, User, Account, LOB and Carrier records.
5. Creates or updates Policy records.
6. Sends the import result back to the main thread.

Using a Worker Thread keeps the CPU-intensive file-processing work away from the main Node.js event loop.

---

# MongoDB Collections

The application uses separate collections as requested in the assessment.

## Agent

Stores insurance agent information.

Example:

```json
{
  "name": "Alex Watson"
}
```

---

## User

Stores customer/user information.

Example:

```json
{
  "firstName": "Lura Lucca",
  "email": "madler@yahoo.ca",
  "phone": "8677356559",
  "state": "NC",
  "zipCode": "27028",
  "gender": "Female",
  "userType": "Active Client"
}
```

---

## Account

Stores account information associated with a user.

Example:

```json
{
  "name": "Lura Lucca & Owen Dodson",
  "userId": "<USER_ID>"
}
```

---

## LOB

Stores policy category / line of business information.

Example:

```json
{
  "categoryName": "Commercial Auto"
}
```

---

## Carrier

Stores insurance company/carrier information.

Example:

```json
{
  "companyName": "Integon Gen Ins Corp"
}
```

---

## Policy

Stores policy information and references related entities.

Example:

```json
{
  "policyNumber": "YEEX9MOIBU7X",
  "policyStartDate": "2018-11-02",
  "policyEndDate": "2019-11-02",
  "userId": "<USER_ID>",
  "categoryId": "<LOB_ID>",
  "carrierId": "<CARRIER_ID>"
}
```

MongoDB ObjectId references are used to maintain relationships between collections.

---

# 2. Search Policy by Username

### Endpoint

```http
GET /api/policies/search?username=Lura
```

### Example

```bash
curl "http://localhost:5000/api/policies/search?username=Lura"
```

### Example Response

```json
{
  "username": "Lura",
  "totalPolicies": 1,
  "policies": [
    {
      "_id": "<POLICY_ID>",
      "policyNumber": "YEEX9MOIBU7X",
      "policyStartDate": "2018-11-02T00:00:00.000Z",
      "policyEndDate": "2019-11-02T00:00:00.000Z",
      "categoryId": {
        "_id": "<LOB_ID>",
        "categoryName": "Commercial Auto"
      },
      "carrierId": {
        "_id": "<CARRIER_ID>",
        "companyName": "Integon Gen Ins Corp"
      },
      "userId": {
        "_id": "<USER_ID>",
        "firstName": "Lura Lucca",
        "email": "madler@yahoo.ca"
      }
    }
  ]
}
```

### Implementation

The API:

1. Accepts the username through a query parameter.
2. Searches the User collection using a case-insensitive match.
3. Finds policies associated with the matching users.
4. Uses Mongoose `populate()` to return related user, category and carrier information.

An index is created on the `User.firstName` field to improve search performance.

---

# 3. Aggregate Policies by User

### Endpoint

```http
GET /api/policies/aggregate
```

### Example

```bash
curl http://localhost:5000/api/policies/aggregate
```

### Example Response

```json
{
  "totalUsers": 1198,
  "users": [
    {
      "userId": "<USER_ID>",
      "username": "Ruth Cockrum",
      "email": "fmtbebuck@me.com",
      "totalPolicies": 1,
      "policies": [
        {
          "policyNumber": "B65UFKXTPB0B",
          "policyStartDate": "2018-12-14T00:00:00.000Z",
          "policyEndDate": "2019-06-14T00:00:00.000Z",
          "category": "Personal Auto",
          "carrier": "Nationwide Prop & Cas Ins Co_Copy"
        }
      ]
    }
  ]
}
```

### Implementation

The aggregation uses MongoDB aggregation stages including:

* `$lookup`
* `$unwind`
* `$group`
* `$project`

The flow is:

```text
Policy
   |
   +----> User
   |
   +----> LOB
   |
   +----> Carrier
   |
   v
Group policies by user
   |
   v
Return aggregated response
```

---

# Task 2 - CPU Monitoring

The application continuously monitors Node.js server CPU utilization.

### Implementation

The application uses Node.js:

```javascript
os.cpus()
```

CPU usage is calculated using CPU time differences between monitoring intervals.

The monitor runs every 5 seconds.

Example log:

```text
CPU Usage: 22.90%
CPU Usage: 10.89%
CPU Usage: 10.18%
CPU Usage: 6.63%
```

If CPU utilization reaches or exceeds 70%, the application exits:

```javascript
process.exit(1);
```

PM2 is used as the process manager and automatically restarts the application after the process exits.

### Flow

```text
Node.js Server
      |
      v
CPU Monitor
      |
      v
Check CPU Usage
      |
      +---- < 70% ----> Continue
      |
      +---- >= 70% ---> process.exit(1)
                              |
                              v
                             PM2
                              |
                              v
                       Restart Application
```

---

# PM2

PM2 can be used to run the application as a managed process.

Start the application:

```bash
npx pm2 start src/server.js --name policy-api
```

Check status:

```bash
npx pm2 status
```

View logs:

```bash
npx pm2 logs policy-api
```

Restart:

```bash
npx pm2 restart policy-api
```

Stop:

```bash
npx pm2 stop policy-api
```

Remove the process:

```bash
npx pm2 delete policy-api
```

Clear PM2 logs:

```bash
npx pm2 flush
```

---

# Scheduled Post Service

The application provides an API to schedule a post for a specific date and time.

## Create Scheduled Post

### Endpoint

```http
POST /api/posts
```

### Request Body

```json
{
  "message": "Test scheduled post",
  "day": "2026-09-20",
  "time": "11:30"
}
```

### Example Response

```json
{
  "message": "Post scheduled successfully",
  "post": {
    "_id": "<SCHEDULED_POST_ID>",
    "message": "Test scheduled post",
    "scheduledAt": "2026-09-20T11:30:00.000Z",
    "status": "PENDING"
  }
}
```

---

# Scheduler Implementation

The scheduler uses `node-cron` and checks for pending scheduled posts every minute.

The scheduler searches for records where:

```text
status = PENDING
```

and:

```text
scheduledAt <= current time
```

When a scheduled post is found, it is atomically changed from:

```text
PENDING
```

to:

```text
COMPLETED
```

The message is then inserted into the `Post` collection.

### Flow

```text
POST /api/posts
      |
      v
ScheduledPost Collection
      |
      | status = PENDING
      v
Node-Cron Scheduler
      |
      | scheduledAt <= current time
      v
Atomic Status Update
      |
      v
Create Post
      |
      v
Post Collection
```

---

# Preventing Duplicate Scheduled Posts

The scheduler uses an atomic MongoDB update:

```javascript
{
  _id: scheduledPost._id,
  status: "PENDING"
}
```

Only one scheduler execution can successfully change the status from `PENDING` to `COMPLETED`.

The `Post` model also maintains a unique sparse reference to the scheduled post:

```javascript
scheduledPostId
```

This provides an additional protection against duplicate post creation.

---

# Database Indexes

Indexes are added to frequently queried fields.

### User

```javascript
userSchema.index({
  firstName: 1
});
```

### Account

```javascript
accountSchema.index({
  name: 1
});
```

### Policy

```javascript
policySchema.index({
  userId: 1
});

policySchema.index({
  categoryId: 1
});

policySchema.index({
  carrierId: 1
});
```

Unique constraints are also used for entities such as:

* Agent name
* LOB category name
* Carrier company name
* Policy number

This helps prevent duplicate master records.

---

# Worker Thread Architecture

The upload API creates a Worker Thread:

```text
HTTP Request
     |
     v
Express Controller
     |
     v
Worker Thread
     |
     +---- Read CSV
     |
     +---- Parse CSV
     |
     +---- Process records
     |
     +---- MongoDB operations
     |
     v
Worker Result
     |
     v
HTTP Response
```

The worker receives:

```javascript
{
  filePath,
  mongoUri
}
```

and returns:

```javascript
{
  success: true,
  totalRows: 1198,
  importedPolicies: 1198
}
```

This keeps the heavy import processing outside the main application thread.

---

# Error Handling

The application validates:

* Missing upload files
* Missing username
* Missing post fields
* Invalid date/time
* Past scheduled times
* MongoDB connection failures
* Worker failures
* CSV processing errors

HTTP status codes are used appropriately:

```text
200 - Successful request
201 - Resource created
400 - Invalid request
404 - Resource not found
500 - Server/internal error
```

---

# API Summary

| Method | Endpoint                             | Description                 |
| ------ | ------------------------------------ | --------------------------- |
| GET    | `/health`                            | Health check                |
| POST   | `/api/upload`                        | Upload and import CSV       |
| GET    | `/api/policies/search?username=Lura` | Search policies by username |
| GET    | `/api/policies/aggregate`            | Aggregate policies by user  |
| POST   | `/api/posts`                         | Schedule a post             |

---

# Testing with Postman

## 1. Health Check

```text
GET http://localhost:5000/health
```

---

## 2. Upload CSV

```text
POST http://localhost:5000/api/upload
```

Body:

```text
form-data
```

Add:

```text
Key: file
Type: File
Value: data-sheet - Node js Assesment (2) (1).csv
```

---

## 3. Search Policy

```text
GET http://localhost:5000/api/policies/search?username=Lura
```

---

## 4. Aggregate Policies

```text
GET http://localhost:5000/api/policies/aggregate
```

---

## 5. Schedule Post

```text
POST http://localhost:5000/api/posts
```

Body:

```json
{
  "message": "Test scheduled post",
  "day": "2026-09-20",
  "time": "11:30"
}
```

---

# Sample Import Result

The provided assessment CSV contains 1,198 policy data rows.

A successful import returns:

```json
{
  "message": "File uploaded successfully",
  "totalRows": 1198,
  "importedPolicies": 1198
}
```

---

# Design Decisions

## Why Worker Threads?

CSV processing and large data imports can involve CPU-intensive work.

Using Worker Threads prevents the main Node.js event loop from being blocked by the import operation.

---

## Why Separate Collections?

The assessment requires separate collections for:

* Agent
* User
* User Account
* Policy Category / LOB
* Policy Carrier
* Policy

References using MongoDB ObjectIds keep the data normalized and avoid unnecessarily duplicating master data.

---

## Why Upsert?

The import uses upsert operations for master entities.

For example:

```javascript
{
  upsert: true
}
```

This allows the application to:

* Create a record when it doesn't exist
* Update/reuse an existing record when it already exists

This also makes repeated imports safer.

---

## Why MongoDB Aggregation?

The aggregation API needs data from multiple collections.

MongoDB `$lookup` is used to join:

```text
Policy -> User
Policy -> LOB
Policy -> Carrier
```

The resulting records are then grouped by user.

---

## Why PM2?

The CPU monitoring requirement asks the server to restart when CPU usage reaches 70%.

The application exits the process when the threshold is reached, and PM2 automatically restarts the process.

---

# Security and Configuration

Environment-specific configuration is stored in `.env`.

The `.env` file should not be committed to GitHub.

The repository contains:

```text
.env.example
```

for configuration reference.

Example:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/node_policy_assessment
```

---

# Git Setup

Initialize Git:

```bash
git init
```

Add files:

```bash
git add .
```

Create the first commit:

```bash
git commit -m "Complete Node.js policy assessment"
```

Set the main branch:

```bash
git branch -M main
```

Add the GitHub repository:

```bash
git remote add origin https://github.com/ritavishwakarma/node-policy-assessment
```

Push the project:

```bash
git push -u origin main
```

---

# Important Notes

* MongoDB must be running before starting the application.
* The `.env` file should remain local and should not be committed.
* The uploaded CSV is processed using a Worker Thread.
* The scheduler runs in the Node.js application process.
* PM2 is recommended when running the CPU monitoring functionality because it handles automatic process restarts.
* The provided dataset uses `firstname` as the available user-name field, which is exposed through the API as `username`.

---

# Assessment Requirements Covered

## Task 1

| Requirement                      | Status    |
| -------------------------------- | --------- |
| Upload CSV data                  | Completed |
| Worker Thread processing         | Completed |
| MongoDB storage                  | Completed |
| Agent collection                 | Completed |
| User collection                  | Completed |
| User Account collection          | Completed |
| Policy Category / LOB collection | Completed |
| Policy Carrier collection        | Completed |
| Policy collection                | Completed |
| Search policy by username        | Completed |
| Aggregate policy by user         | Completed |

## Task 2

| Requirement                   | Status    |
| ----------------------------- | --------- |
| CPU monitoring                | Completed |
| 70% CPU threshold             | Completed |
| Server restart                | Completed |
| PM2 process management        | Completed |
| Scheduled post API            | Completed |
| Store scheduled post in DB    | Completed |
| Background scheduler          | Completed |
| Insert post at scheduled time | Completed |
| Duplicate protection          | Completed |

---

# Author

**Rita Vishwakarma**

Node.js Backend Developer

Technologies used in this assessment:

```text
Node.js
Express.js
MongoDB
Mongoose
Worker Threads
REST APIs
Node-Cron
PM2
```
