export default () => ({
  JWT_SECRET: process.env.JWT_SECRET,
  STRIPE: {
    APP_URL: process.env.FRONTEND_URL,
    SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    WEBHOOK_SECRET_KEY: process.env.STRIPE_WEBHOOK_SECRET_KEY,
  },
  FRONTEND_APP_URL: process.env.FRONTEND_APP_URL,
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucketName: process.env.AWS_S3_BUCKET_NAME,
  },
});
