# Excel Data Processor - Setup & API Integration Guide

## 🚀 Project Status: RUNNING

Your React application is now running at **http://localhost:5174/**

---

## 📋 Project Overview

You now have a fully functional Excel Data Processor application with:

✅ Secure login system  
✅ Excel file upload & parsing  
✅ Real-time data table display  
✅ Sequential API processing  
✅ Live status tracking  
✅ Error handling & reporting  

---

## 🔧 API CONFIGURATION (IMPORTANT!)

### Step 1: Identify Your API Endpoints

Before the application can work with your office APIs, you need:

1. **Login Endpoint URL**
   - Example: `https://api.company.com/login`
   - Used for user authentication

2. **Data Processing Endpoint URL**
   - Example: `https://api.company.com/process`
   - Used to process each Excel row

### Step 2: Update Configuration

Open `src/App.tsx` and find this section (around line 16-19):

```typescript
const apiConfig: AppConfig = {
  loginUrl: 'https://your-api.com/login',
  dataEndpoint: 'https://your-api.com/process',
};
```

**Replace with your actual API endpoints:**

```typescript
const apiConfig: AppConfig = {
  loginUrl: 'https://api.yourcompany.com/v1/auth/login',
  dataEndpoint: 'https://api.yourcompany.com/v1/data/process',
};
```

The changes will automatically reload in your browser (Hot Module Replacement).

---

## 📡 API Requirements

### 1. Login API

**Request Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (HTTP 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

**Error Response (HTTP 401):**
```json
{
  "status": 401,
  "message": "Invalid credentials"
}
```

**Important:** The response must include a `token` field. This token will be used for all subsequent requests.

---

### 2. Data Processing API

**Request Method:** `POST`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (Dynamic - contains each Excel row)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "123-456-7890",
  "department": "Sales"
}
```

The application sends complete rows from your Excel file as-is.

**Success Response (Any 2xx HTTP code):**
```json
{
  "status": 200,
  "message": "Row processed successfully",
  "id": 12345
}
```

**Error Response (Any non-2xx HTTP code):**
```json
{
  "status": 400,
  "message": "Invalid email format"
}
```

---

## 🧪 Testing Without API

### Demo Mode

1. Go to Login page
2. Check the "Demo Mode" checkbox
3. Enter any email and password
4. Click "Login"

This allows you to test the UI without API endpoints configured.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Login.tsx              # Authentication component
│   ├── Dashboard.tsx          # Main dashboard
│   ├── FileUpload.tsx         # File upload handler
│   └── DataTable.tsx          # Results display table
│
├── styles/
│   ├── Login.css              # Login page styling
│   ├── Dashboard.css          # Dashboard styling
│   ├── FileUpload.css         # Upload section styling
│   └── DataTable.css          # Table styling
│
├── types.ts                    # TypeScript type definitions
├── App.tsx                     # Main app component
├── App.css                     # Global styles
├── index.css                   # Base styles
└── main.tsx                    # Entry point
```

---

## 🎯 How to Use the Application

### Step 1: Login
- Enter your email and password
- Click "Login" button
- System authenticates with your login API
- On success, redirected to dashboard

### Step 2: Upload Excel File
- Click "Choose Excel File" button
- Select a .xlsx, .xls, or .csv file
- File is parsed automatically
- Rows displayed in table below

### Step 3: Review Data
- Check the table to verify data
- All columns from Excel appear as table columns
- Status column shows "Pending" for all rows

### Step 4: Start Processing
- Click "▶ Run Processing" button
- Progress bar shows processing percentage
- Each row processes sequentially
- Real-time status updates appear

### Step 5: View Results
- Status column updates for each row:
  - ✓ Success (green)
  - ✗ Failure (red)
  - ⏳ Processing (yellow)
  - ○ Pending (gray)
