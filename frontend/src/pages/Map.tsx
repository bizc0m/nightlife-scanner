import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Map.css'

interface User {
  id: string
  email: string
  username: string
  role: string
}

interface Establishment {
  id: string
  name: string
  latitude: number
  longitude: number
  google_rating: number
  address: string
  type: string
}

interface MapProps {
  user: User | null
  onLogout: () => void
}

const Map = ({ user, onLogout }: MapProps) => {
  const navigate = useNavigate()
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('Paris')
  const [ratingFilter, setRatingFilter] = useState(3)
  const [typeFilter, setTypeFilter] = useState('')
  const [mapCenter] = useState<[number, number]>([48.8566, 2.3522]) // Paris center

  useEffect(() => {
    // Fetch establishments for the city
    const fetchEstablishments = async () => {
      try {
        setLoading(true)
        // This would fetch from API based on city
        const response = await axios.get('/api/establishments/city/paris?validated_only=true')
        setEstablishments(response.data)
      } catch (error) {
        console.error('Failed to fetch establishments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEstablishments()
  }, [city])

  const filteredEstablishments = establishments.filter(est => {
    if (ratingFilter && est.google_rating < ratingFilter) return false
    if (typeFilter && est.type !== typeFilter) return false
    return true
  })

  // Default marker icon for Leaflet
  const defaultIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  return (
    <div className="map-page">
      <div className="map-header">
        <div className="header-content">
          <h1>🌙 Nightlife Scanner</h1>
          <p>Discover the best bars, clubs & pubs around you</p>
        </div>
        <div className="header-actions">
          {user ? (
            <>
              <span className="user-info">Welcome, {user.username}</span>
              {(user.role === 'contributor' || user.role === 'validator' || user.role === 'admin') && (
                <button className="primary" onClick={() => navigate('/contributor')}>
                  📝 Contributor Dashboard
                </button>
              )}
              <button className="secondary" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="primary" onClick={() => navigate('/login')}>Login</button>
              <button className="secondary" onClick={() => navigate('/register')}>Register</button>
            </>
          )}
        </div>
      </div>

      <div className="map-controls">
        <div className="control-group">
          <label>City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name"
          />
        </div>
        <div className="control-group">
          <label>Min Rating</label>
          <select value={ratingFilter} onChange={(e) => setRatingFilter(parseFloat(e.target.value))}>
            <option value={0}>All</option>
            <option value={3}>3+ stars</option>
            <option value={4}>4+ stars</option>
            <option value={4.5}>4.5+ stars</option>
          </select>
        </div>
        <div className="control-group">
          <label>Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="bar">Bar</option>
            <option value="club">Club</option>
            <option value="pub">Pub</option>
            <option value="lounge">Lounge</option>
          </select>
        </div>
        <button className="primary" onClick={() => window.location.reload()}>
          🔄 Refresh
        </button>
      </div>

      <div className="map-container">
        {loading ? (
          <div className="loading">Loading establishments...</div>
        ) : (
          <MapContainer center={mapCenter} zoom={13} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredEstablishments.map((est) => (
              <Marker key={est.id} position={[est.latitude, est.longitude]} icon={defaultIcon}>
                <Popup>
                  <div className="marker-popup">
                    <h3>{est.name}</h3>
                    <p className="address">{est.address}</p>
                    <p className="rating">⭐ {est.google_rating}/5</p>
                    <button
                      className="primary"
                      onClick={() => navigate(`/establishment/${est.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <div className="results-summary">
        <p>{filteredEstablishments.length} establishments found</p>
      </div>
    </div>
  )
}

export default Map
