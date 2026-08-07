// Stands in for Node built-ins that Emscripten-generated code (opencv.js)
// references behind a runtime `ENVIRONMENT_HAS_NODE` check. The branch never
// executes in a browser, but the bundler still has to resolve the specifier.
export default {};
