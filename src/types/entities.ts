export interface I_E_Payment {
    id: number,
    order_id: I_E_Order['id'],
    cash_box_id: I_E_CashBox['id']
    payment_method_id: I_E_PaymentMethod['id']
    date_create: number | Date
    value: number | null
    label: string | null
}
export interface I_E_CashBox {
    id: number
    name: string
}

export interface I_E_Order {
    id: number;
    client_phone: string | null;
    client_name: string | null;
    sum: number;
    quest_cost: number;
    cash_box_id: number;
    dop_players_cost: number | null;
    quest_id: number;
    players_count: number | null;
    discount: number | null
    date_create: Date
    date_execution: Date
    slot: string | null
    admin: number | null
    agency_fee_value: number | null
    addition_admin: number | null
    status_id: I_E_OrderStatus['id']
    quest_name: string | null
    actors_ids: number[]
}
export interface I_E_OrderStatus {
    id: number
    name: string
    color: string
    priority: number
}
export interface I_E_Quest {
    id: number,
    name: string,
    label: string
    cost: number,
    cash_box_id: I_E_CashBox['id'],
    DURATION: number
    PICTURE: I_File | undefined
    ACTORS_COUNT: number
    max_players_count: number
    min_players_count: number
    AGES: I_QuestAge[]
}
export interface I_QuestAge {
    age: number,
    price: number
}
export interface I_File {
    id: number
    TIMESTAMP_X?: string
    MODULE_id?: string
    HEIGHT?: string
    WidTH?: string
    FILE_SIZE?: string
    content_TYPE?: string
    SUBDIR?: string
    FILE_name: string
    ORIGINAL_name?: string
    label?: string
    HANDLER_id?: never
    EXTERNAL_id?: string
    VERSION_ORIGINAL_id?: string
    META?: string
    SRC: string
}
export interface I_E_OrderDiscount {
    id: number
    name: string
    order_id: number
    is_agent: boolean | null
    discount_id: number
    discount_value: number
    date_execution: string | number | Date
    date_create: string | number | Date
}
export interface I_E_ActorByOrder {
    id: number
    order_id: number
    date_execution: number | Date
    actor_id: number
    cash_box_id: number
    value: number
}
export interface I_E_PaymentMethod {
    id: number,
    name: string
}
export interface I_OrderTotalByPaymentMethod extends I_E_PaymentMethod {
    value: number
}
export interface I_E_AdditionByOrder {
    id: number
    name: string
    order_id: number
    admin_pay: number
    addition_id: number
    cash_box_id: number
    value: number
}