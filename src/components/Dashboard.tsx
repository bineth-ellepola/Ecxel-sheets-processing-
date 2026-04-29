import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import FileUpload from './FileUpload';
import DataTable from './DataTable';
import { batchSaveResponses } from '../utils/responseAutoSaver';
import { autoLogin } from '../utils/authManager';
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
  const [isPaused, setIsPaused] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef(false);
  const pausedAtIndexRef = useRef(0);
  const currentTokenRef = useRef(token);
  const loginUrlRef = useRef(apiConfig.loginUrl);

  useEffect(() => {
    currentTokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${processingProgress}%`;
    }
  }, [processingProgress]);

  const handleFileUpload = (uploadedRows: ProcessedRow[]) => {
    setRows(uploadedRows);
    setProcessingProgress(0);
    setIsPaused(false);
    pauseRef.current = false;
    pausedAtIndexRef.current = 0;
  };

  const handlePause = () => {
    pauseRef.current = true;
    setIsPaused(true);
  };

  const handleResume = async () => {
    pauseRef.current = false;
    setIsPaused(false);
    await handleRunProcessing(pausedAtIndexRef.current);
  };

  // ✅ ADDED: Build API body from Excel row
  const buildRequestBody = (data: any) => {
    // Get current date in format "dd MMMM yyyy"
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const monthName = now.toLocaleString('en-US', { month: 'long' });
    const year = now.getFullYear();
    const currentDate = `${day} ${monthName} ${year}`;

    return {
      fromAccountId: data.Loan_Id,
      fromAccountType: 1,
      toClientId: 58004,
      toAccountType: 2,
      toAccountId: 1,
      fromAccountTransferActionType: 5,
      toOfficeId: 1,
      transferAmount: Number(data.Overpaid_Amount),
      transferDate: currentDate,
      transferDescription: "Overpaid loan transfer with Client saving Control A/c - Loan ID:",
      locale: "en",
      dateFormat: "dd MMMM yyyy",
      fromClientId: Number(data.Client_Id),
      fromOfficeId: Number(data.office_id),
      savingsTags: []
    };
  };

  const handleRunProcessing = async (startIndex: number = 0) => {
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
    setIsPaused(false);
    pauseRef.current = false;
    const updatedRows = [...rows];
    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;

    // Count already completed items
    for (let i = 0; i < startIndex; i++) {
      if (updatedRows[i].status === 'success') successCount++;
      if (updatedRows[i].status === 'failure') failureCount++;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`BATCH PROCESSING STARTED - ${updatedRows.length} rows`);
    console.log(`Endpoint: ${apiConfig.dataEndpoint}`);
    console.log(`Start Time: ${new Date().toLocaleTimeString()}`);
    console.log(`${'='.repeat(60)}\n`);

    // Retry logic with exponential backoff and auto-login on 401
    const retryPost = async (
      url: string,
      data: any,
      headers: any,
      maxRetries = 3
    ) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await axios.post(url, data, {
            headers,
            timeout: 60000, // Increased timeout for large files
          });
        } catch (error: any) {
          // If it's a 401 (token expired), try auto-login
          if (error.response?.status === 401) {
            console.log(`\n⚠️ TOKEN EXPIRED - Attempting automatic re-login...`);
            const newToken = await autoLogin(loginUrlRef.current);

            if (newToken) {
              console.log(`✓ Auto-login successful! Resuming processing with new token...`);
              currentTokenRef.current = newToken;
              localStorage.setItem('authToken', newToken);

              // Retry with new token
              try {
                return await axios.post(url, data, {
                  headers: {
                    ...headers,
                    'Authorization': `Bearer ${newToken}`,
                  },
                  timeout: 60000,
                });
              } catch (retryError: any) {
                throw new Error(
                  `Failed after auto-login: ${
                    retryError.response?.data?.message || retryError.message
                  }`
                );
              }
            } else {
              throw new Error('Auto-login failed - unable to obtain new token');
            }
          }

          // For other errors, retry with exponential backoff
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
            console.log(`  Retry attempt ${attempt}/${maxRetries} - Waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        }
      }
    };

    try {
      for (let i = startIndex; i < updatedRows.length; i++) {
        // Check if pause was requested
        if (pauseRef.current) {
          pausedAtIndexRef.current = i;
          console.log(`\n⏸️ PROCESSING PAUSED at row ${i + 1}/${updatedRows.length}`);
          break;
        }

        const row = updatedRows[i];
        const rowStartTime = Date.now();

        row.status = 'processing';
        setRows([...updatedRows]);
        setProcessingProgress(Math.round(((i + 1) / updatedRows.length) * 100));

        try {
          const requestBody = buildRequestBody(row.data);

          console.log(`Row ${i + 1}/${updatedRows.length} Processing...`);
          console.log(`  ClientId: ${requestBody.fromClientId}, Amount: ${requestBody.transferAmount}`);

          const response = await retryPost(
            apiConfig.dataEndpoint,
            requestBody,
            {
              'Authorization': `Bearer ${currentTokenRef.current}`,
              'Content-Type': 'application/json',
            }
          );

          const rowDuration = ((Date.now() - rowStartTime) / 1000).toFixed(2);
          console.log(`  ✓ SUCCESS (${rowDuration}s):`, response?.status);

          row.status = 'success';
          row.statusCode = response?.status || 200;
          row.response = JSON.stringify(response?.data || {});
          row.requestBody = requestBody;
          successCount++;
        } catch (error: any) {
          const rowDuration = ((Date.now() - rowStartTime) / 1000).toFixed(2);

          if (error.message === 'Auto-login failed - unable to obtain new token') {
            console.error(`  ✗ AUTO-LOGIN FAILED at row ${i + 1}`);
            alert('Session expired and automatic re-login failed. Please log in again.');
            handleLogout();
            break;
          }

          console.error(`  ✗ FAILED (${rowDuration}s):`, {
            status: error.response?.status,
            message: error.message,
            response: error.response?.data,
          });

          row.status = 'failure';
          row.statusCode = error.response?.status || 0;
          row.error =
            error.response?.data?.message ||
            error.response?.data?.userMessage ||
            error.message ||
            'Unknown error occurred';
          row.response = JSON.stringify(error.response?.data || {});
          row.requestBody = buildRequestBody(row.data);
          failureCount++;
        }

        setRows([...updatedRows]);
      }
    } finally {
      // ✅ AUTO-SAVE: Prepare batch responses
      const batchResponses = updatedRows
        .filter((row) => row.response)
        .map((row) => ({
          data: JSON.parse(row.response || '{}'),
          endpoint: apiConfig.dataEndpoint,
          status: row.statusCode || 0,
          clientId: String(row.data?.Client_Id),
          loanId: String(row.data?.Loan_Id),
          request: row.requestBody,
        }));

      if (pauseRef.current) {
        // PAUSED: Save responses collected so far
        console.log(`\n${'='.repeat(60)}`);
        console.log('⏸️ BATCH PROCESSING PAUSED');
        console.log(`Rows Processed: ${pausedAtIndexRef.current}/${updatedRows.length}`);
        console.log(`✓ Success: ${successCount}`);
        console.log(`✗ Failed: ${failureCount}`);
        console.log(`${'='.repeat(60)}\n`);

        if (batchResponses.length > 0) {
          batchSaveResponses(batchResponses);
          console.log('✓ Responses saved to file');
        }

        setIsProcessing(false);
      } else {
        // COMPLETED: Show full summary and save
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
        const averageTime = (Number(totalDuration) / updatedRows.length).toFixed(2);

        console.log(`\n${'='.repeat(60)}`);
        console.log('BATCH PROCESSING COMPLETED');
        console.log(`Total Rows: ${updatedRows.length}`);
        console.log(`✓ Success: ${successCount}`);
        console.log(`✗ Failed: ${failureCount}`);
        console.log(`Total Time: ${totalDuration}s`);
        console.log(`Average Time per Row: ${averageTime}s`);
        console.log(`End Time: ${new Date().toLocaleTimeString()}`);
        console.log(`${'='.repeat(60)}\n`);

        if (batchResponses.length > 0) {
          batchSaveResponses(batchResponses);
        }

        setIsProcessing(false);
        setIsPaused(false);
        pausedAtIndexRef.current = 0;
      }
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
                onClick={() => handleRunProcessing(0)}
                disabled={rows.length === 0 || isProcessing || isPaused}
              >
                {isProcessing ? ' Processing...' : ' Run Processing'}
              </button>

              {isProcessing && (
                <button
                  className="pause-button"
                  onClick={handlePause}
                >
                  ⏸️ Pause
                </button>
              )}

              {isPaused && (
                <button
                  className="resume-button"
                  onClick={handleResume}
                >
                  ▶️ Resume
                </button>
              )}

              {rows.length > 0 && (
                <div className="row-info">
                  <span>{rows.length} rows ready for processing</span>
                  {isPaused && (
                    <span className="paused-info">Paused at row {pausedAtIndexRef.current + 1}</span>
                  )}
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