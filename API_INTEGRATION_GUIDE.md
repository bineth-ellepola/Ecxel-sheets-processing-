# API Integration Examples

## Backend API Examples

If you're building or need to understand how to set up your API endpoints, here are implementations in different frameworks.

---

## Node.js / Express Example

```javascript
// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET_KEY = 'your-secret-key';

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Validate credentials (replace with actual validation)
  if (email && password.length > 0) {
    const token = jwt.sign(
      { email, timestamp: Date.now() },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      message: 'Login successful'
    });
  }

  res.status(401).json({
    status: 401,
    message: 'Invalid credentials'
  });
});

module.exports = router;
```

```javascript
// backend/routes/data.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET_KEY = 'your-secret-key';

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// Process data endpoint
router.post('/process', verifyToken, (req, res) => {
  const data = req.body;

  try {
    // Validate data
    if (!data.email) {
      return res.status(400).json({
        status: 400,
        message: 'Email is required'
      });
    }

    // Process the data (e.g., save to database)
    console.log('Processing:', data);

    // Return success response
    res.json({
      status: 200,
      message: 'Row processed successfully',
      id: Math.floor(Math.random() * 10000)
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
```

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
```

---

## Python / Flask Example

```python
# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

SECRET_KEY = 'your-secret-key'

# Login endpoint
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Validate credentials
    if email and password:
        token = jwt.encode({
            'email': email,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY, algorithm='HS256')

        return jsonify({
            'token': token,
            'message': 'Login successful'
        })

    return jsonify({
        'status': 401,
        'message': 'Invalid credentials'
    }), 401

# Token verification decorator
def token_required(f):
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'message': 'No token provided'}), 403

        try:
            token = auth_header.split(' ')[1]
            jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except:
            return jsonify({'message': 'Invalid token'}), 403

        return f(*args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated

# Data processing endpoint
@app.route('/api/data/process', methods=['POST'])
@token_required
def process_data():
    data = request.get_json()

    # Validate data
    if not data.get('email'):
        return jsonify({
            'status': 400,
            'message': 'Email is required'
        }), 400

    try:
        # Process the data
        print('Processing:', data)

        return jsonify({
            'status': 200,
            'message': 'Row processed successfully',
            'id': 12345
        })
    except Exception as e:
        return jsonify({
            'status': 500,
            'message': 'Server error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=3001)
```

---

## Configuring the Frontend to Use Your API

### Update src/App.tsx

Add your backend URL:

```typescript
const apiConfig: AppConfig = {
  loginUrl: 'http://localhost:3001/api/auth/login',
  dataEndpoint: 'http://localhost:3001/api/data/process',
};
```

### For Production

Create `.env.production`:

```
VITE_LOGIN_URL=https://api.yourcompany.com/api/auth/login
VITE_DATA_ENDPOINT=https://api.yourcompany.com/api/data/process
```

Update `src/App.tsx`:

```typescript
const apiConfig: AppConfig = {
  loginUrl: import.meta.env.VITE_LOGIN_URL || 'http://localhost:3001/api/auth/login',
  dataEndpoint: import.meta.env.VITE_DATA_ENDPOINT || 'http://localhost:3001/api/data/process',
};
```

---

## CORS Configuration

### Node.js/Express

```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5174', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Python/Flask

```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": "http://localhost:5174",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})
```

---

## Testing with Postman

### Login Request

```
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

### Process Data Request

```
POST http://localhost:3001/api/data/process
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "123-456-7890"
}
```

### Response

```json
{
  "status": 200,
  "message": "Row processed successfully",
  "id": 12345
}
```

---

## Error Handling

The frontend expects these HTTP status codes:

- **200-299**: Success (displays in green)
- **400-499**: Client Error (displays in red with message)
- **500-599**: Server Error (displays in red with message)

---

## Environment Setup

### Local Development

```bash
# Terminal 1: Backend
cd backend
npm install
npm start          # Runs on http://localhost:3001

# Terminal 2: Frontend
cd exel-tool
npm install
npm run dev         # Runs on http://localhost:5174
```

### Production Deployment

1. Build frontend: `npm run build`
2. Deploy `dist/` folder to web server
3. Deploy backend to separate server
4. Update API URLs in `.env.production`
5. Enable CORS on backend for production domain

---

## Database Integration Example

```python
# backend/models.py
from sqlalchemy import create_engine, Column, String, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class ProcessedData(Base):
    __tablename__ = 'processed_data'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    phone = Column(String(20))
    processed_at = Column(DateTime, default=datetime.utcnow)
    user_email = Column(String(255))

# Create database engine
engine = create_engine('sqlite:///data.db')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
```

---

## Rate Limiting (Recommended)

```javascript
// Node.js / Express
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Security Best Practices

1. **Use HTTPS** in production
2. **Validate all input** on server side
3. **Implement rate limiting**
4. **Use strong JWT secret**
5. **Set token expiration** (e.g., 24 hours)
6. **Sanitize error messages** (don't expose stack traces)
7. **Log activity** for auditing
8. **Use environment variables** for secrets

---

## Troubleshooting Common Issues

### CORS Not Working

**Error:** "Access to XMLHttpRequest blocked by CORS policy"

**Solution:**
- Add `CORS` middleware to backend
- Ensure `Access-Control-Allow-Origin` header includes frontend URL
- Add `OPTIONS` method support

### Token Invalid

**Error:** "Invalid token" after login

**Solution:**
- Verify `SECRET_KEY` matches frontend/backend
- Check token expiration time
- Ensure `Authorization: Bearer <token>` format is correct

### Processing Fails

**Error:** API returns 400/500 errors

**Solution:**
- Check request body format matches expected schema
- Log request/response on backend
- Test endpoint with Postman before integrating
- Add detailed error messages

---

## Quick Start Commands

```bash
# Install dependencies
npm install axios jsonwebtoken flask-cors

# Start development
npm run dev          # Frontend
npm start            # Backend

# Test with curl
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}'
```

---

## Additional Resources

- [JWT.io](https://jwt.io) - JWT documentation
- [Express.js](https://expressjs.com) - Backend framework
- [Flask](https://flask.palletsprojects.com) - Python framework
- [Postman](https://www.postman.com) - API testing tool
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**Ready to integrate with your backend?** Follow the examples above and update the API URLs in `src/App.tsx`!
