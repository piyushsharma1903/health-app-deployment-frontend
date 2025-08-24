import React, { useState, useEffect } from 'react';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, imageUrl, reportData }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [isOpen]);

  // Handle keyboard events (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset'; // Restore scroll
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Select best possible image URL
  const getImageUrl = () => {
    const possibleUrls = [
      reportData?.file_url,
      reportData?.file,
      imageUrl,
      reportData?.image_url,
      reportData?.url
    ];

    for (const url of possibleUrls) {
      if (
        url &&
        url !== 'undefined' &&
        url !== undefined &&
        url.trim() !== '' &&
        !url.includes('/undefined') &&
        url.startsWith('http')
      ) {
        return url;
      }
    }
    return null;
  };

  const displayUrl = getImageUrl();

  const handleRetry = () => {
    setImageError(false);
    setImageLoading(true);
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Medical Report</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {displayUrl ? (
            <div className="image-container">
              {/* Loading Spinner */}
              {imageLoading && !imageError && (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading image...</p>
                </div>
              )}
              
              {/* Error State */}
              {imageError && (
                <div className="error-message">
                  <h4>❌ Failed to Load Image</h4>
                  <p><strong>URL:</strong> <code>{displayUrl}</code></p>
                  
                  <div className="error-actions">
                    <button onClick={handleRetry} className="retry-button">
                      🔄 Retry
                    </button>
                    <a 
                      href={displayUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="direct-link-button"
                    >
                      🔗 Test Direct Link
                    </a>
                  </div>
                </div>
              )}

              {/* Actual Image */}
              {!imageError && (
                <img
                  src={displayUrl}
                  alt="Medical Report"
                  className="report-image"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{ display: imageLoading ? 'none' : 'block' }}
                />
              )}
            </div>
          ) : (
            <div className="no-image">
              <h4>📋 Image Not Available</h4>
              {!reportData ? (
                <p>❌ No report data was passed to this component.</p>
              ) : (
                <p>❌ The image URL is invalid or missing.</p>
              )}
            </div>
          )}

          {/* Report Information */}
          {reportData && (
            <div className="report-info">
              <h4>📋 Report Details</h4>
              
              {reportData.report_type && (
                <p><strong>Type:</strong> {reportData.report_type}</p>
              )}
              
              {reportData.report_date && (
                <p><strong>Date:</strong> {new Date(reportData.report_date).toLocaleDateString()}</p>
              )}
              
              {reportData.created_at && (
                <p><strong>Uploaded:</strong> {new Date(reportData.created_at).toLocaleDateString()}</p>
              )}
              
              {reportData.first_name && reportData.last_name && (
                <p><strong>Patient:</strong> {reportData.first_name} {reportData.last_name}</p>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="close-modal-btn">
            ❌ Close
          </button>
          
          {displayUrl && !imageError && (
            <a 
              href={displayUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="open-new-tab-btn"
            >
              🔗 Open in New Tab
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
