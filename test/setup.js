// Suppress the punycode deprecation warning
const originalWarn = process.emitWarning;
process.emitWarning = (...args) => {
  if (args[2] && args[2].code === 'DEP0040') return;
  return originalWarn.apply(process, args);
};

// Suppress the experimental ES Module warning
const originalEmit = process.emit;
process.emit = function (event, ...args) {
  if (event === 'warning' && args[0] && args[0].name === 'ExperimentalWarning') return;
  return originalEmit.apply(process, [event, ...args]);
}; 