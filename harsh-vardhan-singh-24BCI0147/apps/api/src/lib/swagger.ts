import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Video Streaming Analytics API",
    version: "1.0.0",
    description: "API for video streaming concurrency and analytics",
  },
  servers: ["http://localhost:5000"],
  basePath: "/api",
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/app.ts"];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc);