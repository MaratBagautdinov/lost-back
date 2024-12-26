import { Request, Response } from 'express';
import { replaceFilterOptions } from '../../utils/replacers';
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
        res.status(200).json({
            error: false,
            data: undefined,
            message: ''
        })
    },

    list: async (req, res) => {
        res.status(200).json({
            error: false,
            data: [],
            message: ''
        })
    },
    update: async (req, res) => {
        res.status(200).json({
            error: false,
            data: undefined,
            message: ''
        })
    },

    one: async (req, res) => {

        try {
            const resLost = await requestLost('/quest/timeline?QUEST_ID=' + req.params.id);
            if (resLost.status == 'error') {
                res.status(200).json({
                    error: [],
                    data: [],
                    message: 'Cannot catch quests from rest api'
                });
                return
            }
            const slotsList: Record<string, {
                start: string,
                cost: number,
            }[]> = {};
            Object.entries(resLost.data as Record<string, unknown>).forEach(([dayName, daySlots]) => {
                const slotsByDay: {
                    start: string,
                    cost: number,
                }[] = [];
                Object.entries(daySlots as Record<string, unknown>).forEach(([time, price]) => {
                    slotsByDay.push({
                        start: time,
                        cost: parseInt(price as string)
                    });
                });
                slotsList[dayName as keyof typeof slotsList] = slotsByDay;
            });
            res.status(200).json({
                error: false,
                data: {
                    id: req.params.id,
                    days: slotsList
                },
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
    delete: async (req, res) => {
        res.status(200).json({
            error: false,
            data: undefined,
            message: ''
        })
    }
} as EntityController;
