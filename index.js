const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const expressJSDocSwagger = require('express-jsdoc-swagger');

const app = express();
const middlewares = require('./src/middlewares');
const db = require('./src/db');

// connectors for db, cache etc.;
async function connector() {
    await db.MongoDB.connector();
}

connector();

const port = 7979;

app.use(cors());
app.use(logger('dev'));
app.use(express.json({ limit: 1000000 }));
app.use(express.urlencoded({ extended: false }));


expressJSDocSwagger(app)(middlewares.swagger);
app.use(express.json({ limit: '50mb' }));

//routes;
app.get('/deprem/status', (req, res) => {
    return res.json(
        {
            status: true,
            desc: 'kandilli rasathanesi api service',
            nope_redis: {}
        }
    );
});

app.use(require('./src/routes'));

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error(err);
        let response = {
            status: false,
            desc: '',
            httpStatus: 500
        };
        response.desc = err.message;
        return res.status(response.httpStatus).send(response); // Bad request
    }
    return next();
});



/**
 * 404
 */
app.use(function (req, res) {
    let response = {
        httpStatus: 404,
        status: false
    };
    response.desc = 'No endpoint!';
    return res.status(response.httpStatus).json(
        response
    );
});


app.listen(port, () => {
    console.log(`Kandilli Rasathanesi API Service API - PORT: ${port}`);
});