import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import type { RowData, ProcessedRow } from '../types';
import '../styles/FileUpload.css';

interface FileUploadProps {
  onFileUpload: (rows: ProcessedRow[]) => void;
  isProcessing: boolean;
}

interface ExcelSheet {
  name: string;
  rowCount: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState('');
  const [sheets, setSheets] = React.useState<ExcelSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = React.useState<string>('');
  const [workbookData, setWorkbookData] = React.useState<Record<string, RowData[]>>({});

  const processSheet = (sheetName: string) => {
    const jsonData = workbookData[sheetName];

    if (!jsonData || jsonData.length === 0) {
      alert(`No rows found in sheet: ${sheetName}`);
      return;
    }

    // Convert to ProcessedRow format
    const processedRows: ProcessedRow[] = jsonData.map((row, index) => ({
      id: `sheet-${sheetName}-row-${index}`,
      data: row,
      status: 'pending',
    }));

    console.log(`Processing sheet: ${sheetName} with ${processedRows.length} rows`);
    setSelectedSheet(sheetName);
    onFileUpload(processedRows);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSelectedSheet('');
    setSheets([]);
    setWorkbookData({});

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          alert('No sheets found in the Excel file');
          return;
        }

        console.log('Available sheets:', workbook.SheetNames);

        // Extract data from all sheets
        const sheetList: ExcelSheet[] = [];
        const allData: Record<string, RowData[]> = {};

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          // Start reading from row 5 (skip first 4 rows) - use header row 5 and data below
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          range.s.r = 0; // Start from row 5 (0-indexed, so 4 = row 5)
          const jsonData: RowData[] = XLSX.utils.sheet_to_json(worksheet, { range, defval: '' });

          if (jsonData.length > 0) {
            allData[sheetName] = jsonData;
            sheetList.push({
              name: sheetName,
              rowCount: jsonData.length,
            });
          }
        });

        if (sheetList.length === 0) {
          alert('No data found in any sheets');
          setFileName('');
          return;
        }

        setSheets(sheetList);
        setWorkbookData(allData);
        // Auto-select first sheet
        setSelectedSheet(sheetList[0].name);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Error parsing Excel file. Please ensure it is a valid Excel file.');
        setFileName('');
        setSheets([]);
        setWorkbookData({});
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="file-upload-container">
      <div className="upload-section">
        <button
          className="upload-button"
          onClick={handleClick}
          disabled={isProcessing}
          type="button"
        >
           Choose Excel File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .xlsm, .csv"
          onChange={handleFileChange}
          className="file-input-hidden"
          aria-label="Upload Excel file"
          disabled={isProcessing}
        />
      </div>

      {fileName && (
        <div className="file-info">
          <p className="file-name"> {fileName}</p>
          
          {sheets.length > 0 && (
            <div className="sheets-section">
              <p className="sheets-label"> Available Sheets:</p>
              <div className="sheets-list">
                {sheets.map((sheet) => (
                  <button
                    key={sheet.name}
                    className={`sheet-button ${selectedSheet === sheet.name ? 'active' : ''}`}
                    onClick={() => processSheet(sheet.name)}
                    disabled={isProcessing}
                    type="button"
                  >
                    <span className="sheet-name">{sheet.name}</span>
                    <span className="sheet-rows">{sheet.rowCount} rows</span>
                  </button>
                ))}
              </div>
              {selectedSheet && (
                <p className="selected-sheet">
                   Selected Sheet: <strong>{selectedSheet}</strong> ({workbookData[selectedSheet]?.length || 0} rows)
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
