'use client';

/**
 * LOCAL AUTH PROTOCOL
 * Strictly local storage based authentication for terminal operation.
 */

function getLocalUsers() {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('vault_users') || '[]');
}

export async function verifyIdentityAction(id: string, email: string) {
  try {
    const users = getLocalUsers();
    const found = users.find((u: any) => u.id === id && u.email === email);
    
    if (!found) {
      return { success: false, message: 'Identity verification failed. ID and Email do not match our records.' };
    }
    
    return { success: true, message: 'Identity verified.' };
  } catch (e) {
    return { success: false, message: 'Local verification system error.' };
  }
}

export async function updatePasswordAction(id: string, newPass: string) {
  try {
    const users = getLocalUsers();
    const updated = users.map((u: any) => u.id === id ? { ...u, password: newPass } : u);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vault_users', JSON.stringify(updated));
    }
    return { success: true, message: 'Password updated successfully.' };
  } catch (e) {
    return { success: false, message: 'Failed to update password locally.' };
  }
}

export async function login(id: string, pass: string) {
  try {
    const cleanId = String(id).trim();
    const cleanPass = String(pass).trim();

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
