FROM debian:9
MAINTAINER Jesko Dujmovic

# copy mosml .deb file into /tmp
COPY mosml*.deb /tmp/

# install it with dependencies
RUN apt-get update -y && \
    apt-get install libgmp10 -y && \
    dpkg -i /tmp/mosml*

# user rights shit
RUN groupadd mosml && useradd -g mosml -u 1000 -d "/home/mosml" -m mosml


COPY run.sh /bin

USER mosml
WORKDIR "/home/mosml"
CMD ["/bin/bash","/bin/run.sh"]

## Security points
# 1. don't run as root
# 2. sanitize user input
# 3. secure/up-to-date connection protocols

# https://hmarr.com/2013/oct/16/codecube-runnable-gists/
