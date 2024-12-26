import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthToken } from '../utils/tokens';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
    user?: any;
}

export const authMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: true,
            data: null,
            message: 'No token provided'
        });
    }

    try {
        const decoded = AuthToken.verify(token);
        if (!decoded) {
            return res.status(401).json({
                error: true,
                data: null,
                message: 'Invalid token'
            });
        }
        const user = await prisma.user.findFirst({
            where: decoded
        });

        if (!user) {
            return res.status(401).json({
                error: true,
                data: null,
                message: 'Invalid token'
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            error: true,
            data: null,
            message: 'Invalid token'
        });
    }
};
