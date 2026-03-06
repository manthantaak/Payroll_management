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
  // fallback to a secrets file inside the repo if present (convenience for local dev)
  const defaultRel = 'secrets/payroll-25ec8-firebase-adminsdk-fbsvc-1b861a040c.json'
  const defaultPath = path.resolve(process.cwd(), defaultRel)
  if (fs.existsSync(defaultPath)) {
    return require(defaultPath)
  }
  console.error('No service account provided. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.')
  process.exit(1)
}

async function main() {
  const serviceAccount = getServiceAccount()

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })

  const db = admin.firestore()

  console.log('Seeding example collections: employees, attendance, leaveRequests, payroll, payslips')

  // Employees
  const employeesRef = db.collection('employees')
  await employeesRef.add({
    name: 'Alice Johnson',
    email: 'alice@company.com',
    position: 'Senior Developer',
    department: 'Engineering',
    salary: 8500,
    joinDate: '2022-01-15',
    status: 'active',
  })

  // Attendance
  const attendanceRef = db.collection('attendance')
  await attendanceRef.add({
    employeeName: 'Alice Johnson',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '09:00',
    checkOut: '18:00',
  })

  // Leave Requests
  const leaveRef = db.collection('leaveRequests')
  await leaveRef.add({
    employeeName: 'Alice Johnson',
    employeeId: 'EMP001',
    leaveType: 'annual',
    startDate: '2024-04-01',
    endDate: '2024-04-05',
    days: 5,
    reason: 'Vacation',
    status: 'pending',
    appliedDate: new Date().toISOString().split('T')[0],
  })

  // Payroll
  const payrollRef = db.collection('payroll')
  await payrollRef.add({
    employeeId: 'EMP001',
    employeeName: 'Alice Johnson',
    month: new Date().toISOString().slice(0,7),
    baseSalary: 8500,
    allowances: 1000,
    deductions: 1500,
    netSalary: 8000,
    status: 'processed',
    processedDate: new Date().toISOString().split('T')[0],
  })

  // Payslips
  const payslipsRef = db.collection('payslips')
  await payslipsRef.add({
    month: 'March',
    year: 2024,
    baseSalary: 6250,
    allowances: 750,
    deductions: 1000,
    netSalary: 6000,
    generatedDate: new Date().toISOString().split('T')[0],
  })

  console.log('Seeding complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
