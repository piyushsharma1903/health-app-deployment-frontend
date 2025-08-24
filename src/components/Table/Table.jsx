import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Table.css";
import { FaFileAlt } from "react-icons/fa";
import ReportModal from "../ReportModal/ReportModal";
import SummaryModal from "../SummaryModal/SummaryModal";
import { getAuth } from "firebase/auth";

const ReportTable = () => {
  const [reports, setReports] = useState([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null); // 🔧 FIXED: Store full report object
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async (user) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔍 User object:", user);
      console.log("🔍 User email:", user.email);
      console.log("🔍 User UID:", user.uid);
      
      // Get a fresh token
      const idToken = await user.getIdToken(true);
      console.log("🎫 Token generated (first 50 chars):", idToken.substring(0, 50) + "...");
      console.log("🎫 Token length:", idToken.length);
      
      // Verify token format
      const tokenParts = idToken.split('.');
      console.log("🎫 Token parts count:", tokenParts.length);
      
      const headers = {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      };
      
      console.log("📡 Request headers:", headers);
      console.log("📡 Making request to: http://127.0.0.1:8000/api/reports/");

      const response = await axios.get("http://127.0.0.1:8000/api/reports/", {
        headers: headers,
      });

      setReports(response.data);
      console.log("✅ Reports fetched successfully:", response.data);
      
      // 🔧 ADDED: Debug each report's file fields
      response.data.forEach((report, index) => {
        console.log(`📋 Report ${index + 1}:`, {
          id: report.id,
          file: report.file,
          file_url: report.file_url,
          report_type: report.report_type,
          report_date: report.report_date
        });
      });
      
    } catch (err) {
      console.error("❌ Full error object:", err);
      console.error("❌ Error response:", err.response);
      console.error("❌ Error status:", err.response?.status);
      console.error("❌ Error data:", err.response?.data);
      
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else {
        setError("Failed to fetch reports. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Wait a bit to ensure the user is fully authenticated
        setTimeout(() => {
          fetchReports(user);
        }, 500);
      } else {
        console.warn("⚠️ User is not logged in");
        setReports([]);
        setLoading(false);
        setError("Please log in to view reports.");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert("You must be logged in to delete a report.");
      return;
    }

    if (!window.confirm("Delete this report?")) {
      return;
    }

    try {
      const idToken = await user.getIdToken(true);
      
      await axios.delete(`http://127.0.0.1:8000/api/reports/${id}/`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      setReports((prev) => prev.filter((report) => report.id !== id));
      console.log("✅ Report deleted successfully");
    } catch (err) {
      console.error("❌ Deletion failed:", err);
      
      if (err.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      } else {
        alert("Failed to delete report. Please try again.");
      }
    }
  };

  const handleViewSummary = (report) => {
    setSelectedSummary({
      summary: report.ai_summary,
      reportType: report.report_type,
      reportDate: report.report_date,
    });
    setSummaryModalOpen(true);
  };

  // 🔧 FIXED: Handle viewing report image
  const handleViewReport = (report) => {
    console.log("🖼️ Opening report modal for:", report);
    console.log("📁 Report file field:", report.file);
    console.log("🔗 Report file_url field:", report.file_url);
    
    setSelectedReport(report); // Store the full report object
    setReportModalOpen(true);
  };

  const handleRetry = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      fetchReports(user);
    }
  };

  if (loading) {
    return (
      <div className="report-table-container">
        <h2>Reports History</h2>
        <div style={{ textAlign: "center", padding: "20px" }}>
          Loading reports...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-table-container">
        <h2>Reports History</h2>
        <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
          {error}
          <br />
          <button 
            onClick={handleRetry} 
            style={{ 
              marginTop: "10px", 
              padding: "8px 16px", 
              backgroundColor: "#007bff", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              cursor: "pointer" 
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-table-container">
      <h2>Reports History</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th>Report Date</th>
            <th>Report Type</th>
            <th>AI Summary</th>
            <th>Report Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.length > 0 ? (
            reports.map((report) => (
              <tr key={report.id}>
                <td>{report.report_date || "N/A"}</td>
                <td>{report.report_type}</td>
                <td>
                  <button
                    className="view-btn"
                    onClick={() => handleViewSummary(report)}
                  >
                    View
                  </button>
                </td>
                <td>
                  {/* 🔧 FIXED: Use correct function and check for valid file URL */}
                  <button
                    onClick={() => handleViewReport(report)}
                    style={{
                      backgroundColor: "transparent",
                      color: "#007bff",
                      padding: "6px 12px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    title="View Report Image"
                    disabled={!report.file_url && !report.file} // Disable if no file
                  >
                    <FaFileAlt />
                  </button>
                  
                  {/* 🔧 ADDED: Debug info for each row in development */}
                  
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(report.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No reports yet
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 🔧 FIXED: Pass both reportData and imageUrl props */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setSelectedReport(null); // Clear selected report when closing
        }}
        reportData={selectedReport}  // ✅ Pass the full report object
        imageUrl={selectedReport?.file_url || selectedReport?.file} // ✅ Use correct field names
      />

      <SummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        summary={selectedSummary?.summary}
        reportType={selectedSummary?.reportType}
        reportDate={selectedSummary?.reportDate}
      />
    </div>
  );
};

export default ReportTable;