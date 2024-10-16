import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import {
    Container, 
    Typography, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Button, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Box,
} from '@mui/material';

function App() {
    const [centers, setCenters] = useState([]);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSport, setSelectedSport] = useState('');
    const [slots, setSlots] = useState({});
    const [openBookingModal, setOpenBookingModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState({ courtNumber: null, timeSlot: '' });
    const [bookingDetails, setBookingDetails] = useState({ name: '', email: '', phone: '', paymentMethod: 'online' });
    const timeSlots = Array.from({ length: 12 }, (_, i) => `${(i + 9) % 24}:00-${(i + 10) % 24}:00`);

    useEffect(() => {
        axios.get('http://localhost:5000/centers')
            .then(response => setCenters(response.data))
            .catch(error => console.error('Error fetching centers:', error));
    }, []);

    useEffect(() => {
        if (selectedCenter && selectedDate && selectedSport&& renderTable()) {
            const sport = selectedCenter.sports.find(s => s.sportName === selectedSport);
            if (sport) {
                const courtData = sport.courts.reduce((acc, court) => {
                    acc[court.courtNumber] = court.availability[selectedDate] || {};
                    return acc;
                }, {});
                setSlots(courtData);
            }
        }
    }, [selectedCenter, selectedDate, selectedSport]);
    
    useEffect(() => {
      if (selectedCenter && selectedSport && selectedDate) {
          axios.get('http://localhost:5000/bookings', {
              params: {
                  centerId: selectedCenter._id,
                  sport: selectedSport,
                  date: selectedDate
              }
          })
          .then(response => {
              const newBookings = response.data;
  
              // Transform bookings into a slot-based format for easy rendering
              const updatedSlots = {};
  
              newBookings.forEach(booking => {
                  if (!updatedSlots[booking.courtNumber]) {
                      updatedSlots[booking.courtNumber] = {};
                  }
  
                  updatedSlots[booking.courtNumber][booking.timeSlot] = {
                      user: booking.user.name,
                      payment: booking.payment.method === 'online' ? 'Paid' : 'Collect'
                  };
              });
  
              setSlots(updatedSlots);
          })
          .catch(error => {
              console.error('Error fetching bookings:', error);
          });
      }
  }, [selectedCenter, selectedSport, selectedDate]);
  const handleBooking = () => {
    const { courtNumber, timeSlot } = selectedSlot;

    axios.post('http://localhost:5000/bookings', {
        centerId: selectedCenter._id,
        sport: selectedSport,
        courtNumber: courtNumber,
        date: selectedDate,
        timeSlot: timeSlot,
        user: {
            name: bookingDetails.name,
            email: bookingDetails.email,
            phone: bookingDetails.phone,
        },
        status: "booked",
        payment: {
            method: bookingDetails.paymentMethod, // This should consistently use the same string values
            amount: 499,
        }
    })
    .then(() => {
        alert('Booking successful!');
        // Refresh the slots by fetching new bookings
        fetchBookings(); // Call the method to fetch bookings
        setOpenBookingModal(false);
        setBookingDetails({ name: '', email: '', phone: '', paymentMethod: 'online' });
    })
    .catch(error => {
        console.error('Error making booking:', error);
        alert('Booking failed. Please try again.');
    });
};

const fetchBookings = () => {
    axios.get('http://localhost:5000/bookings', {
        params: {
            centerId: selectedCenter._id,
            sport: selectedSport,
            date: selectedDate
        }
    })
    .then(response => {
        const newBookings = response.data;

        // Transform bookings into a slot-based format for easy rendering
        const updatedSlots = {};

        newBookings.forEach(booking => {
            if (!updatedSlots[booking.courtNumber]) {
                updatedSlots[booking.courtNumber] = {};
            }

            updatedSlots[booking.courtNumber][booking.timeSlot] = {
                user: booking.user.name,
                payment: booking.payment.method === 'online' ? 'Paid' : 'Collect' // Ensure consistency
            };
        });

        setSlots(updatedSlots);
    })
    .catch(error => {
        console.error('Error fetching bookings:', error);
    });
};
  const renderTable = () => {
    const timeSlots = [
        '06:00-07:00', '07:00-08:00', '08:00-09:00',
        '09:00-10:00', '10:00-11:00', '11:00-12:00',
        '12:00-13:00', '13:00-14:00', '14:00-15:00',
        '15:00-16:00', '16:00-17:00', '17:00-18:00',
        '18:00-19:00', '19:00-20:00', '20:00-21:00'
    ];

    return (
        <table>
            <thead>
                <tr>
                    <th>Time Slot</th>
                    {Array.from({ length: selectedCenter?.sports?.find(s => s.sportName === selectedSport)?.courts.length || 0 }).map((_, i) => (
                        <th key={i}>Court {i + 1}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {timeSlots.map(timeSlot => (
                    <tr key={timeSlot}>
                        <td>{timeSlot}</td>
                        {Array.from({ length: selectedCenter?.sports?.find(s => s.sportName === selectedSport)?.courts.length || 0 }).map((_, i) => {
                            const slotInfo = slots[i + 1] && slots[i + 1][timeSlot];
                            return (
                                <td key={i} className={slotInfo ? 'booked' : 'available'}>
                                    {slotInfo ? (
                                        <>
                                            <div>{slotInfo.user}</div>
                                            <sup className={slotInfo.payment === 'Online' ? 'paid' : 'collect'}>
                                                {slotInfo.payment}
                                            </sup>
                                        </>
                                    ) : (
                                        <button onClick={() => handleSlotClick(i + 1, timeSlot)}>
                                            Book
                                        </button>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const handleSlotClick = (courtNumber, timeSlot) => {
  setSelectedSlot({ courtNumber, timeSlot });
  setOpenBookingModal(true);
};

const handleBookingSubmit = () => {
  handleBooking(); // This will update the backend and refresh the slots
  setOpenBookingModal(false);
};



    const openModal = (courtNumber, timeSlot) => {
        setSelectedSlot({ courtNumber, timeSlot });
        setOpenBookingModal(true);
    };


    return (
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom align="center" sx={{ marginTop: 4 }}>
                Sports Booking System
            </Typography>
            <Box sx={{ marginBottom: 4 }}>
                <FormControl fullWidth margin="normal">
                    <InputLabel>Select Center</InputLabel>
                    <Select
                        value={selectedCenter?._id || ''}
                        onChange={(e) => {
                            const center = centers.find(c => c._id === e.target.value);
                            setSelectedCenter(center);
                            setSelectedSport('');
                            setSelectedDate('');
                            setSlots({});
                        }}
                    >
                        <MenuItem value="">Select a Center</MenuItem>
                        {centers.map(center => (
                            <MenuItem key={center._id} value={center._id}>{center.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {selectedCenter && (
                    <>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Select Sport</InputLabel>
                            <Select
                                value={selectedSport}
                                onChange={(e) => setSelectedSport(e.target.value)}
                            >
                                <MenuItem value="">Select a Sport</MenuItem>
                                {selectedCenter.sports.map(sport => (
                                    <MenuItem key={sport.sportName} value={sport.sportName}>
                                        {sport.sportName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Select Date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />
                    </>
                )}
            </Box>

{selectedDate && selectedSport && (
    <TableContainer component={Paper}>
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Time Slot</TableCell>
                    {selectedCenter.sports.find(s => s.sportName === selectedSport).courts.map(court => (
                        <TableCell key={court.courtNumber} align="center">
                            Court {court.courtNumber}
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {timeSlots.map(timeSlot => (
                    <TableRow key={timeSlot}>
                        <TableCell>{timeSlot}</TableCell>
                        {selectedCenter.sports.find(s => s.sportName === selectedSport).courts.map(court => {
                            const courtNumber = court.courtNumber;
                            const slot = slots[courtNumber]?.[timeSlot];
                            const status = slot ? 'booked' : 'available';

                            return (
                                <TableCell
                                    key={courtNumber}
                                    align="center"
                                    sx={{
                                        backgroundColor: status === 'booked' ? '#e8f5e9' : '#f0f0f0',
                                        color: '#000',
                                        position: 'relative',
                                    }}
                                >
                                    {status === 'available' ? (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => openModal(courtNumber, timeSlot)}
                                        >
                                            Book
                                        </Button>
                                    ) : (
                                        <>
                                            <div style={{
                                                position: 'absolute',
                                                top: '4px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                fontSize: '0.75em',
                                                color: slot.payment === 'Paid' ? '#388e3c' : '#d32f2f', // Use 'Paid' instead of payment method
                                                border: `1px solid ${slot.payment === 'Paid' ? '#388e3c' : '#d32f2f'}`,
                                                borderRadius: '5px',
                                                padding: '2px 5px',
                                                backgroundColor: 'white',
                                                zIndex: 1,
                                            }}>
                                                {slot.payment} {/* This will display 'Paid' or 'Collect' */}
                                            </div>
                                            <div style={{
                                                marginTop: '20px',
                                                textAlign: 'center',
                                            }}>
                                                {slot.user}
                                            </div>
                                        </>
                                    )}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
)}


            <Dialog open={openBookingModal} onClose={() => setOpenBookingModal(false)}>
                <DialogTitle>Book a Slot</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Name"
                        value={bookingDetails.name}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, name: e.target.value })}
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="Email"
                        value={bookingDetails.email}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, email: e.target.value })}
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="Phone Number"
                        value={bookingDetails.phone}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, phone: e.target.value })}
                        fullWidth
                        margin="dense"
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                            value={bookingDetails.paymentMethod}
                            onChange={(e) => setBookingDetails({ ...bookingDetails, paymentMethod: e.target.value })}
                        >
                            <MenuItem value="online">Online</MenuItem>
                            <MenuItem value="cash">Cash</MenuItem>
                        </Select>
                    </FormControl>
                    <Typography variant="body2" sx={{ marginTop: 2 }}>
                        Booking Amount: ₹499
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBookingModal(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleBooking} color="primary" variant="contained">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default App;

