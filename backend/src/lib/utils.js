import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const isProduction = process.env.NODE_ENV === "production";

  // For a split (cross-site) deployment, set COOKIE_SAMESITE=none which also
  // forces secure cookies. For same-origin deployment "lax"/"strict" is fine.
  const sameSite = process.env.COOKIE_SAMESITE || "strict";

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite, // CSRF protection (use "none" for cross-site deployments)
    secure: isProduction || sameSite === "none", // HTTPS-only in prod / cross-site
  });

  return token;
};
