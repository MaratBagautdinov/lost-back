import { I_E_Quest } from '../../types/entities';
import { Request, Response } from 'express';
import { replaceFilterOptions, toLowerCaseFields } from '../../utils/replacers';
import { PrismaClient } from '@prisma/client';
import {
    I_E_ActorByOrder,
    I_E_AdditionByOrder,
    I_E_Order,
    I_E_OrderDiscount,
    I_E_Payment,
    I_E_PaymentMethod,
    I_OrderTotalByPaymentMethod
} from '../../types/entities';
import requestLost from '../../utils/rest';

const prisma = new PrismaClient();

interface EntityController {
    create: (req: Request, res: Response) => Promise<void>;
    list: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    one: (req: Request, res: Response) => Promise<void>;
    delete: (req: Request, res: Response) => Promise<void>;
}

function sumValues(carry: number, item: { value: number }) {
    return carry + item.value;
}

function sumDiscount(carry: number, item: { discount_value: number }) {
    return carry + item.discount_value;
}

function paymentsTotal(item: I_E_PaymentMethod, payments: { payment_method_id: number, value: number }[], refunds: {
    payment_method_id: number,
    value: number
}[]) {
    const paymentsByTypeId = payments.filter(pay => pay.payment_method_id === item.id);
    const refundsByTypeId = refunds.filter(pay => pay.payment_method_id === item.id);
    const paymentSum = paymentsByTypeId.reduce((carry: number, item: { value: number }) => sumValues(carry, item), 0);
    const refundSum = refundsByTypeId.reduce((carry: number, item: { value: number }) => sumValues(carry, item), 0);

    return {
        ...item,
        value: paymentSum - refundSum
    };
}

async function validate(intId: number, data: Partial<I_E_Order>) {
    const orderInit = await (prisma.order).findUnique({
        where: { id: Number(intId) }
    });
    if (!orderInit) {
        throw new Error('Order not found')
    }
    const order = await getCalculate(orderInit)
    const resLost: {
        status: string
        data: I_E_Quest
    } = await requestLost('/quest?ID=' + order.quest_id);
    if (resLost.status == 'error') {
        throw new Error('Квест не найден');
    }

    const quest = {
        ...toLowerCaseFields(resLost.data),
        id: Number(resLost.data.id),
    }
    const requiredFields: (keyof I_E_Order)[] = ['date_execution', 'slot', 'players_count', 'admin'];

    const validRes: {
        error: boolean
        message: string
        data: {
            message: string,
            code: string,
            customData: (keyof I_E_Order | "refunds")
        }[]
    } = {
        error: false,
        message: '',
        data: []
    };

    if (data.status_id) {
        if (data.status_id === 2) {
            requiredFields.forEach(field => {
                if (!order[field]) {
                    validRes.data.push({
                        message: '',
                        code: '',
                        customData: field
                    });
                }
            });

            if (quest.AGES.length > 0 && (Number(order.players_count) > quest.min_players_count) && !order.dop_players_cost) {
                validRes.data.push({
                    message: '',
                    code: '',
                    customData: 'dop_players_cost'
                });
            }
        }

        if (data.status_id === 3) {
            if (order.calc.to_refund > 0) {
                validRes.data.push({
                    message: 'Необходимо произвести возврат',
                    code: '',
                    customData: 'refunds'
                });
            }
        }
    }

    if (validRes.data.length > 0) {
        validRes.error = true;
        validRes.message = 'Ошибка валидации';
    }

    return validRes;
}

export interface OrderCalculate extends I_E_Order {
    calc: {
        remain_pay_sum: number
        discount_quest_cost: number
        additional_players_sum: number
        additional_events_sum: number
        refunds_sum: number
        to_refund: number
        refunds_list: I_E_Payment[]
        order_discounts_list: I_E_OrderDiscount[]
        payments_list: I_E_Payment[]
        actors_list: I_E_ActorByOrder[]
        total_by_payments_list: I_OrderTotalByPaymentMethod[]
        additions_list: I_E_AdditionByOrder[]
    }
}

