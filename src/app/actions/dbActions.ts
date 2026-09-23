
'use server';

import { users, labs, rooms, pcs, labrequests, attendance, auditlog, settings } from '@/lib/db';
import { User, Lab, Pc, LabRequest, Attendance, Room, AuditLog } from '@/utils/storage';
import { revalidatePath } from 'next/cache';

/**
 * SERVER REGISTRY PROTOCOL (JSON DB)
 * Clean JS implementation for Nexus Engine.
 */

// USER ACTIONS
export async function getUsersAction(): Promise<User[]> {
    return users.all();
}

export async function getUserByIdAction(id: string): Promise<User | null> {
    return users.get(id) || null;
}

export async function addUserAction(user: User) {
    users.insert({
        ...user,
        isApproved: !!user.isApproved,
        isBanned: !!user.isBanned
    });
    revalidatePath('/');
}

export async function updateUserAction(id: string, updates: Partial<User>) {
    users.update(id, updates);
    revalidatePath('/');
    return users.get(id) || null;
}

// LAB & ROOM ACTIONS
export async function getLabsAction(): Promise<Lab[]> {
    return labs.all();
}

export async function addLabAction(lab: Lab) {
    labs.insert(lab);
    
    // Auto-Provision PCs
    for (let i = 0; i < lab.capacity; i++) {
        pcs.insert({
            id: `PC-${lab.id}-${i + 1}`,
            pcNumber: (i + 1).toString(),
            labId: lab.id,
            status: 'available'
        });
    }
    revalidatePath('/');
}

export async function updateLabAction(id: string, updates: Partial<Lab>) {
    labs.update(id, updates);
    revalidatePath('/');
}

export async function deleteLabAction(id: string) {
    labs.delete(id);
    const labPcs = pcs.where(p => p.labId === id);
    labPcs.forEach(p => pcs.delete(p.id));
    revalidatePath('/');
}

export async function getRoomsAction(): Promise<Room[]> {
    return rooms.all();
}

export async function addRoomAction(room: Room) {
    rooms.insert(room);
    revalidatePath('/');
}

export async function deleteRoomAction(id: string) {
    rooms.delete(id);
    revalidatePath('/');
}

export async function updateRoomAction(id: string, updates: Partial<Room>) {
    rooms.update(id, updates);
    revalidatePath('/');
}

export async function getPcsAction(): Promise<Pc[]> {
    return pcs.all();
}

export async function updatePcAction(id: string, updates: Partial<Pc>) {
    pcs.update(id, updates);
    revalidatePath('/');
}

// REQUEST ACTIONS
export async function getLabRequestsAction(): Promise<LabRequest[]> {
    const all = labrequests.all();
    return all.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

export async function addLabRequestAction(req: Omit<LabRequest, 'id'>) {
    const id = `REQ-${Date.now()}`;
    labrequests.insert({ ...req, id } as LabRequest);
    revalidatePath('/');
}

export async function updateLabRequestAction(id: string, updates: Partial<LabRequest>) {
    labrequests.update(id, updates);
    revalidatePath('/');
}

// ATTENDANCE & AUDIT
export async function getAttendancesAction(): Promise<Attendance[]> {
    const all = attendance.all();
    return all.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addAttendanceAction(att: Omit<Attendance, 'id'>) {
    const id = `ATT-${Date.now()}`;
    attendance.insert({ ...att, id } as Attendance);
    revalidatePath('/');
}

export async function updateAttendanceAction(id: string, updates: Partial<Attendance>) {
    attendance.update(id, updates);
    revalidatePath('/');
}

export async function addAuditLogAction(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const id = `AUDIT-${Date.now()}`;
    const timestamp = new Date().toISOString();
    auditlog.insert({ ...log, id, timestamp } as AuditLog);
}

export async function getAuditLogsAction(): Promise<AuditLog[]> {
    const all = auditlog.all();
    return all.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// SYSTEM
export async function cleanupExpiredSessionsAction() {
    const now = new Date();
    const expired = labrequests.where(r => r.status === 'approved' && new Date(r.endTime) < now);
    
    expired.forEach(r => {
        if (r.pcId) {
            pcs.update(r.pcId, { status: 'available' });
        }
    });
    return { updated: expired.length };
}

export async function forceResetAllLabsAction() {
    const allPcs = pcs.all();
    allPcs.forEach(p => pcs.update(p.id, { status: 'available' }));
    
    const timeOut = new Date().toLocaleTimeString('en-US', { hour12: false });
    const activeAtt = attendance.where(a => !a.timeOut);
    activeAtt.forEach(a => attendance.update(a.id, { timeOut }));
    
    revalidatePath('/');
    return { closedSessions: allPcs.length };
}

export async function updateSettingsAction(updates: any) {
    const currentStr = settings.get('main')?.value || '{}';
    const current = JSON.parse(currentStr);
    const newData = JSON.stringify({ ...current, ...updates });
    settings.upsert({ id: 'main', value: newData });
}

export async function getSettingsAction() {
    const row = settings.get('main');
    return row ? JSON.parse(row.value) : {};
}

export async function updateLastSeenAction(id: string) {
    users.update(id, { lastSeen: new Date().toISOString() });
}

export async function getSubjectsAction() { return []; }
