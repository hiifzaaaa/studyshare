import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { User } from './models/User.js';
import { Resource } from './models/Resource.js';
import { Review } from './models/Review.js';
import { Bookmark } from './models/Bookmark.js';
import { Request } from './models/Request.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Minimal valid PDF generator
function createPDFBuffer(title, subject, dept, details) {
  const streamContent = `BT
/F1 20 Tf
50 740 Td
(${title}) Tj
0 -30 Td
/F1 12 Tf
(Subject: ${subject} | Department: ${dept}) Tj
0 -25 Td
(StudyShare - Centralized Academic Resource Platform) Tj
0 -30 Td
(--------------------------------------------------------------------------------------------------) Tj
0 -30 Td
(Overview & Key Highlights:) Tj
0 -20 Td
(${details.replace(/[()]/g, '')}) Tj
0 -40 Td
(This verified document was uploaded by a peer student on StudyShare.) Tj
0 -20 Td
(Organized by Department, Semester, and Subject for easy exam preparation.) Tj
0 -30 Td
(Study Hard & Ace Your Exams!) Tj
ET`;

  const streamLength = Buffer.byteLength(streamContent, 'utf8');

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000295 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;

  return Buffer.from(pdf, 'utf-8');
}

export async function seedDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studyshare';
  console.log(`[Seed] Connecting to MongoDB: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Resource.deleteMany({}),
    Review.deleteMany({}),
    Bookmark.deleteMany({}),
    Request.deleteMany({})
  ]);

  console.log('[Seed] Creating 2 required testing accounts with hashed passwords...');

  // Account 1: Student Account
  const studentPasswordHash = await User.hashPassword('Student@123');
  const studentUser = await User.create({
    username: 'student01',
    email: 'student01@college.edu',
    passwordHash: studentPasswordHash,
    fullName: 'Aarav Sharma',
    department: 'CSE',
    semester: 3,
    role: 'student',
    bio: 'B.Tech CSE Sophomore. Preparing for Data Structures and Operating Systems.'
  });

  // Account 2: Admin Account
  const adminPasswordHash = await User.hashPassword('Admin@123');
  const adminUser = await User.create({
    username: 'admin01',
    email: 'admin01@college.edu',
    passwordHash: adminPasswordHash,
    fullName: 'Prof. Priya Nair',
    department: 'CSE',
    semester: 6,
    role: 'admin',
    bio: 'Department Resource Coordinator and Teaching Assistant.'
  });

  console.log(`[Seed] Created User 1: ${studentUser.username} (${studentUser.role})`);
  console.log(`[Seed] Created User 2: ${adminUser.username} (${adminUser.role})`);

  // Create physical seed files on disk
  const samplePdfs = [
    {
      filename: 'dsa_unit1_5_complete_notes.pdf',
      title: 'DSA Complete Unit 1-5 Handwritten Notes',
      subject: 'Data Structures & Algorithms',
      dept: 'CSE',
      details: 'Arrays, Linked Lists, Binary Search Trees, Graph algorithms, Dynamic Programming with big-O notation.'
    },
    {
      filename: 'os_5yr_solved_pyq.pdf',
      title: 'Operating Systems 5-Year Solved PYQs (2020-2025)',
      subject: 'Operating Systems',
      dept: 'CSE',
      details: 'Process Synchronization, Bankers Algorithm, LRU Page Replacement, Semaphores, and Disk Scheduling.'
    },
    {
      filename: 'dbms_lab_manual_queries.pdf',
      title: 'DBMS Lab Manual with SQL Queries & Viva Questions',
      subject: 'Database Management Systems',
      dept: 'CSE',
      details: 'Contains 12 SQL Experiments, PL/SQL Procedures, Triggers, and BCNF Normalization Cheatsheet.'
    },
    {
      filename: 'engg_maths_laplace_vector.pdf',
      title: 'Engineering Mathematics II Formula Booklet',
      subject: 'Engineering Mathematics I & II',
      dept: 'GEN',
      details: 'Greens Theorem, Stokes Theorem, Gauss Divergence, and Inverse Laplace Transforms with derivations.'
    },
    {
      filename: 'dsp_midterm_pyq_solutions.pdf',
      title: 'Digital Signal Processing Solved Question Papers',
      subject: 'Digital Signal Processing',
      dept: 'ECE',
      details: 'Covers FFT Decimation-in-Time, Butterworth Filter Design, Z-Transforms, and bilinear transformations.'
    },
    {
      filename: 'thermo_cycles_formula_sheet.pdf',
      title: 'Thermodynamics Cycle Diagrams and Formulas',
      subject: 'Thermodynamics',
      dept: 'MECH',
      details: 'Rankine, Carnot, Diesel, Otto cycles with P-v and T-s diagrams and thermal efficiency derivations.'
    }
  ];

  for (const s of samplePdfs) {
    const filePath = path.join(uploadsDir, s.filename);
    fs.writeFileSync(filePath, createPDFBuffer(s.title, s.subject, s.dept, s.details));
  }
  console.log('[Seed] Generated realistic PDF documents in uploads directory.');

  console.log('[Seed] Seeding academic resources...');
  const res1 = await Resource.create({
    title: 'DSA Complete Unit 1-5 Handwritten Notes (Trees, Graphs, DP)',
    description: 'Detailed handwritten revision notes covering Arrays, Linked Lists, Trees, Graph algorithms (Dijkstra, Prim, Kruskal), Dynamic Programming, and asymptotic notations with clean diagrams.',
    department: 'CSE',
    semester: 3,
    subject: 'Data Structures & Algorithms',
    category: 'Notes',
    academicYear: '2024-2025',
    examType: 'End-Semester',
    tags: ['Trees', 'Graphs', 'DP', 'Handwritten', 'Algorithms'],
    type: 'file',
    fileUrl: '/uploads/dsa_unit1_5_complete_notes.pdf',
    originalFilename: 'DSA_Complete_Notes_Unit1_5.pdf',
    fileSize: 4280000,
    fileType: 'application/pdf',
    uploader: studentUser._id,
    uploaderName: studentUser.fullName,
    uploaderDepartment: studentUser.department,
    downloadCount: 342,
    averageRating: 5.0,
    reviewCount: 2,
    upvotes: [studentUser._id, adminUser._id]
  });

  const res2 = await Resource.create({
    title: 'Operating Systems 5-Year Solved PYQs (2020-2025)',
    description: 'Previous year question papers with model answers covering Process Synchronization, Banker\'s Algorithm, Page Replacement (FIFO, LRU, Optimal), Semaphore implementation, and Disk Scheduling.',
    department: 'CSE',
    semester: 4,
    subject: 'Operating Systems',
    category: 'PYQ',
    academicYear: '2024-2025',
    examType: 'End-Semester',
    tags: ['PYQ', 'Solved', 'Deadlocks', 'Paging', 'Semaphores'],
    type: 'file',
    fileUrl: '/uploads/os_5yr_solved_pyq.pdf',
    originalFilename: 'OS_PYQ_Solved_2020_2025.pdf',
    fileSize: 6150000,
    fileType: 'application/pdf',
    uploader: adminUser._id,
    uploaderName: adminUser.fullName,
    uploaderDepartment: adminUser.department,
    downloadCount: 512,
    averageRating: 4.8,
    reviewCount: 2,
    upvotes: [studentUser._id]
  });

  const res3 = await Resource.create({
    title: 'DBMS Lab Manual with SQL Queries & Normalization Cheatsheet',
    description: 'Complete lab manual containing all 12 experimental queries, PL/SQL procedures, triggers, cursor examples, BCNF/3NF decomposition exercises, and ER diagrams.',
    department: 'CSE',
    semester: 4,
    subject: 'Database Management Systems',
    category: 'Lab',
    academicYear: '2024-2025',
    examType: 'Lab-Viva',
    tags: ['SQL', 'PL/SQL', 'Normalization', 'Triggers', 'Viva Questions'],
    type: 'file',
    fileUrl: '/uploads/dbms_lab_manual_queries.pdf',
    originalFilename: 'DBMS_Lab_Manual_Full.pdf',
    fileSize: 2890000,
    fileType: 'application/pdf',
    uploader: adminUser._id,
    uploaderName: adminUser.fullName,
    uploaderDepartment: adminUser.department,
    downloadCount: 278,
    averageRating: 5.0,
    reviewCount: 1,
    upvotes: [studentUser._id, adminUser._id]
  });

  const res4 = await Resource.create({
    title: 'Machine Learning Math & Algorithms Interactive Notes (Stanford CS229 Companion)',
    description: 'Supervised and Unsupervised learning summary: Linear Regression, Logistic Regression, SVMs, PCA, K-Means, Neural Networks, plus intuitive loss gradient formulas.',
    department: 'AIDS',
    semester: 5,
    subject: 'Machine Learning',
    category: 'Notes',
    academicYear: '2025-2026',
    examType: 'Mid-Term',
    tags: ['ML', 'Math', 'Supervised', 'Deep Learning', 'Stanford'],
    type: 'link',
    linkUrl: 'https://stanford.edu/~shervine/teaching/cs-229/cheatsheet-supervised-learning',
    originalFilename: 'Stanford ML Cheatsheet',
    fileSize: 0,
    fileType: 'external/link',
    uploader: studentUser._id,
    uploaderName: studentUser.fullName,
    uploaderDepartment: studentUser.department,
    downloadCount: 419,
    averageRating: 5.0,
    reviewCount: 1,
    upvotes: [adminUser._id]
  });

  const res5 = await Resource.create({
    title: 'Engineering Mathematics II - Vector Calculus & Laplace Transforms',
    description: 'Handwritten formula booklet and solved step-by-step examples on Gauss Divergence Theorem, Green\'s Theorem, Stokes\' Theorem, and Inverse Laplace Transforms.',
    department: 'GEN',
    semester: 2,
    subject: 'Engineering Mathematics I & II',
    category: 'Book',
    academicYear: '2024-2025',
    examType: 'End-Semester',
    tags: ['Laplace', 'Vector Calculus', 'Formulas', 'First Year'],
    type: 'file',
    fileUrl: '/uploads/engg_maths_laplace_vector.pdf',
    originalFilename: 'Maths_II_Formulas_Solved.pdf',
    fileSize: 3750000,
    fileType: 'application/pdf',
    uploader: studentUser._id,
    uploaderName: studentUser.fullName,
    uploaderDepartment: studentUser.department,
    downloadCount: 620,
    averageRating: 5.0,
    reviewCount: 1,
    upvotes: [studentUser._id, adminUser._id]
  });

  const res6 = await Resource.create({
    title: 'Digital Signal Processing Mid-Term Question Papers & Solutions',
    description: 'Detailed solved papers covering Discrete Fourier Transform (DFT), Fast Fourier Transform (FFT Decimation-in-Time & Frequency), IIR Filter design (Butterworth & Chebyshev).',
    department: 'ECE',
    semester: 5,
    subject: 'Digital Signal Processing',
    category: 'PYQ',
    academicYear: '2024-2025',
    examType: 'Mid-Term',
    tags: ['DSP', 'FFT', 'DFT', 'Butterworth', 'Solved'],
    type: 'file',
    fileUrl: '/uploads/dsp_midterm_pyq_solutions.pdf',
    originalFilename: 'DSP_Midterm_PYQ_Solved.pdf',
    fileSize: 4500000,
    fileType: 'application/pdf',
    uploader: adminUser._id,
    uploaderName: adminUser.fullName,
    uploaderDepartment: adminUser.department,
    downloadCount: 195,
    averageRating: 4.5,
    reviewCount: 1,
    upvotes: []
  });

  console.log('[Seed] Seeding verified student reviews...');
  await Review.create([
    {
      user: studentUser._id,
      resource: res2._id,
      rating: 5,
      comment: 'Almost 70% questions in our end-sem were directly from this booklet! Very well structured.'
    },
    {
      user: adminUser._id,
      resource: res1._id,
      rating: 5,
      comment: 'Clean diagrams and clear Big-O complexity tables. Highly recommended for 3rd semester exam prep.'
    }
  ]);

  console.log('[Seed] Seeding bookmarks...');
  await Bookmark.create([
    { user: studentUser._id, resource: res1._id },
    { user: studentUser._id, resource: res2._id },
    { user: adminUser._id, resource: res3._id }
  ]);

  console.log('[Seed] Seeding community material requests...');
  await Request.create([
    {
      title: 'Need 2024 End-Sem DAA Question Paper with Solved Solutions',
      description: 'Looking for the dynamic programming matrix chain multiplication problem from last year paper.',
      department: 'CSE',
      semester: 3,
      subject: 'Data Structures & Algorithms',
      urgency: 'High',
      requester: studentUser._id,
      requesterName: studentUser.fullName,
      status: 'Open'
    },
    {
      title: 'Signals & Systems Unit 3 Convolution Integral handwritten solved examples',
      description: 'Need step-by-step graphical convolution solved problems for continuous time signals.',
      department: 'ECE',
      semester: 4,
      subject: 'Signals & Systems',
      urgency: 'Medium',
      requester: studentUser._id,
      requesterName: studentUser.fullName,
      status: 'Open'
    },
    {
      title: 'Cloud Computing AWS Architecture Lab Manual',
      description: 'Looking for lab exercises covering EC2 setup, S3 bucket policy configuration, and Lambda trigger demos.',
      department: 'IT',
      semester: 6,
      subject: 'Cloud Computing',
      urgency: 'Low',
      requester: studentUser._id,
      requesterName: studentUser.fullName,
      status: 'Fulfilled',
      fulfilledBy: adminUser._id,
      fulfilledResource: res1._id
    }
  ]);

  console.log('----------------------------------------------------');
  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('----------------------------------------------------');
  console.log('Testing Account 1 (Student):');
  console.log('  Username: student01');
  console.log('  Password: Student@123');
  console.log('  Role: student');
  console.log('Testing Account 2 (Admin / Senior):');
  console.log('  Username: admin01');
  console.log('  Password: Admin@123');
  console.log('  Role: admin');
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
}

// Execute if run directly via `node seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
