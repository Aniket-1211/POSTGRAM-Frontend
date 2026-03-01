# Social Media PRD and Implementation Checklist

## 1. Product Overview
Build core social features on top of current auth system:
1. Users can create and delete posts.
2. Users can comment on posts.
3. Users can reply to comments (comment-on-comment).
4. Users can like or unlike posts.
5. Users can like or unlike comments.
6. Users can delete their own comments/replies and remove their own likes.

## 2. Goals
1. Enable meaningful social engagement around user-generated content.
2. Keep interactions fast and intuitive on web.
3. Enforce clear ownership and permissions for create/delete actions.
4. Ship a stable MVP with extensibility for notifications, feeds, and media.

## 3. Non-Goals (MVP)
1. No private messaging.
2. No advanced ranking/recommendation feed.
3. No hashtags/search system.
4. No edit history/versioning.
5. No moderation queue tooling (phase 2+).

## 4. User Stories
1. As a user, I can create a post with text content.
2. As a user, I can delete my own post.
3. As a user, I can comment on a post.
4. As a user, I can reply to a comment.
5. As a user, I can delete my own comment or reply.
6. As a user, I can like/unlike posts and comments.
7. As a user, I can see counts and whether I already liked an item.
8. As a user, I can view a post thread with comments and nested replies.

## 5. Functional Requirements
1. Authentication required for all create/delete/like/comment actions.
2. Post scope for MVP: create, read feed/post detail, delete own post.
3. Comment scope: create top-level comment, create reply, delete own comment/reply.
4. Like scope: toggle like for post/comment, unique like per user per target.
5. Deletion behavior:
   1. Deleting a post removes associated comments/replies/likes (cascade).
   2. Deleting a comment removes child replies and likes for that comment thread item.
6. Ownership rules: users can delete only their own posts/comments/likes.
7. Validation: post/comment text required with length limit.
8. Pagination required for feed and comments.
9. Clear API error codes/messages (400/401/403/404/500).

## 6. Permissions Matrix
1. Create Post: authenticated user.
2. Delete Post: post owner only.
3. Create Comment/Reply: authenticated user.
4. Delete Comment/Reply: comment owner only.
5. Like/Unlike Post: authenticated user.
6. Like/Unlike Comment: authenticated user.

## 7. Data Model (MVP)
1. User
2. Post: _id, authorId, content, createdAt, updatedAt, likeCount, commentCount, isDeleted
3. Comment: _id, postId, authorId, parentCommentId (nullable), content, createdAt, updatedAt, likeCount, replyCount, isDeleted
4. Like: _id, userId, targetType (post|comment), targetId, createdAt
5. Unique index: (userId, targetType, targetId)

## 8. API Requirements (MVP)
1. POST /api/posts
2. GET /api/posts?page=&limit=
3. GET /api/posts/:postId
4. DELETE /api/posts/:postId
5. POST /api/posts/:postId/comments
6. POST /api/comments/:commentId/replies
7. DELETE /api/comments/:commentId
8. POST /api/posts/:postId/likes/toggle
9. POST /api/comments/:commentId/likes/toggle
10. GET /api/posts/:postId/comments?page=&limit=

## 9. UX Requirements
1. Feed screen with post composer and list of posts.
2. Post card with like button, comment button, delete button (owner only).
3. Comments section with nested replies.
4. Like buttons show active state for user-like.
5. Confirmation modal before deleting posts/comments.
6. Toasts for success and errors.
7. Loading and empty states for feed/comments.
8. Mobile responsive layout.

## 10. Non-Functional Requirements
1. API p95 target under 300ms for common reads.
2. Basic rate limiting for spam protection.
3. Input sanitization for XSS risk reduction.
4. Unit/integration tests for auth and ownership flows.

## 11. Milestones
1. Phase 1: Models + protected APIs for posts/comments/replies/likes.
2. Phase 2: Frontend feed/thread UI and interaction controls.
3. Phase 3: Pagination optimization, validation hardening, tests.
4. Phase 4: Moderation/admin capabilities and notifications.

## 12. Open Questions
1. One-level replies vs deep nesting?
2. Hard delete vs soft delete?
3. Edit post/comment in MVP?
4. Toggle endpoint vs separate create/delete for likes?
5. Admin moderation in MVP or phase 2?

## 13. Implementation Checklist (Mapped to Current Project)

### Backend: Create or Update
1. backend/models/Post.js
2. backend/models/Comment.js
3. backend/models/Like.js
4. backend/controllers/postController.js
5. backend/controllers/commentController.js
6. backend/controllers/likeController.js
7. backend/routes/postRoutes.js
8. backend/routes/commentRoutes.js
9. backend/routes/likeRoutes.js
10. backend/middleware/ownershipMiddleware.js
11. backend/server.js (mount new routes)
12. backend/.env.example (add any new config)

### Frontend: Create or Update
1. frontend/src/pages/FeedPage.jsx
2. frontend/src/components/PostComposer.jsx
3. frontend/src/components/PostCard.jsx
4. frontend/src/components/CommentList.jsx
5. frontend/src/components/CommentItem.jsx
6. frontend/src/services/api.js
7. frontend/src/services/authHeader.js
8. frontend/src/App.jsx (route /feed as protected)
9. frontend/src/components/AppNavbar.jsx (show Feed when logged in)
10. Optional: frontend/src/hooks/useAuth.js

### Phase 1: Data Models
1. Define Post, Comment, Like schemas.
2. Add unique like index.
3. Add indexes for feed/thread performance.

### Phase 2: APIs
1. Create posts endpoints.
2. Create comment/reply endpoints.
3. Create like toggle endpoints.
4. Protect write endpoints with auth middleware.

### Phase 3: Authorization
1. Owner-only delete checks for posts/comments.
2. Validate IDs and return consistent errors.
3. Cascade cleanup on deletions.

### Phase 4: Frontend Integration
1. Build API service with auth header attachment.
2. Render feed and post composer.
3. Implement like/comment/reply/delete interactions.
4. Add toasts and loading/error states.

### Phase 5: QA
1. Unauthenticated write requests return 401.
2. Create post/comment/reply flows work.
3. Like toggles are idempotent and unique.
4. Owner deletes pass, non-owner deletes fail.
5. Protected route redirects are correct.
6. Frontend and backend builds pass.
