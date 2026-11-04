import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function createSimplePDF(title, subject, department, details) {
  const content = `BT
/F1 20 Tf
50 740 Td
(${title}) Tj
0 -30 Td
/F1 12 Tf
(Subject: ${subject} | Department: ${department}) Tj
0 -25 Td
(StudyShare - Centralized Academic Resource Platform) Tj
0 -30 Td
(--------------------------------------------------------------------------------------------------) Tj
0 -30 Td
(Overview & Key Highlights:) Tj
0 -20 Td
(${details.replace(/[()]/g, '')}) Tj
0 -40 Td
(This document was shared by a peer student on StudyShare.) Tj
0 -20 Td
(Organized by Department, Semester, and Subject for easy exam preparation.) Tj
0 -30 Td
(Study Hard & Ace Your Exams!) Tj
ET`;

  const streamLength = Buffer.byteLength(content, 'utf8');

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
${content}
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

const seedFiles = [
  {
    name: 'dsa_handwritten_complete_notes.pdf',
    title: 'DSA Complete Handwritten Unit 1-5 Notes',
    subject: 'Data Structures and Algorithms',
    dept: 'Computer Science and Engineering',
    desc: 'Covers Binary Trees, Red-Black Trees, Dijkstra, Kruskal, Prim, and Dynamic Programming.'
  },
  {
    name: 'os_solved_pyq_2020_2025.pdf',
    title: 'Operating Systems 5-Year Solved PYQs',
    subject: 'Operating Systems',
    dept: 'Computer Science and Engineering',
    desc: 'Includes Bankrs Algorithm, LRU Page Replacement, Semaphores, and Disk Scheduling.'
  },
  {
    name: 'dbms_lab_manual_queries.pdf',
    title: 'DBMS Lab Manual with SQL Queries',
    subject: 'Database Management Systems',
    dept: 'Computer Science and Engineering',
    desc: 'Contains 12 SQL Experiments, PL-SQL Procedures, Triggers, and BCNF Normalization.'
  },
  {
    name: 'engg_maths_laplace_vector.pdf',
    title: 'Engineering Mathematics II Formula Booklet',
    subject: 'Engineering Mathematics',
    dept: 'Basic Sciences',
    desc: 'Covers Green Theorem, Stokes Theorem, Gauss Divergence, and Inverse Laplace Transforms.'
  },
  {
    name: 'dsp_midterm_pyq_solutions.pdf',
    title: 'Digital Signal Processing Solved Papers',
    subject: 'Digital Signal Processing',
    dept: 'Electronics and Communication',
    desc: 'Covers FFT Decimation-in-Time, Butterworth Filter Design, and Z-Transforms.'
  },
  {
    name: 'thermo_cycles_formula_sheet.pdf',
    title: 'Thermodynamics Cycle Diagrams and Formulas',
    subject: 'Thermodynamics',
    dept: 'Mechanical Engineering',
    desc: 'Rankine, Carnot, Diesel, Otto cycles with P-v and T-s diagrams and efficiency derivations.'
  }
];

for (const f of seedFiles) {
  const filePath = path.join(uploadsDir, f.name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, createSimplePDF(f.title, f.subject, f.dept, f.desc));
    console.log(`Generated: ${f.name}`);
  }
}
console.log('Seed files created successfully.');
