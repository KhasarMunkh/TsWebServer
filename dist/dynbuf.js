"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufPush = bufPush;
exports.cutMessage = cutMessage;
exports.bufPop = bufPop;
// append data to the end of the buffer
function bufPush(buf, data) {
    const newLength = buf.length + data.length;
    if (buf.data.length < newLength) {
        // increase buffer capacity
        let cap = Math.max(newLength, 32);
        while (cap < newLength) {
            cap *= 2;
        }
        const newBuf = Buffer.alloc(cap);
        buf.data.copy(newBuf, 0, 0);
        buf.data = newBuf;
    }
    data.copy(buf.data, buf.length, 0);
    buf.length = newLength;
}
function cutMessage(buf) {
    const index = buf.data.subarray(0, buf.length).indexOf('\n');
    if (index < 0) {
        return null; // no complete message found
    }
    const msg = Buffer.from(buf.data.subarray(0, index + 1)); //create a new buffer with the message 
    bufPop(buf, index + 1);
    return msg;
}
// remove the first `length` bytes from the buffer
function bufPop(buf, length) {
    buf.data.copyWithin(0, length, buf.length);
    buf.length -= length;
}
