const express = require('express');
const dotenv = require('dotenv');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

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
const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URI}/api/auth/jwks`));
const verifyToken = async (req, res, next) => {
    const authheader = req?.headers.authorization;
    if (!authheader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authheader.split(' ')[1];
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    
    try {
        const { payload } = await jwtVerify(token, JWKS);
        
        next();
    } catch (error) {
        return res.status(401).send({ message: 'unauthorized access user' });
    }
    
}

async function run() {
    try {
        //await client.connect();
        const db = client.db("studynook");
        const bookingsCollection = db.collection("bookings");


        app.post("/rooms", verifyToken, async (req, res) => {
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
        app.delete("/rooms/:id", async (req, res) => {
            const id = req.params.id;

            const query = {
                _id: new ObjectId(id),
            };

            const result = await db
                .collection("rooms")
                .deleteOne(query);

            res.send(result);
        });
        app.put("/rooms/:id", async (req, res) => {
        const id = req.params.id;
        const updatedData = req.body;

        const query = {
            _id: new ObjectId(id),
        };

        const updateDoc = {
            $set: {
            roomName: updatedData.roomName,
            description: updatedData.description,
            image: updatedData.image,
            floor: updatedData.floor,
            capacity: Number(updatedData.capacity),
            hourlyRate: Number(updatedData.hourlyRate),
            amenities: updatedData.amenities,
            },
        };

        const result = await db
            .collection("rooms")
            .updateOne(query, updateDoc);

        res.send(result);
        });
        app.get("/my-rooms/:email", async (req, res) => {
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
        app.post("/bookings", async (req, res) => {
            try {
                const booking = req.body;

                const {
                    roomId,
                    date,
                    startTime,
                    endTime,
                } = booking;

                // conflict check
                const existingBooking =
                    await bookingsCollection.findOne({
                        roomId,
                        date,
                        status: "confirmed",

                        $or: [
                            {
                                startTime: {
                                    $lt: endTime,
                                },

                                endTime: {
                                    $gt: startTime,
                                },
                            },
                        ],
                    });

                if (existingBooking) {
                    return res.status(400).send({
                        success: false,
                        message:
                            "Time slot already booked",
                    });
                }

                const result =
                    await bookingsCollection.insertOne({
                        ...booking,
                        status: "confirmed",
                        createdAt: new Date(),
                    });

                res.send({
                    success: true,
                    insertedId:
                        result.insertedId,
                    message:
                        "Room booked successfully",
                });
            } catch (error) {
                console.log(error);

                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });
        app.get("/my-bookings/:email",
            async (req, res) => {
                try {
                    const email =
                        req.params.email;

                    const bookings =
                        await bookingsCollection
                            .find({
                                bookingEmail: email,
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
        app.patch("/bookings/:id/cancel",
            async (req, res) => {
                try {
                    const id =
                        req.params.id;

                    const result =
                        await bookingsCollection.updateOne(
                            {
                                _id:
                                    new ObjectId(id),
                            },
                            {
                                $set: {
                                    status:
                                        "cancelled",
                                },
                            }
                        );

                    res.send({
                        success: true,
                        message:
                            "Booking cancelled",
                        result,
                    });
                } catch (error) {
                    res.status(500).send({
                        message:
                            error.message,
                    });
                }
            }
        );
        app.get("/latest-rooms", async (req, res) => {
            try {
                const result = await db
                    .collection("rooms")
                    .find()
                    .sort({ _id: -1 })
                    .limit(6)
                    .toArray();

                res.send(result);
            } catch (error) {
                res.status(500).send({
                    message:
                        "Failed to fetch latest rooms",
                });
            }
        });

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
