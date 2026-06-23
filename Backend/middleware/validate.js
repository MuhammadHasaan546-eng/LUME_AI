const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const messages = error.details.map((detail) => detail.message).join(", ");
    return res.status(400).json({ message: messages });
  }

  next();
};

export default validate;
