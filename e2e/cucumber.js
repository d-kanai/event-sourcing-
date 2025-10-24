module.exports = {
  default: {
    requireModule: ["ts-node/register"],
    require: ["support/**/*.ts", "steps/**/*.ts"],
    paths: ["../specification/**/*.feature"],
    format: ["progress"],
    worldParameters: {
      baseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:3100"
    }
  }
};
