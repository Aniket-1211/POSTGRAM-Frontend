import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const MY_POSTS_CACHE_KEY = 'myPostsCacheV1'
const MY_POSTS_CACHE_TTL_MS = 2 * 60 * 1000

function MyPostsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const shouldForceRefresh = Boolean(location.state?.refreshMyPosts)
  const didLoadRef = useRef(false)
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [focusedPostId, setFocusedPostId] = useState(null)
  const [likeLoadingMap, setLikeLoadingMap] = useState({})
  const [commentsByPost, setCommentsByPost] = useState({})
  const [commentsLoadingMap, setCommentsLoadingMap] = useState({})
  const [commentLikeLoadingMap, setCommentLikeLoadingMap] = useState({})
  const [commentDeleteLoadingMap, setCommentDeleteLoadingMap] = useState({})
  const [commentDraftByPost, setCommentDraftByPost] = useState({})
  const [commentSubmitLoadingMap, setCommentSubmitLoadingMap] = useState({})
  const [repliesByComment, setRepliesByComment] = useState({})
  const [replyOpenMap, setReplyOpenMap] = useState({})
  const [repliesLoadingMap, setRepliesLoadingMap] = useState({})
  const [replyDraftByComment, setReplyDraftByComment] = useState({})
  const [replySubmitLoadingMap, setReplySubmitLoadingMap] = useState({})
  const hasLoadedPostsRef = useRef(false)

  const currentUserId = (() => {
    try {
      const raw = localStorage.getItem('authUser')
      return raw ? JSON.parse(raw).id || '' : ''
    } catch {
      return ''
    }
  })()

  const focusedPost = useMemo(
    () => posts.find((post) => post._id === focusedPostId) || null,
    [posts, focusedPostId]
  )

  const readMyPostsCache = (userId) => {
    if (!userId) {
      return null
    }

    try {
      const raw = sessionStorage.getItem(MY_POSTS_CACHE_KEY)
      if (!raw) {
        return null
      }

      const parsed = JSON.parse(raw)
      const isExpired = Date.now() - (parsed.cachedAt || 0) > MY_POSTS_CACHE_TTL_MS
      const isWrongUser = parsed.userId !== userId
      const hasInvalidPosts = !Array.isArray(parsed.posts)
      if (isExpired || isWrongUser || hasInvalidPosts) {
        return null
      }

      return parsed.posts
    } catch {
      return null
    }
  }

  const writeMyPostsCache = (userId, nextPosts) => {
    if (!userId || !Array.isArray(nextPosts)) {
      return
    }

    try {
      sessionStorage.setItem(
        MY_POSTS_CACHE_KEY,
        JSON.stringify({
          userId,
          cachedAt: Date.now(),
          posts: nextPosts
        })
      )
    } catch {
      // Ignore cache write failures (quota/private mode)
    }
  }

  useEffect(() => {
    if (location.state?.toastMessage) {
      toast.success(location.state.toastMessage)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (didLoadRef.current) {
      return
    }
    didLoadRef.current = true

    const loadPosts = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) {
        toast.error('Please sign in first')
        setIsLoading(false)
        return
      }

      const cachedPosts = shouldForceRefresh ? null : readMyPostsCache(currentUserId)
      if (cachedPosts) {
        setPosts(cachedPosts)
        hasLoadedPostsRef.current = true
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/post/my?page=1&limit=50`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || 'Unable to load your posts')
        }

        const nextPosts = data.posts || []
        setPosts(nextPosts)
        writeMyPostsCache(currentUserId, nextPosts)
        hasLoadedPostsRef.current = true
      } catch (error) {
        toast.error(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [currentUserId, shouldForceRefresh])

  useEffect(() => {
    if (!hasLoadedPostsRef.current) {
      return
    }

    writeMyPostsCache(currentUserId, posts)
  }, [currentUserId, posts])

  const fetchComments = async (postId) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please sign in first')
      return
    }

    setCommentsLoadingMap((prev) => ({ ...prev, [postId]: true }))

    try {
      const response = await fetch(`${API_BASE_URL}/api/post/${postId}/comments?page=1&limit=100`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load comments')
      }

      setCommentsByPost((prev) => ({ ...prev, [postId]: data.comments || [] }))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setCommentsLoadingMap((prev) => ({ ...prev, [postId]: false }))
    }
  }

  const fetchReplies = async (commentId) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please sign in first')
      return
    }

    setRepliesLoadingMap((prev) => ({ ...prev, [commentId]: true }))

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/replies?page=1&limit=100`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load replies')
      }

      setRepliesByComment((prev) => ({ ...prev, [commentId]: data.replies || [] }))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setRepliesLoadingMap((prev) => ({ ...prev, [commentId]: false }))
    }
  }

  const openCommentsView = async (postId) => {
    setFocusedPostId(postId)
    if (!commentsByPost[postId]) {
      await fetchComments(postId)
    }
  }

  const closeCommentsView = () => {
    setFocusedPostId(null)
  }

  const handleToggleReplies = async (commentId) => {
    const isOpen = Boolean(replyOpenMap[commentId])
    if (isOpen) {
      setReplyOpenMap((prev) => ({ ...prev, [commentId]: false }))
      return
    }

    setReplyOpenMap((prev) => ({ ...prev, [commentId]: true }))
    if (!repliesByComment[commentId]) {
      await fetchReplies(commentId)
    }
  }

  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please sign in first')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/post/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete post')
      }

      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId))
      if (focusedPostId === postId) {
        setFocusedPostId(null)
      }
      toast.success('Post deleted successfully')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleToggleLike = async (postId) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please sign in first')
      return
    }

    if (likeLoadingMap[postId]) {
      return
    }

    setLikeLoadingMap((prev) => ({ ...prev, [postId]: true }))

    try {
      const response = await fetch(`${API_BASE_URL}/api/post/${postId}/likes/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to update like')
      }

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                likeCount: data.likeCount,
                likedByMe: data.likedByMe
              }
            : post
        )
      )
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLikeLoadingMap((prev) => ({ ...prev, [postId]: false }))
    }
  }

  const handleToggleCommentLike = async (postId, commentId) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please sign in first')
      return
    }

    if (commentLikeLoadingMap[commentId]) {
      return
    }

    setCommentLikeLoadingMap((prev) => ({ ...prev, [commentId]: true }))

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/likes/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to update comment like')
      }

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                likedByMe: data.likedByMe,
                likeCount: data.likeCount
              }
            : comment
        )
      }))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setCommentLikeLoadingMap((prev) => ({ ...prev, [commentId]: false }))
    }
  }

  const handleToggleReplyLike = async (parentCommentId, replyId) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please sign in first')
      return
    }

    if (commentLikeLoadingMap[replyId]) {
      return
    }

    setCommentLikeLoadingMap((prev) => ({ ...prev, [replyId]: true }))

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${replyId}/likes/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to update reply like')
      }

      setRepliesByComment((prev) => ({
        ...prev,
        [parentCommentId]: (prev[parentCommentId] || []).map((reply) =>
          reply._id === replyId
            ? {
                ...reply,
                likedByMe: data.likedByMe,
                likeCount: data.likeCount
              }
            : reply
        )
      }))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setCommentLikeLoadingMap((prev) => ({ ...prev, [replyId]: false }))
    }
  }

  const handleDeleteReply = async (postId, parentCommentId, reply) => {
    const replyId = reply?._id
    if (!replyId) {
      return
    }

    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please sign in first')
      return
    }

    if (commentDeleteLoadingMap[replyId]) {
      return
    }

    const shouldDelete = window.confirm('Delete this reply?')
    if (!shouldDelete) {
      return
    }

    setCommentDeleteLoadingMap((prev) => ({ ...prev, [replyId]: true }))

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${replyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete reply')
      }

      const removedCount = Math.max(Number(data.deletedCount) || 1, 1)

      setRepliesByComment((prev) => ({
        ...prev,
        [parentCommentId]: (prev[parentCommentId] || []).filter((item) => item._id !== replyId)
      }))

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((item) =>
          item._id === parentCommentId
            ? {
                ...item,
                replyCount: Math.max((item.replyCount || 0) - removedCount, 0)
              }
            : item
        )
      }))

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                commentCount: Math.max((post.commentCount || 0) - removedCount, 0)
              }
            : post
        )
      )

      toast.success(data.message || 'Reply deleted successfully')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setCommentDeleteLoadingMap((prev) => ({ ...prev, [replyId]: false }))
    }
  }
  const handleDeleteComment = async (postId, comment) => {
    const commentId = comment?._id
    if (!commentId) {
      return
    }

    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please sign in first')
      return
    }

    if (commentDeleteLoadingMap[commentId]) {
      return
    }

    const shouldDelete = window.confirm('Delete this comment? This will also remove all replies to it.')
    if (!shouldDelete) {
      return
    }

    setCommentDeleteLoadingMap((prev) => ({ ...prev, [commentId]: true }))

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete comment')
      }

      const removedCount = Math.max(Number(data.deletedCount) || 1, 1)

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((item) => item._id !== commentId)
      }))

      setRepliesByComment((prev) => {
        const next = { ...prev }
        delete next[commentId]
        return next
      })

      setReplyOpenMap((prev) => {
        const next = { ...prev }
        delete next[commentId]
        return next
      })

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                commentCount: Math.max((post.commentCount || 0) - removedCount, 0)
              }
            : post
        )
      )

      toast.success(data.message || 'Comment deleted successfully')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setCommentDeleteLoadingMap((prev) => ({ ...prev, [commentId]: false }))
    }
  }
  const handleAddComment = async (postId) => {
    const content = (commentDraftByPost[postId] || '').trim()
    if (!content) {
      toast.error('Comment cannot be empty')
      return
    }

    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please sign in first')
      return
    }

    if (commentSubmitLoadingMap[postId]) {
      return
    }

    setCommentSubmitLoadingMap((prev) => ({ ...prev, [postId]: true }))

    try {
      const response = await fetch(`${API_BASE_URL}/api/post/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to add comment')
      }

      setCommentDraftByPost((prev) => ({ ...prev, [postId]: '' }))

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [data.comment, ...(prev[postId] || [])]
      }))

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                commentCount: (post.commentCount || 0) + 1
              }
            : post
        )
      )
    } catch (error) {
      toast.error(error.message)
    } finally {
      setCommentSubmitLoadingMap((prev) => ({ ...prev, [postId]: false }))
    }
  }

  const handleAddReply = async (postId, comment) => {
    if (comment.author?._id === currentUserId) {
      toast.error('You cannot reply to your own comment')
      return
    }

    const commentId = comment._id
    const content = (replyDraftByComment[commentId] || '').trim()
    if (!content) {
      toast.error('Reply cannot be empty')
      return
    }

    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please sign in first')
      return
    }

    if (replySubmitLoadingMap[commentId]) {
      return
    }

    setReplySubmitLoadingMap((prev) => ({ ...prev, [commentId]: true }))

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to add reply')
      }

      setReplyDraftByComment((prev) => ({ ...prev, [commentId]: '' }))
      setReplyOpenMap((prev) => ({ ...prev, [commentId]: true }))

      setRepliesByComment((prev) => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), data.reply]
      }))

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((item) =>
          item._id === commentId
            ? {
                ...item,
                replyCount: (item.replyCount || 0) + 1
              }
            : item
        )
      }))

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                commentCount: (post.commentCount || 0) + 1
              }
            : post
        )
      )
    } catch (error) {
      toast.error(error.message)
    } finally {
      setReplySubmitLoadingMap((prev) => ({ ...prev, [commentId]: false }))
    }
  }

  return (
    <div
      className="min-vh-100"
      style={{
        background: 'linear-gradient(180deg, #f4fbff 0%, #eef8ff 45%, #e6f2ff 100%)'
      }}
    >
      <div className="container py-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-2">My Posts</h2>
        </div>

        {isLoading ? (
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status" aria-label="Loading"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4 text-center p-5 bg-white">
            <h5 className="fw-semibold mb-2">No posts yet</h5>
            <p className="text-muted mb-0">Create your first post from the Add Post page.</p>
          </div>
        ) : (
          <div
            className="row g-4"
            style={
              focusedPostId
                ? {
                    filter: 'blur(3px)',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }
                : undefined
            }
          >
            {posts.map((post) => (
              <div className="col-12 col-md-6 col-xl-4" key={post._id}>
                <article className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                  {post.imageLink ? (
                    <img src={post.imageLink} alt="Post visual" className="w-100" style={{ height: '210px', objectFit: 'cover' }} />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        height: '210px',
                        background: 'linear-gradient(135deg, #cfe8ff 0%, #b8dcff 100%)',
                        color: '#0f3556',
                        fontWeight: 600
                      }}
                    >
                      Text Post
                    </div>
                  )}
                  <div className="card-body d-flex flex-column">
                    <p className="mb-3 text-break" style={{ whiteSpace: 'pre-wrap' }}>
                      {post.content}
                    </p>
                    <div className="mt-auto d-flex justify-content-between align-items-center text-muted small gap-2">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                          onClick={() => openCommentsView(post._id)}
                          aria-label="Open comments"
                          title="Open comments"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 3a5 5 0 0 0-4.546 2.916A4.493 4.493 0 0 0 3 8c0 1.09.388 2.09 1.03 2.87L3 14l3.4-1.133c.51.135 1.047.207 1.6.207a5 5 0 1 0 0-10Zm0 1a4 4 0 1 1 0 8 4.95 4.95 0 0 1-1.6-.27l-.17-.058-1.91.636.606-1.818-.11-.169A3.49 3.49 0 0 1 4 8a4 4 0 0 1 4-4Z" />
                          </svg>
                          <span>{post.commentCount || 0}</span>
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm d-inline-flex align-items-center gap-1 ${post.likedByMe ? 'btn-danger' : 'btn-outline-danger'}`}
                          onClick={() => handleToggleLike(post._id)}
                          disabled={Boolean(likeLoadingMap[post._id])}
                          aria-label={post.likedByMe ? 'Unlike post' : 'Like post'}
                          title={post.likedByMe ? 'Unlike' : 'Like'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z" />
                          </svg>
                          <span>{post.likeCount || 0}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                          onClick={() => handleDeletePost(post._id)}
                          aria-label="Delete post"
                          title="Delete post"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Zm2 .5a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0V6Z" />
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H5V1.5A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5V2h2.5a1 1 0 0 1 1 1ZM6 2h4v-.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5V2Zm-2 2v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4H4Z" />
                          </svg>
                            <span> &nbsp;</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>

      {focusedPost && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(4, 18, 30, 0.35)', zIndex: 1050 }}
          onClick={closeCommentsView}
        >
          <article
            className="card border-0 shadow-lg rounded-4 w-100"
            style={{ maxWidth: '780px', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                <h5 className="mb-0">Post Comments</h5>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeCommentsView}>
                  Close
                </button>
              </div>

              {focusedPost.imageLink ? (
                <img
                  src={focusedPost.imageLink}
                  alt="Post visual"
                  className="w-100 rounded-3 mb-3"
                  style={{ maxHeight: '300px', objectFit: 'cover' }}
                />
              ) : null}

              <p className="mb-2 text-break" style={{ whiteSpace: 'pre-wrap' }}>
                {focusedPost.content}
              </p>
              <div className="d-flex justify-content-between text-muted small mb-3">
                <span>{new Date(focusedPost.createdAt).toLocaleDateString()}</span>
                <span>
                  {focusedPost.likeCount || 0} likes | {focusedPost.commentCount || (commentsByPost[focusedPost._id] || []).length || 0} comments
                </span>
              </div>

              <div className="d-flex gap-2 mb-3">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Write a comment..."
                  value={commentDraftByPost[focusedPost._id] || ''}
                  onChange={(event) =>
                    setCommentDraftByPost((prev) => ({ ...prev, [focusedPost._id]: event.target.value }))
                  }
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAddComment(focusedPost._id)}
                  disabled={Boolean(commentSubmitLoadingMap[focusedPost._id])}
                >
                  {commentSubmitLoadingMap[focusedPost._id] ? 'Adding...' : 'Add Comment'}
                </button>
              </div>

              {commentsLoadingMap[focusedPost._id] ? (
                <div className="text-muted small">Loading comments...</div>
              ) : (commentsByPost[focusedPost._id] || []).length === 0 ? (
                <div className="text-muted small">No comments yet.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {(commentsByPost[focusedPost._id] || []).map((comment) => {
                    const isOwnComment = comment.author?._id === currentUserId
                    const isReplyOpen = Boolean(replyOpenMap[comment._id])
                    const replies = repliesByComment[comment._id] || []

                    return (
                      <div key={comment._id} className="bg-light rounded-3 p-2">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div>
                            <div className="small fw-semibold text-dark">{comment.author?.username || 'User'}</div>
                            <div className="small text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                              {comment.content}
                            </div>
                          </div>
                          <div className="d-inline-flex align-items-center gap-1">
                            <button
                              type="button"
                              className={`btn btn-sm d-inline-flex align-items-center gap-1 ${comment.likedByMe ? 'btn-danger' : 'btn-outline-danger'}`}
                              onClick={() => handleToggleCommentLike(focusedPost._id, comment._id)}
                              disabled={Boolean(commentLikeLoadingMap[comment._id])}
                              aria-label={comment.likedByMe ? 'Unlike comment' : 'Like comment'}
                              title={comment.likedByMe ? 'Unlike comment' : 'Like comment'}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z" />
                              </svg>
                              <span>{comment.likeCount || 0}</span>
                            </button>
                            {isOwnComment && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                                onClick={() => handleDeleteComment(focusedPost._id, comment)}
                                disabled={Boolean(commentDeleteLoadingMap[comment._id])}
                                aria-label="Delete comment"
                                title="Delete comment"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Zm2 .5a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0V6Z" />
                                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H5V1.5A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5V2h2.5a1 1 0 0 1 1 1ZM6 2h4v-.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5V2Zm-2 2v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4H4Z" />
                                </svg>
                                <span>{commentDeleteLoadingMap[comment._id] ? 'Deleting...' : 'Delete'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleToggleReplies(comment._id)}
                          >
                            {isReplyOpen ? 'Hide Replies' : `Replies (${comment.replyCount || 0})`}
                          </button>

                        </div>

                        {isReplyOpen && (
                          <div className="mt-2 ms-3 border-start ps-2">
                            {!isOwnComment && (
                              <div className="d-flex gap-2 mb-2">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Write a reply..."
                                  value={replyDraftByComment[comment._id] || ''}
                                  onChange={(event) =>
                                    setReplyDraftByComment((prev) => ({ ...prev, [comment._id]: event.target.value }))
                                  }
                                />
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleAddReply(focusedPost._id, comment)}
                                  disabled={Boolean(replySubmitLoadingMap[comment._id])}
                                >
                                  {replySubmitLoadingMap[comment._id] ? 'Replying...' : 'Reply'}
                                </button>
                              </div>
                            )}

                            {repliesLoadingMap[comment._id] ? (
                              <div className="small text-muted">Loading replies...</div>
                            ) : replies.length === 0 ? (
                              <div className="small text-muted">No replies yet.</div>
                            ) : (
                              <div className="d-flex flex-column gap-1">
                                                                {replies.map((reply) => {
                                  const isOwnReply = reply.author?._id === currentUserId

                                  return (
                                    <div key={reply._id} className="bg-white rounded-2 p-2">
                                      <div className="d-flex justify-content-between align-items-start gap-2">
                                        <div>
                                          <div className="small fw-semibold text-dark">{reply.author?.username || 'User'}</div>
                                          <div className="small text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                                            {reply.content}
                                          </div>
                                        </div>
                                        <div className="d-inline-flex align-items-center gap-1">
                                          <button
                                            type="button"
                                            className={`btn btn-sm d-inline-flex align-items-center gap-1 ${reply.likedByMe ? 'btn-danger' : 'btn-outline-danger'}`}
                                            onClick={() => handleToggleReplyLike(comment._id, reply._id)}
                                            disabled={Boolean(commentLikeLoadingMap[reply._id])}
                                            aria-label={reply.likedByMe ? 'Unlike reply' : 'Like reply'}
                                            title={reply.likedByMe ? 'Unlike reply' : 'Like reply'}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                              <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z" />
                                            </svg>
                                            <span>{reply.likeCount || 0}</span>
                                          </button>
                                          {isOwnReply && (
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                                              onClick={() => handleDeleteReply(focusedPost._id, comment._id, reply)}
                                              disabled={Boolean(commentDeleteLoadingMap[reply._id])}
                                              aria-label="Delete reply"
                                              title="Delete reply"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Zm2 .5a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0V6Z" />
                                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H5V1.5A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5V2h2.5a1 1 0 0 1 1 1ZM6 2h4v-.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5V2Zm-2 2v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4H4Z" />
                                              </svg>
                                              {/* <span>{commentDeleteLoadingMap[reply._id] ? 'Deleting...' : 'Delete'}</span> */}
                                              <span>&nbsp;</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </article>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} />
    </div>
  )
}

export default MyPostsPage

