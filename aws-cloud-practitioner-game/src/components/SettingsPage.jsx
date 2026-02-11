import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, UserIcon, CameraIcon, PaletteIcon, KeyIcon, BarChartIcon, TrashIcon, ImageIcon, RefreshIcon, CheckIcon } from './Icons';
import { isAnalyticsOptedOut, setAnalyticsOptOut } from '../services/analytics';
import './SettingsPage.css';

// Constants
const EMOJI_OPTIONS = ['🤖', '🎓', '🚀', '☁️', '🧠', '💻', '🔥', '⚡', '🎯', '🏆', '💡', '🔒', '🌟', '📚', '🎮', '💎'];
const COLOR_OPTIONS = [
  '#ff9900', '#58a6ff', '#3fb950', '#f85149', '#d29922', '#bc8cff',
  '#56d4dd', '#f778ba', '#6e7681', '#e6edf3', '#388bfd', '#ff6b6b'
];

// Generate deterministic pattern from seed string
const generatePattern = (seed, bgColor = '#58a6ff') => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Simple hash from seed
  let hash = 0;
  const str = seed + (typeof window.__patternSalt !== 'undefined' ? window.__patternSalt : '');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 128, 128);

  // Draw geometric shapes
  const rng = (n) => { hash = (hash * 16807 + 1) & 0x7fffffff; return hash % n; };
  const shapeCount = 4 + rng(4);

  ctx.globalAlpha = 0.3;
  for (let i = 0; i < shapeCount; i++) {
    const x = rng(128);
    const y = rng(128);
    const size = 16 + rng(40);
    const r = 150 + rng(105);
    const g = 150 + rng(105);
    const b = 150 + rng(105);
    ctx.fillStyle = `rgb(${r},${g},${b})`;

    const shape = rng(3);
    if (shape === 0) {
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    } else if (shape === 1) {
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y - size / 2);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.lineTo(x - size / 2, y + size / 2);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Symmetric overlay (mirror left half to right)
  const imageData = ctx.getImageData(0, 0, 64, 128);
  const mirrorCanvas = document.createElement('canvas');
  mirrorCanvas.width = 64;
  mirrorCanvas.height = 128;
  mirrorCanvas.getContext('2d').putImageData(imageData, 0, 0);
  ctx.save();
  ctx.translate(128, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(mirrorCanvas, 0, 0);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.85);
};

