const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Port configuration
const PORT = process.env.PORT || 3002;

const DATA_FILE = path.join(__dirname, 'bookings.json'); // <--- 2. ADD THIS

// --- 3. THE DATA LOADING LOGIC (Add it here) ---
const loadBookings = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("Error loading bookings:", err);
    }
    return []; 
};

// Initialize the array from the file immediately
let hotelBookings = loadBookings();


// --- MIDDLEWARE ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const { Parser } = require('json2csv');


// --- ROUTES ---

// 1. Home Page
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'D Calvins Luxury Hotel | Home', 
        page_name: 'home' 
    });
});

// 2. Rooms Gallery
app.get('/rooms', (req, res) => {
    const hotelRooms = [
        { name: 'Standard', price: 15000, image: 'bedroom-3.jpeg', beds: '2 Queen Beds', features: 'WI-FI, Fans, AC, TV' },
        { name: 'Executive', price: 18000, image: 'bedroom-1.png', beds: '1 King Bed', features: 'Fans, AC, TV' },
        { name: 'Luxury', price: 25000, image: 'bedroom-2.png', beds: '1 King Bed', features: 'WI-FI, Fans, AC, TV' },
        { name: 'VIP Suite', price: 35000, image: 'suite.png', beds: '2 King Beds', features: 'WI-FI, Fans, AC, TV' },
        { name: 'VIP LOUNGE', price: 45000, image: 'suite-2.png', beds: '1 Queen Bed', features: 'Fans, AC, TV' }
    ];
    res.render('rooms', { 
        title: 'Rooms | D\'Calvins', 
        page_name: 'rooms', 
        rooms: hotelRooms 
    });
});

// 3. Room Details (Individual)
app.get('/room-details', (req, res) => {
    const roomName = req.query.name;
    const allRooms = {
        'Standard': { name: 'Standard Room', price: '15,000', images: ['bed-1.png', 'bed-2.png', 'bed-3.png'], description: 'Experience comfort in our Standard Room...', features: ['High-Speed Wi-Fi', 'AC', 'TV'] },
        'Executive': { name: 'Executive Room', price: '18,000', images: ['executive-1.png'], description: 'Luxury and functionality...', features: ['High-Speed Wi-Fi', 'AC'] },
        'Luxury': { name: 'Luxury Room', price: '25,000', images: ['luxury-1.png'], description: 'Discerning guests only...', features: ['High-Speed Wi-Fi', 'AC'] },
        'VIP Suite': { name: 'VIP Suite', price: '35,000', images: ['bedroom-1.png'], description: 'Unparalleled luxury...', features: ['High-Speed Wi-Fi', 'AC'] },
        'VIP LOUNGE': { name: 'VIP LOUNGE', price: '45,000', images: ['suite-2.png'], description: 'Pinnacle of sophistication...', features: ['High-Speed Wi-Fi', 'AC'] }
    };
    const roomData = allRooms[roomName] || allRooms['Standard'];
    res.render('room-details', { title: `${roomData.name} | D'Calvins`, page_name: 'rooms', room: roomData });
});

// 4. Booking Page
app.get('/booking', (req, res) => {
    const requestedRoom = req.query.room || 'Standard';
    const roomDetails = {
        'Standard': { name: 'Standard', price: 15000, image: 'bedroom-3.jpeg' },
        'Executive': { name: 'Executive', price: 18000, image: 'bedroom-1.png' },
        'Luxury': { name: 'Luxury', price: 25000, image: 'bedroom-2.png' },
        'VIP Suite': { name: 'VIP Suite', price: 35000, image: 'suite.png' },
        'VIP LOUNGE': { name: 'VIP LOUNGE', price: 45000, image: 'suite-2.png' }
    };
    const roomData = roomDetails[requestedRoom] || roomDetails['Standard'];
    res.render('booking', { title: 'Book Your Stay', page_name: 'booking', selectedRoom: requestedRoom, room: roomData });
});

