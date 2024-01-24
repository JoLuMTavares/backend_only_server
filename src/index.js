import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './simple-image/simple-image.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { Provider } from 'react-redux';
// import { legacy_createStore as createStore, combineReducers } from 'redux';

// import store from './helpers/store';

import { history } from "./helpers/history";

// import { Router } from 'express';
import { BrowserRouter as Router, /* Route, Routes */ } from 'react-router-dom';

import { /* persistor, */ store } from './redux/store';
// import { PersistGate } from 'redux-persist/integration/react';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <React.StrictMode>
      <Router history={history}>
        <App />
      </Router>
    </React.StrictMode>
  </Provider>
);



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
