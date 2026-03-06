import { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'

export function useFirestoreCollection<T>(
  name: string,
  constraints: QueryConstraint[] = []
) {
  const [items, setItems] = useState<(T & { id: string })[]>([])

  useEffect(() => {
    const q = query(collection(db, name), ...constraints)
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as T),
      }))
      setItems(data)
    })
    return unsub
  }, [name, JSON.stringify(constraints)])

  const add = (docData: T) => addDoc(collection(db, name), docData)
  const update = (id: string, docData: Partial<T>) =>
    updateDoc(doc(db, name, id), docData)
  const remove = (id: string) => deleteDoc(doc(db, name, id))

  return { items, add, update, remove }
}
