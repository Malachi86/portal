
import fs from 'fs';
import path from 'path';

/**
 * NEXUS ENGINE PURE-JS DATABASE
 * Replaces better-sqlite3 to avoid native compilation errors.
 * Stores data in JSON files within the Nexus Engine data directory.
 */

const getDbDir = () => {
    // If DB_PATH is injected (e.g. data/app/app.db), we use its directory
    if (process.env.DB_PATH) {
        return path.dirname(process.env.DB_PATH);
    }
    // Fallback for local development
    return path.join(process.cwd(), 'database');
};

const dbDir = getDbDir();

// Ensure the data directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

class JsonTable<T extends { id: string }> {
    private filePath: string;

    constructor(tableName: string) {
        this.filePath = path.join(dbDir, `${tableName}.json`);
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([]));
        }
    }

    private read(): T[] {
        try {
            const content = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(content);
        } catch (e) {
            return [];
        }
    }

    private write(data: T[]) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    all(): T[] {
        return this.read();
    }

    get(id: string): T | undefined {
        return this.read().find(item => item.id === id);
    }

    insert(item: T) {
        const data = this.read();
        data.push(item);
        this.write(data);
    }

    update(id: string, updates: Partial<T>) {
        const data = this.read();
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            this.write(data);
        }
    }

    delete(id: string) {
        const data = this.read();
        const filtered = data.filter(item => item.id !== id);
        this.write(filtered);
    }

    where(predicate: (item: T) => boolean): T[] {
        return this.read().filter(predicate);
    }

    find(predicate: (item: T) => boolean): T | undefined {
        return this.read().find(predicate);
    }
    
    upsert(item: T) {
        const data = this.read();
        const index = data.findIndex(i => i.id === item.id);
        if (index !== -1) {
            data[index] = { ...data[index], ...item };
        } else {
            data.push(item);
        }
        this.write(data);
    }
}

// Initialize Tables
export const users = new JsonTable<any>('users');
export const labs = new JsonTable<any>('labs');
export const rooms = new JsonTable<any>('rooms');
export const pcs = new JsonTable<any>('pcs');
export const labrequests = new JsonTable<any>('labrequests');
export const attendance = new JsonTable<any>('attendance');
export const auditlog = new JsonTable<any>('auditlog');
export const settings = new JsonTable<{ id: string; value: string }>('settings');

// Default export for generic use if needed
const db = {
    users,
    labs,
    rooms,
    pcs,
    labrequests,
    attendance,
    auditlog,
    settings
};

export default db;
