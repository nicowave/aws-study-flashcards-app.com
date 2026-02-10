const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// Initialize Firebase Admin SDK
initializeApp();

/**
 * exchangeToken - Validates a Firebase ID token and returns a Custom Token.
 * Used for cross-subdomain SSO: when a user is logged in on one subdomain,
 * other subdomains can use the shared cookie (ID token) to establish
 * their own Firebase session via signInWithCustomToken().
 */
exports.exchangeToken = onCall(
  {
    cors: [
      "https://aws-study-flashcards-app.com",
      "https://cloud.aws-study-flashcards-app.com",
      "https://ai.aws-study-flashcards-app.com",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    // No authentication required - we validate the ID token manually
    enforceAppCheck: false,
  },
  async (request) => {
    const { idToken } = request.data;

    if (!idToken || typeof idToken !== "string") {
      throw new HttpsError("invalid-argument", "ID token is required");
    }

    try {
      // Verify the ID token with Firebase Admin SDK
      const decodedToken = await getAuth().verifyIdToken(idToken);

      // Ensure email is verified (matches existing app requirement)
      if (!decodedToken.email_verified && !decodedToken.provider_id === "anonymous") {
        throw new HttpsError(
          "permission-denied",
          "Email must be verified before cross-domain login"
        );
      }

      // Create a custom token for this user
      const customToken = await getAuth().createCustomToken(decodedToken.uid);

      return { customToken };
    } catch (error) {
      // Handle specific Firebase auth errors
      if (error.code === "auth/id-token-expired") {
        throw new HttpsError("unauthenticated", "Token expired");
      }
      if (error.code === "auth/id-token-revoked") {
        throw new HttpsError("unauthenticated", "Token revoked");
      }
      if (error.code === "auth/argument-error") {
        throw new HttpsError("invalid-argument", "Invalid token format");
      }

      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error;
      }

      console.error("exchangeToken error:", error);
      throw new HttpsError("internal", "Failed to exchange token");
    }
  }
);
