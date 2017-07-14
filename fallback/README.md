# MoscowML fallback Docker image

This folder contains the source code and configuration to build the Docker image for the
MoscowML fallback server.

## Prerequisites

You should have Docker installed and the Docker daemon running.
Download and build the dependencies via:
```bash
./download.sh
```

## Build

To build the fallback and load it onto your dockerhub run:
```bash
docker build -t youraccount/image .
```

## Run

Pipe into this command:
```bash
docker run --rm -i youraccount/image
```
to get a cleaned up result.

Or use mine:
```bash
docker run --rm -i derjesko/mosmlfallback
```

If run available for public running you should propably limit its resources:
```bash
docker run --cpus=1 --memory=128m --rm -i --read-only derjesko/mosmlfallback
```

If don't want the user running this to have dockerrights make shure docker is in the docker group 
then change the ownership of dockerrun like this:
```bash
chown docker:docker dockerrun.sh
chmod 755 dockerrun.sh
chmod u+s dockerrun.sh 
```

Now you can start a mosml docker container via:
```bash
./sockerrun.sh
```
