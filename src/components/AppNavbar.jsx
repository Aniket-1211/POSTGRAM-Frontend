import { Link, useLocation, useNavigate } from 'react-router-dom'

function AppNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isLoggedIn = Boolean(localStorage.getItem('authToken'))
  const username = (() => {
    try {
      const raw = localStorage.getItem('authUser')
      if (!raw) {
        return ''
      }

      const parsed = JSON.parse(raw)
      if (parsed.username) {
        return parsed.username
      }

      return parsed.email ? String(parsed.email).split('@')[0] : ''
    } catch {
      return ''
    }
  })()

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    navigate('/signin')
  }

  const isPathActive = (path) => {
    const currentPath = location.pathname.replace(/\/+$/, '') || '/'
    const targetPath = path.replace(/\/+$/, '') || '/'
    return currentPath === targetPath
  }

  const navLinkStyle = (isActive) => ({
    color: isActive ? '#4A70A9' : '#f8f9fa',
    fontWeight: isActive ? 700 : 500
  })

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark"
      style={{
        background: '#AEB784',
        boxShadow: '0 2px 10px rgba(39, 71, 77, 0.24)'
      }}
    >
      <div className="container">
        <Link className="navbar-brand d-inline-flex align-items-center gap-2 fw-semibold" to={isLoggedIn ? '/feed' : '/signin'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M15.36 3.32a5.6 5.6 0 0 1-1.6.44 2.79 2.79 0 0 0 1.23-1.54 5.58 5.58 0 0 1-1.77.67A2.79 2.79 0 0 0 8.47 5.44 7.92 7.92 0 0 1 2.7 2.52a2.79 2.79 0 0 0 .86 3.72 2.76 2.76 0 0 1-1.26-.35v.04a2.79 2.79 0 0 0 2.24 2.73 2.8 2.8 0 0 1-1.26.05 2.79 2.79 0 0 0 2.6 1.94A5.6 5.6 0 0 1 1.6 12.8a7.9 7.9 0 0 0 4.28 1.25c5.14 0 7.95-4.26 7.95-7.95 0-.12 0-.24-.01-.36a5.68 5.68 0 0 0 1.54-1.42Z" />
          </svg>
          <span>POSTGRAM</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {!isLoggedIn && (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/signin"
                    style={navLinkStyle(isPathActive('/signin'))}
                    aria-current={isPathActive('/signin') ? 'page' : undefined}
                  >
                    Sign In
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/signup"
                    style={navLinkStyle(isPathActive('/signup'))}
                    aria-current={isPathActive('/signup') ? 'page' : undefined}
                  >
                    Sign Up
                  </Link>
                </li>
              </>
            )}
            {isLoggedIn && (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/feed"
                    style={navLinkStyle(isPathActive('/feed'))}
                    aria-current={isPathActive('/feed') ? 'page' : undefined}
                  >
                    Feed
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/add-post"
                    style={navLinkStyle(isPathActive('/add-post'))}
                    aria-current={isPathActive('/add-post') ? 'page' : undefined}
                  >
                    Add Post
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/my-posts"
                    style={navLinkStyle(isPathActive('/my-posts'))}
                    aria-current={isPathActive('/my-posts') ? 'page' : undefined}
                  >
                    My Posts
                  </Link>
                </li>
                {username && (
                  <li className="nav-item">
                    <span className="nav-link text-light fw-semibold" style={{ fontSize: '1rem' }}>
                      {username}
                    </span>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    type="button"
                    className="btn btn-link nav-link d-inline-flex align-items-center justify-content-center p-2"
                    onClick={handleLogout}
                    style={{ color: '#de3163', minWidth: '44px', minHeight: '44px' }}
                    aria-label="Logout"
                    title="Logout"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M6 2a1 1 0 0 0-1 1v2a.5.5 0 0 1-1 0V3a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a.5.5 0 0 1 1 0v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H6Z" />
                      <path d="M.146 8.354a.5.5 0 0 1 0-.708l2.5-2.5a.5.5 0 1 1 .708.708L1.707 7.5H8.5a.5.5 0 0 1 0 1H1.707l1.647 1.646a.5.5 0 0 1-.708.708l-2.5-2.5Z" />
                    </svg>
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default AppNavbar
