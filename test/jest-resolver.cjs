/**
 * Custom Jest resolver that rewrites `.js` extensions to `.ts`
 * for local project files, while leaving node_modules untouched.
 */
module.exports = (request, options) => {
  // Only rewrite .js -> .ts for relative imports and src/ bare imports
  const isRelative = request.startsWith('./') || request.startsWith('../');
  const isSrcBare = request.startsWith('src/');

  if ((isRelative || isSrcBare) && request.endsWith('.js')) {
    const tsRequest = request.slice(0, -3) + '.ts';
    try {
      return options.defaultResolver(tsRequest, options);
    } catch {
      // fall through to default resolution
    }
  }

  return options.defaultResolver(request, options);
};
