'use client';

/**
 * LOCAL AUTH PROTOCOL
 * Strictly local storage based authentication for terminal operation.
 */

function getLocalUsers() {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('vault_users') || '[]');
}

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

    const users = getLocalUsers();
    const found = users.find((u: any) => u.id === cleanId && u.password === cleanPass);

    if (!found) {
      return { success: false, message: 'Invalid credentials.' };
    }
    
    return { success: true, user: found };
  } catch (error) {
    return { success: false, message: 'An error occurred during local login.' };
  }
}
