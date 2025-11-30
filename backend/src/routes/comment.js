import { Router } from "express";
import {
  createComment,
  listComments,
  deleteComment,
  updateComment,
  getCommentById,
  listReplies,
} from "../controllers/comment.controller.js";
import {
  createCommentBody,
  listCommentsQuery,
} from "../validators/comment.validation.js";
import auth from "../middleware/auth.js";

const router = Router();

const validate =
  (schema, part = "body") =>
  (req, res, next) => {
    const { value, error } = schema.validate(req[part], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        error: "ValidationError",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }
    if (part === "body") req.body = value;
    else if (part === "query") req._validatedQuery = value;
    else req[part] = value;
    next();
  };

router.post("/", auth, validate(createCommentBody, "body"), createComment);
router.get("/", validate(listCommentsQuery, "query"), listComments);
router.get("/:id", getCommentById);
router.get("/:id/replies", listReplies);
router.patch("/:id", auth, updateComment);
router.delete("/:id", auth, deleteComment);

export default router;
