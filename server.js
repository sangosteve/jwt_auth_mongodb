const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const routes = require("./routes/routes");

mongoose.connect(
  "mongodb+srv://blackjack:blackjack@cluster0.aor3g.mongodb.net/jwt_auth_mongodb?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const database = mongoose.connection;

database.on("error", (error) => {
  console.log(error);
});

database.once("connected", () => {
  console.log("Database Connected");
});
app = express();

//MIDDLEWARE
app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
  res.status(200).send("Hello");
});
app.use("/api", routes);
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "http://localhost:8000"],
  })
);

app.listen(8000, () => console.log("Listening on port: 8000"));
