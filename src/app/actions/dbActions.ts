'use server';

import db from '@/lib/db';
import { User, Lab, Pc, LabRequest, Attendance, Room, AuditLog } from '@/utils/storage';
import { revalidatePath } from 'next/cache';

/**
 * SERVER REGISTRY PROTOCOL
 * SQLite implementation for persistent workstation management.
 */

// USER ACTIONS
export async function getUsersAction(): Promise<User[]> {
    const rows = db.prepare('SELECT * FROM users').all();
    return rows.map((u: any) => ({
        ...u,
        isApproved: Boolean(u.isApproved),
        isBanned: Boolean(u.isBanned)
    }));
}

export async function getUserByIdAction(id: string): Promise<User | null> {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
        ...row,
        isApproved: Boolean(row.isApproved),
        isBanned: Boolean(row.isBanned)
    };
}

export async function addUserAction(user: User) {
    const stmt = db.prepare(`
        INSERT INTO users (id, name, email, password, role, department, profilePic, isApproved, isBanned)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
        user.id,
        user.name,
        user.email,
        user.password,
        user.role,
        user.department,
        user.profilePic || '',
        user.isApproved ? 1 : 0,
        user.isBanned ? 1 : 0
    );
    revalidatePath('/');
}

export async function updateUserAction(id: string, updates: Partial<User>) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return null;

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => {
        const val = (updates as any)[key];
        if (typeof val === 'boolean') return val ? 1 : 0;
        return val;
    });

    const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
    
    return getUserByIdAction(id);
}

// LAB & ROOM ACTIONS
export async function getLabsAction(): Promise<Lab[]> {
    return db.prepare('SELECT * FROM labs').all() as Lab[];
}

export async function addLabAction(lab: Lab) {
    db.prepare('INSERT INTO labs (id, name, capacity) VALUES (?, ?, ?)').run(lab.id, lab.name, lab.capacity);
    
    // Auto-Provision PCs
    const pcStmt = db.prepare('INSERT INTO pcs (id, pcNumber, labId, status) VALUES (?, ?, ?, ?)');
    for (let i = 0; i < lab.capacity; i++) {
        pcStmt.run(`PC-${lab.id}-${i + 1}`, (i + 1).toString(), lab.id, 'available');
    }
    revalidatePath('/');
}

export async function updateLabAction(id: string, updates: Partial<Lab>) {
    const keys = Object.keys(updates);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => (updates as any)[key]);
    db.prepare(`UPDATE labs SET ${setClause} WHERE id = ?`).run(...values, id);
    revalidatePath('/');
}

export async function deleteLabAction(id: string) {
    db.prepare('DELETE FROM labs WHERE id = ?').run(id);
    db.prepare('DELETE FROM pcs WHERE labId = ?').run(id);
    revalidatePath('/');
}

export async function getRoomsAction(): Promise<Room[]> {
    return db.prepare('SELECT * FROM rooms').all() as Room[];
}

export async function addRoomAction(room: Room) {
    db.prepare('INSERT INTO rooms (id, name, capacity) VALUES (?, ?, ?)').run(room.id, room.name, room.capacity);
    revalidatePath('/');
}

export async function deleteRoomAction(id: string) {
    db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
    revalidatePath('/');
}

export async function updateRoomAction(id: string, updates: Partial<Room>) {
    const keys = Object.keys(updates);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => (updates as any)[key]);
    db.prepare(`UPDATE rooms SET ${setClause} WHERE id = ?`).run(...values, id);
    revalidatePath('/');
}

export async function getPcsAction(): Promise<Pc[]> {
    return db.prepare('SELECT * FROM pcs').all() as Pc[];
}

export async function updatePcAction(id: string, updates: Partial<Pc>) {
    const keys = Object.keys(updates);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => (updates as any)[key]);
    db.prepare(`UPDATE pcs SET ${setClause} WHERE id = ?`).run(...values, id);
}

// REQUEST ACTIONS
export async function getLabRequestsAction(): Promise<LabRequest[]> {
    return db.prepare('SELECT * FROM labrequests ORDER BY startTime DESC').all() as LabRequest[];
}

export async function addLabRequestAction(req: Omit<LabRequest, 'id'>) {
    const id = `REQ-${Date.now()}`;
    const stmt = db.prepare(`
        INSERT INTO labrequests (id, studentId, studentName, subjectId, labId, pcId, startTime, endTime, reason, status, requestType)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
        id,
        req.studentId,
        req.studentName,
        req.subjectId,
        req.labId,
        req.pcId || '',
        req.startTime,
        req.endTime,
        req.reason || '',
        req.status,
        req.requestType
    );
    revalidatePath('/');
}

