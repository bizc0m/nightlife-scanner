import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './EstablishmentDetail.css'

interface User {
  id: string
  email: string
  username: string
  role: string
}

interface Establishment {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  google_rating: number
  google_reviews_count: number
  phone?: string
  website?: string
  type: string
  description?: string
  status: string
}

interface EstablishmentDetailProps {
  user: User | null
}

const EstablishmentDetail = ({ user }: EstablishmentDetailProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchEstablishment = async () => {
      try {
        const response = await axios.get(`/api/establishments/${id}`)
        setEstablishment(response.data)
      } catch (err) {
        setError('Failed to load establishment details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEstablishment()
    }
  }, [id])

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">{error}</div>
  if (!establishment) return <div className="error">Establishment not found</div>

  return (
    <div className="establishment-detail">
      <button className="back-button" onClick={() => navigate('/')}>← Back to Map</button>

      <div className="detail-container">
        <div className="detail-header">
          <h1>{establishment.name}</h1>
          <div className="rating">
            <span className="stars">⭐ {establishment.google_rating}</span>
            <span className="reviews">({establishment.google_reviews_count} reviews)</span>
          </div>
        </div>

        <div className="detail-content">
          <div className="main-info">
            <div className="info-section">
              <h3>📍 Location</h3>
              <p>{establishment.address}</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(establishment.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                View on Google Maps
              </a>
            </div>

            <div className="info-section">
              <h3>📋 Details</h3>
              <div className="details-grid">
                <div>
                  <strong>Type:</strong>
                  <p>{establishment.type}</p>
                </div>
                <div>
                  <strong>Status:</strong>
                  <p>
                    <span className={`badge ${establishment.status === 'validated' ? 'green' : 'yellow'}`}>
                      {establishment.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {establishment.phone && (
              <div className="info-section">
                <h3>📞 Contact</h3>
                <p>
                  <a href={`tel:${establishment.phone}`}>
                    {establishment.phone}
                  </a>
                </p>
              </div>
            )}

            {establishment.website && (
              <div className="info-section">
                <h3>🌐 Website</h3>
                <p>
                  <a href={establishment.website} target="_blank" rel="noopener noreferrer">
                    Visit Website
                  </a>
                </p>
              </div>
            )}

            {establishment.description && (
              <div className="info-section">
                <h3>ℹ️ About</h3>
                <p>{establishment.description}</p>
              </div>
            )}
          </div>

          <div className="sidebar">
            {user && (
              <div className="action-card">
                <h3>Contribute</h3>
                <p>Help improve this venue by adding or updating information</p>
                <button className="primary" onClick={() => navigate('/contributor')}>
                  Add Information
                </button>
              </div>
            )}

            {!user && (
              <div className="action-card">
                <h3>Want to Help?</h3>
                <p>Sign up to contribute information about your favorite venues</p>
                <button className="primary" onClick={() => navigate('/register')}>
                  Register Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EstablishmentDetail
