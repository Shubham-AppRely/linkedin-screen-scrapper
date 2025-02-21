const express = require("express");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/saveData", (req, res) => {
    const data = req.body.profiles;
    if (!data) return res.status(400).send({ message: "No data received" });

    fs.appendFileSync("scrapedData.json", JSON.stringify(data, null, 2) + ",\n");
    res.send({ message: "Data saved successfully", count: data.length });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