export async function updateLabRequestAction(id: string, updates: Partial<LabRequest>) {
    const keys = Object.keys(updates);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => (updates as any)[key]);
    db.prepare(`UPDATE labrequests SET ${setClause} WHERE id = ?`).run(...values, id);
    revalidatePath('/');
}

// ATTENDANCE & AUDIT
export async function getAttendancesAction(): Promise<Attendance[]> {
    return db.prepare('SELECT * FROM attendance ORDER BY date DESC').all() as Attendance[];
}

export async function addAttendanceAction(att: Omit<Attendance, 'id'>) {
    const id = `ATT-${Date.now()}`;
    const stmt = db.prepare(`
        INSERT INTO attendance (id, studentId, studentName, subjectId, date, status, timeIn, timeOut, locationId, locationType, pcId, sessionId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
        id,
        att.studentId,
        att.studentName || '',
        att.subjectId,
        att.date,
        att.status,
        att.timeIn || '',
        att.timeOut || '',
        att.locationId,
        att.locationType,
        att.pcId || '',
        att.sessionId || ''
    );
    revalidatePath('/');
}

export async function updateAttendanceAction(id: string, updates: Partial<Attendance>) {
    const keys = Object.keys(updates);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => (updates as any)[key]);
    db.prepare(`UPDATE attendance SET ${setClause} WHERE id = ?`).run(...values, id);
    revalidatePath('/');
}

export async function addAuditLogAction(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const id = `AUDIT-${Date.now()}`;
    const timestamp = new Date().toISOString();
    db.prepare('INSERT INTO auditlog (id, userId, userName, action, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, log.userId, log.userName, log.action, log.details, timestamp);
}

export async function getAuditLogsAction(): Promise<AuditLog[]> {
    return db.prepare('SELECT * FROM auditlog ORDER BY timestamp DESC').all() as AuditLog[];
}

// SYSTEM
export async function cleanupExpiredSessionsAction() {
    const now = new Date().toISOString();
    const expired = db.prepare("SELECT * FROM labrequests WHERE status = 'approved' AND endTime < ?").all() as any[];
    
    for (const r of expired) {
        if (r.pcId) {
            db.prepare("UPDATE pcs SET status = 'available' WHERE id = ?").run(r.pcId);
        }
    }
    return { updated: expired.length };
}

export async function forceResetAllLabsAction() {
    const rowCount = db.prepare("UPDATE pcs SET status = 'available'").run().changes;
    // Also auto-timeout any active attendances
    const timeOut = new Date().toLocaleTimeString('en-US', { hour12: false });
    db.prepare("UPDATE attendance SET timeOut = ? WHERE timeOut = '' OR timeOut IS NULL").run(timeOut);
    revalidatePath('/');
    return { closedSessions: rowCount };
}

export async function updateSettingsAction(updates: any) {
    const current = await getSettingsAction();
    const newData = JSON.stringify({ ...current, ...updates });
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('main', newData);
}

export async function getSettingsAction() {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'main'").get() as any;
    return row ? JSON.parse(row.value) : {};
}

export async function updateLastSeenAction(id: string) {
    db.prepare('UPDATE users SET lastSeen = ? WHERE id = ?').run(new Date().toISOString(), id);
}

export async function getSubjectsAction() { return []; } // Legacy stub