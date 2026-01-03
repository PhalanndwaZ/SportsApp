const axios = require('axios');

class F1Collector{
    constructor(){
        this.baseURL = 'https:api.openf1.org/v1';
   }
   // returns the current sessions 
   async getCurrentSession(){
        try {
            const response = await axios.get(`${this.baseURL}/sessions`, {
                params:{
                session_name:'Race',
                year: new Date().getFullYear()
                }      
            });
            return response.data;
        
        } catch (error) {
            console.error('Error fetching F1 session: ', error.message);
            throw error;
        
        }
    }
    // returns live driver positions
    async getLivePositions(){
        try {
            const response = await axios.get(`${this.baseURL}/position`,{
                params: {
                    session_key: sessionKey
                }
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching drivers: ', error.message);
            throw error;
            
        }
    }
}

module.exports = new F1Collector();

