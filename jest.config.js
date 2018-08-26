module.exports = {
  setupFiles: ["./test/setup.ts"],
  transform: {
    ".(ts|tsx)": "ts-jest"
  },
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/test/mock-file.ts",
    "\\.(css|less)$": "<rootDir>/test/mock-style.ts"
  },
  testRegex: "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  coveragePathIgnorePatterns: ["./node_modules", "./out", "./build", "./dist", "./test", "./docs", "\\.story.tsx$"],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  collectCoverage: false
};
