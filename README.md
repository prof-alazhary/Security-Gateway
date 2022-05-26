#  Security Gatway POC:-

##### This is a POC that demonstrates the Security Gateway solution to provide a layer on the front of the Client-side, to apply some security requirements for the Front End APP. in terms of communicating with any API "HTTP calls". 

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

## Feature Keys

- Docker file that holds the [Nginx](https://hub.docker.com/_/nginx) and [njs](https://github.com/nginx/njs) Modules installaion.
- Nginx config `nginx.cong` file ready to use.
- njs applications/examples inside the `jsCode.js` that holds the javascript code would be used to achieve our POC.
- Exposing 2 Nginx servers (`security_gateway` & `apix_server`) that allow us to apply the functionality that we've implemented.
- docker-compose to facilitate the development process.

## RUN & Get Started

```sh
> docker-compose up --build
```

## Use Case
- Token/Cookie exchange:
We will explain the `token/Cookie` exchange process through the security gateway, Using the njs module as a scripting langate to facilitate and allow us to manipulate the request/response by writing some `javascript` functions/callbacks to handle a certain `Nginx` location/API.

> covertTokenToCookie

By the Postman App, you can perform the folloeing API call :-
```
POST localhost:8086/token
```

nginx.conf:
```config
        location /token{
            if ($request_method != 'POST'){
             return 405;
             }
            js_content jsCode.covertTokenToCookie;
        }

        location /token_proxy {
            proxy_pass   http://apix_server:8087/token;
            proxy_ssl_server_name on;
        }
```
As you can see, we used the `js_content` Directive from the [ngx_http_js_module](https://nginx.org/en/docs/http/ngx_http_js_module.html#directives). and pass the handler `covertTokenToCookie` to it. So that we can control/manipulate the `/token_proxy` response. by extracting the response body, then adding its fields as Cookies for the same response.
jsCode.js:
```javascript
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
```
-------------
> covertCookieToToken

By the Postman App, you can perform the folloeing API call :-
```
POST localhost:8086/agent_token
```

Here we will explain the opposite of the prev. example.
nginx.conf:
```config
        location /agent_token{
            if ($request_method != 'POST'){
             return 403;
            }
            js_content jsCode.covertCookieToToken;
        }

       location /agent_token_proxy{
            if ($request_method != 'POST'){
             return 403;
            }
            proxy_pass http://apix_server:8087/agent_token;
            proxy_ssl_server_name on;
        }
```
Also, we used the `js_content` Directive and passes the handler `covertCookieToToken` to it. So that we can cmanipulate the `/agent_token` request. by extracting the Cookies header, then adding them as a request body for the `agent_token_proxy` API.

jsCode.js:
```javascript
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
```

## License

MIT
