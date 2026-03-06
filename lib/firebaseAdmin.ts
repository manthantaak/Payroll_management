import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import * as fs from 'fs'
import * as path from 'path'

// The service account key should be provided via an environment variable
// (stringified JSON) or you can point GOOGLE_APPLICATION_CREDENTIALS at a
// file that contains the JSON.  Do not commit the real credentials to git.

if (!getApps().length) {
  let serviceAccount: any = null

  // 1. Prefer the secrets JSON file on disk (preserves private_key newlines correctly)
  const secretPath = path.resolve(
    process.cwd(),
    'secrets/payroll-25ec8-firebase-adminsdk-fbsvc-1b861a040c.json'
  )
  if (fs.existsSync(secretPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(secretPath, 'utf-8'))
  }

  // 2. Fall back to the env-var (stringified JSON)
  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    // Fix: Next.js .env loading turns real \n into literal \\n in the private_key.
    // We need to convert them back to actual newline characters.
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
    }
  }

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    })
  } else {
    console.error(
      'Firebase Admin: No service account found. Place credentials in secrets/ or set FIREBASE_SERVICE_ACCOUNT env var.'
    )
  }
}

export const adminDb = getFirestore()
export const adminAuth = getAuth()
