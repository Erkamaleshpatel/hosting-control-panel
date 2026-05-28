const mongoose = require('mongoose');

// Schema declaration matching the backend database configuration
const DeploymentSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
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
