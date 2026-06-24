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
app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  const user = await usersCollection.findOne({
    _id: new ObjectId(id),
  });

  res.send(user);
});
app.patch("/api/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        const result = await usersCollection.updateOne(
            {
                _id: new ObjectId(id)
            },
            {
                $set: updatedData
            }
        );

        res.send(result);

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message
        });
    }
});
app.patch("/api/users/:id/fraud-status", async (req, res) => {
  const { id } = req.params;
  const { isFraud } = req.body;

  const user = await usersCollection.findOne({
    _id: new ObjectId(id),
  });

  const userResult = await usersCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    {
      $set: {
        isFraud,
      },
    }
  );

  await ticketCollection.updateMany(
    {
      vendorEmail: user.email,
    },
    {
      $set: {
        isHidden: isFraud,
      },
    }
  );

  res.send(userResult);
});
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

        app.get("/api/tickets/advertised", async (req, res) => {
  const result = await ticketCollection.find({
      status: "approved",
      isAdvertised: true,
    })
    .toArray();

  res.send(result);
});
app.get('/api/tickets/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }
            const result = await ticketCollection.findOne(query);
            res.send(result);
        })


        app.patch("/api/tickets/:id/advertise", async (req, res) => {
  const { id } = req.params;
  const { isAdvertised } = req.body;

  try {
    // Count current advertised tickets
    const advertisedCount = await ticketCollection.countDocuments({
      isAdvertised: true,
    });

    // If trying to turn ON and already 6 active
    if (isAdvertised) {
      if (advertisedCount >= 6) {
        return res.status(400).send({
          message: "Maximum 6 tickets can be advertised",
        });
      }
    }

    const result = await ticketCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isAdvertised,
        },
      }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});



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
          app.get("/api/bookings/:userId", async (req, res) => {
      const { userId } = req.params;

      const result = await bookingsCollection.find({ userId: userId }).toArray();

      res.json(result);
    });
 app.delete("/api/bookings/:bookingId", async (req, res) => {
      const { bookingId } = req.params;
      const result = await bookingsCollection.deleteOne({
        _id: new ObjectId(bookingId),
      });

      res.json(result);
    });

    app.patch(
  "/api/bookings/payment-success",
  async (req, res) => {
    const { email } = req.body;

    const result =
      await bookingsCollection.updateMany(
        {
          userEmail: email,
          paymentStatus: "Unpaid",
        },
        {
          $set: {
            paymentStatus: "Paid",
            paidAt: new Date(),
          },
        }
      );

    res.send(result);
  }
);

app.patch(
  "/api/bookings/:id",
  async (req, res) => {
    const id = req.params.id;
    const { bookingStatus } =
      req.body;

    const result =
      await bookingsCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            bookingStatus,
          },
        }
      );

    res.send(result);
  }
);
app.get(
  "/api/vendor/bookings/:vendorId",
  async (req, res) => {
    const { vendorId } =
      req.params;

    const result =
      await bookingsCollection
        .find({ vendorId })
        .toArray();

    res.send(result);
  }
);
         app.get('/api/vendors', async (req, res) => {
            const cursor = vendorCollection.find();
            const vendors = await cursor.toArray();
            for (const vendor of vendors) {
                const filter = {
                    vendorId: vendor._id.toString()
                }
                const ticketCount = await ticketCollection.countDocuments(filter)
                vendor.ticketCount = ticketCount
            }
            res.send(vendors);
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

 app.patch('/api/vendors/:id', async (req, res) => {
            const id = req.params.id;
            const updatedVendor = req.body;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: updatedVendor.status
                }
            }
            const result = await vendorCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })


      app.get(
  "/api/vendor/revenue/:vendorId",
  async (req, res) => {
    const { vendorId } = req.params;

    const totalTicketsAdded =
      await ticketCollection.countDocuments({
        vendorId,
      });

    const paidBookings =
      await bookingsCollection
        .find({
          vendorId,
          paymentStatus: "Paid",
        })
        .toArray();

    const totalTicketsSold =
      paidBookings.reduce(
        (sum, booking) =>
          sum + Number(booking.quantity || 0),
        0
      );

    const totalRevenue =
      paidBookings.reduce(
        (sum, booking) =>
          sum +
          Number(booking.totalPrice || 0),
        0
      );

    res.send({
      totalTicketsAdded,
      totalTicketsSold,
      totalRevenue,
    });
  }
);

app.patch("/tickets/:id/approve", async (req, res) => {
  const { id } = req.params;

  const result = await ticketCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "approved",
      },
    }
  );

  res.send(result);
});
app.patch("/tickets/:id/reject", async (req, res) => {
  const { id } = req.params;

  const result = await ticketCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "rejected",
      },
    }
  );

  res.send(result);
});

// admin stats 
app.get("/api/admin/stats", async (req, res) => {
  const usersCollection = database.collection("user");
  const ticketCollection = database.collection("tickets");

  const totalUsers = await usersCollection.countDocuments();
  const totalVendors = await usersCollection.countDocuments({ role: "vendor" });

  const totalTickets = await ticketCollection.countDocuments();

  const advertisedTickets = await ticketCollection.countDocuments({
    isAdvertised: true,
    status: "approved",
  });

  res.send({
    totalUsers,
    totalVendors,
    totalTickets,
    advertisedTickets,
  });
});

// vendor stats 
app.get("/api/vendor/stats/:email", async (req, res) => {
  const { email } = req.params;

  const totalTickets =
    await ticketCollection.countDocuments({
      vendorEmail: email,
    });

  const activeTickets =
    await ticketCollection.countDocuments({
      vendorEmail: email,
      status: "approved",
    });

  const paidBookings =
    await bookingsCollection
      .find({
        vendorEmail: email,
        paymentStatus: "Paid",
      })
      .toArray();

  const totalBookings =
    paidBookings.length;

  const revenue =
    paidBookings.reduce(
      (sum, booking) =>
        sum +
        Number(booking.totalPrice || 0),
      0
    );

  res.send({
    totalTickets,
    activeTickets,
    totalBookings,
    revenue,
  });
});

app.get(
  "/api/transactions/:userId",
  async (req, res) => {
    const { userId } = req.params;

    const result =
      await bookingsCollection
        .find({
          userId,
          paymentStatus: "Paid",
        })
        .sort({ paidAt: -1 })
        .toArray();

    res.send(result);
  }
);

app.get("/api/user/stats/:userId", async (req, res) => {
  const { userId } = req.params;

  const bookings = await bookingsCollection
    .find({ userId })
    .toArray();

  const myBookings = bookings.length;

  const pendingPayments = bookings.filter(
    booking => booking.paymentStatus === "Unpaid"
  ).length;

  const bookedTrips = bookings.filter(
    booking => booking.paymentStatus === "Paid"
  ).length;

  const availableTickets =
    await ticketCollection.countDocuments({
      status: "approved",
      isHidden: { $ne: true }
    });

  res.send({
    myBookings,
    pendingPayments,
    bookedTrips,
    availableTickets,
  });
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