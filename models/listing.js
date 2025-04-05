const mongoose = require("mongoose");
const Review = require("./review.js");

const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image: {
        type: String,
        default:
            "https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        set: (v) => {
            return v === ""
                ? "https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                : v;
        },
    },
    price: {
        type: Number,
    },
    location: {
        type: String,
    },
    country: {
        type: String,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
});

// The middleware would run just after a listing document is deleted from the database (Database operation is completed)
// It handles the deletion of reviews associated with the listing
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing.reviews.length) {
        const result = await Review.deleteMany({
            _id: { $in: listing.reviews },
        });
        console.log(result);
    }
});

module.exports = mongoose.model("Listing", listingSchema);
