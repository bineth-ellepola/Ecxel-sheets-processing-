# Excel Data Processor - Web Application

A modern, secure React-based web application for uploading Excel files, displaying data in a table, and processing rows sequentially through API endpoints with real-time status tracking.

## Features

✅ **Secure Login System** - Authentication via API endpoint  
✅ **Excel File Upload** - Support for .xlsx, .xls, and .csv files  
✅ **Data Table Display** - Real-time table with all Excel rows  
✅ **Sequential Processing** - Process each row one-by-one via API  
✅ **Real-time Updates** - Live status indicators for each request  
✅ **Response Tracking** - Capture and display status codes and responses  
✅ **Error Handling** - Clear error messages and failure tracking  
✅ **Demo Mode** - Test without a real API (useful for development)  
✅ **Session Persistence** - Remember authentication token  
✅ **Responsive Design** - Works on desktop and mobile devices  

## Quick Start

### Installation
```bash
npm install
```

### Configure API Endpoints
Edit `src/App.tsx` and update these lines:
```typescript
loginUrl: 'https://your-api.com/login',
dataEndpoint: 'https://your-api.com/process',
```

### Run Development Server
```bash
npm run dev
```

Application opens at `http://localhost:5173/`

### Build for Production
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Login.tsx          # Authentication
│   ├── Dashboard.tsx      # Main dashboard
│   ├── FileUpload.tsx     # Excel upload
│   └── DataTable.tsx      # Results table
├── styles/
│   ├── Login.css
│   ├── Dashboard.css
│   ├── FileUpload.css
│   └── DataTable.css
├── types.ts               # TypeScript definitions
├── App.tsx                # Main component
└── main.tsx               # Entry point
```

## How It Works

1. **Login** - Authenticate using your office credentials or Demo Mode
2. **Upload Excel** - Select and upload an Excel file (.xlsx, .xls, .csv)
3. **Review Data** - See all rows in a formatted table
4. **Process Rows** - Click "Run Processing" to send each row to your API
5. **Track Results** - View real-time status, response codes, and errors

## API Requirements

### Login Endpoint
```
POST https://your-api.com/login
{
  "email": "user@email.com",
  "password": "password"
}
```

Response should include:
```json
{
  "token": "your-jwt-token-here"
}
```

### Data Processing Endpoint
```
POST https://your-api.com/process
Authorization: Bearer <token>
{
  "column1": "value1",
  "column2": "value2"
}
```

Response format (any HTTP status code):
```json
{
  "message": "Processing result",
  "status": 200
}
```

## Features Explained

### Real-time Status Updates
- Each row updates as it's processed
- Color-coded status: Green (✓ Success), Red (✗ Failure), Yellow (⏳ Processing), Gray (○ Pending)
- Pulsing animation for rows being processed

### Response Tracking
- Captures HTTP status code from your API
- Displays response message/error
- Shows first 100 characters of response
- Continues processing even if individual rows fail

### Error Handling
- 30-second timeout per request
- Graceful handling of network errors
- Display of API error messages
- No data loss during errors

### Demo Mode
- Test the UI without configuring API endpoints
- Simulate processing with dummy data
- Perfect for development and training

## Technologies

- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Axios** - HTTP requests
- **XLSX** - Excel parsing
- **CSS3** - Modern styling

## Troubleshooting

**CORS errors?**
- Ensure API server allows localhost:5173
- Check CORS headers on your backend

**Login fails?**
- Verify API endpoint is correct in `src/App.tsx`
- Use Demo Mode to bypass authentication
- Check browser console for detailed errors

**File upload issues?**
- Ensure Excel file has headers in first row
- Supported formats: .xlsx, .xls, .csv

**Processing doesn't work?**
- Verify data endpoint in `src/App.tsx`
- Check authentication token is valid
- Use browser DevTools Network tab to debug API calls

## Sample Excel Format

| Name | Email | Phone |
|------|-------|-------|
| John Doe | john@example.com | 555-0001 |
| Jane Smith | jane@example.com | 555-0002 |

## Advanced Options

### Change request timeout
Edit `src/components/Dashboard.tsx`, change timeout value:
```typescript
timeout: 60000, // 60 seconds
```

### Modify table columns
Edit `src/components/DataTable.tsx` to customize display

### Add custom headers
In `Dashboard.tsx` axios call, add:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'X-Custom-Header': 'value'
}
```

## Production Deployment

Create `.env` file:
```
VITE_LOGIN_URL=https://api.company.com/login
VITE_DATA_ENDPOINT=https://api.company.com/process
```

Use environment variables in `src/App.tsx`:
```typescript
loginUrl: import.meta.env.VITE_LOGIN_URL,
dataEndpoint: import.meta.env.VITE_DATA_ENDPOINT,
```

## Security Notes

- Authentication token stored in localStorage
- Token sent in Authorization header
- Use HTTPS in production
- Validate data on server side
- Implement rate limiting on backend

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Created for office use.

---

**Need help?** Check browser console (F12) for error messages or refer to the complete documentation in src/types.ts and component files.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
