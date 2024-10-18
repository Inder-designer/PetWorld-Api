const mongoose = require("mongoose");

const connectDatabase = () => {
  console.log("handleDb");
  mongoose
    .connect(process.env.DB_URI, {
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
