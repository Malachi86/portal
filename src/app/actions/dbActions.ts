
'use client';

import { db } from '@/firebase/config';
import { 
    collection, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    getDoc,
    serverTimestamp,
    onSnapshot,
    Timestamp
} from "firebase/firestore";
import { User, Lab, Pc, LabRequest, Attendance } from '@/utils/storage';

// Generic sync and write helpers preserved but restricted to needed collections
const activeListeners: Record<string, () => void> = {};

export function startNeuralSync(collectionName: string) {
    if (typeof window === 'undefined' || activeListeners[collectionName]) return;
    try {
        const q = collection(db, collectionName);
        const unsubscribe = onSnapshot(q, (snap) => {
            const updates = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            localStorage.setItem(`vault_${collectionName}`, JSON.stringify(updates));
            window.dispatchEvent(new CustomEvent('sync_update', { detail: { collection: collectionName } }));
        });
        activeListeners[collectionName] = unsubscribe;
    } catch (e) {
        console.error(`Sync failed for ${collectionName}`);
    }
}

async function sync<T>(collectionName: string): Promise<T[]> {
    if (typeof window === 'undefined') return [];
    if (!activeListeners[collectionName]) startNeuralSync(collectionName);
    const cached = localStorage.getItem(`vault_${collectionName}`);
    return cached ? JSON.parse(cached) : [];
}

function write(collectionName: string, id: string, data: any) {
    const docRef = doc(db, collectionName, id);
    setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// RESTRICTED ACTIONS
export async function getUsersAction(): Promise<User[]> { return await sync<User>('users'); }
export async function getUserByIdAction(id: string): Promise<User | null> {
    const snap = await getDoc(doc(db, 'users', id));
    return snap.exists() ? { ...snap.data(), id: snap.id } as User : null;
}
export async function addUserAction(user: User) { write('users', user.id, user); }

export async function getLabsAction(): Promise<Lab[]> { return await sync<Lab>('labs'); }
export async function getPcsAction(): Promise<Pc[]> { return await sync<Pc>('pcs'); }
export async function updatePcAction(id: string, updates: Partial<Pc>) { write('pcs', id, updates); }

export async function getLabRequestsAction(): Promise<LabRequest[]> { return await sync<LabRequest>('labrequests'); }
export async function addLabRequestAction(req: Omit<LabRequest, 'id'>) {
    const id = `REQ-${Date.now()}`;
    write('labrequests', id, { ...req, id });
}
export async function updateLabRequestAction(id: string, updates: Partial<LabRequest>) { write('labrequests', id, updates); }

export async function addAttendanceAction(att: Omit<Attendance, 'id'>) {
    const id = `ATT-${Date.now()}`;
    write('attendance', id, { ...att, id });
}
export async function getAttendancesAction(): Promise<Attendance[]> { return await sync<Attendance>('attendance'); }
