const express = require('express');
const dotenv = require('dotenv');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
        const db = client.db("studynook");


        app.post("/rooms", async (req, res) => {
            const room = req.body;

            const result = await db.collection("rooms").insertOne(room);

            res.send(result);
        });

        app.get("/rooms", async (req, res) => {
            try {
                const rooms = await db
                    .collection("rooms")
                    .find()
                    .sort({ createdAt: -1 })
                    .toArray();

                res.send(rooms);
            } catch (error) {
                res.status(500).send({
                    message: error.message,
                });
            }
        });
        app.get("/rooms/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const room = await db.collection("rooms").findOne({
                    _id: new ObjectId(id),
                });

                res.send(room);
            } catch (error) {
                res.status(500).send({
                    message: error.message,
                });
            }
        });
        app.get("/my-bookings/:email", async (req, res) => {
            try {
                const email = req.params.email;

                const bookings = await db.collection("rooms")
                        .find({
                            ownerEmail: email,
                        })
                        .sort({
                            createdAt: -1,
                        })
                        .toArray();

                res.send(bookings);
            } catch (error) {
                res.status(500).send({
                    message:
                        error.message,
                });
            }
        }
        );

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
