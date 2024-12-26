import { Request, Response } from 'express';
import { replaceFilterOptions } from '../utils/replacers';
import { PrismaClient } from '@prisma/client';

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
		const entityId = req.params.entity_id as keyof PrismaClient;
		const data = req.body;

		try {
			const result = await (prisma[entityId] as any).create({
				data
			});

			res.status(201).json({
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

	list: async (req, res) => {
		const entityId = req.params.entity_id as keyof PrismaClient;
		const filters = replaceFilterOptions(req.body);

		try {
			const result = await (prisma[entityId] as any).findMany({
				where: filters
			});

			res.status(200).json({
				error: false,
				data: result,
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
		const entityId = req.params.entity_id as keyof PrismaClient;
		const data = req.body;

		try {
			const result = await (prisma[entityId] as any).update({
				where: { id: Number(id) },
				data
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
	},

	one: async (req, res) => {
		const { id } = req.params;
		const entityId = req.params.entity_id as keyof PrismaClient;

		try {
			const result = await (prisma[entityId] as any).findUnique({
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
	},
	delete: async (req, res) => {
		const { id } = req.params;
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
