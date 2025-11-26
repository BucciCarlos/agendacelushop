// 1. Import dependencies
require('dotenv').config(); // Must be the first import
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
// import { v4 as uuidv4 } from 'uuid'; // No longer needed for Contacts as Mongoose generates _id

// Import DB connection and Models
const dbConnect = require('./config/db.js');
const User = require('./models/User.js');
const Contact = require('./models/Contact.js'); // Import the new Contact model


// --- Legacy file DB logic (commented out) ---
// import fs from 'fs';

// const DB_FILE = path.join(__dirname, 'db.json');
// const readDb = () => JSON.parse(fs.readFileSync(DB_FILE));
// const writeDb = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
// --- End of legacy file DB logic ---

// 2. Initialize app and port
const app = express();
const PORT = process.env.PORT || 3001; // Changed default to 3001 to avoid conflict

// 3. Connect to Database
// Connection logic is moved to the serverless function handler to prevent race conditions.


// 4. Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
};
app.use(cors(corsOptions));
app.use(bodyParser.json());


// 5. API Endpoints

// --- AUTHENTICATION ---
app.post('/api/login', async (req, res) => {
    console.log('Login attempt received. Body:', req.body);
    const { username, password } = req.body;
    console.log('1. Body recibido:', req.body);

    try {
        const user = await User.findOne({ username });
        console.log('2. Usuario encontrado en DB:', user);

        console.log('3. Password DB:', user ? user.password : 'N/A');
        console.log('4. Password Body:', password);
        if (!user || user.password.trim() !== password.trim()) {
            console.log('User not found or password incorrect');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        console.log('Found user:', user);
        res.json({ success: true, message: 'Login successful' });
    } catch (error) {
        console.error('🔥 Error during login:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// --- CONTACTS (Mongoose based endpoints) ---

app.get('/api/contacts', async (req, res) => {
    try {
        const { name, lastname, saleNumber, dni, date, startDate, endDate, all } = req.query;
        let query = {};

        if (name) query.name = { $regex: name, $options: 'i' };
        if (lastname) query.lastname = { $regex: lastname, $options: 'i' };
        if (dni) query.dni = { $regex: dni, $options: 'i' };
        if (saleNumber) query['sales.saleNumber'] = { $regex: saleNumber, $options: 'i' };

        if (date) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (date === 'today') query.date = { $gte: today };
            if (date === 'lastWeek') query.date = { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) };
            if (date === 'lastMonth') query.date = { $gte: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()) };
        }
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        let contacts;
        if (all === 'true') {
            contacts = await Contact.find(query).sort({ date: -1 });
            return res.json({ contacts });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        contacts = await Contact.find(query)
                                .sort({ date: -1 })
                                .skip(skip)
                                .limit(limit);
        const totalContacts = await Contact.countDocuments(query);
        const totalPages = Math.ceil(totalContacts / limit);

        res.json({
            contacts,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('🔥 Error fetching contacts:', error);
        res.status(500).json({ message: 'Error fetching contacts' });
    }
});

app.post('/api/contacts', async (req, res) => {
    try {
        const newContact = await Contact.create(req.body);
        res.status(201).json(newContact);
    } catch (error) {
        console.error('🔥 Error creating contact:', error);
        res.status(400).json({ message: error.message });
    }
});

app.post('/api/contacts/import', async (req, res) => {
    try {
        const importedContactsData = req.body;
        const newContacts = [];
        const errors = [];

        for (const contactData of importedContactsData) {
            // Basic validation
            if (!contactData['Nombre'] || !contactData['Apellido']) {
                errors.push(`Missing Nombre or Apellido for contact: ${JSON.stringify(contactData)}`);
                continue;
            }

            const personalPhone = String(contactData['Telefono Personal'] || '');
            const familyPhone = String(contactData['Telefono Familiar'] || '');
            const dni = String(contactData['DNI'] || '');

            const sales = contactData['N° de Venta'] ? [{
                saleNumber: String(contactData['N° de Venta']),
                date: contactData['Fecha de Venta'] ? String(contactData['Fecha de Venta']) : '',
            }] : [];

            let contactDate = new Date();
            if (contactData['Fecha']) {
                const parts = String(contactData['Fecha']).split('/');
                if (parts.length === 3) {
                    contactDate = new Date(parts[2], parts[1] - 1, parts[0]);
                } else {
                    contactDate = new Date(contactData['Fecha']);
                }
            }

            const contactToSave = {
                name: String(contactData['Nombre']),
                lastname: String(contactData['Apellido']),
                dni: dni,
                phones: [
                    { type: 'personal', number: personalPhone },
                    { type: 'family', number: familyPhone, relativeName: String(contactData['Nombre del Familiar'] || '') }
                ],
                sales: sales,
                comments: String(contactData['Comentarios'] || ''),
                date: contactDate,
            };
            newContacts.push(contactToSave);
        }

        if (errors.length > 0) {
            return res.status(400).json({ message: 'Validation errors during import', errors });
        }

        const insertedContacts = await Contact.insertMany(newContacts, { ordered: false });
        res.status(201).json({ message: 'Contacts imported successfully', importedCount: insertedContacts.length });

    } catch (error) {
        console.error('🔥 Error importing contacts:', error);
        res.status(500).json({ message: 'Error importing contacts', errors: error.errors });
    }
});


app.put('/api/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedContact = await Contact.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!updatedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.json(updatedContact);
    } catch (error) {
        console.error('🔥 Error updating contact:', error);
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedContact = await Contact.findByIdAndDelete(id);
        if (!deletedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.status(204).send(); // No Content
    } catch (error) {
        console.error('🔥 Error deleting contact:', error);
        res.status(500).json({ message: 'Error deleting contact' });
    }
});

app.put('/api/contacts/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const updatedContact = await Contact.findByIdAndUpdate(id, { comments }, { new: true });
        if (!updatedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.json(updatedContact);
    } catch (error) {
        console.error('🔥 Error updating comments:', error);
        res.status(400).json({ message: error.message });
    }
});





// 7. Start Server
// app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
// });

module.exports = app;