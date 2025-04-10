const seller = async (req, res, next) => {
  if (!req.user.isSeller) {
    return res
      .status(403)
      .json({ message: "Access denied. Seller privileges required." });
  }
  next();
};

module.exports = seller;
