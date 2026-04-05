import Joi from "joi";

export const googleAuthValidation = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  avatar: Joi.string().required(),
});
