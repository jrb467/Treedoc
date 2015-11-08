'use strict';

var config = {};

/* Either 'zip' or 'filesystem':
 * 'zip': Everything is contained in a zip file, which is sent over to the client
 *          From there, no requests to the server must be made
 *          The zip file must be in the project root named 'doc.zip'
 *
 * 'filesystem': The XML is sent to the user intially, but not external data
 *              as defined by the 'src' tags
 *              Data must be in folder named 'doc'
 *
 * NOTE: The word 'doc' for a root folder in the treedoc is reserved!
 */
config.documentFormat = 'filesystem';

// Set up the port the server runs on (defaults to 3000)
config.port = 80;

module.exports = config;
