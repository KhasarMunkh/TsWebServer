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
        buf.data.copy(newBuf, 0, buf.headPtr, buf.headPtr + buf.length);
        buf.data = newBuf;
        buf.headPtr = 0; // reset head pointer to the beginning
    }
    data.copy(buf.data, buf.length + buf.headPtr, 0);
    buf.length = newLength;
}
function cutMessage(buf) {
    const index = buf.data.subarray(buf.headPtr, buf.headPtr + buf.length).indexOf('\n');
    if (index < 0) {
        return null; // no complete message found
    }
    const msg = Buffer.from(buf.data.subarray(buf.headPtr, buf.headPtr + index + 1)); //create a new buffer with the message 
    bufPop(buf, index + 1);
    return msg;
}
// remove data from the beginning of the buffer
// defer data movement until the wasted space is more than half of the buffer
function bufPop(buf, length) {
    buf.length -= length;
    buf.headPtr += length;
    if (buf.headPtr > buf.data.length / 2) {
        buf.data.copy(buf.data, 0, buf.headPtr, buf.length + buf.headPtr);
        buf.headPtr = 0;
    }
}
