import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import SenderFlow from './components/SenderFlow';
import RecipientFlow from './components/RecipientFlow';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/send" element={<SenderFlow />} />
      <Route path="/receive" element={<RecipientFlow />} />
    </Routes>
  );
}

export default App;
