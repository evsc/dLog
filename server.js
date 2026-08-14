// ---------------------------------------
// Globals
// ---------------------------------------
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const config = require('./config');

const handle = require('./lib/handle')
    .initialize();

const port = process.env.PORT || 8010;
const publicDir = path.resolve(__dirname, 'public');

const db = require('./lib/db.js').initialize(
    port,
    config.db,
    function () {
        console.log('DB success');

        // handle.updateAllDreams(db);

        // Run these manually occasionally to update
        // the sentiment graphs on the viz page:
        // handle.updateAllTags(db);
        // handle.updateAllCharacters(db);
    },
    function () {
        console.log('DB failure');
    }
);

console.log('port: ' + port);


// ---------------------------------------
// Helpers
// ---------------------------------------

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};


function sendResponse(response, statusCode, contentType, body) {
    // Prevent accidental second responses.
    if (response.headersSent || response.writableEnded) {
        console.error(
            'Attempted to send response after response was already sent'
        );
        return;
    }

    response.writeHead(statusCode, {
        'content-type': contentType
    });

    response.end(body);
}


function sendFile(response, filePath, statusCode = 200) {
    // Don't attempt to send a second response.
    if (response.headersSent || response.writableEnded) {
        return;
    }

    fs.readFile(filePath, function (err, data) {
        if (err) {
            console.error('Error reading file:', filePath, err);

            if (response.headersSent || response.writableEnded) {
                return;
            }

            if (err.code === 'ENOENT') {
                sendResponse(
                    response,
                    404,
                    'text/plain; charset=utf-8',
                    'Not found'
                );
            } else {
                sendResponse(
                    response,
                    500,
                    'text/plain; charset=utf-8',
                    'Internal server error'
                );
            }

            return;
        }

        if (response.headersSent || response.writableEnded) {
            return;
        }

        const extension = path.extname(filePath).toLowerCase();

        response.writeHead(statusCode, {
            'content-type':
                mimeTypes[extension] ||
                'application/octet-stream'
        });

        response.end(data);
    });
}


function servePublicFile(request, response) {
    let pathname;

    try {
        pathname = new URL(
            request.url,
            `http://${request.headers.host || 'localhost'}`
        ).pathname;

        pathname = decodeURIComponent(pathname);
    } catch (err) {
        console.error('Invalid URL:', request.url);

        return sendResponse(
            response,
            400,
            'text/plain; charset=utf-8',
            'Bad request'
        );
    }

    // Prevent directory traversal:
    // /../../something cannot escape the public directory.
    const filePath = path.resolve(
        publicDir,
        '.' + pathname
    );

    if (
        filePath !== publicDir &&
        !filePath.startsWith(publicDir + path.sep)
    ) {
        return sendResponse(
            response,
            403,
            'text/plain; charset=utf-8',
            'Forbidden'
        );
    }

    sendFile(response, filePath);
}


// ---------------------------------------
// Server
// ---------------------------------------

const server = http.createServer(async function (request, response) {

    const requestUrl = new URL(
        request.url,
        `http://${request.headers.host || 'localhost'}`
    );

    const pathname = requestUrl.pathname;
    const params = requestUrl.searchParams;


    // ---------------------------------------
    // POST
    // ---------------------------------------

    if (request.method === 'POST') {

        console.log('Server request POST');

        let data = '';

        try {
            for await (const chunk of request) {
                data += chunk;

                // Protect against accidentally huge POST requests.
                if (Buffer.byteLength(data, 'utf8') > 1024 * 1024) {
                    return sendResponse(
                        response,
                        413,
                        'text/plain; charset=utf-8',
                        'Request body too large'
                    );
                }
            }
        } catch (err) {
            console.error('Error reading POST request:', err);

            return sendResponse(
                response,
                400,
                'text/plain; charset=utf-8',
                'Could not read request'
            );
        }


        console.log('POST data: ' + data);


        // ---------------------------------------
        // Parse JSON
        // ---------------------------------------

        let dataJSON;

        try {
            dataJSON = JSON.parse(data);
        } catch (err) {
            console.log('Error parsing JSON data:', err.message);

            return sendResponse(
                response,
                400,
                'text/plain; charset=utf-8',
                'Invalid JSON'
            );
        }


        if (!dataJSON) {
            console.log('Deadend');

            return sendResponse(
                response,
                400,
                'text/plain; charset=utf-8',
                "Don't know what you want"
            );
        }


        console.log(
            'dataJSON.pass ' +
            dataJSON.pass +
            '   config.accesspw ' +
            config.accesspw
        );

        console.log(
            'dataJSON.startDate ' +
            dataJSON.startDate
        );


        // ---------------------------------------
        // Password
        // ---------------------------------------

        if (dataJSON.pass !== config.accesspw) {

            console.log(
                'Wrong Password: ' +
                dataJSON.pass
            );

            return sendResponse(
                response,
                200,
                'text/plain; charset=utf-8',
                'Wrong Password!'
            );
        }


        // ---------------------------------------
        // POST request handlers
        // ---------------------------------------

        switch (dataJSON.req) {

            case 'all':
                return handle.all(
                    db,
                    dataJSON.tag,
                    dataJSON.character,
                    dataJSON.sort,
                    dataJSON.cflags,
                    dataJSON.startDate,
                    dataJSON.endDate,
                    response
                );


            case 'viz':
                return handle.viz(
                    db,
                    response
                );


            case 'viz_tags':
                return handle.viz_tags(
                    db,
                    response
                );


            case 'viz_chars':
                return handle.viz_chars(
                    db,
                    response
                );


            case 'chars':
                return handle.getChars(
                    db,
                    response
                );


            case 'tags':
                return handle.getTags(
                    db,
                    response
                );


            case 'delete':
                return handle.deleteDream(
                    db,
                    dataJSON.id,
                    response
                );


            case 'one':
                return handle.getDream(
                    db,
                    dataJSON.id,
                    response
                );


            case 'save':
                return handle.saveDream(
                    db,
                    dataJSON.data,
                    response
                );


            case 'checkpw':
                return sendResponse(
                    response,
                    200,
                    'text/plain; charset=utf-8',
                    '1'
                );


            default:
                return sendResponse(
                    response,
                    400,
                    'text/plain; charset=utf-8',
                    'Unknown request'
                );
        }
    }


    // ---------------------------------------
    // GET
    // ---------------------------------------

    if (request.method === 'GET') {

        console.log(
            'Server request GET ' +
            pathname
        );


        switch (pathname) {

            case '/':
            case '/new':
            case '/one':

                sendFile(
                    response,
                    path.join(publicDir, 'one.html')
                );

                return;


            case '/tags':

                sendFile(
                    response,
                    path.join(publicDir, 'tags.html')
                );

                return;


            case '/all':

                sendFile(
                    response,
                    path.join(publicDir, 'all.html')
                );

                return;


            case '/viz':

                sendFile(
                    response,
                    path.join(publicDir, 'viz.html')
                );

                return;


            default:

                servePublicFile(
                    request,
                    response
                );

                return;
        }
    }


    // ---------------------------------------
    // Unsupported HTTP method
    // ---------------------------------------

    return sendResponse(
        response,
        405,
        'text/plain; charset=utf-8',
        'Method not allowed'
    );
});


// ---------------------------------------
// Start server
// ---------------------------------------

server.listen(port, function () {
    console.log(
        'Server listening on port ' + port
    );
});