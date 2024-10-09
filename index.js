const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));

const dbFilePath = path.join(__dirname, 'events.json');

const readEvents = () => {
    try {
        const data = fs.readFileSync(dbFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading events:', err);
        return [];
    }
};

const writeEvents = (events) => {
    try {
        fs.writeFileSync(dbFilePath, JSON.stringify(events, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing events:', err);
    }
};

// TODO: Implement
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.get('/events', (req, res) => {
    const events = readEvents();
    res.json(events);
});

app.post('/event', (req, res) => {
    const { name, type, date } = req.body;
    if (!name || !type || !date) {
        return res.status(400).json({ error: 'Name, type, and date are required' });
    }

    const events = readEvents();
    const newEvent = {
        id: events.length ? events[events.length - 1].id + 1 : 1,
        name,
        type,
        date,
    };

    events.push(newEvent);
    writeEvents(events);

    res.status(201).json(newEvent);
});

app.delete('/event/:id', (req, res) => {
    const { id } = req.params;
    const events = readEvents();
    const eventIndex = events.findIndex(event => event.id === parseInt(id));

    if (eventIndex === -1) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const deletedEvent = events.splice(eventIndex, 1)[0];
    writeEvents(events);

    res.json(deletedEvent);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
