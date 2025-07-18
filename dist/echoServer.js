"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const net = __importStar(require("net"));
const tcpconn_1 = require("./tcpconn");
const dynbuf_1 = require("./dynbuf");
function newConnection(socket) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('new connection', socket.remoteAddress, socket.remotePort);
        try {
            yield ServeClient(socket);
        }
        catch (err) {
            console.error('exception in ServeClient:', err);
        }
        finally {
            socket.destroy(); // close the socket when done
        }
    });
}
// Parse and remove a complete message from the incoming byte stream.
// Append some data to the buffer.
// Continue the loop if the message is incomplete.
// Handle the message.
// Send the response.
function ServeClient(socket) {
    return __awaiter(this, void 0, void 0, function* () {
        const conn = (0, tcpconn_1.soInit)(socket);
        const buf = { data: Buffer.alloc(0), length: 0 };
        while (true) {
            const msg = (0, dynbuf_1.cutMessage)(buf);
            if (!msg) {
                //need more data to complete the message
                const data = yield (0, tcpconn_1.soRead)(conn);
                (0, dynbuf_1.bufPush)(buf, data);
                // EOF
                if (data.length === 0) {
                    // no more data to read, end of stream
                    return;
                }
                // got some data, try to get a message again
                continue;
            }
            // TODO: handle the message and send a response
            if (msg.equals(Buffer.from('quit\n'))) {
                yield (0, tcpconn_1.soWrite)(conn, Buffer.from('Bye!\n'));
                socket.destroy();
                return;
            }
            else {
                const reply = Buffer.concat([Buffer.from('Echo: '), msg]);
                yield (0, tcpconn_1.soWrite)(conn, reply);
            }
        } //loop for msgs
    });
}
//net.createServer() function creates a listening socket whose type is net.Server. 
//net.Server has a listen() method to bind and listen on an address.
let server = net.createServer({
    pauseOnConnect: true, // Required by TcpConn, 'data' event paused until we read from socket
});
server.on("connection", newConnection);
server.on("error", (err) => { throw err; });
server.listen({ host: '127.0.0.1', port: 1234 });
