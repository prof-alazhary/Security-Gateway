#   Security Gateway POC:-

##### This is a POC that demonstrates A solution to provide a layer on the front of the Client-side (placed within an API Gateway), to apply some security requirements for the Front End App to be more secure. in terms of communicating with any backend API. 

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

## Feature Keys

- Docker file that holds the [Nginx](https://hub.docker.com/_/nginx) and [njs](https://github.com/nginx/njs) Modules installation. (special THANKS to my friend [Kareem](https://github.com/kareemelkasaby1) for supporting with this Doker file preparation)
- Nginx configurations (`nginx.conf` for backend server - `default.conf` for security gateway server)file ready to use.
- njs applications/examples inside the `jsCode.js` that contains the javascript code would be used to achieve our POC.
- Exposing 2 Nginx servers (`security_gateway` & `backend_side`) that allow us to apply the functionality that we've implemented.
- docker-compose to facilitate the environment for development.

## RUN & Get Started

```sh
> docker-compose up --build
```

## Use Case
- Token/Cookie exchange:
We will explain the `token/Cookie` exchange/encapsulation process through the security gateway, Using the njs module as a scripting language to facilitate and allow us to manipulate the request/response by writing some `javascript` functions/callbacks to handle a certain `Nginx` location/API.

> encapsulateTokenInCookie

By the Postman App, you can perform the following API call :-
```
POST localhost:8086/login
```

default.conf:
```config
        location /login{
            if ($request_method != 'POST'){
             return 405;
             }
            js_content jsCode.encapsulateTokenInCookie;
        }

        location /login_proxy {
            proxy_pass   http://backend_side:8087/login;
            proxy_ssl_server_name on;
        }
```
As you can see, we used the `js_content` Directive from the [ngx_http_js_module](https://nginx.org/en/docs/http/ngx_http_js_module.html#directives). and pass the handler `encapsulateTokenInCookie` to it. So that we can control/manipulate the `/login_proxy` response. by extracting the response body, then adding its all body data -for example- as an HTTP only Cookies for the same response.
jsCode.js:
```javascript
function encapsulateTokenInCookie(r) {
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
```
-------------
> extractTokenFromCookie

By the Postman App, you can perform the following API call :-
```
POST localhost:8086/api
```

Here we will explain the opposite of the prev. example.
default.conf:
```config
        location /api{
            js_content jsCode.extractTokenFromCookie;
        }

       location /backend_api_proxy{
            proxy_set_header Authorization "$auth";
            proxy_pass http://backend_side:8087/api;
            proxy_ssl_server_name on;
        }
```
Also, we used the `js_content` Directive and passes the handler `extractTokenFromCookie` to it. So that we can manipulate the `/api` request. by extracting the Cookies header, then adding it as an Authorization header for the `backend_api_proxy` API using `proxy_set_header` Directive, after binding its value from `extractTokenFromCookie` handler through `$auth`variable by `r.variables['auth']`.

jsCode.js:
```javascript
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
```
## test WIP bot. test
## License

MIT
