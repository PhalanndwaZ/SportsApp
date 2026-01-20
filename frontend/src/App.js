import React, {useState, useEffect} from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';

const socket = io('http://localhost:5000');

function App(){
  const [f1Data, setF1Data] = useState([]);
  const [footballData, setFootballData] = useState([]);
  const [connected, setConnected] = useState(false);


  useEffect(() => {
    // websocket connection status 
    socket.on('connect', ()=> {
      console.log('connected to server');
      setConnected(true);

    });
    socket.on('disconnect', ()=>{

      console.log('Dsiconnected from server');
      setConnected(false);
    });

    // listen for updates
    socket.on('f1-update', (data) =>{
      console.log('F1 update recieved', data);
      setF1Data(data);
    });

    socket.on('football-update', (data) => {
      console.log('Football update recieved', data);
      setFootballData(data);
    });



    // inital data fetch
    fetchInitialData(); 
    return ()=>{
      socket.off('connect');
      socket.off('disconnect');
      socket.off('f1-update');
      socket.off('football-update');
    };
  }, []);


  const fetchInitialData = async () => {
    try {
      // fetch all f1 drivers
      const f1Response = await axios.get('http://localhost:5000/api/f1/drivers');
      console.log('F1 drivers fetched: ', f1Response.data);
      setF1Data(f1Response.data);

      const footballResponse = await axios.get('http://localhost:5000/api/football/upcoming');
      console.log('Football matches Fetched: ', footballResponse.data);
      setFootballData(footballResponse.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };



  return (
    <div className="App">
      <header style={{ padding: '20px', background: '#282c34', color: 'white' }}>
        <h1>🏎️⚽ Sports Data Dashboard</h1>
        <p>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      </header>

      <main style={{ padding: '20px' }}>
        <section style={{ marginBottom: '40px' }}>
          <h2>🏎️ F1 Data</h2>
          <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px' }}>
            {f1Data && f1Data.length > 0 ? (
              <div>
                <p><strong>Total items:</strong> {f1Data.length}</p>
                {f1Data.slice(0, 10).map((item, index) => (
                  <div key={index} style={{ 
                    background: 'white', 
                    padding: '10px', 
                    margin: '10px 0', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {item.full_name || item.driver_number || JSON.stringify(item).substring(0, 100)}
                  </div>
                ))}
              </div>
            ) : (
              <p>No F1 data available yet... Waiting for updates...</p>
            )}
          </div>
        </section>

        <section>
          <h2>⚽ Football Live Matches</h2>
          <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px' }}>
            {footballData && footballData.length > 0 ? (
              <div>
                <p><strong>Total matches:</strong> {footballData.length}</p>
                {footballData.slice(0, 10).map((match, index) => (
                  <div key={index} style={{ 
                    background: 'white', 
                    padding: '15px', 
                    margin: '10px 0', 
                    borderRadius: '4px' 
                  }}>
                    <strong>{match.homeTeam?.name || 'Home'}</strong> vs <strong>{match.awayTeam?.name || 'Away'}</strong>
                    {match.score && (
                      <span style={{ marginLeft: '10px' }}>
                        ({match.score.fullTime?.home || 0} - {match.score.fullTime?.away || 0})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No live matches at the moment... Waiting for updates...</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;


