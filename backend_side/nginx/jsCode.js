function logsFormate(r) {
    var log = `${r.variables.time_iso8601} client=${r.remoteAddress} method=${r.method} uri=${r.uri} status=${r.status}`;
    r.rawHeadersIn.forEach(h => log += ` in.${h[0]}=${h[1]}`);
    r.rawHeadersOut.forEach(h => log += ` out.${h[0]}=${h[1]}`);
    log += `.   REQ_BODY : ${r.requestBody instanceof Object ? JSON.stringify(r.requestBody) : r.requestBody}`;
    return log;
}

function middleware(r) {
    r.log('inside middleware-->')
    r.log(`uri is : ${r.uri}`)
    r.log(`r.variables.request_uri is : ${r.variables.request_uri}`)
    r.log(`r.variables.args is : ${r.variables.args}`)
    const body = r.requestBody;
    r.log(`r.requestBody is : ${body}`)

    r.subrequest("/real_agent_token", { method: "POST", body },
        function (reply) {
            var status = reply.status;
            r.log(`status is ${status}`)
            if (status) {
                r.return(status, reply.responseBody);//reply.responseBody
            } else {
                r.return(401);
            }
        }
    );
}

function test(r) {
    r.log(`test test test test`)
    Object.keys(r).forEach(key => {

        r.log(`${key} :${r[key]}`)
    })
    var req_body = r.requestBody;
    r.log(`requestBody---> ${typeof req_body}, ${JSON.stringify(req_body)}`)
    r.return(400, req_body);
}

export default { logsFormate, test, middleware }