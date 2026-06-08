import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// #region agent log
fetch('http://127.0.0.1:7273/ingest/00ba8ebd-6ff8-4652-a093-db2b1c4b91f5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a99cbd'},body:JSON.stringify({sessionId:'a99cbd',runId:'run-3',hypothesisId:'H10',location:'frontend/src/main.tsx:6',message:'Frontend bundle executed in browser',data:{href:window.location.href,origin:window.location.origin,userAgent:navigator.userAgent},timestamp:Date.now()})}).catch(()=>{});
// #endregion

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
