# StudyShare — Academic Resource Sharing Platform

**StudyShare** is a production-grade, full-stack academic repository web application built using **React 18, Vite, Node.js, Express, and MongoDB (Mongoose)**. Designed specifically for university students, it solves academic material fragmentation by providing a structured taxonomy (Department → Semester → Subject → Category) for uploading, discovering, previewing, rating, downloading, and bookmarking academic resources.

---

## 1. Problem Statement & Objectives

### Problem Statement
In university environments, academic resources (lecture notes, previous year question papers, lab manuals, and syllabus files) are scattered across temporary WhatsApp groups, Telegram channels, and expired Google Drive links. Students face significant challenges:
- **No Unified Taxonomy**: Materials are disorganized and not indexed by Branch, Semester, or Subject.
- **Lost Knowledge**: High-scoring notes and past exam papers are permanently lost when senior batches graduate.
- **Unverified Quality**: Students often download large files right before exams only to find they are incomplete or inaccurate.
- **No Ownership Control**: Scattered storage leaves students with no way to manage or delete their own shared files.

### Objectives
1. **Centralized Platform**: Provide a single, authenticated web hub accessible across all university branches.
2. **Strict 4-Tier Taxonomy**: Classify resources by Department (8 branches) → Semester (1 to 8) → Subject → Category.
3. **Database-Backed Quality Control**: Provide 5-star ratings, verified student reviews (with duplicate prevention), and peer upvotes.
4. **Strict Ownership Security**: Enforce that **only the student who uploaded a resource can edit or delete it**.
5. **Community Collaboration**: Enable students to request missing study materials and allow peers to fulfill them.
6. **Persistent Revision Library**: Save bookmarks directly to MongoDB for access across devices.

---

## 2. Technology Stack & Justification

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | React 18, Vite | High performance Virtual DOM, component modularity, sub-second HMR development. |
| **Styling** | Tailwind CSS | Academic SaaS aesthetic, responsive design, zero runtime CSS overhead. |
| **Icons** | Lucide React | Clean, modern feather-style iconography. |
| **Backend** | Node.js, Express.js | Asynchronous non-blocking I/O, RESTful API architecture, scalable middleware pipeline. |
| **Database** | MongoDB (v8.x), Mongoose | Document-oriented NoSQL model perfectly matches hierarchical academic resources; schema validation and aggregation pipelines. |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` | Stateless authentication with secure salt rounds (10), token expiry, and role-based access. |
| **File Handling** | Multer | Server-side MIME validation, safe filename sanitization, 50MB size limit. |

---

## 3. System Architecture & Entity Relationships

### Architecture Diagram
```
+-------------------------------------------------------------------------+
|                  Client Layer: React 18 SPA (Port 5173)                 |
|  - Academic Repository   - Document Previewer   - Community Requests    |
|  - Auth & Profile        - Revision Library     - Upload Management     |
+-------------------------------------------------------------------------+
                                    |
                    REST APIs / Bearer JWT (HTTP / JSON)
                                    v
+-------------------------------------------------------------------------+
|                Server Layer: Node.js + Express (Port 5000)              |
|  - Auth Middleware (JWT) - Upload Middleware (Multer)                   |
|  - Resource Controller   - Review & Rating Engine                       |
|  - Bookmark Controller   - Aggregated Analytics Engine                  |
+-------------------------------------------------------------------------+
                    |                               |
        Mongoose ODM Operations           Static File Storage
                    v                               v
+---------------------------------------+  +-------------------------------+
|     MongoDB Database (Port 27017)     |  |       Local File Storage      |
|  Collections:                         |  |  /uploads/ (PDFs, Docs, PPTs) |
|  - users        - resources           |  +-------------------------------+
|  - reviews      - bookmarks           |
|  - requests                           |
+---------------------------------------+
```

### MongoDB Entity Relationship Diagram (ERD)
```
      +------------------+
      |      users       |
      +------------------+
      | _id (PK)         |<------------------------+
      | username         |                         |
      | email            |                         |
      | passwordHash     |                         |
      | fullName         |                         |
      | department       |                         |
      | semester         |                         |
      | role             |                         |
      +------------------+                         |
        | 1            | 1                         | 1
        |              |                           |
        | N            | N                         | N
      +------------------+      +------------------+      +------------------+
      |    resources     |      |     reviews      |      |    bookmarks     |
      +------------------+      +------------------+      +------------------+
      | _id (PK)         |<-----| _id (PK)         |      | _id (PK)         |
      | title            | 1  N | resource (FK)    |      | user (FK)        |
      | department       |      | user (FK)        |      | resource (FK)    |
      | semester         |      | rating (1-5)     |      +------------------+
      | subject          |      | comment          |        (Unique: user +
      | category         |      +------------------+         resource)
      | uploader (FK)    |        (Unique: user +
      | fileUrl          |         resource)
      | downloadCount    |
      | averageRating    |
      +------------------+
