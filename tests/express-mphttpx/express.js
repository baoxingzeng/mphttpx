const express = require("express");
const formidable = require("formidable");

const app = express();

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.post("/api/formdata", (req, res, next) => {
    const form = formidable.formidable({});

    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        res.json({ fields, files });
    });
});

app.listen(3000);
