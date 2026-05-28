const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

// Delay helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Invokes an AWS Lambda function to register routing, fallback to simulation if AWS credentials are not configured.
 * @param {Object} deployment - The Mongoose deployment document
 * @param {Object} containerInfo - Output metadata from Docker run (containerId, simulated)
 * @param {Function} onLog - Logger callback to write to database
 */
async function notifyAWSLambda(deployment, containerInfo, onLog) {
  onLog(`[AWS] Preparing deployment event trigger...`);
  
  const functionName = process.env.LAMBDA_FUNCTION_NAME || 'docker-deployment-notification';
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Construct the payload to send to AWS Lambda
  const payload = {
    clientName: deployment.clientName,
    domain: deployment.domain,
    image: deployment.image,
    containerId: containerInfo.containerId,
    status: 'Ready',
    timestamp: new Date().toISOString()
  };

  // Check if real credentials have been provided in the environment
  const hasCredentials = 
    process.env.AWS_ACCESS_KEY_ID && 
    process.env.AWS_SECRET_ACCESS_KEY && 
    process.env.AWS_ACCESS_KEY_ID !== 'your_access_key_id' && 
    process.env.AWS_SECRET_ACCESS_KEY !== 'your_secret_access_key';

  if (hasCredentials) {
    onLog(`[AWS] Credentials verified. Invoking Lambda: "${functionName}" in region: "${region}"...`);
    try {
      const client = new LambdaClient({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });

      // Construct invoke command with JSON payload
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(payload))
      });

      const response = await client.send(command);
      
      // Decode the payload response from Lambda
      const responsePayloadString = new TextDecoder('utf-8').decode(response.Payload);
      onLog(`[AWS] Lambda successfully responded with status: ${response.StatusCode}`);
      onLog(`[AWS] Lambda Response payload: ${responsePayloadString}`);

      return {
        success: true,
        simulated: false,
        response: JSON.parse(responsePayloadString)
      };

    } catch (error) {
      onLog(`[AWS] Lambda Invocation failed: ${error.message}`);
      onLog(`[AWS] Defaulting to simulated AWS cloud handler...`);
    }
  } else {
    onLog(`[AWS] Real AWS credentials not set or set to dummy values in .env file.`);
    onLog(`[AWS] Simulating AWS integration...`);
  }

  // Simulation mode
  await sleep(1000);
  onLog(`[AWS-Sim] POST payload payload dispatching...`);
  onLog(`[AWS-Sim] Payload Content:\n${JSON.stringify(payload, null, 2)}`);
  
  await sleep(1200);
  onLog(`[AWS-Sim] Invoking function arn:aws:lambda:${region}:098765432109:function:${functionName}`);
  
  await sleep(1000);
  // Construct a realistic DNS / Gateway creation receipt response
  const mockReceipt = {
    statusCode: 200,
    body: {
      message: `Lambda handler processed deployment successfully.`,
      targetHost: `alb.hosting-cluster.internal`,
      cnameRecord: `${deployment.domain} -> alb.hosting-cluster.internal`,
      sslCertificateArn: `arn:aws:acm:${region}:098765432109:certificate/cert-abc-123`,
      deploymentReceiptId: `rcpt-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    }
  };

  onLog(`[AWS-Sim] Lambda executed successfully.`);
  onLog(`[AWS-Sim] Response Payload:\n${JSON.stringify(mockReceipt, null, 2)}`);

  return {
    success: true,
    simulated: true,
    response: mockReceipt
  };
}

module.exports = {
  notifyAWSLambda
};