// 5. Submit Booking (POST)
app.post('/confirm-booking', (req, res) => {
    // 1. Pull guestPhone out of the request body
    const { guestName, roomType, guestPhone } = req.body; 

    const priceMap = {
        'Standard': "15,000", 'Executive': "18,000", 
        'Luxury': "25,000", 'VIP Suite': "35,000", 'VIP LOUNGE': "45,000"
    };

    const newBooking = {
        id: "DC" + Math.floor(Math.random() * 900 + 100),
        guest: guestName,
        phone: guestPhone, // <--- 2. ADD THIS LINE TO THE OBJECT
        room: roomType || "Standard Room",
        status: "Paid",
        amount: priceMap[roomType] || "15,000"
    };

    hotelBookings.unshift(newBooking);
    fs.writeFileSync(DATA_FILE, JSON.stringify(hotelBookings, null, 2));
    res.redirect('/thank-you'); 
});

// 6. Admin Dashboard
app.get('/admin/dashboard', (req, res) => {
    // 1. Calculate REAL Total Revenue
    const dynamicRevenue = hotelBookings.reduce((total, booking) => {
        // Ensure amount is a string before replacing commas
        const amountStr = booking.amount ? booking.amount.toString() : "0";
        const cleanAmount = Number(amountStr.replace(/,/g, ''));
        return total + cleanAmount;
    }, 0);

    // 2. Calculate REAL Occupancy Rate
    const totalRooms = 5; // D'Calvins capacity
    const activeBookingsCount = hotelBookings.length;
    
    // Calculate percentage and cap it at 100%
    let occupancyCalc = (activeBookingsCount / totalRooms) * 100;
    let finalOccupancy = Math.min(Math.round(occupancyCalc), 100);

    // 3. Render the page with all dynamic stats
    res.render('admin-dashboard', { 
        title: 'Admin Panel | D\'Calvins', 
        page_name: 'admin',
        stats: { 
            totalRevenue: dynamicRevenue.toLocaleString(), // e.g., "45,000"
            activeBookings: activeBookingsCount, 
            occupancyRate: finalOccupancy + "%" // e.g., "20%" or "100%"
        },
        orders: hotelBookings 
    });
});

app.get('/admin/export-report', (req, res) => {
    try {
        // 1. Define the columns for Excel
        const fields = ['id', 'guest', 'room', 'status', 'amount'];
        const opts = { fields };
        const parser = new Parser(opts);

        // 2. Convert your live 'hotelBookings' array to CSV format
        const csv = parser.parse(hotelBookings);

        // 3. Set the filename with today's date
        const fileName = `DCalvins_Report_${new Date().toISOString().split('T')[0]}.csv`;

        // 4. Tell the browser to download the file
        res.header('Content-Type', 'text/csv');
        res.attachment(fileName);
        return res.send(csv);

    } catch (err) {
        console.error(err);
        res.status(500).send("Export failed. Please check the server terminal.");
    }
});

// Ensure there is a :id here!
app.post('/admin/delete-booking/:id', (req, res) => {
    const bookingId = req.params.id;
    console.log("Attempting to delete ID:", bookingId);
    console.log("Current IDs in memory:", hotelBookings.map(b => b.id));
    
    // WAIT! There was a tiny bug in the filter above. It should be !== (NOT EQUAL)
    hotelBookings = hotelBookings.filter(booking => booking.id.toString().trim() !== bookingId.toString().trim());

    fs.writeFileSync(DATA_FILE, JSON.stringify(hotelBookings, null, 2));
    res.redirect('/admin/dashboard');
});

// 1. Show the Thank You page when someone goes to /thank-you
app.get('/thank-you', (req, res) => {
    // We grab the most recent booking from the top of our array
    const latestBooking = hotelBookings[0] || {}; 

    res.render('thank-you', { 
        title: 'Booking Confirmed | D\'Calvins', 
        page_name: 'booking',
        booking: latestBooking // Pass the data to EJS
    });
});

// 7. Contact Page
app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact Us', page_name: 'contact' });
});

app.post('/send-message', (req, res) => {
    res.send('Thank you! Your message has been sent to D\'Calvins.');
});

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`Hotel site is live at http://localhost:${PORT}`);
});