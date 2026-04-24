import React from 'react';
import type { ProcessedRow } from '../types';
import '../styles/DataTable.css';

interface DataTableProps {
  rows: ProcessedRow[];
  isProcessing: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ rows, isProcessing }) => {

  // 🟡 If no data
  if (rows.length === 0) {
    return (
      <div className="table-container">
        <p className="no-data">
          No data loaded. Please upload an Excel file first.
        </p>
      </div>
    );
  }

  // 📊 Get dynamic columns from Excel data
  const columns = Array.from(
    new Set(
      rows.flatMap((row) => Object.keys(row.data))
    )
  );

  // 🎯 Status class for styling
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'status-success';
      case 'failure':
        return 'status-failure';
      case 'processing':
        return 'status-processing';
      default:
        return 'status-pending';
    }
  };

  // 🎯 Status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '✅ Success';
      case 'failure':
        return '❌ Failure';
      case 'processing':
        return '⏳ Processing';
      default:
        return '○ Pending';
    }
  };

  return (
    <div className="table-container">

      <div className="table-wrapper">
        <table className="data-table">

          {/* 🔹 Table Header */}
          <thead>
            <tr>
              <th className="status-header">Status</th>

              {columns.map((col) => (
                <th key={col} className="data-header">
                  {col}
                </th>
              ))}

              <th className="response-header">Response Details</th>
            </tr>
          </thead>

          {/* 🔹 Table Body */}
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={`row-${row.status}`}>

                {/* Status */}
                <td className={`status-cell ${getStatusClass(row.status)}`}>
                  {getStatusText(row.status)}
                </td>

                {/* Dynamic Data Columns */}
                {columns.map((col) => (
                  <td key={`${row.id}-${col}`} className="data-cell">
                    {row.data[col] !== undefined && row.data[col] !== null
                      ? String(row.data[col])
                      : '-'}
                  </td>
                ))}

                {/* Response Section */}
                <td className="response-cell">
                  {(row.statusCode || row.error || row.response) && (
                    <div className="response-info">

                      {/* Status Code */}
                      {row.statusCode !== undefined && (
                        <div className="status-code">
                          Code: <strong>{row.statusCode}</strong>
                        </div>
                      )}

                      {/* Success Response */}
                      {row.response && (
                        <div className="response-text">
                          {row.response.length > 120
                            ? row.response.substring(0, 120) + '...'
                            : row.response}
                        </div>
                      )}

                      {/* Error */}
                      {row.error && (
                        <div className="error-text">
                          {row.error.length > 120
                            ? row.error.substring(0, 120) + '...'
                            : row.error}
                        </div>
                      )}

                    </div>
                  )}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* 📊 Summary Section */}
      <div className="table-summary">

        <div className="summary-item">
          <span className="summary-label">Total Rows:</span>
          <span className="summary-value">{rows.length}</span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Success:</span>
          <span className="summary-value success">
            {rows.filter((r) => r.status === 'success').length}
          </span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Failed:</span>
          <span className="summary-value error">
            {rows.filter((r) => r.status === 'failure').length}
          </span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Pending:</span>
          <span className="summary-value pending">
            {rows.filter((r) => r.status === 'pending').length}
          </span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Processing:</span>
          <span className="summary-value processing">
            {rows.filter((r) => r.status === 'processing').length}
          </span>
        </div>

        {isProcessing && (
          <div className="processing-indicator">
            ⏳ Processing requests...
          </div>
        )}

      </div>

    </div>
  );
};

export default DataTable;