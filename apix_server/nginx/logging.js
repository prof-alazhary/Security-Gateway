function kvAccess(r) {
    var log = `${r.variables.time_iso8601} client=${r.remoteAddress} method=${r.method} uri=${r.uri} status=${r.status}`;
    r.rawHeadersIn.forEach(h => log += ` in.${h[0]}=${h[1]}`);
    r.rawHeadersOut.forEach(h => log += ` out.${h[0]}=${h[1]}`);
    log += `.   REQ_BODY : ${r.requestBody instanceof Object ? JSON.stringify(r.requestBody) : r.requestBody}`;
    return log;
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

export default { kvAccess, test }