// Resize and center-crop image to 128x128
const resizeImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Center crop
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 128, 128);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const SettingsPage = ({ onBack }) => {
  const {
    user, userData, isGuest,
    changeUserPassword, changeDisplayName, updateAvatar, deleteUserAccount, refreshUserData
  } = useAuth();

  // Display name state
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);

  // Avatar state
  const [avatarTab, setAvatarTab] = useState('emoji');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [patternDataUrl, setPatternDataUrl] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);
  const fileInputRef = useRef(null);

  // Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  // Analytics state
  const [analyticsOptOut, setAnalyticsOptOutState] = useState(isAnalyticsOptedOut());

  // Delete state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePw, setDeletePw] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(null);

  const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com');

  // Load existing avatar on mount
  useEffect(() => {
    if (userData?.avatar) {
      const { type, value, bgColor } = userData.avatar;
      if (bgColor) setSelectedColor(bgColor);
      if (type === 'emoji' && value) {
        setSelectedEmoji(value);
        setAvatarTab('emoji');
      } else if (type === 'pattern') {
        setAvatarTab('pattern');
      } else if (type === 'image' && value) {
        setUploadedImage(value);
        setAvatarTab('image');
      }
    }
  }, [userData?.avatar]);

  // Generate pattern on mount and when color changes
  useEffect(() => {
    if (user?.uid) {
      setPatternDataUrl(generatePattern(user.uid, selectedColor));
    }
  }, [user?.uid, selectedColor]);

  // Preview avatar based on current selections
  const getPreviewAvatar = useCallback(() => {
    if (avatarTab === 'emoji' && selectedEmoji) {
      return { type: 'emoji', display: selectedEmoji, bgColor: selectedColor };
    }
    if (avatarTab === 'pattern' && patternDataUrl) {
      return { type: 'pattern', display: null, imgSrc: patternDataUrl, bgColor: selectedColor };
    }
    if (avatarTab === 'image' && uploadedImage) {
      return { type: 'image', display: null, imgSrc: uploadedImage, bgColor: selectedColor };
    }
    if (avatarTab === 'color') {
      const initials = (userData?.displayName || user?.displayName || user?.email || '?')[0].toUpperCase();
      return { type: 'initials', display: initials, bgColor: selectedColor };
    }
    // Default: initials
    const initials = (userData?.displayName || user?.displayName || user?.email || '?')[0].toUpperCase();
    return { type: 'initials', display: initials, bgColor: selectedColor };
  }, [avatarTab, selectedEmoji, selectedColor, patternDataUrl, uploadedImage, userData, user]);

  const preview = getPreviewAvatar();

  // Save display name
  const handleSaveDisplayName = async () => {
    setNameMsg(null);
    const trimmed = newDisplayName.trim();
    if (!trimmed || trimmed.length < 2) {
      setNameMsg({ type: 'error', text: 'Display name must be at least 2 characters' });
      return;
    }
    if (trimmed.length > 30) {
      setNameMsg({ type: 'error', text: 'Display name must be 30 characters or less' });
      return;
    }
    setNameSaving(true);
    const result = await changeDisplayName(trimmed);
    setNameSaving(false);
    if (result.success) {
      setNameMsg({ type: 'success', text: 'Display name updated!' });
      setEditingName(false);
      setTimeout(() => setNameMsg(null), 3000);
    } else {
      setNameMsg({ type: 'error', text: result.error });
    }
  };

  // Save avatar
  const handleSaveAvatar = async () => {
    setAvatarSaving(true);
    setAvatarMsg(null);

    let avatarData;
    if (avatarTab === 'emoji' && selectedEmoji) {
      avatarData = { type: 'emoji', value: selectedEmoji, bgColor: selectedColor };
    } else if (avatarTab === 'pattern' && patternDataUrl) {
      avatarData = { type: 'pattern', value: patternDataUrl, bgColor: selectedColor };
    } else if (avatarTab === 'image' && uploadedImage) {
      avatarData = { type: 'image', value: uploadedImage, bgColor: selectedColor };
    } else {
      avatarData = { type: 'initials', value: null, bgColor: selectedColor };
    }

    const result = await updateAvatar(avatarData);
    setAvatarSaving(false);
    setAvatarMsg(result.success ? { type: 'success', text: 'Avatar saved!' } : { type: 'error', text: result.error });

    if (result.success) {
      setTimeout(() => setAvatarMsg(null), 3000);
    }
  };

  // Handle image upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarMsg({ type: 'error', text: 'Please select an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg({ type: 'error', text: 'Image must be under 5MB' });
      return;
    }

    try {
      const dataUrl = await resizeImage(file);
      setUploadedImage(dataUrl);
      setAvatarMsg(null);
    } catch (err) {
      setAvatarMsg({ type: 'error', text: 'Failed to process image' });
    }
  };

  // Regenerate pattern
  const handleRegeneratePattern = () => {
    window.__patternSalt = (window.__patternSalt || 0) + 1;
    setPatternDataUrl(generatePattern(user.uid, selectedColor));
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (currentPw === newPw) {
      setPwMsg({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setPwSaving(true);
    const result = await changeUserPassword(currentPw, newPw);
    setPwSaving(false);

    if (result.success) {
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwMsg(null), 3000);
    } else {
      setPwMsg({ type: 'error', text: result.error });
    }
  };

  // Toggle analytics
  const handleAnalyticsToggle = () => {
    const newValue = !analyticsOptOut;
    setAnalyticsOptOutState(newValue);
    setAnalyticsOptOut(newValue);
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setDeleting(true);
    setDeleteMsg(null);

    const result = await deleteUserAccount(isGoogleUser ? null : deletePw);
    setDeleting(false);

    if (result.success) {
      // Account deleted — onBack will redirect to home (AuthContext clears user)
      if (onBack) onBack();
    } else {
      setDeleteMsg({ type: 'error', text: result.error });
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (isGuest) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <button className="settings-back-btn" onClick={onBack}><ArrowLeftIcon size={18} /></button>
          <h1>Settings</h1>
        </div>
        <div className="settings-section">
          <p style={{ color: 'var(--md-on-surface-variant)' }}>
            Sign in with an email or Google account to access settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>
          <ArrowLeftIcon size={18} />
        </button>
        <h1>Account Settings</h1>
      </div>

      {/* Section 1: Account Info */}
      <div className="settings-section">
        <h2><UserIcon size={20} /> Account Information</h2>
        <div className="account-info-grid">
          <div className="account-info-item">
            <div className="info-label">Email</div>
            <div className="info-value">{user?.email || 'N/A'}</div>
          </div>
          <div className="account-info-item account-info-editable">
            <div className="info-label">Display Name</div>
            {editingName ? (
              <div className="inline-edit-row">
                <input
                  type="text"
                  className="settings-input inline-edit-input"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  maxLength={30}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveDisplayName(); if (e.key === 'Escape') setEditingName(false); }}
                />
                <button className="inline-edit-save" onClick={handleSaveDisplayName} disabled={nameSaving}>
                  {nameSaving ? '...' : <CheckIcon size={16} />}
                </button>
                <button className="inline-edit-cancel" onClick={() => { setEditingName(false); setNameMsg(null); }}>
                  &times;
                </button>
              </div>
            ) : (
              <div className="info-value info-value-editable" onClick={() => { setNewDisplayName(userData?.displayName || user?.displayName || ''); setEditingName(true); setNameMsg(null); }}>
                {userData?.displayName || user?.displayName || 'N/A'}
                <span className="edit-hint">click to edit</span>
              </div>
            )}
            {nameMsg && (
              <div className={`settings-${nameMsg.type}`} style={{ marginTop: 6 }}>{nameMsg.text}</div>
            )}
          </div>
          <div className="account-info-item">
            <div className="info-label">Auth Provider</div>
            <div className="info-value">{isGoogleUser ? 'Google' : 'Email / Password'}</div>
          </div>
          <div className="account-info-item">
            <div className="info-label">Member Since</div>
            <div className="info-value">{formatDate(userData?.createdAt)}</div>
          </div>
          <div className="account-info-item">
            <div className="info-label">Verification</div>
            <div className={`info-value ${user?.emailVerified ? 'verified' : 'unverified'}`}>
              {user?.emailVerified ? 'Verified' : 'Not Verified'}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Avatar */}
      <div className="settings-section">
        <h2><CameraIcon size={20} /> Profile Avatar</h2>
        <div className="avatar-section-content">
          {/* Preview */}
          <div className="avatar-preview-area">
            <div className="avatar-preview" style={{ backgroundColor: preview.bgColor }}>
              {preview.imgSrc ? (
                <img src={preview.imgSrc} alt="Avatar" />
              ) : (
                preview.display
              )}
            </div>
            <span className="avatar-preview-label">Preview</span>
          </div>

          {/* Tabs */}
          <div className="avatar-tabs">
            <button className={`avatar-tab ${avatarTab === 'emoji' ? 'active' : ''}`} onClick={() => setAvatarTab('emoji')}>
              Emoji
            </button>
            <button className={`avatar-tab ${avatarTab === 'pattern' ? 'active' : ''}`} onClick={() => setAvatarTab('pattern')}>
              Pattern
            </button>
            <button className={`avatar-tab ${avatarTab === 'color' ? 'active' : ''}`} onClick={() => setAvatarTab('color')}>
              Color
            </button>
            <button className={`avatar-tab ${avatarTab === 'image' ? 'active' : ''}`} onClick={() => setAvatarTab('image')}>
              Upload
            </button>
          </div>

          {/* Tab Content */}
          <div className="avatar-tab-content">
            {avatarTab === 'emoji' && (
              <>
                <div className="emoji-grid">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      className={`emoji-option ${selectedEmoji === emoji ? 'selected' : ''}`}
                      onClick={() => setSelectedEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {/* Color picker below emoji */}
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--md-on-surface-disabled)', marginBottom: 8 }}>Background Color</p>
                  <div className="color-swatches">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {avatarTab === 'pattern' && (
              <div className="pattern-area">
                <p style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)', textAlign: 'center' }}>
                  A unique geometric pattern generated from your account
                </p>
                <button className="regenerate-btn" onClick={handleRegeneratePattern}>
                  <RefreshIcon size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Regenerate
                </button>
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--md-on-surface-disabled)', marginBottom: 8 }}>Base Color</p>
                  <div className="color-swatches">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {avatarTab === 'color' && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)', marginBottom: 12, textAlign: 'center' }}>
                  Choose a background color for your initials
                </p>
                <div className="color-swatches">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
            )}

            {avatarTab === 'image' && (
              <div className="upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon size={32} />
                  <p>Click to upload an image</p>
                  <p className="upload-hint">JPG, PNG, GIF &mdash; max 5MB. Will be cropped to square.</p>
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          {avatarMsg && (
            <div className={`settings-${avatarMsg.type}`}>{avatarMsg.text}</div>
          )}
          <button
            className="save-avatar-btn"
            onClick={handleSaveAvatar}
            disabled={avatarSaving}
          >
            {avatarSaving ? 'Saving...' : 'Save Avatar'}
          </button>
        </div>
      </div>

      {/* Section 3: Change Password (email users only) */}
      {!isGoogleUser && (
        <div className="settings-section">
          <h2><KeyIcon size={20} /> Change Password</h2>
          <form className="password-form" onSubmit={handleChangePassword}>
            <div className="settings-input-group">
              <label>Current Password</label>
              <input
                type="password"
                className="settings-input"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
            <div className="settings-input-group">
              <label>New Password</label>
              <input
                type="password"
                className="settings-input"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                autoComplete="new-password"
              />
            </div>
            <div className="settings-input-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="settings-input"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>
            {pwMsg && (
              <div className={`settings-${pwMsg.type}`}>{pwMsg.text}</div>
            )}
            <button
              type="submit"
              className="password-submit-btn"
              disabled={pwSaving || !currentPw || !newPw || !confirmPw}
            >
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Section 4: Analytics */}
      <div className="settings-section">
        <h2><BarChartIcon size={20} /> Analytics Preferences</h2>
        <div className="analytics-toggle-row">
          <div className="analytics-toggle-info">
            <p>Opt out of Google Analytics</p>
            <p className="toggle-description">
              When enabled, no usage data will be collected. This applies to all AWS Study Hub sites on this browser.
            </p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={analyticsOptOut}
              onChange={handleAnalyticsToggle}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Section 5: Danger Zone */}
      <div className="settings-section danger-zone">
        <h2><TrashIcon size={20} /> Danger Zone</h2>
        <p className="danger-warning">
          <strong>Permanently delete your account.</strong> This action cannot be undone.
          All your progress, stats, and account data will be permanently removed.
        </p>
        <div className="delete-confirm-area">
          <div className="delete-type-confirm">
            <label>Type <code>DELETE</code> to confirm</label>
            <input
              type="text"
              className="settings-input"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder='Type "DELETE"'
              autoComplete="off"
            />
          </div>
          {!isGoogleUser && (
            <div className="settings-input-group">
              <label>Enter your password to confirm</label>
              <input
                type="password"
                className="settings-input"
                value={deletePw}
                onChange={(e) => setDeletePw(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
          )}
          {deleteMsg && (
            <div className={`settings-${deleteMsg.type}`}>{deleteMsg.text}</div>
          )}
          <button
            className="delete-btn"
            onClick={handleDeleteAccount}
            disabled={deleting || deleteConfirmText !== 'DELETE' || (!isGoogleUser && !deletePw)}
          >
            {deleting ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
