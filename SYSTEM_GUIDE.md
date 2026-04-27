# Excel Data Processor - System Guide & Logging Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [How It Works](#how-it-works)
4. [Logging System](#logging-system)
5. [API Integration](#api-integration)
6. [Data Flow](#data-flow)
7. [Troubleshooting](#troubleshooting)
8. [Log Reference](#log-reference)

---

## 🎯 Overview

**Excel Data Processor** is a web-based tool that:
- ✅ Authenticates users with OAuth 2.0
- ✅ Uploads and processes Excel files (.xlsx, .xls, .xlsm, .csv)
- ✅ Reads data starting from row 5 as headers
- ✅ Posts data to Finflux API endpoints
- ✅ Tracks processing status in real-time
- ✅ Generates detailed processing logs
- ✅ Handles token expiration with auto-logout
- ✅ Retries failed requests with exponential backoff

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Login      │  │   Dashboard  │  │   Results    │       │
│  │  Component   │  │  Component   │  │  Component   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                          │                                    │
│  ┌──────────────┐  ┌─────┴──────┐  ┌──────────────┐        │
│  │  FileUpload  │  │  Logging   │  │   DataTable  │        │
│  │  Component   │  │  System    │  │  Component   │        │
│  └──────────────┘  └────────────┘  └──────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
              ┌────▼────┐      ┌────▼────┐
              │  OAuth  │      │ Account  │
              │  Login  │      │Transfers │
              │  API    │      │   API    │
              └─────────┘      └──────────┘
                   │                 │
                   ▼                 ▼
         ┌──────────────────────────────┐
         │  Finflux API Server          │
         │  sejaya-uat.finflux.io       │
         └──────────────────────────────┘
```

---

## ⚙️ How It Works

### Step 1: User Login
```flow
1. User enters credentials (Username & Password)
2. App sends OAuth request to: https://sejaya-uat.finflux.io/fineract-provider/api/oauth/token
3. Server returns access token
4. Token stored in localStorage
5. User redirected to Dashboard
```

**Console Log Example:**
```
[LOG] 2:45:30 PM - Sending login request to: https://sejaya-uat.finflux.io/fineract-provider/api/oauth/token
[LOG] 2:45:31 PM - Login response: {data: {access_token: "9efa1a51-7fb7-41cb-aeb8..."}}
[LOG] 2:45:31 PM - Token extracted: 9efa1a51-7fb7-41cb...
[LOG] 2:45:31 PM - Token stored in localStorage
✓ Login successful - Redirected to Dashboard
```

### Step 2: Excel File Upload
```flow
1. User uploads Excel file (.xlsx, .xls, .xlsm, .csv)
2. FileUpload component reads the file
3. Extracts all sheet names
4. Reads data starting from Row 5 (Row 5 = Headers)
5. Converts to JSON format
6. Displays available sheets with row counts
```

**File Structure Expected:**
```
Row 1-4:   [Headers/Metadata - SKIPPED]
Row 5:     [COLUMN HEADERS] - Client_Id | Loan_Id | office_id | Overpaid_Amount
Row 6-N:   [DATA ROWS]      - 179       | LN-123  | 4         | 14
           [DATA ROWS]      - 33194     | LN-456  | 14        | 99.98
```

**Console Log Example:**
```
[LOG] 2:46:15 PM - File uploaded: data.xlsx
[LOG] 2:46:15 PM - Available sheets: ["Sheet1", "Sheet2"]
[LOG] 2:46:15 PM - Sheet1: 150 rows
[LOG] 2:46:15 PM - Sheet2: 200 rows
[LOG] 2:46:16 PM - Auto-selected first sheet: Sheet1
```

### Step 3: Data Processing
```flow
1. User clicks "Run Processing"
2. App iterates through all rows
3. For each row:
   a. Builds request payload
   b. Adds current date
   c. Posts to API with Bearer token
   d. Waits for response
   e. Handles success/failure
4. Updates status in real-time
5. Shows progress bar
6. Generates comprehensive logs
```

---

## 📊 Logging System

### Types of Logs

The system captures THREE types of console logs:

#### 1. **INFO Logs** - General information
```
[INFO] 2:47:30 PM - Row 1/100 Processing...
[INFO] 2:47:30 PM - ClientId: 179, Amount: 14
```

#### 2. **LOG Logs** - Processing details
```
[LOG] 2:47:31 PM - ✓ SUCCESS (1.23s): 200
[LOG] 2:47:32 PM - Request Body: {fromAccountId: "179", ...}
```

#### 3. **ERROR Logs** - Failures & issues
```
[ERROR] 2:47:35 PM - ✗ FAILED (0.85s): {status: 403, message: "Forbidden"}
[ERROR] 2:47:40 PM - Row 5 FAILED: Token expired - Please log in again
```

---

## 📝 Log File Output Format

### Console Log Example (Full Batch)

```
============================================================
BATCH PROCESSING STARTED - 100 rows
Endpoint: https://sejaya-uat.finflux.io/fineract-provider/api/v1/accounttransfers
Start Time: 2:45:30 PM
============================================================

Row 1/100 Processing...
  ClientId: 179, Amount: 14
  ✓ SUCCESS (1.23s): 200

Row 2/100 Processing...
  ClientId: 33194, Amount: 99.98
  ✓ SUCCESS (1.45s): 200

Row 3/100 Processing...
  ClientId: 33253, Amount: 34.31
  ✗ FAILED (0.92s): {
  status: 403,
  message: "Forbidden",
  response: {
    httpStatusCode: 403,
    userMessage: "Insufficient permissions"
  }
}

Row 4/100 Processing...
  ClientId: 45678, Amount: 50.00
  ✓ SUCCESS (1.67s): 200
  Retry attempt 1/3 - Waiting 1000ms...
  ✓ SUCCESS (1.23s): 200

...

============================================================
BATCH PROCESSING COMPLETED
Total Rows: 100
✓ Success: 98
✗ Failed: 2
Total Time: 145.67s
Average Time per Row: 1.46s
End Time: 2:47:15 PM
============================================================
```

### How to Access Logs

1. **Open Browser DevTools**
   - Press: **F12** (Windows) or **Cmd+Option+I** (Mac)
   - Go to: **Console** tab

2. **See Live Logs**
   - Click "Run Processing"
   - Watch logs appear in real-time
   - Each row shows status and timing

3. **Copy Logs**
   - Right-click any log
   - Select "Copy message"
   - Paste into text file

---

## 🔗 API Integration

### Authentication Flow

**Endpoint:** `POST https://sejaya-uat.finflux.io/fineract-provider/api/oauth/token`

**Request Body:**
```json
{
  "username": "SMCL-426",
  "password": "Sejaya@123",
  "client_id": "community-app",
  "grant_type": "password",
  "isPasswordEncrypted": "false"
}
```

**Response:**
```json
{
  "access_token": "9efa1a51-7fb7-41cb-aeb8-336b915a0c56",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Data Processing Endpoint

**Endpoint:** `POST https://sejaya-uat.finflux.io/fineract-provider/api/v1/accounttransfers`

**Request Headers:**
```
Authorization: Bearer 9efa1a51-7fb7-41cb-aeb8-336b915a0c56
Content-Type: application/json
Timeout: 60 seconds (auto-retries 3 times on failure)
```

**Request Body Example:**
```json
{
  "fromAccountId": "179",
  "fromAccountType": 1,
  "toClientId": 58004,
  "toAccountType": 2,
  "toAccountId": 1,
  "fromAccountTransferActionType": 5,
  "toOfficeId": 1,
  "transferAmount": 14,
  "transferDate": "27 April 2026",
  "transferDescription": "Auto transfer",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy",
  "fromClientId": 179,
  "fromOfficeId": 4,
  "savingsTags": []
}
```

**Success Response (HTTP 200):**
```json
{
  "id": 1001,
  "status": "completed",
  "message": "Transfer successful"
}
```

**Error Response (HTTP 403):**
```json
{
  "httpStatusCode": 403,
  "developerMessage": "User does not have permission",
  "userMessage": "Insufficient permissions"
}
```

---

## 🔄 Data Flow Diagram

```
User Input (Excel File)
        │
        ▼
    ┌─────────────┐
    │ FileUpload  │
    │  Component  │
    └─────────────┘
        │
        ▼
  ┌──────────────┐
  │ Read Excel   │
  │ (Row 5+)     │
  └──────────────┘
        │
        ▼
 ┌────────────────┐
 │ Extract Sheets │
 │ & Row Data     │
 └────────────────┘
        │
        ▼
  ┌──────────────┐
  │ Dashboard    │
  │ Displays     │
  │ Sheets       │
  └──────────────┘
        │
  User Selects Sheet
        │
        ▼
 ┌────────────────┐
 │ Display All    │
 │ Rows in Table  │
 └────────────────┘
        │
  User Clicks "Run Processing"
        │
        ▼
 FOR EACH ROW:
  ┌────────────────────────────────┐
  │ 1. Build Request Body          │
  │    - Map Excel columns to API  │
  │    - Add current date          │
  │    - Add static fields         │
  └────────────────────────────────┘
        │
        ▼
  ┌────────────────────────────────┐
  │ 2. POST to API                 │
  │    - Add Bearer token          │
  │    - 60 second timeout         │
  │    - Auto-retry on failure     │
  └────────────────────────────────┘
        │
        ▼
  ┌────────────────────────────────┐
  │ 3. Handle Response             │
  │    - Success: Mark as done     │
  │    - Failure: Log error        │
  │    - Expired token: Re-login   │
  └────────────────────────────────┘
        │
        ▼
  ┌────────────────────────────────┐
  │ 4. Update UI                   │
  │    - Show status indicator     │
  │    - Update progress bar       │
  │    - Store response in table   │
  └────────────────────────────────┘
        │
        ▼
  ┌────────────────────────────────┐
  │ 5. Log Entry                   │
  │    - Timestamp                 │
  │    - Status (Success/Failed)   │
  │    - Response code             │
  │    - Processing time           │
  └────────────────────────────────┘
        │
        ▼
 [NEXT ROW or COMPLETE]
```

---

## � What Log Files Contain

Log files automatically capture and store **ALL system activity**. Here's everything included:

### 1. **User Authentication Logs** 🔐
**When:** User logs in or logs out  
**Example:**
```
[LOG] 2:45:05 PM - User Login Attempt
[LOG] 2:45:06 PM - POST https://sejaya-uat.finflux.io/fineract-provider/api/oauth/token
[LOG] 2:45:07 PM - Username: SMCL-426
[LOG] 2:45:07 PM - Response: 200 OK
[LOG] 2:45:07 PM - Token: 9efa1a51-7fb7-41cb-aeb8...
[LOG] 2:45:07 PM - ✓ Login successful
[LOG] 2:45:07 PM - Token stored in localStorage
[LOG] 2:45:08 PM - User redirected to Dashboard
```

---

### 2. **File Upload Logs** 📤
**When:** User uploads an Excel file  
**Example:**
```
[LOG] 2:45:10 PM - File Upload Started
[LOG] 2:45:11 PM - Filename: sales_data.xlsx
[LOG] 2:45:11 PM - File size: 2.3 MB
[LOG] 2:45:11 PM - File type: application/vnd.ms-excel
[LOG] 2:45:12 PM - Reading Excel sheets...
[LOG] 2:45:13 PM - Sheets detected: ["Sheet1", "Sheet2", "Summary"]
[LOG] 2:45:13 PM - Sheet1: 150 rows found
[LOG] 2:45:13 PM - Sheet2: 200 rows found
[LOG] 2:45:13 PM - Summary: 50 rows found
[LOG] 2:45:13 PM - Auto-selected: Sheet1
[LOG] 2:45:14 PM - File upload complete ✓
```

---

### 3. **API Requests Logs** 🌐
**When:** System calls an API endpoint (every request logged)  
**Example:**
```
[LOG] 2:45:15 PM - API REQUEST INITIATED
[LOG] 2:45:15 PM - Endpoint: POST /api/v1/accounttransfers
[LOG] 2:45:15 PM - Full URL: https://sejaya-uat.finflux.io/fineract-provider/api/v1/accounttransfers
[LOG] 2:45:15 PM - Authorization: Bearer 9efa1a51-7fb7-41cb...
[LOG] 2:45:15 PM - Content-Type: application/json
[LOG] 2:45:15 PM - Timeout: 60 seconds
[LOG] 2:45:15 PM - Request Body:
{
  "fromAccountId": "179",
  "fromAccountType": 1,
  "toClientId": 58004,
  "transferAmount": 14,
  "transferDate": "27 April 2026"
}
[LOG] 2:45:16 PM - Response received: 200 OK
[LOG] 2:45:16 PM - Response time: 1.23 seconds
```

---

### 4. **Processing Activity Logs** ⚙️
**When:** Processing starts, during processing, and when complete  
**Example:**
```
[LOG] 2:45:15 PM - Processing Started
[LOG] 2:45:15 PM - Total rows to process: 150
[LOG] 2:45:15 PM - Processing row 1/150...
[LOG] 2:45:16 PM - Row 1 SUCCESS (1.23s) | ClientId: 179 | Amount: 14
[LOG] 2:45:17 PM - Processing row 2/150...
[LOG] 2:45:18 PM - Row 2 SUCCESS (1.45s) | ClientId: 33194 | Amount: 99.98
[LOG] 2:45:19 PM - Processing row 3/150...
[LOG] 2:45:20 PM - Row 3 SUCCESS (1.67s) | ClientId: 33253 | Amount: 34.31
... [continuing rows] ...
[LOG] 2:48:52 PM - Processing Complete ✓
[LOG] 2:48:52 PM - Total time: 217.34 seconds
[LOG] 2:48:52 PM - Successfully processed: 150 rows
[LOG] 2:48:52 PM - Failed: 0 rows
[LOG] 2:48:52 PM - Average time per row: 1.45 seconds
```

---

### 5. **Error Logs** 🔥 (Critical Information)
**When:** Errors occur during any operation  
**Example:**
```
[ERROR] 2:47:35 PM - Row 5 Processing Failed
[ERROR] 2:47:35 PM - HTTP Status: 403 Forbidden
[ERROR] 2:47:35 PM - Error Message: Insufficient permissions
[ERROR] 2:47:35 PM - Request that failed:
{
  "fromAccountId": "555",
  "transferAmount": 50,
  "toClientId": 58004
}
[ERROR] 2:47:35 PM - Full Error Response:
{
  "httpStatusCode": 403,
  "developerMessage": "User does not have permission",
  "userMessage": "Insufficient permissions"
}
[ERROR] 2:47:35 PM - Retry attempt 1/3 in 1000ms...
```

---

### 6. **Token Expiration Logs** ⏰
**When:** Session expires or token becomes invalid  
**Example:**
```
[ERROR] 2:50:05 PM - Row 45 Processing Failed
[ERROR] 2:50:05 PM - HTTP Status: 401 Unauthorized
[ERROR] 2:50:05 PM - Error Message: Token expired
[ERROR] 2:50:05 PM - Reason: Session timeout
[LOG] 2:50:05 PM - AUTO LOGOUT TRIGGERED
[LOG] 2:50:05 PM - Clearing localStorage
[LOG] 2:50:05 PM - Redirecting to login page
[LOG] 2:50:06 PM - Alert: "Your session has expired. Please log in again."
```

---

### 7. **Retry/Recovery Logs** 🔄
**When:** Network fails and system retries  
**Example:**
```
[LOG] 2:47:30 PM - Row 10 - Request attempt 1/3
[ERROR] 2:47:31 PM - Row 10 - FAILED: Network timeout
[LOG] 2:47:32 PM - Row 10 - Retry attempt 1/3 - Waiting 1000ms...
[LOG] 2:47:33 PM - Row 10 - Request attempt 2/3
[ERROR] 2:47:34 PM - Row 10 - FAILED: Connection refused
[LOG] 2:47:34 PM - Row 10 - Retry attempt 2/3 - Waiting 2000ms...
[LOG] 2:47:36 PM - Row 10 - Request attempt 3/3
[LOG] 2:47:37 PM - Row 10 - ✓ SUCCESS (1.23s): 200
```

---

### 8. **System Activity Logs** ⏹️
**When:** Application starts, stops, or crashes  
**Example:**
```
[LOG] 2:45:00 PM - Application Started
[LOG] 2:45:00 PM - Environment: Development
[LOG] 2:45:00 PM - Server: http://localhost:3001
[LOG] 2:45:01 PM - React version: 18.0.0
[LOG] 2:45:01 PM - Vite dev server running
[LOG] 2:45:02 PM - Hot Module Replacement enabled
... [during usage] ...
[LOG] 3:15:00 PM - User Session Active (30 mins)
[LOG] 3:45:00 PM - User clicked logout
[LOG] 3:45:00 PM - Clearing all data
[LOG] 3:45:01 PM - Session terminated
[LOG] 3:45:02 PM - Application ready for next login
```

---

## �🔍 Logging Details

### What Gets Logged

#### **Before Processing Starts:**
```
============================================================
BATCH PROCESSING STARTED - 100 rows
Endpoint: https://sejaya-uat.finflux.io/fineract-provider/api/v1/accounttransfers
Start Time: 2:45:30 PM
============================================================
```

#### **For Each Row:**
```
Row 1/100 Processing...
  ClientId: 179, Amount: 14
  Endpoint: https://...
  Token: 9efa1a51-7fb7-41c...

Request attempt 1/3:
  POST https://sejaya-uat.finflux.io/fineract-provider/api/v1/accounttransfers
  Headers: {Authorization: Bearer 9efa1a51...}
  Body: {fromAccountId: "179", ...}

Response:
  ✓ SUCCESS (1.23s): Status Code 200
  Response: {id: 1001, status: "completed"}
```

#### **On Retry (Network Failure):**
```
Row 4/100 Processing...
  ClientId: 45678, Amount: 50.00
  
  Request attempt 1/3: FAILED (timeout)
  Retry attempt 1/3 - Waiting 1000ms...
  
  Request attempt 2/3: FAILED (network error)
  Retry attempt 2/3 - Waiting 2000ms...
  
  Request attempt 3/3: SUCCESS (1.23s): Status Code 200
```

#### **On Token Expiration:**
```
Row 25/100 Processing...
  ClientId: 12345, Amount: 75.50
  
  ✗ FAILED: TOKEN EXPIRED
  Error: Request failed with status code 401
  Message: "Token expired - Please log in again"
  
  ▶ AUTO LOGOUT TRIGGERED
  Alert: "Your session has expired. Please log in again."
```

#### **After All Rows Complete:**
```
============================================================
BATCH PROCESSING COMPLETED
Total Rows: 100
✓ Success: 98
✗ Failed: 2
Total Time: 145.67s
Average Time per Row: 1.46s
End Time: 2:47:15 PM
============================================================
```

---

## 🐛 Troubleshooting

### Issue 1: Login Fails (401 Unauthorized)

**Symptoms:**
```
[ERROR] Login error: Request failed with status code 401
[ERROR] Invalid response from login server - no token received
```

**Causes & Solutions:**
- ❌ Wrong username/password → Use correct credentials
- ❌ Account locked → Contact admin
- ❌ API down → Try again later

**Check in Console:**
```javascript
// Copy this log message
[ERROR] Login error: {status: 401, message: "..."}
```

---

### Issue 2: Processing Returns 403 Forbidden

**Symptoms:**
```
Row 5/100 Processing...
  ✗ FAILED (0.92s): {
    status: 403,
    message: "Forbidden",
    response: {userMessage: "Insufficient permissions"}
  }
```

**Causes & Solutions:**
- ❌ User doesn't have permission → Ask admin for "Account Transfers" permission
- ❌ Wrong API endpoint → Check configuration
- ❌ Payload format incorrect → Check Excel columns

**Check in Console:**
```javascript
// Full error details logged
[ERROR] Row 5 FAILED: {
  status: 403,
  responseData: {httpStatusCode: 403, userMessage: "Insufficient permissions"}
}
```

---

### Issue 3: Slow Processing / Processing Takes Too Long

**Symptoms:**
```
Average Time per Row: 2.45s
Processing 1000 rows = ~41 minutes
```

**Normal Behavior:**
- Network latency: 0.5-1.5 seconds per row
- Large payloads: 1.5-2.5 seconds per row
- With retries: 2-5 seconds per row

**Optimization:**
- Check network connection
- Reduce file size (use smaller batches)
- Process during off-peak hours
- Contact API team if consistently slow

---

### Issue 4: Token Expires During Processing

**Symptoms:**
```
Row 45/100 Processing...
  ✗ TOKEN EXPIRED
  Message: "Token expired - Please log in again"
  
  AUTO LOGOUT TRIGGERED
```

**Solution:**
1. Log in again with your credentials
2. Upload the same Excel file
3. Click "Run Processing" again
4. Processing resumes with fresh token

**Note:** The app handles this automatically and logs you out safely.

---

### Issue 5: Network Timeout / Connection Lost

**Symptoms:**
```
Row 10/100 Processing...
  Request attempt 1/3: FAILED (request timeout)
  Retry attempt 1/3 - Waiting 1000ms...
  Request attempt 2/3: FAILED (network error)
  Retry attempt 2/3 - Waiting 2000ms...
  Request attempt 3/3: FAILED (connection refused)
  ✗ FAILED: Unknown error occurred
```

**Solution:**
- Check network connection
- Try again (auto-retry handles 1-2 temporary failures)
- If persistent, contact IT support

---

## 📋 Log Reference Table

| Log Type | Format | Example | Meaning |
|----------|--------|---------|---------|
| **Processing Start** | `BATCH PROCESSING STARTED` | `- 100 rows` | Batch job initiated |
| **Row Processing** | `Row X/Total Processing...` | `Row 1/100 Processing...` | Processing specific row |
| **Success** | `✓ SUCCESS (Xs): CODE` | `✓ SUCCESS (1.23s): 200` | Row processed successfully |
| **Failure** | `✗ FAILED (Xs): ERROR` | `✗ FAILED (0.92s): 403` | Row processing failed |
| **Retry** | `Retry attempt X/3` | `Retry attempt 1/3 - Waiting 1000ms...` | Attempting to retry |
| **Token Expired** | `TOKEN EXPIRED` | `Token expired - Please log in again` | Session timeout |
| **Summary** | `BATCH PROCESSING COMPLETED` | `✓ Success: 98 ✗ Failed: 2` | Final results |

---

## 🎬 Example: Complete Workflow Log

```
[LOG] 2:45:00 PM - Application started at http://localhost:3001

[LOG] 2:45:05 PM - User inputs credentials: SMCL-426

[LOG] 2:45:06 PM - POST https://sejaya-uat.finflux.io/fineract-provider/api/oauth/token
[LOG] 2:45:07 PM - Response: 200 OK
[LOG] 2:45:07 PM - Token: 9efa1a51-7fb7-41cb-aeb8...
[LOG] 2:45:07 PM - ✓ Login successful

[LOG] 2:45:10 PM - File uploaded: sales_data.xlsx
[LOG] 2:45:11 PM - Excel sheets detected: ["Sheet1", "Sheet2"]
[LOG] 2:45:11 PM - Sheet1: 150 rows, Sheet2: 200 rows
[LOG] 2:45:12 PM - User selected: Sheet1

[LOG] 2:45:15 PM - User clicked "Run Processing"

============================================================
BATCH PROCESSING STARTED - 150 rows
Endpoint: https://sejaya-uat.finflux.io/fineract-provider/api/v1/accounttransfers
Start Time: 2:45:15 PM
============================================================

Row 1/150 Processing...
  ClientId: 179, Amount: 14
  ✓ SUCCESS (1.23s): 200

Row 2/150 Processing...
  ClientId: 33194, Amount: 99.98
  ✓ SUCCESS (1.45s): 200

Row 3/150 Processing...
  ClientId: 33253, Amount: 34.31
  ✓ SUCCESS (1.67s): 200

... [rows 4-148: all successful] ...

Row 149/150 Processing...
  ClientId: 98765, Amount: 250.00
  ✓ SUCCESS (1.34s): 200

Row 150/150 Processing...
  ClientId: 55555, Amount: 100.50
  ✓ SUCCESS (1.89s): 200

============================================================
BATCH PROCESSING COMPLETED
Total Rows: 150
✓ Success: 150
✗ Failed: 0
Total Time: 217.34s
Average Time per Row: 1.45s
End Time: 2:48:52 PM
============================================================

[LOG] 2:48:52 PM - All rows processed successfully!
[LOG] 2:48:52 PM - Results displayed in table
```

---

## 📞 Support & Additional Help

**For Issues:**
1. Check the **Console** logs (F12 → Console tab)
2. Note the error code and timestamp
3. Take a screenshot of the error
4. Contact support with the log excerpt

**Performance:**
- Typical: 1-2 seconds per row
- Slow connection: 2-5 seconds per row
- Large payload: 3-5 seconds per row

**Data Requirements:**
- Excel file must have headers in Row 5
- Columns needed: Client_Id, Loan_Id, office_id, Overpaid_Amount
- No empty cells allowed in required columns

---

**Last Updated:** April 27, 2026  
**Version:** 1.0
