import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";

const basename = '';
const root = ReactDOM.createRoot(document.getElementById("root"))

root.render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>,
);

reportWebVitals();
