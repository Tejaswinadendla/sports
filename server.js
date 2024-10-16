const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const MONGODB_URL = 'mongodb+srv://gametheory:gametheory@cluster0.6sffr.mongodb.net/gm?retryWrites=true&w=majority';

    mongoose.connect(MONGODB_URL, {
        connectTimeoutMS: 20000, // 20 seconds
        serverSelectionTimeoutMS: 20000
    })
        .then(() => console.log('MongoDB connected'))
        .catch(err => {
            console.error('Error connecting to MongoDB:', err);
            process.exit(1);
        });
    
const centerSchema = new mongoose.Schema({
    name: String,
    location: String,
    sports: [
        {
            sportName: String,
            courts: [
                {
                    courtNumber: Number,
                    availability: Object
                }
            ]
        }
    ]
});

const Center = mongoose.model('Center', centerSchema);

app.get('/centers', async (req, res) => {
    try {
        console.log('Fetching centers...');
        const centers = await Center.find();
        console.log('Centers fetched:', centers);
        if (centers.length === 0) {
            return res.status(404).json({ message: 'No centers found' });
        }
        res.json(centers);
    } catch (error) {
        console.error('Error fetching centers:', error);
        res.status(500).json({ message: 'Error fetching centers', error: error.message });
    }
});


const bookingSchema = new mongoose.Schema({
    centerId: mongoose.Types.ObjectId,
    sport: String,
    courtNumber: Number,
    date: String,
    timeSlot: String,
    user: {
        name: String,
        email: String,
        phone: String
    },
    status: String,
    payment: {
        method: String,
        amount: Number
    }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Fetch all centers
app.get('/centers', async (req, res) => {
    try {
        const centers = await Center.find();
        res.json(centers);
    } catch (error) {
        console.error('Error fetching centers:', error);
        res.status(500).json({ message: 'Error fetching centers' });
    }
});

// Handle booking creation
app.post('/bookings', async (req, res) => {
    try {
        const { centerId, sport, courtNumber, date, timeSlot, user, payment } = req.body;

        // Check if the slot is already booked
        const existingBooking = await Booking.findOne({
            centerId,
            sport,
            courtNumber,
            date,
            timeSlot,
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'Slot is already booked' });
        }

        // Create a new booking
        const newBooking = new Booking({
            centerId,
            sport,
            courtNumber,
            date,
            timeSlot,
            user,
            status: 'booked',
            payment
        });

        // Save the booking to the database
        await newBooking.save();

        res.status(201).json({ message: 'Booking successful', booking: newBooking });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Error creating booking' });
    }
});

// Fetch bookings for a center, sport, and date
app.get('/bookings', async (req, res) => {
    try {
        const { centerId, sport, date } = req.query;
        const bookings = await Booking.find({ centerId, sport, date });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Error fetching bookings' });
    }
});


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
