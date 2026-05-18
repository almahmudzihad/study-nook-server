const express = require('express');
const dotenv = require('dotenv');
const app = express();
const cors = require('cors');

dotenv.config();

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => 
    res.send('studynook Server is running!')
);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
