const mongoose = require("mongoose");

const connectDatabase = () => {
  mongoose
    .connect("mongodb+srv://Inder-07k:Inder12071999@ivar-07k.upggqdk.mongodb.net/Ecommerce?retryWrites=true&w=majority", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    .then((data) => {
      console.log(`Mongodb connected with server: ${data.connection.host}`);
    }).catch((err) => {
      console.log("Mongodb connected fail");
    })
};

module.exports = connectDatabase;
