import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Dashboard.css'

interface User {
  id: string
  email: string
  username: string
  role: string
}

interface Contribution {
  id: string
  establishment_id: string
  establishment_name: string
  contribution_type: string
  status: string
  created_at: string
  validator_notes?: string
}

interface DashboardProps {
  user: User
  token: string
}

const Dashboard = ({ user, token }: DashboardProps) => {
  const navigate = useNavigate()
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('my-contributions')

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        setLoading(true)
        // This would fetch from API
        const headers = { Authorization: `Bearer ${token}` }
        // const response = await axios.get('/api/contributions/pending', { headers })
        // setContributions(response.data)
        // setPendingCount(response.data.filter((c: any) => c.status === 'pending').length)
      } catch (error) {
        console.error('Failed to fetch contributions:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user.role === 'validator' || user.role === 'admin') {
      fetchContributions()
    }
  }, [token, user.role])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📋 Contributor Dashboard</h1>
        <div className="header-info">
          <span className="user-badge">{user.username} • {user.role}</span>
          <button className="secondary" onClick={() => navigate('/')}>Back to Map</button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'my-contributions' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-contributions')}
        >
          My Contributions
        </button>
        {(user.role === 'validator' || user.role === 'admin') && (
          <button
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Reviews {pendingCount > 0 && <span className="badge-count">{pendingCount}</span>}
          </button>
        )}
        <button
          className={`tab ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          How to Contribute
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'my-contributions' && (
          <div className="tab-content">
            <h2>Your Contributions</h2>
            {loading ? (
              <div className="loading">Loading contributions...</div>
            ) : contributions.length === 0 ? (
              <div className="empty-state">
                <p>You haven't made any contributions yet</p>
                <button className="primary" onClick={() => navigate('/')}>
                  Go back to find venues
                </button>
              </div>
            ) : (
              <div className="contributions-list">
                {contributions.map((contrib) => (
                  <div key={contrib.id} className="contribution-item">
                    <div className="contribution-header">
                      <h3>{contrib.establishment_name}</h3>
                      <span className={`status-badge ${contrib.status}`}>
                        {contrib.status}
                      </span>
                    </div>
                    <p className="contribution-type">{contrib.contribution_type}</p>
                    <small className="date">{new Date(contrib.created_at).toLocaleDateString()}</small>
                    {contrib.validator_notes && (
                      <p className="validator-notes">💬 {contrib.validator_notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (user.role === 'validator' || user.role === 'admin') && (
          <div className="tab-content">
            <h2>Pending Reviews ({pendingCount})</h2>
            <p>Review and validate contributions from other users</p>
            <div className="empty-state">
              <p>No pending contributions to review</p>
            </div>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="tab-content guide">
            <h2>How to Contribute</h2>
            <div className="guide-content">
              <div className="guide-section">
                <h3>✨ What can you contribute?</h3>
                <ul>
                  <li><strong>Opening Hours:</strong> Update or add opening times</li>
                  <li><strong>Happy Hours:</strong> Add happy hour information and specials</li>
                  <li><strong>Specialties:</strong> Share what makes the venue unique</li>
                  <li><strong>Combos:</strong> Add special offers and combo deals</li>
                  <li><strong>Photos:</strong> Upload photos of the venue</li>
                  <li><strong>Contact Info:</strong> Update phone numbers and websites</li>
                </ul>
              </div>

              <div className="guide-section">
                <h3>📝 Guidelines for contributions</h3>
                <ul>
                  <li>Only edit information you can verify</li>
                  <li>Be accurate with dates and times</li>
                  <li>Use proper formatting for happy hours (e.g., "Mon-Fri 5-7pm")</li>
                  <li>Keep descriptions clear and concise</li>
                  <li>No spam or promotional content</li>
                  <li>Photos should be clear and recent</li>
                </ul>
              </div>

              <div className="guide-section">
                <h3>🎯 Best practices</h3>
                <ul>
                  <li>Contribute accurate, up-to-date information</li>
                  <li>Include specific details (drink types, event nights, etc.)</li>
                  <li>Help other users find great places to go</li>
                  <li>Validators review contributions within 24 hours</li>
                  <li>Top contributors get special recognition</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
