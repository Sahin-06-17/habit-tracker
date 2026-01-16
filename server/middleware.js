const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// You don't need to write custom logic. Clerk does it.
// Just export their function.
module.exports = ClerkExpressRequireAuth({
  // It will look for CLERK_SECRET_KEY in your .env
});