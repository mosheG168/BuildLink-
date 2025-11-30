import Joi from "joi";
import mongoose from "mongoose";

const objectId = () =>
  Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "ObjectId validation")
    .messages({ "any.invalid": "Must be a valid Mongo ObjectId" });

export const createCommentBody = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
  post: objectId().required(),
  mentions: Joi.array().items(objectId()).default([]),
  parent: objectId().allow(null).optional(),
  publisher: Joi.forbidden(),
  date: Joi.forbidden(),
});

const sortValidator = Joi.string()
  .custom((v, helpers) => {
    const s = String(v || "").toLowerCase();
    const ok =
      /^(date|createdat)$/.test(s) ||
      /^-(date|createdat)$/.test(s) ||
      /^(date|createdat):(asc|desc|1|-1)$/.test(s) ||
      /^(asc|desc|1|-1)$/.test(s);

    if (!ok) {
      return helpers.error("any.invalid", { value: v });
    }
    return v;
  }, "sort token validation")
  .messages({
    "any.invalid":
      'Invalid sort. Use one of: "date", "-date", "createdAt", "-createdAt", "date:asc", "date:desc", "date:1", "date:-1", "createdAt:asc", "createdAt:desc", "createdAt:1", "createdAt:-1", "asc", "desc", "1", "-1".',
  })
  .default("date");

export const listCommentsQuery = Joi.object({
  post: objectId().required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string()
    .valid("date", "-date", "createdAt", "-createdAt")
    .default("date"),
});
