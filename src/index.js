import React from 'react';
import ReactDOM from 'react-dom/client';  // Cette ligne doit être valide avec React 18
import App from './App';
import './index.css'; // Ajoute cette ligne dans ton fichier JavaScript


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
