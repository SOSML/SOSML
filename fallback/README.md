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
docker run --cpus=1 --memory=128m --rm -i --tmpfs /home/mosml:rw,noexec,nosuid,nodev,size=256k,uid=1000 --read-only derjesko/mosmlfallback
```
