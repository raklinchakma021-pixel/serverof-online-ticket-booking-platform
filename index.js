const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const cors = require('cors');
const app = express()
const port = 5000
require('dotenv').config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion , ObjectId} = require('mongodb');

app.get('/', (req, res) => {
    res.send('Hello World!')
})




const uri = process.env.MONGO_DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const database = client.db("ticketbari_db");
         const usersCollection = database.collection("user");
           const ticketCollection = database.collection("tickets");
     const vendorCollection = database.collection("vendors");
  const bookingsCollection = database.collection("bookings");
    app.get('/api/users', async (req, res) => {

            const cursor = usersCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

             app.get('/api/tickets', async(req, res) =>{
            const query = {};
            if(req.query.vendorId){
                query.vendorId = req.query.vendorId;
            }
            if(req.query.status){
                query.status = req.query.status;
            }
            const cursor = ticketCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
            app.post('/api/tickets', async (req, res) => {
            const ticket = req.body;
            const newTicket = {
                ...ticket,
                createdAt:  new Date()
            }
            const result = await ticketCollection.insertOne(newTicket);
            res.send(result);
        })
app.get('/api/tickets/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }
            const result = await ticketCollection.findOne(query);
            res.send(result);
        })
  // booking related apis
        app.get('/api/bookings', async (req, res) => {
            const query = {};
            if (req.query.bookingId) {
                query.bookingId = req.query.bookingId;
            }
            if (req.query.ticketId) {
                query.ticketId = req.query.ticketId;
            }
            const cursor = bookingsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/api/bookings', async (req, res) => {
            const booking = req.body;
            const newBooking = {
                ...booking,
                createdAt: new Date()
            }
            const result = await bookingsCollection.insertOne(newBooking);
            res.send(result);
        })
         app.get('/api/vendors', async (req, res) => {
            const cursor = vendorCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        app.get('/api/my/vendors', async (req, res) => {
            const query = {};
            if (req.query.vendorId) {
                query.vendorId = req.query.vendorId;
            }
            const result = await vendorCollection.findOne(query);

            res.send(result || {});
        })

        app.post('/api/vendors', async (req, res) => {
            const vendor = req.body;
            const newVendor = {
                ...vendor,
                createdAt: new Date()
            }
            const result = await vendorCollection.insertOne(newVendor);
            res.send(result);
        })

app.put('/api/vendors/:id', async (req, res) => {
    try {
        const vendorId = req.params.id;
        const updatedData = req.body;

        const result = await vendorCollection.updateOne(
            { vendorId: vendorId },
            {
                $set: {
                    ...updatedData,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        res.send({
            success: true,
            message: "Vendor updated successfully",
            result
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: error.message
        });
    }
});

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})