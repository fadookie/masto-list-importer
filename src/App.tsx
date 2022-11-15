import React from 'react';
import 'github-fork-ribbon-css/gh-fork-ribbon.css';
import './App.css';
import { Importer } from './Importer';

function App() {
  return (
    <div className="App">
      <a className="github-fork-ribbon" href="https://github.com/fadookie/masto-list-importer" data-ribbon="Fork me on GitHub" title="Fork me on GitHub">Fork me on GitHub</a>
      <Importer />
    </div>
  );
}

export default App;
