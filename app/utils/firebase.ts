import firebaseAdmin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

let serviceAccount = {
  type: "service_account",
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.RIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AITH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER,
  client_x509_cert_url: process.env.CLIENT_CERT_URL,
  universe_domain: "googleapis.com",
};

// Initialize Firebase Admin SDK
// const serviceAccount = require("./attendance-app-db-416e4-firebase-adminsdk-pf4g0-dedb567513.json");

export const amdin = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount as any),
  storageBucket: process.env.STORAGE_BUCKET,
});
