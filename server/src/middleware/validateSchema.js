const validateSchema = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.reduce((acc, err) => {
          acc[err.path[0]] = err.message;
          return acc;
        }, {});

        return res.status(400).json({
          message: "Validation error",
          errors,
        });
      }

      next();
    } catch (err) {
      console.error("Schema validation error:", err);
      res.status(500).json({
        message: "Internal server error during validation",
      });
    }
  };
};

module.exports = {
  validateSchema,
};
