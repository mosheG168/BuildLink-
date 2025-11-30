#!/usr/bin/env bash
docker run -d --name buildlink-mongo -p 27017:27017 -v buildlink-mongo-data:/data/db mongo:6.0