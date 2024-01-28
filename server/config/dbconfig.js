const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URL;
const connectToMongo = () => {
  mongoose.connect(mongoURI).then(()=>console.log ("Connected to Mongo Successfully")).catch((err) => console.log(err));

};
mongoose.set('strictQuery', true);
module.exports = connectToMongo; 