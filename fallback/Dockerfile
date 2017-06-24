FROM debian:9
MAINTAINER Jesko Dujmovic

# copy mosml .deb file into /tmp
COPY mosml*.deb /tmp/

# install it with dependencies
RUN apt-get update -y && \
    apt-get install libgmp10 -y && \
    dpkg -i /tmp/mosml*

# user rights shit
RUN groupadd mosml && useradd -g mosml -d "/home/mosml" -m mosml


COPY run.sh /home/mosml

#COPY isolate /home/mosml
#RUN ["/home/mosml/isolate","--init"]

USER mosml
WORKDIR "/home/mosml"
CMD ["/bin/bash","./run.sh"]
#CMD ["/home/mosml/isolate","--run", "--","run.sh"]

# pipe into this command for terminating after first error
# docker run --rm -i derjesko/test

## Security points
# 1. don't run as root
# 2. sanitize user input
# 3. secure/up-to-date connection protocols

# https://hmarr.com/2013/oct/16/codecube-runnable-gists/
