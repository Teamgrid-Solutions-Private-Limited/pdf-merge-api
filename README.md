# MIDDLEWARE-API

This Middleware API system calls Coherent Spark API and serves as a PDF Collating engine. All parameters and responses/structures remains same as Coherent Spark API provides. Additional parameter to be passed along with other parameters (as per coherent sparks API) is {printIllustration: yes / no}
## Setup

1. Clone and install:
```bash
git clone <repo-url>
cd <repo-name>
npm install
```

2. Create `.env` file:
```env
# Environment Configuration
NODE_ENV=development
PROTECTED_KEY=your_protected_api_key
PORT=5000
JWT_SECRET=your_jwt_secret

# API Configuration
API_URLMYGA=https://your-myga-api-endpoint.com
API_URLFIA=https://your-fia-api-endpoint.com
API_TYPE_CAL=Neuron
API_TYPE_PRINT=Neuron

# External API Authentication
X-SYNTHETIC-KEY=your_synthetic_key
TENANT_NAME=your_tenant_name
API_KEY=your_api_key
```

3. Start server:
```bash
npm start
```

## API Endpoints

- **POST** `your-api-url/api/v1/DemoMYGA` - Process MYGA illustrations
- **POST** `your-api-url/api/v1/DemoFIA` - Process FIA illustrations

## Frontend Usage

### Authentication
Include API key in headers:
```javascript
headers: {
  'x-protected-key': 'YOUR_PROTECTED_KEY',
  'Content-Type': 'application/json'
}
```

### Get JSON Response
```javascript
const response = await fetch('your-api-url/api/v1/DemoMYGA', {
  method: 'POST',
  headers: {
    'x-protected-key': 'YOUR_PROTECTED_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    printIllustration: 'no',
    annuiyInputData: {
      premium: 100000,
      term: 5
      // ... your annuity data
    }
  })
});

const data = await response.json();
```

### Get PDF File
```javascript
const response = await fetch('your-api-url/api/v1/DemoMYGA', {
  method: 'POST',
  headers: {
    'x-protected-key': 'YOUR_PROTECTED_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    printIllustration: 'yes',
    annuiyInputData: {
      premium: 100000,
      term: 5
      // ... your annuity data
    }
  })
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'illustration.pdf';
  a.click();
}
```

### React Example
```javascript
const handleGeneratePDF = async (formData) => {
  try {
    const response = await fetch('your-api-url/api/v1/DemoMYGA', {
      method: 'POST',
      headers: {
        'x-protected-key': `${process.env.REACT_APP_PROTECTED_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        printIllustration: 'yes',
        annuiyInputData: formData
      })
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'illustration.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Request Body Structure

```javascript
{
  "printIllustration": "yes" | "no",  // "yes" for PDF, "no" for JSON
  "annuiyInputData": {
    // Your annuity calculation data
    "premium": 100000,
    "term": 5,
    // ... other required fields
  }
}
```

## Response Types

- **printIllustration: "no"** → Returns JSON data
- **printIllustration: "yes"** → Returns PDF file for download
