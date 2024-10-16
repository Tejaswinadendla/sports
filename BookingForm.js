import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookingForm = () => {
  const [centers, setCenters] = useState([]);
  const [sports, setSports] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState([]);

  useEffect(() => {
    // Fetch available centers
    axios.get('/centers').then(response => {
      setCenters(response.data);
    });
  }, []);

  const handleCenterChange = (centerId) => {
    setSelectedCenter(centerId);
    // Fetch sports for the selected center
    const center = centers.find(c => c._id === centerId);
    setSports(center.sports);
  };

  const checkAvailability = () => {
    axios.post('/availability', {
      centerId: selectedCenter,
      sport: selectedSport,
      date: selectedDate
    }).then(response => {
      setAvailability(response.data);
    });
  };

  const bookSlot = (court, timeSlot) => {
    axios.post('/book', {
      centerId: selectedCenter,
      sport: selectedSport,
      court,
      date: selectedDate,
      timeSlot
    }).then(response => {
      alert('Booking successful!');
      checkAvailability();
    }).catch(err => {
      alert('Slot already booked');
    });
  };

  return (
    <div>
      <h1>Book a Slot</h1>
      <div>
        <label>Select Center:</label>
        <select onChange={(e) => handleCenterChange(e.target.value)}>
          <option value="">Select Center</option>
          {centers.map(center => (
            <option key={center._id} value={center._id}>{center.name}</option>
          ))}
        </select>
      </div>
      
      {sports.length > 0 && (
        <div>
          <label>Select Sport:</label>
          <select onChange={(e) => setSelectedSport(e.target.value)}>
            <option value="">Select Sport</option>
            {sports.map(sport => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
        </div>
      )}

      {selectedSport && (
        <div>
          <label>Select Date:</label>
          <input type="date" onChange={(e) => setSelectedDate(e.target.value)} />
          <button onClick={checkAvailability}>Check Availability</button>
        </div>
      )}

      {availability.length > 0 && (
        <div>
          <h2>Available Courts</h2>
          {availability.map(court => (
            <div key={court.court}>
              <h3>Court {court.court}</h3>
              <div>
                {Object.entries(court.availability).map(([timeSlot, status]) => (
                  <button
                    key={timeSlot}
                    onClick={() => bookSlot(court.court, timeSlot)}
                    disabled={status === 'booked'}>
                    {timeSlot} ({status})
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingForm;
