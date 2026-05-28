const express = require('express');
const router = express.Router();
const Deployment = require('../models/Deployment');
const { deploymentQueue } = require('../config/queue');

/**
 * @route   POST /api/deploy
 * @desc    Submit a new docker deployment
 * @access  Public
 */
router.post('/deploy', async (req, res) => {
  try {
    const { clientName, domain, image } = req.body;

    // Validation
    if (!clientName || !domain || !image) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide client name, domain, and docker image.' 
      });
    }

    // Save initial deployment state to MongoDB
    const deployment = new Deployment({
      clientName,
      domain,
      image,
      status: 'Pending',
      logs: ['[System] Deployment request received.', '[System] Saved configuration to database.']
    });

    await deployment.save();

    // Push deployment job into BullMQ queue
    await deploymentQueue.add('deploy-job', {
      deploymentId: deployment._id.toString()
    });

    res.status(201).json({
      success: true,
      deploymentId: deployment._id,
      message: 'Deployment job queued successfully.'
    });

  } catch (error) {
    console.error('Error in /api/deploy:', error);
    res.status(500).json({ success: false, message: 'Server error. Failed to initiate deployment.' });
  }
});

/**
 * @route   GET /api/status/:id
 * @desc    Get live status & logs of a deployment
 * @access  Public
 */
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deployment = await Deployment.findById(id);

    if (!deployment) {
      return res.status(404).json({ success: false, message: 'Deployment not found.' });
    }

    res.json({
      success: true,
      status: deployment.status,
      logs: deployment.logs,
      deployment
    });

  } catch (error) {
    console.error('Error in /api/status:', error);
    res.status(500).json({ success: false, message: 'Server error. Failed to retrieve status.' });
  }
});

/**
 * @route   GET /api/deployments
 * @desc    Retrieve list of all deployments (history)
 * @access  Public
 */
router.get('/deployments', async (req, res) => {
  try {
    const deployments = await Deployment.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      deployments
    });
  } catch (error) {
    console.error('Error in /api/deployments:', error);
    res.status(500).json({ success: false, message: 'Server error. Failed to fetch deployments.' });
  }
});

/**
 * @route   POST /api/deploy/retry/:id
 * @desc    Retry a failed deployment
 * @access  Public
 */
router.post('/deploy/retry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deployment = await Deployment.findById(id);

    if (!deployment) {
      return res.status(404).json({ success: false, message: 'Deployment not found.' });
    }

    if (deployment.status !== 'Failed' && deployment.status !== 'Completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Deployment is already running or pending.' 
      });
    }

    // Reset deployment fields
    deployment.status = 'Pending';
    deployment.logs = [
      `[System] Deployment retry requested on ${new Date().toISOString()}`,
      `[System] Resetting deployment status to Pending.`
    ];
    await deployment.save();

    // Re-queue the deployment job
    await deploymentQueue.add('deploy-job', {
      deploymentId: deployment._id.toString()
    });

    res.json({
      success: true,
      deploymentId: deployment._id,
      message: 'Deployment retry job queued.'
    });

  } catch (error) {
    console.error('Error in /api/deploy/retry:', error);
    res.status(500).json({ success: false, message: 'Server error. Failed to retry deployment.' });
  }
});

module.exports = router;
