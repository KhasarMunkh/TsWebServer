export type DynBuf = {
  data: Buffer, // the underlying buffer that holds the data
  length: number,   // current length of the data in the buffer
  headPtr: number, // index of the beginning of the data 
}
// append data to the end of the buffer
export function bufPush(buf: DynBuf, data: Buffer): void {
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

export function cutMessage(buf: DynBuf): Buffer | null {
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
export function bufPop(buf: DynBuf, length: number): void {
  buf.length -= length;
  buf.headPtr += length;
  if (buf.headPtr > buf.data.length / 2) {
    buf.data.copy(buf.data, 0, buf.headPtr, buf.length + buf.headPtr);
    buf.headPtr = 0;
  }
} 
