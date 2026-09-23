
'use server';

import { users } from '@/lib/db';
import { User } from '@/utils/storage';

/**
 * SERVER AUTH PROTOCOL (JSON DB)
 * Secure authentication for Nexus Engine workstations.
 */

export async function login(id: string, pass: string) {
    try {
        const cleanId = String(id).trim();
        const cleanPass = String(pass).trim();

        // Default Admin Override
        if (cleanId === 'admin' && cleanPass === 'AMACC#2026') {
            return {
                success: true,
                user: { id: 'admin', role: 'admin', name: 'Administrator', department: 'college' },
            };
        }

        const user = users.find(u => u.id === cleanId && u.password === cleanPass);

        if (!user) {
            return { success: false, message: 'Invalid credentials.' };
        }

        if (user.isBanned) {
            return { success: false, message: 'Your account has been restricted.' };
        }
        
        return { 
            success: true, 
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                profilePic: user.profilePic,
                isApproved: Boolean(user.isApproved)
            }
        };
    } catch (error) {
        console.error("Auth error:", error);
        return { success: false, message: 'An internal error occurred during authentication.' };
    }
}

export async function verifyIdentityAction(id: string, email: string) {
    const user = users.find(u => u.id === id && u.email === email);
    if (user) return { success: true };
    return { success: false, message: 'Identity could not be verified in the registry.' };
}

export async function updatePasswordAction(id: string, newPass: string) {
    try {
        users.update(id, { password: newPass });
        return { success: true };
    } catch (e) {
        return { success: false, message: 'Registry update failed.' };
    }
}
