const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const bodyParser = require('body-parser');
const jsonFormat = require('json-format');


const DATA_DIR = os.tmpdir();

const app = express();

app.use(bodyParser.raw({
    inflate: true,
    limit: '100kb',
    type: 'application/json'
}));

PORT = process.env.PORT || 8877;
TOKEN = 'bda98695-b53e-4a63-a9c5-8b115ba6539c';

app.get(`/${TOKEN}`, (req, res) => res.send('Simple Web Server!'));

app.get('/aaa/:bucket_id', (req, res) => {
    console.log(req.params);
    res.send("fff")
});

app.get(`/${TOKEN}/:bucket_id`, (req, res, next) => {
        const bucket_dir = path.join(DATA_DIR, req.params['bucket_id']);

        if (bucket_dir.includes('.')) {
            return next('Invalid bucket name');
        }
        res.set('Content-Type', 'text/plain');

        if (!fs.existsSync(bucket_dir)) {
            fs.mkdirSync(bucket_dir);
        }
        fs.readdir(bucket_dir, (err, files) => {
            if (err) return next(err);

            files.sort().reverse().slice(0, 100).forEach((filename, idx, array) => {
                fs.readFile(path.join(bucket_dir, filename), (err, content) => {
                    res.write("============ " + filename + " ============");
                    res.write("\n");

                    res.write(JSON.stringify(JSON.parse(content), null, '\t'));
                    res.write("\n");

                    res.write("#######################################################")
                    res.write("\n");
                    res.write("\n");

                    if (idx === array.length - 1) {
                        res.end()
                    }
                });
            });
        });
    }
);

app.post(`/${TOKEN}/:bucket_id`, (req, res, next) => {
        const bucket_dir = path.join(DATA_DIR, req.params['bucket_id']);
        if (!fs.existsSync(bucket_dir)) {
            fs.mkdirSync(bucket_dir);
        }
        const timestamp = new Date().toISOString();
        const filename = timestamp + '.json';
        const file_path = path.join(bucket_dir, filename);
        fs.writeFile(file_path, req.body, (err) => {
            if (err) return next(err);
            res.send('Accepted');
        });

    }
);


app.use((req, res, next) =>
    res.status(404).send("Page not found. Maybe invalid token?")
);

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
