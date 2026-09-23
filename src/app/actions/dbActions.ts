'use client';

import { User, Lab, Pc, LabRequest, Attendance, Room, AuditLog, Subject } from '@/utils/storage';

/**
 * LOCAL REGISTRY PROTOCOL
 * All database operations are now routed through LocalStorage for zero-dependency execution.
 */

function getLocal<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(`vault_${key}`) || '[]');
}

function setLocal(key: string, data: any[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`vault_${key}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('sync_update'));
}

// USER ACTIONS
export async function getUsersAction(): Promise<User[]> { return getLocal<User>('users'); }
export async function getUserByIdAction(id: string): Promise<User | null> {
    const users = getLocal<User>('users');
    return users.find(u => u.id === id) || null;
}
export async function addUserAction(user: User) {
    const users = getLocal<User>('users');
    setLocal('users', [...users, user]);
}
export async function updateUserAction(id: string, updates: Partial<User>) {
    const users = getLocal<User>('users');
    const updated = users.map(u => u.id === id ? { ...u, ...updates } : u);
    setLocal('users', updated);
    return updated.find(u => u.id === id) || null;
}

// LAB & ROOM ACTIONS
export async function getLabsAction(): Promise<Lab[]> { return getLocal<Lab>('labs'); }
export async function addLabAction(lab: Lab) {
    const labs = getLocal<Lab>('labs');
    setLocal('labs', [...labs, lab]);
    
    // Auto-Provision PCs based on capacity
    const pcs = getLocal<Pc>('pcs');
    const newPcs: Pc[] = Array.from({ length: lab.capacity }).map((_, i) => ({
        id: `PC-${lab.id}-${i + 1}`,
        pcNumber: (i + 1).toString(),
        labId: lab.id,
        status: 'available'
    }));
    setLocal('pcs', [...pcs, ...newPcs]);
}
export async function updateLabAction(id: string, updates: Partial<Lab>) {
    const labs = getLocal<Lab>('labs');
    setLocal('labs', labs.map(l => l.id === id ? { ...l, ...updates } : l));
}

export async function getRoomsAction(): Promise<Room[]> { return getLocal<Room>('rooms'); }
export async function addRoomAction(room: Room) {
    const rooms = getLocal<Room>('rooms');
    setLocal('rooms', [...rooms, room]);
}

export async function getPcsAction(): Promise<Pc[]> { return getLocal<Pc>('pcs'); }
export async function updatePcAction(id: string, updates: Partial<Pc>) {
    const pcs = getLocal<Pc>('pcs');
    setLocal('pcs', pcs.map(p => p.id === id ? { ...p, ...updates } : p));
}

// REQUEST ACTIONS
export async function getLabRequestsAction(): Promise<LabRequest[]> { return getLocal<LabRequest>('labrequests'); }
export async function addLabRequestAction(req: Omit<LabRequest, 'id'>) {
    const requests = getLocal<LabRequest>('labrequests');
    const id = `REQ-${Date.now()}`;
    setLocal('labrequests', [{ ...req, id }, ...requests]);
}
export async function updateLabRequestAction(id: string, updates: Partial<LabRequest>) {
    const requests = getLocal<LabRequest>('labrequests');
    setLocal('labrequests', requests.map(r => r.id === id ? { ...r, ...updates } : r));
}

// ATTENDANCE & AUDIT
export async function getAttendancesAction(): Promise<Attendance[]> { return getLocal<Attendance>('attendance'); }
export async function addAttendanceAction(att: Omit<Attendance, 'id'>) {
    const data = getLocal<Attendance>('attendance');
    setLocal('attendance', [{ ...att, id: `ATT-${Date.now()}` }, ...data]);
}
export async function updateAttendanceAction(id: string, updates: Partial<Attendance>) {
    const data = getLocal<Attendance>('attendance');
    setLocal('attendance', data.map(a => a.id === id ? { ...a, ...updates } : a));
}

export async function addAuditLogAction(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const data = getLocal<AuditLog>('auditlog');
    setLocal('auditlog', [{ ...log, id: `AUDIT-${Date.now()}`, timestamp: new Date().toISOString() }, ...data]);
}

export async function getSubjectsAction(): Promise<Subject[]> { return getLocal<Subject>('subjects'); }

// SYSTEM
export async function cleanupExpiredSessionsAction() {
    const now = new Date();
    const requests = getLocal<LabRequest>('labrequests');
    const expired = requests.filter(r => r.status === 'approved' && new Date(r.endTime) < now);
    for (const r of expired) {
        if (r.pcId) updatePcAction(r.pcId, { status: 'available' });
    }
    return { updated: expired.length };
}

export async function forceResetAllLabsAction() {
    const pcs = getLocal<Pc>('pcs');
    setLocal('pcs', pcs.map(p => ({ ...p, status: 'available' })));
    return { closedSessions: pcs.length };
}

export async function updateSettingsAction(updates: any) {
    const settings = JSON.parse(localStorage.getItem('vault_settings') || '{}');
    localStorage.setItem('vault_settings', JSON.stringify({ ...settings, ...updates }));
}
export async function getSettingsAction() {
    return JSON.parse(localStorage.getItem('vault_settings') || '{}');
}
export async function updateLastSeenAction(id: string) {
    const users = getLocal<User>('users');
    setLocal('users', users.map(u => u.id === id ? { ...u, lastSeen: new Date().toISOString() } : u));
}
