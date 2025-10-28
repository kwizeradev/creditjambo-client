export function logServerStart(port: string | number): void {
  console.log('=================================');
  console.log('Credit Jambo Savings API Server');
  console.log('=================================');
  console.log(`Port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health: http://localhost:${port}/api/health`);
  console.log(`Security: Enabled`);
  console.log('=================================');
}
