export default () => ({
  JWT_SECRET: process.env.JWT_SECRET,
  STRIPE: {
    APP_URL: process.env.FRONTEND_URL,
    SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    WEBHOOK_SECRET_KEY: process.env.STRIPE_WEBHOOK_SECRET_KEY,
  },
  FRONTEND_APP_URL: process.env.FRONTEND_APP_URL,
});
