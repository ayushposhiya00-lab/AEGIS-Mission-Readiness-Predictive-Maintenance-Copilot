import React, { useState } from 'react';
import { X, ShieldPlus, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';
import { registerNewAsset } from '../../api/apiClient';

export default function RegisterAssetModal({ isOpen, onClose, onAssetRegistered }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    callsign: '',
    type: 'Aircraft',
    category: 'Combat Aircraft',
    operationalBase: 'Ambala Air Force Station',
    crewAssigned: 'Squadron 222 Tiger Sharks',
    flightHours: 950,
    vibration: 2.1,
    pressure: 2950,
    temp: 685,
    speed_rpm: 1650,
    torque_nm: 48,
    tool_wear_min: 85
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen) return null;

  const handleTypeChange = (newType) => {
    let cat = 'Combat Aircraft';
    let base = 'Ambala Air Force Station';
    let crew = 'Squadron 222 Tiger Sharks';
    let vib = 2.1;
    let pres = 2950;
    let temp = 685;

    if (newType === 'Ground Armor') {
      cat = 'Ground Armored Fleet';
      base = 'Jaisalmer Forward Armor Depot';
      crew = '14th Cavalry Heavy Armor';
      vib = 1.4;
      pres = 185;
      temp = 95;
    } else if (newType === 'Naval') {
      cat = 'Naval Strike Group';
      base = 'Western Naval Command, Mumbai';
      crew = 'Destroyer Squadron 15';
      vib = 1.1;
      pres = 310;
      temp = 410;
    } else if (newType === 'Air Defense') {
      cat = 'Air & Missile Defense';
      base = 'Northern Air Defense Grid';
      crew = 'Air Defense Regiment 501';
      vib = 0.8;
      pres = 220;
      temp = 55;
    }

    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: cat,
      operationalBase: base,
      crewAssigned: crew,
      vibration: vib,
      pressure: pres,
      temp: temp
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.name.trim()) {
      setError('Please provide both Asset ID and Platform Name.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      id: formData.id.trim().toUpperCase(),
      callsign: formData.callsign.trim().toUpperCase() || `${formData.id}-01`,
      flightHours: Number(formData.flightHours),
      vibration: Number(formData.vibration),
      pressure: Number(formData.pressure),
      temp: Number(formData.temp),
      speed_rpm: Number(formData.speed_rpm),
      torque_nm: Number(formData.torque_nm),
      tool_wear_min: Number(formData.tool_wear_min)
    };

    const res = await registerNewAsset(payload);
    setLoading(false);

    if (res.success && res.data) {
      setSuccessResult(res.data);
      if (onAssetRegistered) onAssetRegistered(res.data);
      setTimeout(() => {
        setSuccessResult(null);
        onClose();
      }, 1600);
    } else {
      setError(res.error || 'Failed to register asset. Please check backend connection.');
    }
  };

  const getTargetModel = () => {
    if (formData.type === 'Aircraft') return 'IMS Bearing Model (Vibration & Roller Bearing)';
    if (formData.type === 'Ground Armor') return 'AI4I 2020 Model (Torque, Thermal & Tool Wear)';
    if (formData.type === 'Naval') return 'IMS Bearing Model (Propulsion Shaft & Turbines)';
    return 'N-CMAPSS Model (Thermodynamic Flight Envelope)';
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="pro-card" style={{
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        border: '1px solid var(--border-medium)',
        background: 'var(--bg-surface)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-subtle)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldPlus size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Register Defense Combat Platform
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Add a new equipment asset with live sensor telemetry & automated ML model scoring
            </p>
          </div>
        </div>

        {/* Target ML Model Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          fontSize: '0.8rem',
          color: '#60a5fa'
        }}>
          <Cpu size={16} />
          <span>Active ML Scorer: <strong>{getTargetModel()}</strong></span>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#f87171',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successResult && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#34d399',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={18} />
            <div>
              <strong>Asset Registered Successfully!</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '2px' }}>
                Readiness Score: <strong>{successResult.readinessScore}%</strong> ({successResult.status.toUpperCase()}) &bull; Predicted RUL: {successResult.predictedRUL} days
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
            {/* Asset ID */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Asset Identifier *
              </label>
              <input
                type="text"
                placeholder="e.g. A-818, V-505, N-044"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Platform Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Platform Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rafale DH, Arjun Mk-II, INS Kolkata"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Callsign */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Callsign / Tactical Tag
              </label>
              <input
                type="text"
                placeholder="e.g. TIGER-01, BHISHMA-04"
                value={formData.callsign}
                onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Branch / Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Military Branch & Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <option value="Aircraft">Combat Aircraft (Fighters, Helicopters)</option>
                <option value="Ground Armor">Ground Armor (Tanks, Howitzers, UGVs)</option>
                <option value="Naval">Naval Strike Group (Destroyers, Submarines)</option>
                <option value="Air Defense">Air & Missile Defense (Radars, Missiles)</option>
              </select>
            </div>

            {/* Base */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Operational Deployment Base
              </label>
              <input
                type="text"
                value={formData.operationalBase}
                onChange={(e) => setFormData({ ...formData, operationalBase: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Flight / Operating Hours */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Operating / Flight Hours
              </label>
              <input
                type="number"
                value={formData.flightHours}
                onChange={(e) => setFormData({ ...formData, flightHours: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          {/* Telemetry Sensor Inputs Section */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 12px 0' }}>
              Live Telemetry & Sensor Parameters (Used by ML Model)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {/* Vibration */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  Vibration (G-RMS / mm/s)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.vibration}
                  onChange={(e) => setFormData({ ...formData, vibration: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem'
                  }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Baseline: 1.5 - 2.0 mm/s</span>
              </div>

              {/* Hydraulic Pressure */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  Hydraulic Pressure (PSI/bar)
                </label>
                <input
                  type="number"
                  value={formData.pressure}
                  onChange={(e) => setFormData({ ...formData, pressure: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem'
                  }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Safe Min: &gt;2800 PSI</span>
              </div>

              {/* Operating Temp */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  Operating Temp (°C)
                </label>
                <input
                  type="number"
                  value={formData.temp}
                  onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem'
                  }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Limit: &lt;720 °C</span>
              </div>

              {/* Armor Specifics (Speed, Torque, Tool Wear) */}
              {formData.type === 'Ground Armor' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      Speed (RPM)
                    </label>
                    <input
                      type="number"
                      value={formData.speed_rpm}
                      onChange={(e) => setFormData({ ...formData, speed_rpm: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      Torque (Nm)
                    </label>
                    <input
                      type="number"
                      value={formData.torque_nm}
                      onChange={(e) => setFormData({ ...formData, torque_nm: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      Mechanical Wear (min)
                    </label>
                    <input
                      type="number"
                      value={formData.tool_wear_min}
                      onChange={(e) => setFormData({ ...formData, tool_wear_min: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem'
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              {loading ? 'Evaluating with ML...' : 'Score with ML & Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
