const { verifyToken } = require("../utils/tokens");

function authenticate(req, res, next) {
  try {
    const [scheme, token] = String(req.headers.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) return res.status(401).json({ message: "Authentication required." });
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Your session is invalid or expired." });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have permission for this action." });
    next();
  };
}

module.exports = { authenticate, allowRoles };
