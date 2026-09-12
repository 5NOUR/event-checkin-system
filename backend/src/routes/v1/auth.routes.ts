import { Router } from "express";
import * as authController from "../../controllers/authController";
import { authenticateToken } from "../../middleware/auth";
import { loginLimiter, strictLimiter } from "../../middleware/rateLimiter";
import { validate } from "../../middleware/validate";
import {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../validators/auth.validator";

const router = Router();

// ✅ Public
router.post(
  "/login",
  loginLimiter,
  validate({ body: loginSchema }),
  authController.login,
);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.post(
  "/forgot-password",
  strictLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  strictLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);

// ✅ Protected
router.get("/me", authenticateToken, authController.me);
router.post(
  "/change-password",
  authenticateToken,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);

export default router;
