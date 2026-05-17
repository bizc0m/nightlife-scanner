import { useState } from 'react'
import axios from 'axios'
import './BatchUpload.css'

interface VenueFormData {
  name: string
  address: string
  latitude: number
  longitude: number
  phone?: string
  website?: string
  type?: string
  google_rating?: number
  foursquare_rating?: number
  music_type?: string[]
  crowd_type?: string
  noise_level?: string
  price_tier?: string
  atmosphere_tags?: string[]
  hours?: Array<{ day: number; open: string; close: string; closed?: boolean }>
  happy_hours?: Array<{ day: number; start: string; end: string; offer: string; drinks?: string[]; discount?: number }>
  specialties?: Array<{ category: string; name: string; description?: string }>
  combos?: Array<{ name: string; description?: string; price?: number; discount?: number }>
  events?: Array<{ name: string; day: number; time: string }>
  notes?: string
}

interface BatchUploadProps {
  token: string
  userId: string
  onUploadComplete?: (result: any) => void
}

const BatchUpload = ({ token, userId, onUploadComplete }: BatchUploadProps) => {
  const [cityId, setCityId] = useState('')
  const [venues, setVenues] = useState<VenueFormData[]>([
    {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      type: 'bar',
      music_type: [],
      atmosphere_tags: [],
      hours: [],
      happy_hours: [],
      specialties: [],
      combos: [],
      events: []
    }
  ])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const updateVenue = (index: number, field: keyof VenueFormData, value: any) => {
    const updated = [...venues]
    updated[index] = { ...updated[index], [field]: value }
    setVenues(updated)
  }

  const addVenue = () => {
    setVenues([
      ...venues,
      {
        name: '',
        address: '',
        latitude: 0,
        longitude: 0,
        type: 'bar',
        music_type: [],
        atmosphere_tags: [],
        hours: [],
        happy_hours: [],
        specialties: [],
        combos: [],
        events: []
      }
    ])
  }

  const removeVenue = (index: number) => {
    setVenues(venues.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploading(true)

    try {
      const response = await axios.post(
        '/api/scans/batch',
        {
          user_id: userId,
          city_id: cityId,
          venues: venues.filter(v => v.name && v.address)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setResult(response.data)
      setVenues([
        {
          name: '',
          address: '',
          latitude: 0,
          longitude: 0,
          type: 'bar',
          music_type: [],
          atmosphere_tags: [],
          hours: [],
          happy_hours: [],
          specialties: [],
          combos: [],
          events: []
        }
      ])
      onUploadComplete?.(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="batch-upload">
      <h2>🎯 Batch Venue Upload</h2>

      {result && (
        <div className="result-summary success">
          <h3>✅ Upload Successful!</h3>
          <div className="result-stats">
            <div className="stat">
              <span className="label">Total Venues:</span>
              <span className="value">{result.total_venues}</span>
            </div>
            <div className="stat">
              <span className="label">Created:</span>
              <span className="value">{result.created}</span>
            </div>
            <div className="stat">
              <span className="label">Merged/Deduplicated:</span>
              <span className="value">{result.merged}</span>
            </div>
            <div className="stat">
              <span className="label">Points Earned:</span>
              <span className="value highlight">+{result.points_earned}</span>
            </div>
          </div>
          <button className="primary" onClick={() => setResult(null)}>
            Upload Another Batch
          </button>
        </div>
      )}

      {!result && (
        <form onSubmit={handleSubmit} className="batch-form">
          <div className="form-section">
            <label>Select City *</label>
            <input
              type="text"
              placeholder="City ID or name"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              required
            />
          </div>

          <div className="venues-section">
            <h3>Venues ({venues.length})</h3>

            {venues.map((venue, idx) => (
              <div key={idx} className="venue-card">
                <div className="venue-header">
                  <span className="venue-number">Venue #{idx + 1}</span>
                  {venues.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeVenue(idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group full">
                    <label>Name *</label>
                    <input
                      type="text"
                      placeholder="Venue name"
                      value={venue.name}
                      onChange={(e) => updateVenue(idx, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group full">
                    <label>Address *</label>
                    <input
                      type="text"
                      placeholder="Full address"
                      value={venue.address}
                      onChange={(e) => updateVenue(idx, 'address', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Latitude *</label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="45.1234"
                      value={venue.latitude}
                      onChange={(e) => updateVenue(idx, 'latitude', parseFloat(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Longitude *</label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="5.7234"
                      value={venue.longitude}
                      onChange={(e) => updateVenue(idx, 'longitude', parseFloat(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={venue.type || 'bar'}
                      onChange={(e) => updateVenue(idx, 'type', e.target.value)}
                    >
                      <option value="bar">Bar</option>
                      <option value="club">Club</option>
                      <option value="pub">Pub</option>
                      <option value="lounge">Lounge</option>
                      <option value="nightclub">Nightclub</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      placeholder="+33 4 XX XX XX XX"
                      value={venue.phone || ''}
                      onChange={(e) => updateVenue(idx, 'phone', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Website</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={venue.website || ''}
                      onChange={(e) => updateVenue(idx, 'website', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Google Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      placeholder="4.5"
                      value={venue.google_rating || ''}
                      onChange={(e) => updateVenue(idx, 'google_rating', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Foursquare Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="7.5"
                      value={venue.foursquare_rating || ''}
                      onChange={(e) => updateVenue(idx, 'foursquare_rating', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Crowd Type</label>
                    <select
                      value={venue.crowd_type || ''}
                      onChange={(e) => updateVenue(idx, 'crowd_type', e.target.value)}
                    >
                      <option value="">Select...</option>
                      <option value="young">Young</option>
                      <option value="mixed">Mixed</option>
                      <option value="mature">Mature</option>
                      <option value="students">Students</option>
                      <option value="professionals">Professionals</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Noise Level</label>
                    <select
                      value={venue.noise_level || ''}
                      onChange={(e) => updateVenue(idx, 'noise_level', e.target.value)}
                    >
                      <option value="">Select...</option>
                      <option value="quiet">Quiet</option>
                      <option value="moderate">Moderate</option>
                      <option value="loud">Loud</option>
                      <option value="very_loud">Very Loud</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Price Tier</label>
                    <select
                      value={venue.price_tier || ''}
                      onChange={(e) => updateVenue(idx, 'price_tier', e.target.value)}
                    >
                      <option value="">Select...</option>
                      <option value="€">Cheap</option>
                      <option value="€€">Mid-range</option>
                      <option value="€€€">Expensive</option>
                      <option value="€€€€">Very Expensive</option>
                    </select>
                  </div>

                  <div className="form-group full">
                    <label>Atmosphere Tags (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="live music, cocktails, cozy, dance floor..."
                      value={(venue.atmosphere_tags || []).join(', ')}
                      onChange={(e) =>
                        updateVenue(idx, 'atmosphere_tags', e.target.value.split(',').map(t => t.trim()))
                      }
                    />
                  </div>

                  <div className="form-group full">
                    <label>Music Types (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="house, techno, reggae, funk..."
                      value={(venue.music_type || []).join(', ')}
                      onChange={(e) =>
                        updateVenue(idx, 'music_type', e.target.value.split(',').map(t => t.trim()))
                      }
                    />
                  </div>

                  <div className="form-group full">
                    <label>Additional Notes</label>
                    <textarea
                      placeholder="Any other details about the venue..."
                      value={venue.notes || ''}
                      onChange={(e) => updateVenue(idx, 'notes', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="secondary" onClick={addVenue}>
              + Add Another Venue
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="primary" disabled={uploading || !cityId || venues.filter(v => v.name && v.address).length === 0}>
              {uploading ? 'Uploading...' : `Upload ${venues.filter(v => v.name && v.address).length} Venue(s)`}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default BatchUpload
