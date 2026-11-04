import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Request title is required'],
      trim: true,
      maxlength: [180, 'Title cannot exceed 180 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1500, 'Description cannot exceed 1500 characters'],
      default: ''
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['CSE', 'AIDS', 'IT', 'ECE', 'MECH', 'CIVIL', 'EE', 'GEN']
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requesterName: {
      type: String,
      default: 'Student'
    },
    status: {
      type: String,
      enum: ['Open', 'Fulfilled'],
      default: 'Open',
      index: true
    },
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    fulfilledResource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Request = mongoose.model('Request', requestSchema);
