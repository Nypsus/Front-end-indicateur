import React from 'react';
import ReactDOM from 'react-dom/client';  // Cette ligne doit être valide avec React 18
import App from './App';
import './index.css';  // Importation des fichiers CSS depuis 'src'
import './App.css';



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
