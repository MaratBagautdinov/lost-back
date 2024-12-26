import { Request, Response } from 'express';
import { replaceFilterOptions, toLowerCaseFields } from '../../utils/replacers';
import { PrismaClient } from '@prisma/client';
import requestLost from "../../utils/rest";

const prisma = new PrismaClient();

interface EntityController {
    create: (req: Request, res: Response) => Promise<void>;
    list: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    one: (req: Request, res: Response) => Promise<void>;
    delete: (req: Request, res: Response) => Promise<void>;
}

export default {
    create: async (req, res) => {
        res.status(201).json({
            error: false,
            data: undefined,
            message: ''
        })
    },

    list: async (req, res) => {
        try {
            const resLost = await requestLost('/quest/list');
            if (resLost.status == 'error') {
                res.status(200).json({
                    error: [],
                    data: [],
                    message: 'Cannot catch quests from rest api'
                });
                return
            }
            const result = await (prisma.quest as any).findMany();

            res.status(200).json({
                error: false,
                data: resLost.data.map((q: { ID: number }) => {
                    const o = toLowerCaseFields(q)
                    return ({
                        ...(o),
                        id: Number(q.ID),
                        cash_box_id: result.find((r: { rest_id: number }) => r.rest_id == q.ID)?.cash_box_id
                    })
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
        const id = Number(req.params.id)
        const entityId = req.params.entity_id as keyof PrismaClient;
        const data = req.body;
        try {

            const resultGet = await (prisma[entityId] as any).findUnique({
                where: { id: Number(id) }
            });
            if (!resultGet) {
                const resultCreate = await (prisma[entityId] as any).create({
                    data: {
                        ...data,
                        rest_id: id
                    }
                });
            } else {
                const result = await (prisma[entityId] as any).update({
                    where: { id: Number(id) },
                    data: {
                        ...data,
                        rest_id: id
                    }
                });
            }
            const resLost = await requestLost('/quest?ID=' + id);
            if (resLost.status == 'error') {
                res.status(200).json({
                    error: [],
                    data: [],
                    message: 'Cannot catch quests from rest api'
                });
                return
            }
            const result = await (prisma.quest as any).findFirst({
                where: { rest_id: (id) }
            });

            res.status(200).json({
                error: false,
                data: {
                    ...toLowerCaseFields(resLost),
                    cash_box_id: result?.cash_box_id
                },
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
        try {
            const resLost = await requestLost('/quest?ID=' + req.params.id);
            if (resLost.status == 'error') {
                res.status(200).json({
                    error: [],
                    data: [],
                    message: 'Cannot catch quests from rest api'
                });
                return
            }
            const result = await (prisma.quest as any).findMany();

            res.status(200).json({
                error: false,
                data: {
                    ...toLowerCaseFields(resLost.data),
                    id: Number(resLost.data.ID),
                    cash_box_id: result.find((r: { rest_id: number }) => r.rest_id == resLost.data.ID)?.cash_box_id
                },
                message: ''
            });
        } catch (err) {
            res.status(200).json({
                error: [],
                data: null,
                message: err instanceof Error ? err.message : 'Unknown error'
            });
        }
    },
    delete: async (req, res) => {
        const id = Number(req.params.id)
        const entityId = req.params.entity_id as keyof PrismaClient;

        try {
            const result = await (prisma[entityId] as any).delete({
                where: { id: Number(id) }
            });

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
    }
} as EntityController;
