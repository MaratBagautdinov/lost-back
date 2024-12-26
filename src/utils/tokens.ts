
export const AuthToken = {
    generate: (args: { email: string, password: string }) => {

        const string = `${process.env.LABA__AUTH_SALT}|||${args.email}|||${args.password}`;
        return btoa(string);
    },
    verify: (authHashed: string) => {
        const decoded = atob(authHashed);
        const [salt, email, password] = decoded.split('|||');

        if (salt !== process.env.LABA__AUTH_SALT) {
            return false
        } else {
            return {
                email: email,
                password: password
            }
        }
    }
}