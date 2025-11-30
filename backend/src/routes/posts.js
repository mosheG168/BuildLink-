import { Router } from "express";
import auth from "../middleware/auth.js";
import maybeAuth from "../middleware/maybeAuth.js";
import {
  createPost,
  getPost,
  listPosts,
  recommendedPostsForMe,
  recommendedSubsForPost,
  searchPosts,
  searchSimilarPosts,
  updatePost,
  deletePost,
} from "../controllers/posts.controller.js";
import {
  createPostSchema,
  updatePostSchema,
  validatePost,
} from "../validators/post.validation.js";

const router = Router();

router.get("/recommended-for-me", auth, recommendedPostsForMe);
router.get("/subs-recommended/:postId", auth, recommendedSubsForPost);

router.post("/", auth, validatePost(createPostSchema), createPost);
router.get("/", maybeAuth, listPosts);
router.get("/search", searchPosts);
router.post("/search/similar", searchSimilarPosts);
router.get("/:id", maybeAuth, getPost);
router.patch("/:id", auth, validatePost(updatePostSchema), updatePost);
router.delete("/:id", auth, deletePost);

export default router;
