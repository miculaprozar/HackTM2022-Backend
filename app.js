'use strict';

const configService = require('./app/services/configurationService');
const dbService = new (require('./app/services/dbService'))(configService.config);
const express = require('express')
const favicon = require("serve-favicon");
const path = require('path');
const { nextTick } = require('process');

const app = require('./app/controllers/mainController')(
    dbService,
    configService.config
);

// PORT is either provided as cli param, or read from config
// =============================================================================
const PORT = (process.argv)[2] || configService.config.webServer.port;

// START THE SERVER
// =============================================================================

app.listen(process.env.PORT || PORT, function () {
    console.log(`Server started on ${PORT}`);
});

try {
    app.use(favicon(path.join(__dirname, "www/build", "favicon.ico")));
    app.use(express.static(path.join(__dirname, 'www/build')));

    app.get('/*', (req, res, next) => {
        if (req.path.includes('/api')) {
            next();
        }
        res.sendFile(path.join(__dirname, 'www/build', 'index.html'));
    });
}
catch (err) {
    console.log(err);
    console.log("Something went wrong with the frontend build!")
}

// shutdown handler
// =============================================================================
function gracefulShutdownHandler() {
    console.log('Shutting down gracefully ...');

    databaseService.closeConnections().finally(() => {
        process.exit(0);
    });

}
process.on('SIGTERM', gracefulShutdownHandler);