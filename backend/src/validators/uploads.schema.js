import Joi from "joi";

export const subLicenseUploadSchema = Joi.object({
  originalname: Joi.string().required(),
  mimetype: Joi.string()
    .valid(
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp"
    )
    .required(),
  size: Joi.number()
    .max(5 * 1024 * 1024)
    .required(),
});
