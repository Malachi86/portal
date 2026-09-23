
'use client';

/**
 * DEVICE FINGERPRINTING UTILITY
 * Generates and persists a unique ID for the current hardware/browser instance.
 */

export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server';

  let deviceId = localStorage.getItem('ams_device_id');
  
  if (!deviceId) {
    // Generate a robust unique ID
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const txt = 'AMS-SECURE-PROTOCOL-V2';
    if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125,1,62,20);
        ctx.fillStyle = "#069";
        ctx.fillText(txt, 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText(txt, 4, 17);
    }
    
    const b64 = canvas.toDataURL().replace("data:image/png;base64,","");
    const bin = atob(b64);
    const crc = bin.length;
    
    deviceId = `DEV-${crc}-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
    localStorage.setItem('ams_device_id', deviceId);
  }
  
  return deviceId;
}

export function isAttackPatternDetected(): boolean {
    const attempts = parseInt(sessionStorage.getItem('ams_malicious_attempts') || '0');
    return attempts >= 5;
}

export function recordMaliciousAttempt() {
    const attempts = parseInt(sessionStorage.getItem('ams_malicious_attempts') || '0');
    sessionStorage.setItem('ams_malicious_attempts', (attempts + 1).toString());
}
