const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require ('./cities');
const {places, descriptors} = require('./seedhelpers')  // destructure

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

//pick a random element from an array
// function sample (array) {
//     array[Math.floor(Math.random() * array.length)]
// };

// i dont fucking get the difference
const sample = array => array[Math.floor(Math.random() * array.length)]



const seedDB = async() => {
    await Campground.deleteMany({});
    for (let i=0; i<200; i++){
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '62d1d86d539b97c5cc14fdbb',
            title: `${sample(places)}, ${sample(descriptors)}`,
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            description: '#1 Camping Spots in the US',
            price,
            geometry: {
                type: "Point",
                coordinates: [cities[random1000].longitude,
                cities[random1000].latitude,
                ]
            },
            images: [
                {
                  url: `https://source.unsplash.com/random/500x500?camping,${i}`,
                  // or https://res.cloudinary.com/daxtkw7cw/image/upload/v1658444066/YelpCamp/scott-goodwill-y8Ngwq34_Ak-unsplash_hnyuoz.jpg
                  filename: 'YelpCamp/xosthxhiln6ar5enw6ir',
                }
              ],
            
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})