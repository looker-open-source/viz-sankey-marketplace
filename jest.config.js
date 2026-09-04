module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|js)$": ["ts-jest", { tsconfig: { target: "es2020" } }],
  },
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!(d3|d3-.*|internmap|robust-predicates|delaunator)/)",
  ],
};
