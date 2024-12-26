declare module 'express-mailer' {
    import { Express } from 'express';

    function extend(app: Express, options: {
        from: string;
        host: string;
        secureConnection: boolean;
        port: number;
        transportMethod: string;
        auth: {
            user: string;
            pass: string;
        }
    }): void;

    function send(app: Express, options: {
        from: string;
        host: string;
        secureConnection: boolean;
        port: number;
        transportMethod: string;
        auth: {
            user: string;
            pass: string;
        }
    }): void;

    export = mailer;
}
