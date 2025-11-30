import Joi from "joi";

export const createJobRequestSchema = Joi.object({
  postId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  message: Joi.string().max(1000).allow(""),
});

export const listJobRequestsSchema = Joi.object({
  contractorId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  subcontractorId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  status: Joi.string().valid(
    "pending",
    "accepted",
    "denied",
    "cancelled",
    "withdrawn",
    "expired"
  ),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sortBy: Joi.string()
    .valid("createdAt", "updatedAt", "matchScore", "status")
    .default("createdAt"),
  sortDir: Joi.string().valid("asc", "desc").default("desc"),
});

export const inviteJobRequestSchema = Joi.object({
  postId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  subcontractorId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  note: Joi.string().max(1000).allow(""),
});
