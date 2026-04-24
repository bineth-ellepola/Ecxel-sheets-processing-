import React from 'react';
import type { ProcessedRow } from '../types';
import '../styles/DataTable.css';

interface DataTableProps {
  rows: ProcessedRow[];
  isProcessing: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ rows, isProcessing }) => {
  if (rows.length === 0) {
    return (
      <div className="table-container">
        <p className="no-data">No data loaded. Please upload an Excel file first.</p>
      </div>
    );
  }

  // Get all unique column names from the data
  const columns = Array.from(
    new Set(
      rows.reduce((acc: string[], row) => {
        return [...acc, ...Object.keys(row.data)];
      }, [])
    )
  );

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return ' Success';
      case 'failure':
        return ' Failure';
      case 'processing':
        return ' Processing';
      default:
        return '○ Pending';
    }
  };

  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table className="data-table">
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
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={`row-${row.status}`}>
                <td className={`status-cell ${getStatusClass(row.status)}`}>
                  {getStatusText(row.status)}
                </td>
                {columns.map((col) => (
                  <td key={`${row.id}-${col}`} className="data-cell">
                    {String(row.data[col] || '-')}
                  </td>
                ))}
                <td className="response-cell">
                  {row.statusCode && (
                    <div className="response-info">
                      <div className="status-code">
                        Code: <strong>{row.statusCode}</strong>
                      </div>
                      {row.response && (
                        <div className="response-text">
                          {row.response.substring(0, 100)}
                          {row.response.length > 100 ? '...' : ''}
                        </div>
                      )}
                      {row.error && (
                        <div className="error-text">
                          {row.error.substring(0, 100)}
                          {row.error.length > 100 ? '...' : ''}
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
        {isProcessing && <div className="processing-indicator"> Processing...</div>}
      </div>
    </div>
  );
};

export default DataTable;
