import { Request, Response } from 'express';
import { replaceFilterOptions } from '../utils/replacers';
import { PrismaClient } from '@prisma/client';
import { AuthToken } from '../utils/tokens';
import * as argon2 from 'argon2';
import { app } from '../server'; // Make sure to export your app instance

const prisma = new PrismaClient();

interface EntityController {
    create: (req: Request, res: Response) => Promise<void>;
    list: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    one: (req: Request, res: Response) => Promise<void>;
    delete: (req: Request, res: Response) => Promise<void>;
    auth: (req: Request, res: Response) => Promise<void>;
    login: (req: Request, res: Response) => Promise<void>;
}

interface UserLoginInput {
    email: string;
    password: string;
}

interface UserCreateInput {
    password: string;
    email: string;
    name?: string;
}
export default {
    create: async (req: Request, res: Response) => {
        const entityId = 'user';
        const userData: UserCreateInput = req.body;

        try {
            const existingUser = await (prisma[entityId] as any).findFirst({
                where: { email: userData.email }
            });

            if (existingUser) {
                return res.status(200).json({
                    error: true,
                    data: null,
                    message: 'Пользователь с такой почтой уже зарегистрирован'
                });
            }

            const hashedPassword = await argon2.hash(userData.password + process.env.LABA__AUTH_SALT);

            const result = await (prisma.user).create({
                data: {
                    ...userData,
                    name: userData.name || 'User',
                    password: hashedPassword
                }
            });

            // Send welcome email
            app.mailer.send('userCreate', {
                to: userData.email,
                subject: 'Добро пожаловать в Lost',
                second_name: result.second_name || 'second_name',
                name: result.name || 'name',
                last_name: result.last_name || 'last_name',
                mail: userData.email,
                password: userData.password
            });
            const { password, ...resultWithoutPassword } = result;

            res.status(201).json({
                error: false,
                data: resultWithoutPassword,
                message: 'Пользователь создан'
            });
        } catch (err) {
            res.status(200).json({
                error: true,
                data: null,
                message: err instanceof Error ? err.message : 'Unknown error'
            });
        }
    },
    login: async (req: Request, res: Response) => {
        const entityId = 'user';
        const loginData: UserLoginInput = req.body;
        try {
            const user = await (prisma[entityId]).findFirst({
                where: {
                    email: loginData.email
                },
            });
            if (!user) {
                return res.status(201).json({
                    error: true,
                    data: null,
                    message: 'Пользователь не найден'
                });
            }
            const isValidPassword = await argon2.verify(
                user.password ?? '',
                loginData.password + process.env.LABA__AUTH_SALT
            );
            if (!isValidPassword) {
                return res.status(201).json({
                    error: true,
                    data: null,
                    message: 'Не верный пароль'
                });
            }

            const token = AuthToken.generate({
                email: user.email,
                password: loginData.password
            });

            const { password, ...userWithoutPassword } = user;
            res.status(200).json({
                error: false,
                data: {
                    user: userWithoutPassword,
                    id: user.id,
                    token
                },
                message: 'Login successful'
            });
        } catch (err) {
            res.status(200).json({
                error: true,
                data: null,
                message: err instanceof Error ? err.message : 'Unknown error'
            });
        }
    },
    list: async (req, res) => {
        const entityId = 'user';
        const filters = replaceFilterOptions(req.body);

        try {
            const result = await (prisma[entityId] as any).findMany({
                where: filters
            });

            res.status(200).json({
                error: false,
                data: result.map((u: { password?: string }) => {
                    const uReturn = { ...u }
                    delete uReturn.password
                    return uReturn
                }),
                message: ''
            });
        } catch (err) {
            res.status(200).json({
                error: [],
                data: [],
                message: err instanceof Error ? err.message : 'Unknown error'
            });
        }
    },
    update: async (req, res) => {
        const { id } = req.params;
        const entityId = 'user';
        const data = req.body;

        try {
            const result = await (prisma[entityId] as any).update({
                where: { id: Number(id) },
                data
            });
            delete result.password

            res.status(200).json({
                error: false,
                data: result,
                message: ''
            });
        } catch (err) {
            res.status(200).json({
                error: [],
                data: undefined,
                message: err instanceof Error ? err.message : 'Unknown error'
            });
        }
    },

    one: async (req, res) => {
        const { id } = req.params;
        const entityId = 'user';

        try {
            const result = await (prisma[entityId] as any).findUnique({
                where: { id: Number(id) }
            });

            delete result.password
            res.status(200).json({
                error: false,
                data: result,
                message: ''
            });
        } catch (err) {
            res.status(200).json({
                error: [],
                data: undefined,
                message: err instanceof Error ? err.message : 'Unknown error'
            });
        }
    },
    delete: async (req, res) => {
        const { id } = req.params;
        const entityId = 'user';

        try {
            const result = await (prisma[entityId] as any).delete({
                where: { id: Number(id) }
            });
            delete result.password

            res.status(200).json({
                error: false,
                data: result,
                message: ''
            });
        } catch (err) {
            res.status(200).json({
                error: [],
                data: undefined,
                message: err instanceof Error ? err.message : 'Unknown error'
            });
        }
    },
    auth: async (req: Request, res: Response) => {
        const entityId = 'user';
        const { tk_asugtkh } = req.body;

        try {
            const decoded = AuthToken.verify(tk_asugtkh);
            if (!decoded) {
                return res.status(401).json({
                    error: true,
                    data: null,
                    message: 'Invalid token'
                });
            }
            const user = await (prisma[entityId] as any).findFirst({
                where: {
                    email: decoded.email,
                }
            });

            if (!user) {
                return res.status(401).json({
                    error: true,
                    data: null,
                    message: 'Invalid token'
                });
            }

            const isValidPassword = await argon2.verify(
                user.password,
                decoded.password + process.env.LABA__AUTH_SALT
            );
            if (!isValidPassword) {
                return res.status(401).json({
                    error: true,
                    data: null,
                    message: 'Invalid token'
                });
            }
            delete user.password
            res.status(200).json({
                error: false,
                data: {
                    user,
                    id: user.id,
                    token: tk_asugtkh
                },
                message: 'Token verified successfully'
            });
        } catch (err) {
            res.status(401).json({
                error: true,
                data: null,
                message: 'Invalid token'
            });
        }
    }

} as EntityController;
