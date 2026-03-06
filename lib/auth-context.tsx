'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { auth, db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export type UserRole = 'admin' | 'employee'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
  position?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // helper to convert firebase user + firestore user doc -> our User type
  const hydrateUser = async (fbUser: FirebaseUser): Promise<User | null> => {
    if (!fbUser) return null
    const userRef = doc(db, 'users', fbUser.uid)
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) {
      // create a default profile (role employee)
      const defaultData = {
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Unknown',
        role: 'employee',
        email: fbUser.email,
      }
      await setDoc(userRef, defaultData)
      return {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: defaultData.name,
        role: 'employee',
      }
    }
    const data = userDoc.data() as any

    let department = data.department || ''
    let position = data.position || ''

    // If department/position not in users doc, try to find from employees collection
    if (!department && data.role !== 'admin') {
      try {
        const { collection: firestoreCollection, query: firestoreQuery, where, getDocs } = await import('firebase/firestore')
        // Try matching by uid first, then by email
        const empByUid = firestoreQuery(
          firestoreCollection(db, 'employees'),
          where('uid', '==', fbUser.uid)
        )
        const uidSnap = await getDocs(empByUid)
        if (!uidSnap.empty) {
          const empData = uidSnap.docs[0].data()
          department = empData.department || ''
          position = empData.position || ''
        } else {
          const empByEmail = firestoreQuery(
            firestoreCollection(db, 'employees'),
            where('email', '==', fbUser.email)
          )
          const emailSnap = await getDocs(empByEmail)
          if (!emailSnap.empty) {
            const empData = emailSnap.docs[0].data()
            department = empData.department || ''
            position = empData.position || ''
          }
        }
      } catch {
        // silently fail, department stays empty
      }
    }

    return {
      id: fbUser.uid,
      email: fbUser.email || '',
      name: data.name || '',
      role: data.role || 'employee',
      department,
      position,
    }
  }

  useEffect(() => {
    // listen for firebase auth state changes instead of localStorage
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const hydrated = await hydrateUser(fbUser)
        setUser(hydrated)
      } else {
        setUser(null)
      }
      setIsInitialized(true)
    })
    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const fbUser = credential.user
      const hydrated = await hydrateUser(fbUser)
      setUser(hydrated)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await firebaseSignOut(auth)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isInitialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
