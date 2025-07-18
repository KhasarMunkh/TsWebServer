import * as net from 'net';
import { TcpConn, soInit, soRead, soWrite } from './tcpconn';
import { DynBuf, bufPush, bufPop, cutMessage, } from './dynbuf';

async function newConnection(socket: net.Socket): Promise<void> {
  console.log('new connection', socket.remoteAddress, socket.remotePort);
  try {
    await ServeClient(socket);
  }
  catch (err) {
    console.error('exception in ServeClient:', err);
  } finally {
    socket.destroy(); // close the socket when done
  }
}

// Parse and remove a complete message from the incoming byte stream.
// Append some data to the buffer.
// Continue the loop if the message is incomplete.
// Handle the message.
// Send the response.
async function ServeClient(socket: net.Socket): Promise<void> {
  const conn: TcpConn = soInit(socket);
  const buf: DynBuf = { data: Buffer.alloc(0), length: 0, headPtr: 0};
  while (true) {
    const msg: null | Buffer = cutMessage(buf);
    if (!msg) {
      //need more data to complete the message
      const data: Buffer = await soRead(conn);
      bufPush(buf, data);
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
      await soWrite(conn, Buffer.from('Bye!\n'));
      socket.destroy();
      return;
    }
    else {
      console.log('received message:', msg.toString());
      const reply = Buffer.concat([Buffer.from('Echo: '), msg]);
      await soWrite(conn, reply);
    }

  } //loop for msgs
}


//net.createServer() function creates a listening socket whose type is net.Server. 
//net.Server has a listen() method to bind and listen on an address.
let server = net.createServer({
  pauseOnConnect: true, // Required by TcpConn, 'data' event paused until we read from socket
});
server.on("connection", newConnection);
server.on("error", (err: Error) => { throw err; });
server.listen({ host: '127.0.0.1', port: 1234 });


