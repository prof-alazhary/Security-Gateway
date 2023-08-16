function logsFormate(r) {
    var log = `${r.variables.time_iso8601} client=${r.remoteAddress} method=${r.method} uri=${r.uri} status=${r.status}`;
    r.rawHeadersIn.forEach(h => log += ` in.${h[0]}=${h[1]}`);
    r.rawHeadersOut.forEach(h => log += ` out.${h[0]}=${h[1]}`);
    log += `.   REQ_BODY : ${r.requestBody instanceof Object ? JSON.stringify(r.requestBody) : r.requestBody}`;
    return log;
}

function parseCookiesToJSON(cookies) {
    const arr = cookies.split('; ');
    const obj = {};
    arr.forEach(cookie => {
        const attrs = cookie.split('=');
        const key = attrs[0];
        const value = attrs[1]
        obj[key] = value;
    })
    return obj;
}

function encapsulateTokenInCookie(r) {
    r.log('---inside encapsulateTokenInCookie||||----')
    r.log(`uri is : ${r.uri}`)
    r.log(`r.variables.request_uri is : ${r.variables.request_uri}`)
    r.log(`r.variables.args is : ${r.variables.args}`)
    const body = r.requestBody;
    r.log(`r.requestBody is : ${body}`)

    r.subrequest("/login_proxy", { method: "POST", args: r.variables.args },
        function (reply) {
            var status = reply.status;
            r.log(`status is ${status}`)
            if (status) {
                ngx.log(ngx.INFO, reply.responseBody)
                var response = JSON.parse(reply.responseBody);
                const cookies = [];
                Object.keys(response).forEach(key => {
                    cookies.push(`${key}=${response[key]}; HttpOnly`);
                })
                r.headersOut["Set-Cookie"] = cookies;
                r.return(status, "success!");//reply.responseBody
            } else {
                r.return(401);
            }
        }
    );
}

function extractTokenFromCookie(r) {
    var cookies = r.headersIn["Cookie"];
    if (cookies) {
        var body = parseCookiesToJSON(cookies);
        r.log(`body.token is ---> ${body.token}`);
        r.variables['auth'] = `Bearer ${body.token}`;
        r.subrequest("/backend_api_proxy", { method: "POST" }, function (reply) {
            var status = reply.status;
            r.return(status, reply.responseBody);
        })
    } else {
        r.return(400);
    }
}

export default { logsFormate, encapsulateTokenInCookie, extractTokenFromCookie }