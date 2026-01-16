import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom' // <--- 1. Import this

// Use your manual string or the env variable here
const PUBLISHABLE_KEY = "pk_test_c3VwZXJiLWdhdG9yLTgyLmNsZXJrLmFjY291bnRzLmRldiQ"

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      {/* 2. Wrap App in BrowserRouter */}
      <BrowserRouter> 
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>,
)