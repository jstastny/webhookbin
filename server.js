const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const bodyParser = require('body-parser');
const _ = require('lodash/core');

const DATA_DIR = os.tmpdir();

const app = express();

// create application/json parser
const jsonParser = bodyParser.json();

PORT = process.env.PORT || 8877;
TOKEN = process.env.TOKEN || 'bda98695-b53e-4a63-a9c5-8b115ba6539c';

app.get(`/${TOKEN}`, (req, res) => res.send('Simple Web Server!'));

app.use((req, res, next) => {
    res.set('Content-Type', 'text/plain');
    next()
});

app.use(`/${TOKEN}/:bucket_name`, (req, res, next) => {
    if (!req.params['bucket_name'].match(/^[A-Za-z0-9_-]+$/)) {
        console.error("Invalid bucket name: " + req.params['bucket_name']);
        return res.status(400).send('Invalid bucket name.');
    }
    next()
});

app.get(`/${TOKEN}/:bucket_name`, (req, res, next) => {
    const bucket_dir = path.join(DATA_DIR, req.params['bucket_name']);

    if (!fs.existsSync(bucket_dir)) {
        fs.mkdirSync(bucket_dir);
    }
    fs.readdir(bucket_dir, (err, files) => {
        if (err) return next(err);

        const files_subset = files.sort().reverse().slice(0, 100);
        if (files_subset.length === 0) {
            res.write("No requests in this bucket yet. Send POST request to this URL and check again.");
            res.write("\n");
            res.write("Sample curl call:");
            res.write("\n");
            res.end()
        }

        files_subset.forEach((filename, idx, array) => {
            fs.readFile(path.join(bucket_dir, filename), (err, content) => {
                res.write("============ " + filename + " ============");
                res.write("\n");

                res.write(content);
                res.write("\n");

                res.write("=======================================================");
                res.write("\n");
                res.write("\n");

                if (idx === array.length - 1) {
                    res.end()
                }
            });
        });
    });
});

app.post(`/${TOKEN}/:bucket_name`, jsonParser, (req, res, next) => {
    if (_.isEmpty(req.body)) {
        return res
            .status(400)
            .send("Invalid request. Only application/json requests are supported. " +
                "Make sure, you are setting Content-Type header correctly.");
    }
    const bucket_dir = path.join(DATA_DIR, req.params['bucket_name']);
    if (!fs.existsSync(bucket_dir)) {
        fs.mkdirSync(bucket_dir);
    }
    const timestamp = new Date().toISOString();
    const filename = timestamp + '.json';
    const file_path = path.join(bucket_dir, filename);
    const content = JSON.stringify(req.body, null, 2);
    fs.writeFile(file_path, content, (err) => {
        if (err) {
            console.error("Failed to write to file: " + file_path + ". Content: " + content);
            return next(err)
        }

        res.send('Accepted');
    });
});

app.use((req, res, next) =>
    res.status(404).send("Page not found. Maybe invalid token?")
);

app.listen(PORT, () => console.log(`Webhook bin listening on port ${PORT}!`));
