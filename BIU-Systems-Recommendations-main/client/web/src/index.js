// @ts-check

// Entry point of the React app.
// Wraps the app in BrowserRouter so react router dom works,
// and imports the CSS file.

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
// @ts-ignore
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root was not found in the DOM.')

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)