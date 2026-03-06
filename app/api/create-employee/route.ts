import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, email, password, position, department, salary, accountNumber, ifscCode } = body

        // Validate required fields
        if (!name || !email || !password || !position || !department || !salary || !accountNumber || !ifscCode) {
            return NextResponse.json(
                { error: 'All fields are required.' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters.' },
                { status: 400 }
            )
        }

        // 1. Create the Firebase Auth user
        let uid: string
        try {
            const userRecord = await adminAuth.createUser({
                email,
                password,
                displayName: name,
            })
            uid = userRecord.uid
        } catch (authErr: any) {
            if (authErr.code === 'auth/email-already-exists') {
                return NextResponse.json(
                    { error: 'An account with this email already exists.' },
                    { status: 409 }
                )
            }
            throw authErr
        }

        // 2. Create the Firestore user profile (used by auth-context for login)
        await adminDb.collection('users').doc(uid).set({
            name,
            email,
            role: 'employee',
            department,
            position,
        })

        // 3. Create the employee record in the employees collection
        const employeeDoc = await adminDb.collection('employees').add({
            uid,
            name,
            email,
            position,
            department,
            salary: parseInt(salary, 10),
            accountNumber,
            ifscCode,
            joinDate: new Date().toISOString().split('T')[0],
            status: 'active',
        })

        return NextResponse.json(
            {
                message: `Employee ${name} created successfully.`,
                employeeId: employeeDoc.id,
                uid,
            },
            { status: 201 }
        )
    } catch (err: any) {
        console.error('Error creating employee:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
