import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import FileUpload from './FileUpload';
import DataTable from './DataTable';
import type { ProcessedRow } from '../types';
import '../styles/Dashboard.css';

interface DashboardProps {
  token: string;
  apiConfig: {
    baseUrl: string;
    loginUrl: string;
    dataEndpoint: string;
  };
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ token, apiConfig, onLogout }) => {
  const [rows, setRows] = useState<ProcessedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const progressFillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${processingProgress}%`;
    }
  }, [processingProgress]);

  const handleFileUpload = (uploadedRows: ProcessedRow[]) => {
    setRows(uploadedRows);
    setProcessingProgress(0);
  };

  // ✅ ADDED: Build API body from Excel row
  const buildRequestBody = (data: any) => {
    return {
      fromAccountId: data.Loan_Id,
      fromAccountType: 1,
      toClientId: 58004,
      toAccountType: 2,
      toAccountId: 1,
      fromAccountTransferActionType: 5,
      toOfficeId: 1,
      transferAmount: Number(data.Overpaid_Amount),
      transferDate: "18 March 2026",
      transferDescription: "Auto transfer",
      locale: "en",
      dateFormat: "dd MMMM yyyy",
      fromClientId: Number(data.Client_Id),
      fromOfficeId: Number(data.office_id),
      savingsTags: []
    };
  };

  const handleRunProcessing = async () => {
    if (rows.length === 0) {
      alert('Please upload an Excel file first');
      return;
    }

    if (!apiConfig.dataEndpoint || apiConfig.dataEndpoint === '') {
      alert('Data endpoint not configured. Please update the API configuration.');
      return;
    }

    if (!token) {
      alert('No authentication token found. Please logout and log in again.');
      return;
    }

    setIsProcessing(true);
    const updatedRows = [...rows];

    try {
      console.log('Starting data processing...');
      console.log('Using endpoint:', apiConfig.dataEndpoint);
      console.log('Token available:', !!token);

      for (let i = 0; i < updatedRows.length; i++) {
        const row = updatedRows[i];
        
        row.status = 'processing';
        setRows([...updatedRows]);
        setProcessingProgress(Math.round(((i + 1) / updatedRows.length) * 100));

        try {
          // ✅ UPDATED: use mapped request body
          const requestBody = buildRequestBody(row.data);

          const response = await axios.post(apiConfig.dataEndpoint, requestBody, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          });

          console.log(`Row ${i + 1} processed successfully:`, response.status);

          row.status = 'success';
          row.statusCode = response.status;
          row.response = JSON.stringify(response.data);
        } catch (error: any) {
          console.error(`Row ${i + 1} processing failed:`, error.message);
          
          row.status = 'failure';
          row.statusCode = error.response?.status || 0;
          row.error =
            error.response?.data?.message ||
            error.message ||
            'Unknown error occurred';
          row.response = JSON.stringify(error.response?.data || {});
        }

        setRows([...updatedRows]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    onLogout();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Excel Data Processor</h1>
          <p className="header-subtitle">Upload Excel files and process rows with API integration</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="controls-section">
          <div className="control-group">
            <h2>Step 1: Upload Excel File</h2>
            <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
          </div>

          <div className="control-group">
            <h2>Step 2: Process Rows</h2>
            <div className="process-controls">
              <button
                className="run-button"
                onClick={handleRunProcessing}
                disabled={rows.length === 0 || isProcessing}
              >
                {isProcessing ? ' Processing...' : ' Run Processing'}
              </button>

              {rows.length > 0 && (
                <div className="row-info">
                  <span>{rows.length} rows ready for processing</span>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="progress-section">
                <div className="progress-bar">
                  <div className="progress-fill" ref={progressFillRef}></div>
                </div>
                <p className="progress-text">{processingProgress}% Complete</p>
              </div>
            )}
          </div>

          <div className="control-group">
            <h2>Step 3: Results</h2>
            <DataTable rows={rows} isProcessing={isProcessing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;