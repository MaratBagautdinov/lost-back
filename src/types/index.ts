export interface ApiResponse<T> {
    error: boolean | any[];
    data: T | undefined;
    message: string;
}