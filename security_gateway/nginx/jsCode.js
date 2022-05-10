function kvAccess(r) {
    var log = `${r.variables.time_iso8601} client=${r.remoteAddress} method=${r.method} uri=${r.uri} status=${r.status}`;
    r.rawHeadersIn.forEach(h => log += ` in.${h[0]}=${h[1]}`);
    r.rawHeadersOut.forEach(h => log += ` out.${h[0]}=${h[1]}`);
    log += `.   Req_Body : ${r.requestBody.split('&')}`;
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

function covertTokenToCookie(r) {
    r.subrequest("/token_proxy", { method: "POST" },
        function (reply) {
            var status = reply.status;
            if (status) {
                r.log('---debugging||||----')
                ngx.log(ngx.INFO, reply.responseBody)
                var response = JSON.parse(reply.responseBody);
                var cookies = [];
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

function covertCookieToToken(r) {
    var cookies = r.headersIn["Cookie"]; //r.requestBody

    if (cookies) {
        var body = JSON.stringify(parseCookiesToJSON(cookies));
        r.log(`body is --->${typeof body} , ${body}`);
        r.subrequest("/agent_token_proxy", { method: "POST", body }, function (reply) {
            var status = reply.status;
            r.return(status, reply.responseBody);
        })
    } else {
        r.return(400);
    }

}

export default { kvAccess, covertTokenToCookie, covertCookieToToken }