- Response code displayed in "Response Details" column
- API response message shown
- Error details visible on failure

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install
```

---

## ⚙️ Customization Options

### Change Request Timeout

Edit `src/components/Dashboard.tsx`, find the axios call (around line 65):

```typescript
timeout: 30000, // Change this value (milliseconds)
```

### Customize Table Display

Edit `src/components/DataTable.tsx` to modify:
- Which columns display
- Column ordering
- Column widths
- Cell formatting

### Modify Processing Logic

Edit `src/components/Dashboard.tsx` function `handleRunProcessing()` to:
- Change request format
- Add custom headers
- Implement batch processing
- Add retry logic

---

## 🔒 Security Notes

1. **Token Storage**: Authentication token stored in browser localStorage
2. **Token Usage**: Sent in `Authorization: Bearer <token>` header
3. **HTTPS**: Always use HTTPS in production
4. **Credentials**: Never commit API credentials to version control
5. **Environment Variables**: Use `.env` files for production

---

## 📊 Excel File Format

Your Excel files should follow this structure:

| Column1 | Column2 | Column3 | ... |
|---------|---------|---------|-----|
| Value1  | Value2  | Value3  | ... |
| Value4  | Value5  | Value6  | ... |

**Requirements:**
- First row contains column headers
- At least one data row
- Supported formats: .xlsx, .xls, .csv
- No file size limit (browser dependent)

---

## 🐛 Troubleshooting

### CORS Errors
**Error:** "Access to XMLHttpRequest blocked by CORS policy"

**Solution:**
- Ensure backend allows `http://localhost:5174`
- Backend must include CORS headers:
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: POST, GET, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  ```

### Authentication Fails
**Error:** "Login failed" or "Invalid credentials"

**Solution:**
- Verify API endpoint URL is correct in `src/App.tsx`
- Check credentials are correct
- Enable "Demo Mode" to test UI without API
- Check browser console (F12) for detailed errors

### File Upload Fails
**Error:** "Error parsing Excel file"

**Solution:**
- Ensure file format is .xlsx, .xls, or .csv
- First row should contain column headers
- Check file is not corrupted
- Try with a simple test file

### Processing Doesn't Start
**Error:** "Processing button disabled" or "No response"

**Solution:**
- Verify data endpoint configured correctly
- Check authentication token is valid
- Open DevTools Network tab to see API calls
- Ensure API returns proper response format

### Styling Issues
**Error:** "Page looks broken" or "Styles not applied"

**Solution:**
- Clear browser cache (Ctrl+Shift+Delete)
- Restart dev server (`npm run dev`)
- Check browser console for CSS errors

---

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

Creates optimized `dist/` folder ready for deployment.

### Environment Variables

Create `.env.production`:

```
VITE_LOGIN_URL=https://api.company.com/login
VITE_DATA_ENDPOINT=https://api.company.com/process
```

Update `src/App.tsx`:

```typescript
const apiConfig: AppConfig = {
  loginUrl: import.meta.env.VITE_LOGIN_URL,
  dataEndpoint: import.meta.env.VITE_DATA_ENDPOINT,
};
```

---

## 📞 Support Checklist

Before reporting issues:

- [ ] API endpoints configured correctly in `src/App.tsx`
- [ ] API endpoints are accessible (test with Postman/curl)
- [ ] CORS enabled on backend
- [ ] Authentication token format is correct
- [ ] Excel file format is valid
- [ ] Browser console checked for errors (F12)
- [ ] Network tab shows API requests (F12 > Network)
- [ ] Demo Mode works (confirms UI is functional)

---

## 🎓 Next Steps

1. **Get API Endpoints from Office**
   - Login endpoint URL
   - Data processing endpoint URL

2. **Test API Endpoints**
   - Use Postman or curl to test
   - Verify response format

3. **Update Configuration**
   - Edit `src/App.tsx`
   - Insert actual API endpoints

4. **Test with Demo File**
   - Create sample Excel file
   - Test upload and processing

5. **Deploy**
   - Run `npm run build`
   - Deploy `dist/` folder to server

---

## 📚 Technology Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Fast Build Tool
- **Axios** - HTTP Client
- **XLSX** - Excel Parser
- **CSS3** - Modern Styling

---

## 📄 Version Info

- **Project**: Excel Data Processor
- **Version**: 1.0.0
- **Created**: April 23, 2026
- **React Version**: 18
- **Node Version**: 16+

---

**Application Running At:** `http://localhost:5174/`  
**Dev Server Status:** ✅ Active

Good to go! 🎉
