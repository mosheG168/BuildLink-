export const QK = {
  me: ["me"],

  posts: ["posts"],
  post: (id) => ["post", id],
  recommendedPosts: ["posts", "recommended-for-me"],
  myPosts: (userId) => ["my-posts", userId],
  comments: (postId) => ["comments", postId],
  myRequests: ["myRequests"],
  myRequestForPost: (postId) => ["myRequestForPost", postId],
  myJobs: ["myJobs"],
  pipeline: (column, params) => ["pipeline", column, params], // e.g. "pending"
  notifications: {
    unreadCount: ["notifications", "unread-count"],
    list: ["notifications", "list"],
  },
};
