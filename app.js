const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const methodOverride = require("method-override");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

const validateListing = (req, res, next) => {
    const validationResult = listingSchema.validate(req.body);
    const { error } = validationResult;
    if (error) {
        const errMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, errMsg); // Bad Request
    } else {
        return next();
    }
};

const validateReview = (req, res, next) => {
    const validationResult = reviewSchema.validate(req.body);
    const { error } = validationResult;
    if (error) {
        const errMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, errMsg); // Bad Request
    } else {
        return next();
    }
};

/* If two promises are resolved at the same time (or in very quick succession), the callback (if present) for the promise
   that is placed in the callback queue first will get executed first */

/* Queries are buffered in Mongoose's internal queue when the database connection is not yet established. (Operation Buffering)
   Once the connection is made, the queries are executed
   The associated callbacks (if present), are placed in the callback queue once the asynchronous operation is completed
   The callbacks are moved from the callback queue to the call stack for execution by the event loop in the next cycle,
   once the call stack is clear */

/*  Mongoose, operations are initiated in a FIFO (First In, First Out) manner within the internal queue
    However, It does not necessarily mean they will complete in the same order */

/* The event loop in JavaScript/node runs in a cycle where it first executes synchronous code in the call stack,
   then processes all microtasks from the microtask queue, and finally executes tasks from the callback (macro) queue,
   ensuring non-blocking, asynchronous execution */

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

const port = 8080;

app.get("/", (req, res) => {
    res.send("Root is working");
});

// Index Route
app.get(
    "/listings",
    wrapAsync(async (req, res) => {
        const allListings = await Listing.find();
        res.render("listings/index.ejs", { allListings });
    })
);

// New Route
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

// Create Route
app.post(
    "/listings",
    validateListing,
    wrapAsync(async (req, res) => {
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
    })
);

// Show Route
app.get(
    "/listings/:id",
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        // The  populate method replaces referenced fields in a document with a copy of the actual data from related collections
        const listing = await Listing.findById(id).populate("reviews");
        res.render("listings/show.ejs", { listing });
    })
);

// Edit Route
app.get(
    "/listings/:id/edit",
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        res.render("listings/edit.ejs", { listing });
    })
);

// Update Route
app.patch(
    "/listings/:id",
    validateListing,
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        await Listing.findByIdAndUpdate(id, req.body.listing);
        res.redirect(`/listings/${id}`);
    })
);

// Delete Route
app.delete(
    "/listings/:id",
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        const deletedListing = await Listing.findByIdAndDelete(id);
        console.log(deletedListing);
        res.redirect("/listings");
    })
);

// Reviews
// Post Route
app.post(
    "/listings/:id/reviews",
    validateReview,
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        const newReview = new Review(req.body.review);

        listing.reviews.push(newReview);

        await listing.save();
        await newReview.save();

        console.log("New review saved");
        res.redirect(`/listings/${id}`);
    })
);

// Reviews
// Delete Route
app.delete(
    "/listings/:id/reviews/:reviewId",
    wrapAsync(async (req, res) => {
        const { id, reviewId } = req.params;
        await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        res.redirect(`/listings/${id}`);
    })
);

app.all("*", (req, res) => {
    throw new ExpressError(404, "Page Not Found!");
});

// Error handling Middleware
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { statusCode, message });
});

app.listen(port, () => {
    console.log("App is listening...");
});
