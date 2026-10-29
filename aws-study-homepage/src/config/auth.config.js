// AWS sign-in (Amazon Cognito) + API settings for AWS Study Hub.
// None of these are secret: they ship in every app bundle. Override per build
// with VITE_* variables if the backend is ever redeployed elsewhere.

export const AWS_REGION = 'us-east-1';

// Cognito user pool app client (public, no secret)
export const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '8att6q0026f6sb44qn4il7tu8';

// Branded sign-in domain (Google sign-in and the token endpoint)
export const COGNITO_AUTH_URL = import.meta.env.VITE_COGNITO_AUTH_URL || 'https://auth.aws-study-flashcards-app.com';

// HTTP API: /v1/* (profile, progress) and /callable/* (payments)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://vaj7alg0f6.execute-api.us-east-1.amazonaws.com';
export const CALLABLE_BASE_URL = `${API_BASE_URL}/callable`;

// One sign-in for every subdomain: the session cookie lives on the root domain
export const COOKIE_DOMAIN = '.aws-study-flashcards-app.com';
