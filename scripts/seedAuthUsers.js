const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

function getServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e.message)
            process.exit(1)
        }
    }
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const p = process.env.GOOGLE_APPLICATION_CREDENTIALS
        if (!fs.existsSync(p)) {
            console.error('GOOGLE_APPLICATION_CREDENTIALS file not found:', p)
            process.exit(1)
        }
        return require(p)
    }
    const defaultRel = 'secrets/payroll-25ec8-firebase-adminsdk-fbsvc-1b861a040c.json'
    const defaultPath = path.resolve(process.cwd(), defaultRel)
    if (fs.existsSync(defaultPath)) {
        return require(defaultPath)
    }
    console.error('No service account provided. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.')
    process.exit(1)
}

const USERS = [
    {
        email: 'admin@company.com',
        password: 'password',
        displayName: 'Admin User',
        role: 'admin',
    },
    {
        email: 'employee@company.com',
        password: 'password',
        displayName: 'Employee User',
        role: 'employee',
    },
]

async function main() {
    const serviceAccount = getServiceAccount()

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    })

    const authService = admin.auth()
    const db = admin.firestore()

    console.log('Creating Firebase Auth users and Firestore user profiles...\n')

    for (const u of USERS) {
        let uid
        try {
            // Check if the user already exists
            const existing = await authService.getUserByEmail(u.email)
            uid = existing.uid
            console.log(`✔ User already exists: ${u.email} (uid: ${uid})`)
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                // Create new user
                const created = await authService.createUser({
                    email: u.email,
                    password: u.password,
                    displayName: u.displayName,
                })
                uid = created.uid
                console.log(`✔ Created user: ${u.email} (uid: ${uid})`)
            } else {
                console.error(`✖ Error checking user ${u.email}:`, err.message)
                continue
            }
        }

        // Create/update the Firestore user profile (used by auth-context.tsx)
        await db.collection('users').doc(uid).set(
            {
                name: u.displayName,
                email: u.email,
                role: u.role,
            },
            { merge: true }
        )
        console.log(`  → Firestore profile set for ${u.email} (role: ${u.role})\n`)
    }

    console.log('Done! You can now sign in with:')
    console.log('  Admin:    admin@company.com / password')
    console.log('  Employee: employee@company.com / password')
    process.exit(0)
}

main().catch((err) => {
    console.error('Seeding auth users failed:', err)
    process.exit(1)
})
