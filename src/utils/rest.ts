async function requestLost(route: string, method = 'GET', data = []) {
    const response = await fetch(`${process.env.LABA__LOST_SITE}${route}`, {
        method,
        headers: {
            'X-authorization': btoa('CRM-connector:s4bqaQkbxk'),
            'Content-Type': 'application/json'
        },
        body: method !== 'GET' ? JSON.stringify(data) : undefined
    });

    const result = await response.json();
    return result || [];
}

export default requestLost;