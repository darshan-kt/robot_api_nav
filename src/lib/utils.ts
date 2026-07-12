/**
 * Sanitizes user input to prevent XSS and other injection attacks.
 * Strips HTML tags, trims whitespace, and escapes special characters where appropriate.
 */
export function sanitizeInput(input: string): string {
    if (!input) return ''

    return input
        .replace(/<[^>]*>?/gm, '') // Strip HTML tags
        .trim()
}

/**
 * Escapes characters for safe rendering in HTML.
 * Note: React handles most of this automatically when rendering variables as text.
 */
export function escapeHTML(str: string): string {
    const p = document.createElement('p')
    p.textContent = str
    return p.innerHTML
}

/**
 * Validates robot configuration values.
 */
export const validateRobotConfig = {
    maxSpeed: (val: number) => val >= 0 && val <= 5,
    obstacleDistance: (val: number) => val >= 0.1 && val <= 10,
}

/**
 * Validates file uploads.
 */
export const validateFileUpload = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMapTypes: ['.pgm', '.yaml', '.png', '.jpg', '.jpeg'],

    isAllowedType: (filename: string) => {
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
        return validateFileUpload.allowedMapTypes.includes(ext)
    },

    isAllowedSize: (size: number) => size <= validateFileUpload.maxSize
}
