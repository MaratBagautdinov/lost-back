declare global {
    namespace Express {
        interface Application {
            mailer: {
                send: (
                    template: string,
                    options: {
                        to: string,
                        subject: string,
                        [key: string]: any
                    },
                    callback?: (err: Error | null) => void
                ) => void
            }
        }
    }
}

export { }
