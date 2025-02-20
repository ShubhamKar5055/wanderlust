const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const sampleListings = require("./data.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(MONGO_URL);
}

main()
.then(() => {
    console.log("Database connection successful");
})
.catch((error) => {
    console.log(error);
});

Listing.insertMany(sampleListings.data)
.then(() => {
    console.log("Data was initialized");
})
.catch((error) => {
    console.log(error);
});