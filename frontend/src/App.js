import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

function App() {
  const [f1Data, setF1Data] = useState([]);
  const [footballData, setFootballData] = useState([]);

  useEffect(() => {
    // Listen for real-time updates
    socket.on('f1-update', (data) => {
      setF1Data(data);
    });

    socket.on('football-update', (data) => {
      setFootballData(data);
    });

    // Initial data fetch
    fetchInitialData();

    return () => {
      socket.off('f1-update');
      socket.off('football-update');
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const f1Response = await axios.get('http://localhost:5000/api/f1/drivers');
      setF1Data(f1Response.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  return (
    <div className="App">
      <h1>Sports Data Dashboard</h1>
      
      <section>
        <h2>F1 Live Data</h2>
        <div>
          {f1Data.length > 0 ? (
            f1Data.slice(0, 10).map((item, index) => (
              <div key={index}>
                {JSON.stringify(item)}
              </div>
            ))
          ) : (
            <p>No F1 data available</p>
          )}
        </div>
      </section>

      <section>
        <h2>Football Live Matches</h2>
        <div>
          {footballData.length > 0 ? (
            footballData.map((match, index) => (
              <div key={index}>
                {match.homeTeam?.name} vs {match.awayTeam?.name}
              </div>
            ))
          ) : (
            <p>No live matches</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
```

### **Step 8: Environment Variables**

**backend/.env:**
```
PORT=5000
FOOTBALL_API_KEY=ec5b19bd56d74736b28a18701b7d73a4
DATABASE_URL=postgresql //user:password@localhost:5432/sports_db
REDIS_URL=redis //localhost:6379