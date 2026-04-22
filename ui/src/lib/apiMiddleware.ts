import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limit middleware - prevents API abuse
 */
export const checkRateLimit = (clientId: string): boolean => {
    const now = Date.now();
    const limit = parseInt(process.env.API_RATE_LIMIT || '10');
    const windowMs = parseInt(process.env.API_RATE_WINDOW_MS || '60000');

    const record = rateLimitMap.get(clientId);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (record.count < limit) {
        record.count++;
        return true;
    }

    return false;
};

/**
 * Validate API request security headers
 */
export const validateApiRequest = (req: NextRequest): { valid: boolean; message?: string } => {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
        return {
            valid: false,
            message: 'Rate limit exceeded. Max 10 requests per minute.',
        };
    }

    // Check Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
        return {
            valid: false,
            message: 'Invalid Content-Type. Must be application/json.',
        };
    }

    return { valid: true };
};

/**
 * Error response helper
 */
export const errorResponse = (message: string, status: number) => {
    return NextResponse.json(
        {
            error: message,
            timestamp: new Date().toISOString(),
        },
        { status }
    );
};

/**
 * Success response helper
 */
export const successResponse = <T>(data: T) => {
    return NextResponse.json(data, { status: 200 });
};
