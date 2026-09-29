# AcademeSync: Intelligent Final Year Project Management Portal with Vector Space Redundancy Verification

## 1. Project Overview & Abstract
**AcademeSync** is a complete, full-stack Final Year Project Management System built with the MERN stack (MongoDB, Express.js, React, Node.js)[cite: 6, 7]. 

Manual academic project administration often causes communication bottlenecks between students and supervisors, tracks project milestones ineffectively, and permits duplicate or redundant project topics across graduating cohorts[cite: 6]. AcademeSync provides a unified, web-based platform addressing these shortcomings[cite: 6]. The system features a built-in Vector Space Model (VSM) that performs real-time lexical tokenization and Cosine Similarity computations on candidate proposals against existing institutional archives[cite: 6]. When a submission surpasses a similarity index threshold ($\ge 60\%$), the platform flags it for departmental review to prevent duplicate work[cite: 6]. The application provides end-to-end milestone tracking, role-specific interfaces for students and faculty mentors, and an audit trail supporting final viva voce defense[cite: 6].

* **Track:** Full-Stack Software Engineering & Applied Information Retrieval[cite: 6]
* **Repository:** [kaslama/academe-sync-fyp](https://github.com/kaslama/academe-sync-fyp)[cite: 5]

---

## 2. Core Features
1. **Role-Based Access Control (RBAC):** Distinct interface views and permissions supporting Student, Supervisor, and Admin roles[cite: 6, 7].
2. **Proposal Submission Workflow:** Real-time Cosine Similarity screening against existing project corpuses to check for topic overlap[cite: 6, 7].
3. **Supervisor Review Dashboard:** Faculty consoles equipped with acceptance and rejection controls, feedback threads, and directive tracking[cite: 6, 7].
4. **Milestone Tracking & Audit Trail:** Structured milestone management and data persistence supporting institutional evaluation[cite: 6].

---

## 3. Architecture & Technology Stack
* **Frontend:** React.js (Vite), Tailwind CSS, Lucide Icons[cite: 6, 7]
* **Backend API:** Node.js, Express.js (REST API architecture)[cite: 6, 7]
* **Database:** MongoDB with Mongoose ODM (embedded subdocuments)[cite: 6, 7]
* **Security & Authentication:** Stateless JSON Web Tokens (JWT), Role-Based Access Control (RBAC), and Bcrypt hashing[cite: 6, 7]

---

## 4. Mathematical Foundation: Vector Space Model & Cosine Similarity
AcademeSync eliminates topic duplication through an embedded, zero-dependency Information Retrieval engine executing Term Frequency (TF) vectorization and Cosine Distance analysis[cite: 6].

### Algorithmic Pipeline
* **Token Extraction:** The title and abstract are normalized to lower-case, non-alphanumeric symbols are stripped, and text is tokenized into word vectors[cite: 6].
* **Stop-Word Elimination:** Domain-generic terms ($W = \{\text{"system"}, \text{"using"}, \text{"based"}, \text{"app"}, \text{"portal"}, \dots\}$) are removed to preserve meaningful semantic terms[cite: 6].
* **Term Frequency Computation ($TF$):** 
  $$TF(t, D) = \frac{f_{t,D}}{\sum_{t' \in D} f_{t',D}}$$ 
  *(Where $f_{t,D}$ represents the raw count of token $t$ in document $D$)*[cite: 6].
* **Vector Dot-Product and Normalization:** 
  Given candidate proposal vector $\mathbf{A}$ and archived database vector $\mathbf{B}$: 
  $$\text{Cosine Similarity}(\mathbf{A}, \mathbf{B}) = \frac{\mathbf{A} \cdot \mathbf{B}}{\Vert{}\mathbf{A}\Vert{}_2 \Vert{}\mathbf{B}\Vert{}_2} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$
[cite: 6]
* **Threshold Evaluation:** 
  $$\text{Status} = \begin{cases} \text{"Flagged Conflict"}, & \text{if Score} \ge 0.60 \\ \text{"Under Review"}, & \text{if Score} < 0.60 \end{cases}$$
[cite: 6]

---

## 5. Database Schema & Data Dictionary
### Collection: `projects`
* `_id`: ObjectId (Primary Key, Auto-generated)[cite: 6]
* `title`: String (Required, Trimmed, Indexed)[cite: 6]
* `abstract`: String (Required, minimum 20 characters)[cite: 6]
* `domain`: String (Enum: `'Distributed Systems'`, `'Computer Vision'`, `'NLP'`, `'Cybersecurity'`, `'Cloud'`)[cite: 6]
* `studentName`: String (Required)[cite: 6]
* `studentEmail`: String (Required, Institutional format)[cite: 6]
* `status`: String (Enum: `'Proposed'`, `'Under Review'`, `'Approved'`, `'Flagged Conflict'`)[cite: 6]
* `similarityIndex`: Number (Range: $0$ to $100$, default: $0$)[cite: 6]
* `supervisor`: String (Default: `'Unassigned'`)[cite: 6]
* `milestones`: Array of Subdocuments[cite: 6]
  * `title`: String[cite: 6]
  * `status`: String (`'Pending'`, `'In Progress'`, `'Approved'`)[cite: 6]
* `createdAt` / `updatedAt`: Date (ISODate timestamps)[cite: 6]

---

## 6. Step-by-Step Setup & Run Instructions

### Prerequisites
* **Node.js** (v18 or higher recommended)[cite: 6]
* **Git**[cite: 5]
* **MongoDB Community Server** (running locally on `mongodb://127.0.0.1:27017`) or a valid MongoDB connection string[cite: 6]

### Step 1: Clone the Repository
```bash
git clone [https://github.com/kaslama/academe-sync-fyp.git](https://github.com/kaslama/academe-sync-fyp.git)
cd academe-sync-fyp
```[cite: 5, 6]

### Step 2: Run the Backend Server
```bash
cd server
npm install
node server.js
```[cite: 6]
*(Runs on port `5000` and connects to MongoDB with fallback in-memory data support)[cite: 6]*

### Step 3: Run the Frontend Client
Open a **new terminal window** from the root folder:
```bash
cd client
npm install
npm run dev
```[cite: 6]
*(Open the provided local Vite preview URL, typically `http://localhost:5173`, in your web browser)[cite: 4, 6]*

---

## 7. Defense Viva Voce Q&A Cheat-Sheet

* **Q: Why was an analytical Cosine Similarity algorithm chosen over standard SQL/string matching?**  
  *A:* Exact string matching (`LIKE %term%`) fails if words change order or include variations. The Vector Space Model translates document content into multidimensional term frequency vectors, calculating the directional cosine angle between them. This approach flags topic duplication regardless of sentence structure or minor word reordering[cite: 6].

* **Q: Why is the computation handled natively in Node.js rather than using third-party AI APIs?**  
  *A:* Executing the TF vector calculations and Euclidean norms natively in JavaScript delivers sub-15ms response times, functions completely offline without internet dependencies during academic defenses, and avoids per-token API costs[cite: 6].

* **Q: How does the system handle high-concurrency database failures?**  
  *A:* The server includes a persistent dual-mode architecture. If a local MongoDB instance becomes unavailable or disconnects during a presentation, the application seamlessly engages an in-memory document pipeline, keeping the submission and review demo operational without downtime[cite: 6].