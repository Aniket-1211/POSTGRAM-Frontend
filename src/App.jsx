import { Navigate, Route, Routes } from 'react-router-dom'
import AppNavbar from './components/AppNavbar.jsx'
import FeedPage from './pages/FeedPage.jsx'
import SignInPage from './pages/SignInPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import AddPostPage from './pages/AddPostPage.jsx'
import MyPostsPage from './pages/MyPostsPage.jsx'

const isAuthenticated = () => Boolean(localStorage.getItem('authToken'))

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />
  }
  return children
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/feed" replace />
  }
  return children
}

function App() {
  return (
    <>
      <AppNavbar />
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signin"
          element={
            <PublicOnlyRoute>
              <SignInPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/add-post"
          element={
            <ProtectedRoute>
              <AddPostPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-posts"
          element={
            <ProtectedRoute>
              <MyPostsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </>
  )
}

export default App
