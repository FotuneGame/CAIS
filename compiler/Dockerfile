FROM gcc:14 AS build
WORKDIR /compiler
COPY src src
RUN g++ -std=c++17 -O2 -static -Isrc $(find src -name '*.cpp') -o llmc -pthread

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /compiler/llmc /compiler/llmc
COPY config /compiler/config
WORKDIR /work
ENTRYPOINT ["/compiler/llmc"]
