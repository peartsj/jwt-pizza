# Docker Research Report

## What Docker Is

Docker is a platform used by both individuals and organizations to create, run, and monitor containers. Containers are constructs that contain an app and everything it needs to run, including libraries and configuration. Importantly, containers act like a sandbox: you can run an app without giving it access to everything on the host computer.

There are other services that do the same thing as Docker, but Docker remains the most popular due to:

- **Wide compatibility:** Docker runs on all major operating systems, and containers can work interchangeably from OS to OS.
- **Security:** Docker has very active developer support, and known security vulnerabilities are quickly addressed.
- **Speed:** Docker can be set up and installed quickly, then put to work immediately. Containers can be spun up or taken down fast, allowing for quick updates and excellent uptime.

## Why I Wanted to Research Docker

I have been interested in home labbing in my free time over the last year or so. I got an old used laptop from my dad that I was able to install Ubuntu Server on. During my research, I learned that most people use Docker to run containers hosting the various services I wanted to run on my own time.

I ended up getting a lot of practice using Docker without fully understanding what it was doing “under the hood.”

## Topics I Decided to Research

### What Is a Dockerfile?

According to the Docker website, “Docker builds images by reading the instructions from a Dockerfile. A Dockerfile is a text file containing instructions for building your source code.”

Dockerfiles are essentially a recipe for Docker to use when building an image. A Dockerfile often includes things like:

- which base image and version to use
- environment variables
- application dependencies that need to be installed
- build and run commands

Dockerfiles can be used with Docker to build and run a single container. However, containers are often used alongside other containers running related services intended to work together. In situations like these, a tool called **Docker Compose** is often used.

### Docker Compose

Docker Compose is a tool used to define and run multi-container applications. According to Docker’s website, “Compose simplifies the control of your entire application stack, making it easy to manage services, networks, and volumes in a single YAML configuration file.”

Compose can control multiple containers at the same time, making it possible to update or change multiple services together and then quickly start them back up to ensure everything is running smoothly.

I use Docker Compose for a couple of the services running on my old laptop, and I now understand the benefits of using it to manage connected services. I can briefly take down a group of interconnected services, update them, and then quickly spin them back up with minimal issues.

Below is an example of a Docker Compose file used to keep multiple applications on the same network:

```yaml
services:
  homepage:
    image: ghcr.io/gethomepage/homepage:latest
    container_name: homepage
    ports:
      - "3000:3000"
    volumes:
      - homepage-data:/app/config
    networks:
      - homelab

  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    ports:
      - "8096:8096"
    volumes:
      - jellyfin-config:/config
      - media-data:/media
    networks:
      - homelab

  syncthing:
    image: syncthing/syncthing:latest
    container_name: syncthing
    ports:
      - "8384:8384"
      - "22000:22000"
      - "22000:22000/udp"
    volumes:
      - syncthing-config:/var/syncthing
      - shared-data:/sync
    networks:
      - homelab

  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: uptime-kuma
    ports:
      - "3001:3001"
    volumes:
      - uptime-data:/app/data
    networks:
      - homelab

volumes:
  homepage-data:
  jellyfin-config:
  media-data:
  syncthing-config:
  shared-data:
  uptime-data:

networks:
  homelab:
```

## Final Thoughts

It was very cool to take the time to understand what exactly is happening on my old laptop running my home lab. I think I’ll take some time soon to clean up some of my `docker-compose.yml` files, since a lot of what is in them was suggested by internet tutorials and AI—and I’m sure it’s not as streamlined as it could be.

It’s clear that Docker is an incredibly useful and versatile platform that every developer and IT professional should be familiar with. Dockerfiles and Docker Compose are just the tip of the iceberg.
