/**
 * Lightweight, zero-dependency cookie parser middleware for Express.
 */
export const cookieParser = (req, res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};

  if (cookieHeader && typeof cookieHeader === 'string') {
    const pairs = cookieHeader.split(';');
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].trim();
      const eqIdx = pair.indexOf('=');
      if (eqIdx !== -1) {
        const key = pair.slice(0, eqIdx).trim();
        const rawVal = pair.slice(eqIdx + 1).trim();
        try {
          req.cookies[key] = decodeURIComponent(rawVal);
        } catch {
          req.cookies[key] = rawVal;
        }
      }
    }
  }

  next();
};
