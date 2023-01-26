/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // verbose: true,
  projects: [
    {
      preset: "ts-jest",
      testEnvironment: "node",
      displayName: "shared",
      testMatch: ["<rootDir>/shared/src/**/*.test.ts"],
    },
    {
      preset: "ts-jest",
      testEnvironment: "node",
      displayName: "server",
      testMatch: ["<rootDir>/server/src/**/*.test.ts"],
    },
    {
      preset: "ts-jest",
      testEnvironment: "node",
      displayName: "www",
      testMatch: ["<rootDir>/www/src/**/*.test.ts"],
    },
  ],
};
