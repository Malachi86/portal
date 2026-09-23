'use client';

import { db } from '@/firebase/config';
import { 
    collection, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    onSnapshot,
    query,
    where
} from "firebase/firestore";
import { User, Lab, Pc, LabRequest, Attendance, Room, AuditLog, Subject } from '@/utils/storage';

// REUSABLE SYNC LOGIC
const activeListeners: Record<string, () => void> = {};

export function startNeuralSync(collectionName: string) {
    if (typeof window === 'undefined' || activeListeners[collectionName]) return;
    try {
        const q = collection(db, collectionName);
        const unsubscribe = onSnapshot(q, (snap) => {
            const updates = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            localStorage.setItem(`vault_${collectionName}`, JSON.stringify(updates));
            window.dispatchEvent(new CustomEvent('neural_sync_update', { detail: { collection: collectionName } }));
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
    if (cached) return JSON.parse(cached);
    
    // Initial fetch if cache is empty
    const snap = await getDocs(collection(db, collectionName));
    const data = snap.docs.map(d => ({ ...d.data(), id: d.id })) as T[];
    localStorage.setItem(`vault_${collectionName}`, JSON.stringify(data));
    return data;
}

function write(collectionName: string, id: string, data: any) {
    const docRef = doc(db, collectionName, id);
    setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// USER ACTIONS
export async function getUsersAction(): Promise<User[]> { return await sync<User>('users'); }
export async function getUserByIdAction(id: string): Promise<User | null> {
    const snap = await getDoc(doc(db, 'users', id));
    return snap.exists() ? { ...snap.data(), id: snap.id } as User : null;
}
export async function addUserAction(user: User) { write('users', user.id, user); }

export async function updateUserAction(id: string, updates: Partial<User>) {
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    return await getUserByIdAction(id);
}

export async function updateLastSeenAction(id: string) {
    const docRef = doc(db, 'users', id);
    updateDoc(docRef, { lastSeen: new Date().toISOString() });
}

// SUBJECT ACTIONS
export async function getSubjectsAction(): Promise<Subject[]> { return await sync<Subject>('subjects'); }
export async function addSubjectAction(subject: Subject) { write('subjects', subject.id, subject); }

// FACILITY ACTIONS
export async function getLabsAction(): Promise<Lab[]> { return await sync<Lab>('labs'); }
export async function addLabAction(lab: Lab) { write('labs', lab.id, lab); }
export async function updateLabAction(id: string, updates: Partial<Lab>) { write('labs', id, updates); }
export async function deleteLabAction(id: string) { await deleteDoc(doc(db, 'labs', id)); }

export async function getRoomsAction(): Promise<Room[]> { return await sync<Room>('rooms'); }
export async function addRoomAction(room: Room) { write('rooms', room.id, room); }
export async function updateRoomAction(id: string, updates: Partial<Room>) { write('rooms', id, updates); }
export async function deleteRoomAction(id: string) { await deleteDoc(doc(db, 'rooms', id)); }

export async function getPcsAction(): Promise<Pc[]> { return await sync<Pc>('pcs'); }
export async function updatePcAction(id: string, updates: Partial<Pc>) { write('pcs', id, updates); }

// REQUEST ACTIONS
export async function getLabRequestsAction(): Promise<LabRequest[]> { return await sync<LabRequest>('labrequests'); }
export async function addLabRequestAction(req: Omit<LabRequest, 'id'>) {
    const id = `REQ-${Date.now()}`;
    write('labrequests', id, { ...req, id });
}
export async function updateLabRequestAction(id: string, updates: Partial<LabRequest>) { write('labrequests', id, updates); }

// ATTENDANCE ACTIONS
export async function addAttendanceAction(att: Omit<Attendance, 'id'>) {
    const id = `ATT-${Date.now()}`;
    write('attendance', id, { ...att, id });
}
export async function getAttendancesAction(): Promise<Attendance[]> { return await sync<Attendance>('attendance'); }
export async function updateAttendanceAction(id: string, updates: Partial<Attendance>) { write('attendance', id, updates); }

// AUDIT ACTIONS
export async function addAuditLogAction(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const id = `AUDIT-${Date.now()}`;
    write('auditlog', id, { ...log, id, timestamp: new Date().toISOString() });
}
export async function getAuditLogsAction(): Promise<AuditLog[]> { return await sync<AuditLog>('auditlog'); }

// SYSTEM ACTIONS
export async function cleanupExpiredSessionsAction() {
    const now = new Date();
    const requests = await getLabRequestsAction();
    const expired = requests.filter(r => r.status === 'approved' && new Date(r.endTime) < now);
    
    for (const r of expired) {
        if (r.pcId) updatePcAction(r.pcId, { status: 'available' });
    }
    return { updated: expired.length };
}

export async function forceResetAllLabsAction() {
    const pcs = await getPcsAction();
    for (const pc of pcs) {
        if (pc.status === 'occupied') updatePcAction(pc.id, { status: 'available' });
    }
    return { closedSessions: pcs.length };
}

export async function getSettingsAction() {
    const snap = await getDoc(doc(db, 'settings', 'global'));
    return snap.exists() ? snap.data() : {};
}

export async function updateSettingsAction(updates: any) {
    const docRef = doc(db, 'settings', 'global');
    await setDoc(docRef, updates, { merge: true });
}
