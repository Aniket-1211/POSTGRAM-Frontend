import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function AddPostPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    content: '',
    imageLink: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.content.trim()) {
      toast.error('Post content is required')
      return
    }

    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Please sign in first')
      navigate('/signin')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: formData.content,
          imageLink: formData.imageLink
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to create post')
      }

      setFormData({ content: '', imageLink: '' })
      navigate('/my-posts', {
        state: {
          toastMessage: 'Post created successfully',
          refreshMyPosts: true
        }
      })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center"
      style={{
        background:
          'radial-gradient(circle at 20% 20%, #f7fff1 0%, #e7f9df 35%, #d9f4cd 100%)'
      }}
    >
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-7">
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-4 p-md-5">
                
                <h2 className="fw-bold mb-2 text-center">Share something</h2>
                <p className="text-muted mb-4 text-center">Add post content and optional image link.</p>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label fw-semibold">
                      Content
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      className="form-control"
                      rows="5"
                      maxLength={1000}
                      placeholder="What's on your mind?"
                      value={formData.content}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="imageLink" className="form-label fw-semibold">
                      Image Link (Optional)
                    </label>
                    <input
                      id="imageLink"
                      name="imageLink"
                      type="url"
                      className="form-control"
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageLink}
                      onChange={handleChange}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success btn-lg w-100 fw-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Posting...' : 'Create Post'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} />
    </div>
  )
}

export default AddPostPage
