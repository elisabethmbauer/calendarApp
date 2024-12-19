import logo from './logo.svg';
import React, { useState } from "react";
import './App.css';
import './Components/LoginRegister/LoginRegister.css';
import LoginRegister from './Components/LoginRegister/LoginRegister';
import Calendar from "./Components/Calendar/Calendar";
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    console.log("User authenticated. Switching to Calendar view.");
    setIsAuthenticated(true);
  };

  return (
    <div>
      {isAuthenticated ? <Calendar /> : <LoginRegister onLogin={handleLogin} />}
    </div>
  );
}

export default App;
  