```

---

## 4. Testing Accounts (Stored in MongoDB)

The project includes two pre-seeded, manually usable accounts created with hashed passwords:

| Account Type | Username | Email | Password | Role | Features / Notes |
|---|---|---|---|---|---|
| **Student** | `student01` | `student01@college.edu` | `Student@123` | `student` | Uploader of DSA Notes, Math booklet, ML cheat-sheet. Has full delete rights over these files. |
| **Admin / Senior** | `admin01` | `admin01@college.edu` | `Admin@123` | `admin` | Uploader of OS Solved PYQs, DBMS Lab Manual, DSP papers. Admin deletion & moderation rights. |

> **Note:** To re-seed the database at any time, run: `cd backend && node seed.js`.

---

## 5. Quick Start Instructions

### Prerequisites
1. **Node.js** (v18 or higher) and **npm** installed.
2. **MongoDB** service running locally on `mongodb://127.0.0.1:27017` (or provide a MongoDB Atlas URI in `.env`).

### Step-by-Step Execution

1. **Clone / Open the repository**:
   ```bash
   cd d:\studyshare
   ```

2. **Seed the MongoDB Database** (Populates test accounts and initial resources):
   ```bash
   cd backend
   node seed.js
   cd ..
   ```

3. **Start the Application** (Runs both Express on port 5000 and Vite on port 5173):
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   - **Frontend App**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 6. REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new student account (hashes password with bcrypt) |
| `POST` | `/api/auth/login` | No | Authenticate user using username/email + password; returns JWT |
| `GET` | `/api/auth/me` | Bearer JWT | Fetch authenticated user's profile |
| `PUT` | `/api/auth/profile` | Bearer JWT | Update student name, department, semester, and bio |

### Resources (`/api/resources`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/resources` | Optional | Browse resources with filters (`department`, `semester`, `subject`, `category`, `search`, `sort`, `uploader`) |
| `GET` | `/api/resources/:id` | Optional | Get resource details and review list |
| `POST` | `/api/resources` | Bearer JWT | Upload document (PDF, Word, PPT) or submit external link |
| `PUT` | `/api/resources/:id` | Bearer JWT | Update resource metadata (Owner only) |
| `DELETE` | `/api/resources/:id` | Bearer JWT | **Delete resource permanently (Enforced: Owner only; returns 403 otherwise)** |
| `POST` | `/api/resources/:id/download` | No | Increment download counter in MongoDB |
| `POST` | `/api/resources/:id/upvote` | Bearer JWT | Toggle community upvote |

### Reviews & Ratings (`/api/reviews`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reviews/resource/:resourceId` | No | List verified reviews for a resource |
| `POST` | `/api/reviews/resource/:resourceId` | Bearer JWT | Post 1-5 star review; recalculates average rating (Prevents duplicates) |
| `DELETE` | `/api/reviews/:id` | Bearer JWT | Delete review (Review author only) |

### Bookmarks (`/api/bookmarks`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/bookmarks` | Bearer JWT | Fetch student's saved revision library from MongoDB |
| `POST` | `/api/bookmarks/:resourceId` | Bearer JWT | Bookmark resource |
| `DELETE` | `/api/bookmarks/:resourceId` | Bearer JWT | Remove resource from bookmarks |

### Community Requests (`/api/requests`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/requests` | No | List student material requests |
| `POST` | `/api/requests` | Bearer JWT | Post request for missing notes or question papers |
| `DELETE` | `/api/requests/:id` | Bearer JWT | Delete request (Requester only) |
| `POST` | `/api/requests/:id/fulfill` | Bearer JWT | Mark request as fulfilled |

### Metadata & Analytics (`/api`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/departments` | No | Department taxonomy with live MongoDB resource counts |
| `GET` | `/api/stats` | No | Aggregated platform metrics (Total Resources, Downloads, Top Subjects) |

---

## 7. Security & Validation Highlights

1. **Password Hashing**: Implemented using `bcryptjs` with salt round factor 10. Passwords are never stored or returned in plain-text.
2. **Stateless JWT Authorization**: Express route protection via `requireAuth` middleware verifying signature and checking user existence in MongoDB.
3. **Strict Deletion Authorization**: Backend verifies `resource.uploader.toString() === req.user._id.toString()`. Unauthorized deletion attempts fail with `403 Forbidden`.
4. **Duplicate Review Prevention**: Mongoose compound unique index on `{ user: 1, resource: 1 }` prevents fraudulent rating manipulation.
5. **File Upload Security**: Multer file filter allows only `.pdf`, `.docx`, `.pptx`, `.txt`, `.zip`, `.png`, and `.jpg` while restricting executable files. Maximum upload size enforced at 50MB.

---

## 8. Viva & Evaluation Preparation