const getCalculate = async (order: I_E_Order): Promise<OrderCalculate> => {
    // Get additions
    const additionsByOrder = await prisma.additions_by_order.findMany({
        where: {
            order_id: order.id
        }
    });
    if (!additionsByOrder) {
        throw new Error('additionsByOrder not found')
    }
    const additionsSum = additionsByOrder.reduce((carryAdd: number, add: { value: number }) => sumValues(carryAdd, add), 0);

    // Get discounts 
    const discountsByOrder = await prisma.order_discount.findMany({
        where: {
            order_id: order.id
        }
    });

    if (!discountsByOrder) {
        throw new Error('discountsByOrder not found')
    }
    order.discount = discountsByOrder.reduce((carryAdd: number, add: { discount_value: number, }) => sumDiscount(carryAdd, add), 0);
    const DISCOUNT_QUEST_COST = Number(order.quest_cost) - Number(order.discount);

    const resLost: {
        status: string
        data: I_E_Quest
    } = await requestLost('/quest?ID=' + order.quest_id);
    if (resLost.status == 'error') {
        throw new Error('Квест не найден');
    }

    const quest = {
        ...toLowerCaseFields(resLost.data),
        id: Number(resLost.data.id),
    }
    const sumByPlayersCount = Number(order.players_count) > Number(quest?.min_players_count) ?
        ((Number(order.players_count) - Number(quest?.min_players_count)) * Number(order?.dop_players_cost)) : 0;

    order.sum = DISCOUNT_QUEST_COST + additionsSum + sumByPlayersCount;

    // Get refunds
    const refunds = await prisma.refund.findMany({
        where: {
            order_id: order.id
        }
    });
    const refundsSum = refunds.reduce((carryAdd: number, add: { value: number }) => sumValues(carryAdd, add), 0);

    // Get actors
    const actors = await prisma.order_actor_percent.findMany({
        where: {
            order_id: order.id
        }
    });

    // Get payments
    const payments = await prisma.payment.findMany({
        where: {
            order_id: order.id
        }
    });
    const paymentsSum = payments.reduce((carryAdd: number, add: { value: number }) => sumValues(carryAdd, add), 0);

    // Get payment methods
    const paymentMethods = await prisma.payment_method.findMany();

    const REMAIN_PAY_SUM = order.sum - paymentsSum + refundsSum;
    let TO_REFUND = REMAIN_PAY_SUM;
    TO_REFUND = TO_REFUND < 0 ? Math.abs(TO_REFUND) : 0;

    return {
        ...order,
        calc: {
            remain_pay_sum: REMAIN_PAY_SUM < 0 ? 0 : REMAIN_PAY_SUM,
            discount_quest_cost: DISCOUNT_QUEST_COST || 0,
            additional_players_sum: sumByPlayersCount || 0,
            additional_events_sum: additionsSum || 0,
            refunds_sum: refundsSum || 0,
            to_refund: TO_REFUND || 0,
            refunds_list: refunds || [],
            order_discounts_list: discountsByOrder || [],
            payments_list: payments || [],
            actors_list: actors || [],
            total_by_payments_list: paymentMethods.map((item: I_E_PaymentMethod) => paymentsTotal(item, payments, refunds)),
            additions_list: additionsByOrder || [],
        }
    };
}
export default {
    create: async (req, res) => {
        const data = req.body;

        try {
            const result = await (prisma.order).create({
                data
            });

            res.status(201).json({
                error: false,
                data: await getCalculate(result),
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
        const filters = replaceFilterOptions(req.body);

        try {
            const result = await (prisma.order).findMany({
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
        try {
            const { id } = req.params;
            const data = req.body;

            const isValid = await validate(Number(id), req.body);
            if (isValid.error) {
                return isValid;
            }

            const result = await (prisma.order).update({
                where: { id: Number(id) },
                data
            });
            const orderCalc = await getCalculate(result)
            if (req.body.status_id === 3) {
                const actor = await (prisma.user).findUnique({
                    where: { id: Number(req.body.actor_id) }
                });
                if (!actor) {
                    throw new Error('actor not found')
                }
                await (prisma.order_actor_percent).create({
                    data: {
                        actor_id: data.actor_id,
                        cash_box_id: data.cash_box_id,
                        date_execution: result.date_execution,
                        order_id: result.id,
                        value: result.quest_cost * Number(actor.percent) / 100,
                    }
                });
                for (const actorOrder of orderCalc.calc.actors_list) {
                    const actor = await (prisma.user).findUnique({
                        where: { id: Number(actorOrder.actor_id) }
                    });
                    if (!actor) {
                        throw new Error('actor not found')
                    }

                    await (prisma.order_actor_percent).update({
                        where: {
                            id: actorOrder.id
                        },
                        data: {
                            date_execution: orderCalc.date_execution,
                            value: orderCalc.quest_cost * Number(actor.percent) / 100,
                        }
                    });
                }
            }

            if (data.date_execution || data.slot) {
                const newActorsList = [];
                for (const actorOrder of orderCalc.calc.actors_list) {
                    const actor = await (prisma.user).findUnique({
                        where: { id: Number(actorOrder.actor_id) }
                    });
                    if (!actor) {
                        throw new Error('actor not found')
                    }


                    const updatedActor = await (prisma.order_actor_percent).update({
                        where: {
                            id: actorOrder.id
                        },
                        data: {
                            date_execution: orderCalc.date_execution,
                            value: orderCalc.quest_cost * Number(actor.percent) / 100,
                        }
                    });
                    newActorsList.push(updatedActor);
                }
                orderCalc.calc.actors_list = newActorsList;
            }
            res.status(200).json({
                error: false,
                data: orderCalc,
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

        try {
            const result = await (prisma.order).findUnique({
                where: { id: Number(id) }
            });

            if (!result) {
                throw new Error('Order not found');
            }

            res.status(200).json({
                error: false,
                data: await getCalculate(result),
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

        try {
            const result = await (prisma.order).delete({
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
