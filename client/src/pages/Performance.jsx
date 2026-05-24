import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, AlertCircle, Plus, Sparkles, Send, Check } from 'lucide-react';

const Performance = () => {
  const { user, authFetch } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States for creating a review
  const [showAddModal, setShowAddModal] = useState(false);
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [reviewPeriod, setReviewPeriod] = useState('Q1 2026');
  
  // Rating Scores (1-5)
  const [ratingQuality, setRatingQuality] = useState(5);
  const [ratingComm, setRatingComm] = useState(5);
  const [ratingTeam, setRatingTeam] = useState(5);
  const [ratingDep, setRatingDep] = useState(5);

  const [strengths, setStrengths] = useState('');
  const [growthAreas, setGrowthAreas] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch reviews list
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/performance');
      if (res.success) {
        setReviews(res.data);
      }

      // Fetch employees list if manager/admin for review dropdown
      if (['admin', 'manager'].includes(user.role)) {
        const empRes = await authFetch('/employees');
        if (empRes.success) {
          // Filter out themselves from review list
          const list = empRes.data.filter(e => e._id !== user._id);
          setEmployeesList(list);
        }
      }
    } catch (err) {
      console.error('Error fetching performance audits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Submit new performance audit
  const handleCreateReview = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedEmp || !reviewPeriod) {
      setFormError('Please select an employee and period');
      return;
    }

    setFormLoading(true);
    try {
      const res = await authFetch('/performance', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: selectedEmp,
          reviewPeriod,
          ratings: {
            qualityOfWork: Number(ratingQuality),
            communication: Number(ratingComm),
            teamwork: Number(ratingTeam),
            dependability: Number(ratingDep),
          },
          feedback: {
            strengths,
            growthAreas,
          },
        }),
      });

      if (res.success) {
        setFormSuccess('Performance audit successfully compiled and logged in system!');
        
        // Find matching employee details to append locally
        const empDetails = employeesList.find(e => e._id === selectedEmp);
        const newReview = {
          ...res.data,
          employeeId: {
            name: empDetails.name,
            designation: empDetails.designation,
            department: empDetails.department,
          },
          reviewerId: {
            name: user.name,
            designation: user.designation,
          },
        };

        setReviews(prev => [newReview, ...prev]);
        setShowAddModal(false);

        // Reset
        setSelectedEmp('');
        setReviewPeriod('Q1 2026');
        setRatingQuality(5);
        setRatingComm(5);
        setRatingTeam(5);
        setRatingDep(5);
        setStrengths('');
        setGrowthAreas('');
      } else {
        setFormError(res.error || 'Failed to record audit');
      }
    } catch (err) {
      setFormError(err.message || 'Server connection error');
    } finally {
      setFormLoading(false);
    }
  };

  // Helper to calculate overall rating
  const getOverallRating = (ratings) => {
    if (!ratings) return 0;
    const { qualityOfWork, communication, teamwork, dependability } = ratings;
    return parseFloat(((qualityOfWork + communication + teamwork + dependability) / 4).toFixed(1));
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EM';
  };

  return (
    <div className="content-viewport">
      <div className="flex-between mb-6">
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>Performance Scorecards</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
            {user.role === 'employee'
              ? 'View compiled supervisor reviews, strengths, and growth objectives.'
              : 'Audit workforce competencies, ratings, and log professional summaries.'}
          </p>
        </div>

        {['admin', 'manager'].includes(user.role) && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Compile Performance Audit
          </button>
        )}
      </div>

      {/* Grid listing reviews cards */}
      {loading ? (
        <p className="text-muted" style={{ textAlign: 'center', padding: '4rem' }}>Filtering scorecards...</p>
      ) : reviews.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Loop audits */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {reviews.map((rev) => {
              const overall = getOverallRating(rev.ratings);
              return (
                <div key={rev._id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Card Header */}
                  <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-info mb-4" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>{rev.reviewPeriod}</span>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--heading-color)' }}>{rev.employeeId?.name}</h4>
                      <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.1rem' }}>
                        {rev.employeeId?.designation} • {rev.employeeId?.department}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '1.25rem', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
                        {overall}
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>OVERALL</span>
                    </div>
                  </div>

                  {/* Ratings linear bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Quality of Deliverables</span>
                        <span style={{ fontWeight: 600 }}>{rev.ratings.qualityOfWork} / 5</span>
                      </div>
                      <div className="gauge-track">
                        <div className="gauge-bar gauge-bar-primary" style={{ width: `${(rev.ratings.qualityOfWork / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Communication</span>
                        <span style={{ fontWeight: 600 }}>{rev.ratings.communication} / 5</span>
                      </div>
                      <div className="gauge-track">
                        <div className="gauge-bar gauge-bar-primary" style={{ width: `${(rev.ratings.communication / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Teamwork & Synergy</span>
                        <span style={{ fontWeight: 600 }}>{rev.ratings.teamwork} / 5</span>
                      </div>
                      <div className="gauge-track">
                        <div className="gauge-bar gauge-bar-primary" style={{ width: `${(rev.ratings.teamwork / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Dependability</span>
                        <span style={{ fontWeight: 600 }}>{rev.ratings.dependability} / 5</span>
                      </div>
                      <div className="gauge-track">
                        <div className="gauge-bar gauge-bar-primary" style={{ width: `${(rev.ratings.dependability / 5) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Strengths / Growth */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    {rev.feedback.strengths && (
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-success)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Core Strengths</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.15rem', lineHeight: '1.4' }}>{rev.feedback.strengths}</p>
                      </div>
                    )}
                    {rev.feedback.growthAreas && (
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-warning)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Growth Objectives</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.15rem', lineHeight: '1.4' }}>{rev.feedback.growthAreas}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer Auditor meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <Sparkles size={12} />
                    <span>Audited by: <strong>{rev.reviewerId?.name}</strong> ({rev.reviewerId?.designation})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
          <p className="text-muted">No periodic review scorecards submitted yet.</p>
        </div>
      )}

      {/* Compile Performance Audit Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ maxWidth: '640px' }}>
            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>Compile Professional Performance Audit</h3>

            {formError && (
              <div className="badge badge-danger mb-4" style={{ display: 'flex', width: '100%', padding: '0.75rem', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateReview}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Audit Candidate</label>
                  <select
                    className="form-select"
                    value={selectedEmp}
                    onChange={(e) => setSelectedEmp(e.target.value)}
                    required
                  >
                    <option value="">Select Employee...</option>
                    {employeesList.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Period</label>
                  <select
                    className="form-select"
                    value={reviewPeriod}
                    onChange={(e) => setReviewPeriod(e.target.value)}
                  >
                    <option value="Q1 2026">Q1 2026</option>
                    <option value="Q2 2026">Q2 2026</option>
                    <option value="Q3 2026">Q3 2026</option>
                    <option value="Q4 2026">Q4 2026</option>
                    <option value="Annual 2026">Annual 2026</option>
                  </select>
                </div>
              </div>

              {/* Rating sliders */}
              <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                  Auditing Score Matrix (1 to 5)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 1.5rem' }}>
                  <div className="form-group">
                    <div className="flex-between">
                      <label className="form-label">Quality of Work</label>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>{ratingQuality} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={ratingQuality}
                      onChange={(e) => setRatingQuality(e.target.value)}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <div className="flex-between">
                      <label className="form-label">Communication</label>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>{ratingComm} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={ratingComm}
                      onChange={(e) => setRatingComm(e.target.value)}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <div className="flex-between">
                      <label className="form-label">Teamwork & Synergy</label>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>{ratingTeam} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={ratingTeam}
                      onChange={(e) => setRatingTeam(e.target.value)}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <div className="flex-between">
                      <label className="form-label">Dependability</label>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>{ratingDep} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={ratingDep}
                      onChange={(e) => setRatingDep(e.target.value)}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Strengths and Growth Areas */}
              <div className="form-group">
                <label className="form-label">Core Strengths Summary</label>
                <textarea
                  className="form-textarea"
                  placeholder="Detail primary achievements, architectural excellence, or leadership contributions..."
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  style={{ minHeight: '60px' }}
                ></textarea>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Growth Areas & Objectives</label>
                <textarea
                  className="form-textarea"
                  placeholder="Detail growth directives, future milestones, or communication channels to improve..."
                  value={growthAreas}
                  onChange={(e) => setGrowthAreas(e.target.value)}
                  style={{ minHeight: '60px' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  <Send size={16} /> {formLoading ? 'Recording...' : 'Broadcast Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
