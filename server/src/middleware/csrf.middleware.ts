import csrf from "@dr.pogodin/csurf";

export const csrfProtection = csrf({
  cookie: {
    key: "_csrf",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600000,
  },
  ignoreMethods: ["GET", "HEAD", "OPTIONS"],
});

export const provideCsrfToken = (req: any, res: any, next: any) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};
