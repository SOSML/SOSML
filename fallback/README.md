# MoscowML fallback Docker image

This folder contains the source code and configuration to build the Docker image for the 
MoscowML fallback server.

## Prerequisites

You should have Docker installed and the Docker daemon running.
Download the dependencies via:
```bash
./download.sh
```

## Build

To build the fallback and load it onto your dockerhub run:
```bash
docker build -t youraccount/image .
```

## Run

To run the image:
```bash
docker run --rm -i youraccount/image
```

Or use mine:
```bash
docker run --rm -i derjesko/mosmlfallback
```

