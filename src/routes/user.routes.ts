import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../schemas/user.schema";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";

const router = Router();

router.get("/", getUsers);
router.get("/:id", validate(userIdParamSchema), getUserById);
router.post("/", validate(createUserSchema), createUser);
router.patch("/:id", validate(updateUserSchema), updateUser);
router.delete("/:id", validate(userIdParamSchema), deleteUser);

export default router;