### Recommended Live Demonstration Flow (3–5 Minutes)
1. **Homepage Overview**: Show the clean, academic SaaS dashboard, live metrics (Resources, Downloads, Departments), and responsive search.
2. **Taxonomy & Filtering**: Select **CSE → Semester 3 → Lecture Notes**. Demonstrate dynamic subject filtering (DSA, DBMS, OS).
3. **Document Preview & Reviews**: Click **Preview** on *DSA Complete Handwritten Notes*. Show the embedded PDF reader, star rating breakdown, and existing reviews.
4. **Manual Authentication**: Click **Sign In**, log in manually with `student01` and `Student@123`. Show the updated navbar showing student name and department.
5. **Add a Review**: Submit a 5-star rating with a comment. Show the rating updating live. Try submitting again to demonstrate the duplicate prevention error.
6. **Bookmark to MongoDB**: Click the bookmark icon. Open the **Saved Revision Library** drawer to confirm persistence.
7. **Demonstrate Strict Delete Rights**:
   - On the DSA notes (uploaded by `student01`), point out the active red **Delete** button.
   - Look at the OS PYQ notes (uploaded by `admin01`) — observe that the delete button is **completely hidden**.
8. **Community Request Board**: Open **Requests**, show open vs. fulfilled requests, and demonstrate creating a new request.
9. **MongoDB Verification**: Open MongoDB Compass or run `mongosh` to show real records in `studyshare.users`, `studyshare.resources`, and `studyshare.reviews`.

### Top Viva Questions & Model Answers

**Q1: Why did you use MongoDB instead of a relational database like MySQL?**  
*Answer:* Academic study materials have diverse attributes (some are multi-page PDFs with file sizes and page counts; others are external links with URLs; tags are dynamic arrays). MongoDB's flexible schema handles this semi-structured data natively. Furthermore, MongoDB aggregation pipelines allow efficient calculation of average ratings, download counts, and department distributions in a single query.

**Q2: How is the delete authorization enforced?**  
*Answer:* Authorization is enforced on two levels. On the frontend, delete buttons are only rendered if `currentUser.id === resource.uploader`. More importantly, on the backend, the `DELETE /api/resources/:id` controller extracts the authenticated user from the verified JWT (`req.user._id`) and compares it against `resource.uploader`. If they do not match, the request is rejected with HTTP status code 403 Forbidden.

**Q3: How are passwords stored and authenticated?**  
*Answer:* When a student registers, `bcryptjs.genSalt(10)` creates a cryptographic salt and hashes the password before writing to MongoDB. During login, `bcrypt.compare(candidatePassword, user.passwordHash)` verifies the password without ever decrypting it. Upon verification, a signed JSON Web Token (JWT) containing the user ID and role is issued.

**Q4: How do you prevent duplicate ratings from the same student?**  
*Answer:* In the `Review` Mongoose schema, we created a compound unique index on `{ user: 1, resource: 1 }`. If a student attempts to review the same resource twice, MongoDB rejects the second insert with error code 11000, and the API returns a 400 Bad Request error.

---

## 9. Cloud Deployment on Render (Production Guide)

StudyShare is configured for deployment on [Render](https://render.com) using a two-service architecture:
1. **Express Backend**: Render Web Service (`studyshare-backend`)
2. **React Frontend**: Render Static Site (`studyshare-frontend`)

### Option A: 1-Click Deployment via Render Blueprint (`render.yaml`)

1. Fork or push this repository to GitHub: `https://github.com/hiifzaaaa/studyshare.git`
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository `studyshare`.
5. Render reads `render.yaml` automatically and configures both the backend and frontend services.
6. Provide the environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: Random secure string (Render can generate this automatically).
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: (Optional/Recommended for persistent cloud storage).
7. Click **Apply**. Both services will build and deploy!

### Option B: Manual Service Creation on Render

#### Step 1: Deploy Backend Web Service
- **Service Type**: Web Service
- **Repository**: `https://github.com/hiifzaaaa/studyshare`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV` = `production`
  - `PORT` = `10000`
  - `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster0.mongodb.net/studyshare?retryWrites=true&w=majority`
  - `JWT_SECRET` = `your_jwt_secret_key`
  - `FRONTEND_URL` = `https://<your-frontend-subdomain>.onrender.com`
  - *(Optional)* `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

#### Step 2: Deploy Frontend Static Site
- **Service Type**: Static Site
- **Repository**: `https://github.com/hiifzaaaa/studyshare`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Rewrite Rule** (Required for React Router):
  - **Source**: `/*`
  - **Destination**: `/index.html`
  - **Action**: `Rewrite`
- **Environment Variables**:
  - `VITE_API_URL` = `https://<your-backend-subdomain>.onrender.com`

---

## 10. External Cloud Services Setup

### MongoDB Atlas Setup
1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Deploy a free **M0 Shared Cluster**.
3. Under **Security → Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere, required for Render dynamic IP ranges).
4. Under **Security → Database Access**, create a user with read/write privileges.
5. Under **Database → Connect → Drivers (Node.js)**, copy your connection string and replace `<password>` with your database user password.

### Cloudinary Persistent Storage Setup (Free)
1. Sign up for a free account at [cloudinary.com](https://cloudinary.com).
2. From the Cloudinary Dashboard, copy your:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Add these to your backend environment variables on Render. Uploaded PDFs, notes, and study files will persist permanently in cloud storage.

