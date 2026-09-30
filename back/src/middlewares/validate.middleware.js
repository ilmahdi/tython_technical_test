import { BadRequestError } from '../utils/errors.js';

export const validate = (schema) => (req, _res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.').replace(/^(body|query|params)\./, ''),
        location: issue.path[0],
        message: issue.message,
      }));
      throw new BadRequestError('Validation failed', details);
    }

    // Attach validated and transformed values safely (compatible with Express 5 getters)
    if (parsed.data.body) {
      req.body = parsed.data.body;
    }
    if (parsed.data.params && req.params) {
      Object.assign(req.params, parsed.data.params);
    }
    if (parsed.data.query && req.query) {
      for (const [key, value] of Object.entries(parsed.data.query)) {
        req.query[key] = value;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
