/** @type {import('ts-jest').JestConfigWithTsJest} */
require("../.pnp.cjs").setup();
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
};
