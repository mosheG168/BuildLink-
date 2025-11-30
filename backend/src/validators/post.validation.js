import Joi from "joi";

export const createPostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(160).required(),
  content: Joi.string().trim().min(10).max(5000).required(),
  location: Joi.string().trim().max(160).allow(""),
  salary: Joi.string().trim().max(160).allow(""),
  requirements: Joi.string().trim().max(2000).allow(""),
}).options({ abortEarly: false, stripUnknown: true });

export const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(160),
  content: Joi.string().trim().min(10).max(5000),
  location: Joi.string().trim().max(160).allow(""),
  salary: Joi.string().trim().max(160).allow(""),
  requirements: Joi.string().trim().max(2000).allow(""),
})
  .min(1)
  .options({ abortEarly: false, stripUnknown: true });

export const searchPostsSchema = Joi.object({
  query: Joi.string().min(1).max(100),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  sortBy: Joi.string().valid("date", "similarity").default("date"),
  publisher: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
});

export function validatePost(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: error.details?.[0]?.message || "Validation failed" });
    }
    req.body = value;
    next();
  };
}
