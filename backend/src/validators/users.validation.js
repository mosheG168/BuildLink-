import Joi from "joi";
import sharedRoles from "../../../shared/roles.js";
const { ROLES, ROLE_LIST } = sharedRoles;

export const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*\-]).{9,}$/;

export const israeliPhonePattern = /^(?:\+972|0)5[0-9](?:[- ]?\d){7}$/;

const nameSchema = Joi.object({
  first: Joi.string().trim().min(2).max(256).required().messages({
    "string.base": "First name must be text",
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name must be at most 256 characters",
    "any.required": "First name is required",
  }),
  middle: Joi.string().trim().allow("").max(256).messages({
    "string.max": "Middle name must be at most 256 characters",
  }),
  last: Joi.string().trim().min(2).max(256).required().messages({
    "string.base": "Last name must be text",
    "string.min": "Last name must be at least 2 characters",
    "string.max": "Last name must be at most 256 characters",
    "any.required": "Last name is required",
  }),
})
  .required()
  .messages({ "any.required": "Name is required" });

const imageSchema = Joi.object({
  url: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .allow("")
    .messages({
      "string.uri": "Image URL must be a valid http(s) URI",
    }),
  alt: Joi.string().allow("").max(256),
}).optional();

const addressSchema = Joi.object({
  country: Joi.string().trim().min(2).max(256).required().messages({
    "string.min": "Country must be at least 2 characters",
    "string.max": "Country must be at most 256 characters",
    "any.required": "Country is required",
  }),
  city: Joi.string().trim().min(2).max(256).required().messages({
    "string.min": "City must be at least 2 characters",
    "string.max": "City must be at most 256 characters",
    "any.required": "City is required",
  }),
  street: Joi.string().trim().min(2).max(256).required().messages({
    "string.min": "Street must be at least 2 characters",
    "string.max": "Street must be at most 256 characters",
    "any.required": "Street is required",
  }),

  houseNumber: Joi.alternatives()
    .try(Joi.number().min(1).max(9999), Joi.string().pattern(/^\d{1,4}$/))
    .required()
    .messages({
      "number.base": "House number must be a number",
      "number.min": "House number must be at least 1",
      "number.max": "House number must be at most 9999",
      "string.pattern.base": "House number must be 1–4 digits",
      "any.required": "House number is required",
    }),

  zip: Joi.alternatives()
    .try(Joi.number(), Joi.string().pattern(/^\d{5,7}$/))
    .required()
    .messages({
      "number.base": "Zip must be a number",
      "string.pattern.base": "Zip must be 5–7 digits",
      "any.required": "Zip is required",
    }),
})
  .required()
  .messages({ "any.required": "Address is required" });

export const registerSchema = Joi.object({
  name: nameSchema,
  phone: Joi.string().trim().pattern(israeliPhonePattern).required().messages({
    "string.pattern.base":
      "Phone must be a valid Israeli mobile number (e.g., 05XXXXXXXX or +9725XXXXXXXX)",
    "any.required": "Phone is required",
  }),
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .min(5)
    .required()
    .messages({
      "string.email": "Email must be a valid email address",
      "string.min": "Email must be at least 5 characters",
      "any.required": "Email is required",
    }),
  password: Joi.string().pattern(passwordPattern).required().messages({
    "string.pattern.base":
      "Password must be ≥9 chars and include uppercase, lowercase, number, and a special character (!@#$%^&*-).",
    "any.required": "Password is required",
  }),
  image: imageSchema,
  address: addressSchema,
  isBusiness: Joi.boolean().required().messages({
    "boolean.base": "isBusiness must be true or false",
    "any.required": "isBusiness is required",
  }),
  role: Joi.string()
    .trim()
    .lowercase()
    .valid(...ROLE_LIST)
    .required()
    .messages({
      "any.only": `Role must be one of: ${ROLE_LIST.join(", ")}`,
      "any.required": "Role is required",
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Email must be a valid email address",
      "any.required": "Email is required",
    }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const updateSchema = Joi.object({
  name: nameSchema
    .fork(["first", "middle", "last"], (s) => s.optional())
    .optional(),
  phone: Joi.string().trim().pattern(israeliPhonePattern).messages({
    "string.pattern.base":
      "Phone must be a valid Israeli mobile number (e.g., 05XXXXXXXX or +9725XXXXXXXX)",
  }),
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .min(5)
    .messages({
      "string.email": "Email must be a valid email address",
      "string.min": "Email must be at least 5 characters",
    }),

  image: imageSchema,
  address: addressSchema
    .fork(["country", "city", "street", "houseNumber", "zip"], (s) =>
      s.optional()
    )
    .optional(),
  isBusiness: Joi.boolean(),
  role: Joi.string().valid(...ROLE_LIST),
}).min(1);

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    "string.pattern.base":
      "New password must be ≥9 chars and include uppercase, lowercase, number, and a special character (!@#$%^&*-).",
  }),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string().pattern(passwordPattern).required().messages({
    "string.pattern.base":
      "Password must be ≥9 chars and include uppercase, lowercase, number, and a special character (!@#$%^&*-).",
    "any.required": "Password is required",
  }),
});

export const changeEmailSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .min(5)
    .required()
    .messages({
      "string.email": "Email must be a valid email address",
      "string.min": "Email must be at least 5 characters",
      "any.required": "Email is required",
    }),
});

const formatJoiErrors = (details) =>
  details.reduce((acc, d) => {
    const path = d.path.join(".");
    acc[path] = d.message.replace(/"/g, "");
    return acc;
  }, {});

export const validateUser = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: formatJoiErrors(error.details),
    });
  }

  req.body = value;
  next();
};
