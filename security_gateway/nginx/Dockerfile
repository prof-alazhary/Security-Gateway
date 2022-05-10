FROM ubuntu:18.04

WORKDIR /home/nginx

# update and install dependencies
RUN apt-get update \
    && apt-get install build-essential -y \
    && apt-get install libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev wget -y \
    && apt-get install mercurial -y

# download nginx source
RUN wget http://nginx.org/download/nginx-1.21.6.tar.gz \
    && tar -zxvf nginx-1.21.6.tar.gz

# clone njs module and compile it
RUN hg clone http://hg.nginx.org/njs \
    && cd njs \
    && ./configure \
    && make

# install nginx 
RUN cd /home/nginx/nginx-1.21.6 \
    && ./configure --sbin-path=/usr/bin/nginx --with-debug --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --with-pcre --pid-path=/var/run/nginx.pid --with-http_ssl_module --with-http_auth_request_module --modules-path=/usr/local/nginx/modules --with-http_v2_module --add-module=/home/nginx/njs/nginx \
    && make \
    && make install \
    && which nginx

# forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log \
    && ln -sf /dev/stderr /var/log/nginx/info.log

# look at this port again...
EXPOSE 80

# ========================================YOUR SETUP STARTS FROM HERE==============================================#
# copy nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY jsCode.js /etc/nginx/jsCode.js

CMD ["nginx", "-g", "daemon off;"]