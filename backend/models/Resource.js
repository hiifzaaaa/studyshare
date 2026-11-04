import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [180, 'Title cannot exceed 180 characters'],
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: ''
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['CSE', 'AIDS', 'IT', 'ECE', 'MECH', 'CIVIL', 'EE', 'GEN'],
      index: true
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
      index: true
    },
    subject: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Resource category is required'],
      enum: ['Notes', 'PYQ', 'Lab', 'Book', 'Link', 'Syllabus', 'Assignment', 'Formula Sheet'],
      index: true
    },
    academicYear: {
      type: String,
      default: '2025-2026',
      trim: true
    },
    examType: {
      type: String,
      enum: ['End-Semester', 'Mid-Term', 'Lab-Viva', 'Quiz', 'General'],
      default: 'General'
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    type: {
      type: String,
      enum: ['file', 'link'],
      default: 'file'
    },
    fileUrl: {
      type: String,
      default: ''
    },
    originalFilename: {
      type: String,
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    },
    fileType: {
      type: String,
      default: 'application/pdf'
    },
    linkUrl: {
      type: String,
      default: ''
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    uploaderName: {
      type: String,
      default: 'Student'
    },
    uploaderDepartment: {
      type: String,
      default: ''
    },
    downloadCount: {
      type: Number,
      default: 0,
      index: true
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Text index for full-text search across title, subject, tags, and description
resourceSchema.index({
  title: 'text',
  subject: 'text',
  description: 'text',
  tags: 'text'
});

export const Resource = mongoose.model('Resource', resourceSchema);
