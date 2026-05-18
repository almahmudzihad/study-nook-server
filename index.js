const express = require('express');
const dotenv = require('dotenv');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
     await client.connect();
    const database = client.db("studynook");
    const collection = database.collection("rooms");

    app.get('/rooms', async (req, res) => {
        const result = await collection.find({}).toArray();
        res.send(result);
    })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => 
    res.send('studynook Server is running!')
);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
