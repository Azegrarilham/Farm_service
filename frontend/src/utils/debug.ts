/**
 * Debug utility for tracking authentication issues
 * Enable this in the console with: window.DEBUG_AUTH = true
 */

declare global {
    interface Window {
        DEBUG_AUTH: boolean;
    }
}

// Set to false by default
window.DEBUG_AUTH = false;

export function authDebug(message: string, data?: any): void {
    if (window.DEBUG_AUTH) {
        console.log(`%c[AUTH] ${message}`, 'color: #4CAF50; font-weight: bold;', data || '');
    }
}

export function setupAuthDebugger(): void {
    // Create a wrapper for the original fetch
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        // Only log authentication-related requests when debug is enabled
        if (window.DEBUG_AUTH) {
            const url = args[0] instanceof Request ? args[0].url : String(args[0]);
            if (url.includes('login') || url.includes('user') || url.includes('logout')) {
                console.log(`%c[FETCH] ${args[0]} ${JSON.stringify(args[1] || {})}`, 'color: #2196F3;');
            }
        }
        return originalFetch.apply(this, args);
    };

    // Instructions for enabling debug
    console.log('%cAuth Debugger loaded. Enable with: window.DEBUG_AUTH = true', 'color: #4CAF50; font-weight: bold;');
}

export default authDebug;
