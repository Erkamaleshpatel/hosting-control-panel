const mongoose = require('mongoose');

// Define the deployment schema to track client deployment details
const DeploymentSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  domain: {
    type: String,
    required: [true, 'Domain is required'],
    trim: true,
    lowercase: true
  },
  image: {
    type: String,
    required: [true, 'Docker image name is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Deploying', 'Completed', 'Failed'],
    default: 'Pending'
  },
  logs: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Deployment', DeploymentSchema);
