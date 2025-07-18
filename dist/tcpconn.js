"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.soInit = soInit;
exports.soRead = soRead;
exports.soWrite = soWrite;
// Wraps a raw TCP socket (net.Socket) into a TCPConn abstraction
function soInit(socket) {
    const conn = {
        socket: socket,
        err: null,
        ended: false,
        reader: null,
    };
    socket.on('data', (data) => {
        console.assert(conn.reader); // there should be a reader waiting for data
        conn.socket.pause();
        conn.reader.resolve(data);
        conn.reader = null;
    });
    socket.on('error', (err) => {
        // deliver err to current read 
        conn.err = err;
        if (conn.reader) {
            conn.reader.reject(err); // reject the read promise with the error
            conn.reader = null;
        }
    });
    socket.on('end', () => {
        conn.ended = true;
        if (conn.reader) {
            conn.reader.resolve(Buffer.from('')); // resolve with empty buffer ,EOF
            conn.reader = null; //clear reader
        }
    });
    return conn;
}
function soRead(conn) {
    console.assert(!conn.reader); // no concurrent reads
    return new Promise((resolve, reject) => {
        // if connection is unreadable, complete the promise immediately
        if (conn.err) {
            reject(conn.err);
            return;
        }
        if (conn.ended) {
            resolve(Buffer.from('')); // resolve with empty buffer, EOF
            return;
        }
        // save the promise callbacks
        conn.reader = { resolve: resolve, reject: reject };
        // resume the 'data' event to fulfill the promise when data arrives
        conn.socket.resume();
    });
}
// socket.write() accepts a callback, so conversion to a promise is trivial.
function soWrite(conn, data) {
    console.assert(data.length > 0);
    return new Promise((resolve, reject) => {
        if (conn.err) {
            reject(conn.err);
        }
        conn.socket.write(data, () => {
            resolve();
        });
    });
}
