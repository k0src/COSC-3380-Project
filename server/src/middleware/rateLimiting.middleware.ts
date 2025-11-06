import rateLimit from "express-rate-limit";

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too Many Requests",
    message: "Too many requests, please try again later",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: "Too Many Requests",
    message: "Too many requests, please try again later",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    return res.statusCode < 400;
  },
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too Many Requests",
    message: "Too many requests, please try again later",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
