// client.js
const io = require('socket.io-client');
const { RTCPeerConnection } = require('wrtc');

const SIGNALING_URL = process.env.SIGNALING_URL || 'http://localhost:3000';
const socket = io(SIGNALING_URL);

socket.on('connect', () => {
  console.log('[client] connected to signaling server', socket.id);
  start();
});

async function start() {
  const pc = new RTCPeerConnection();

  // create data channel to send jobs
  const channel = pc.createDataChannel('compute');

  channel.onopen = () => {
    console.log('[client] datachannel open — sending job');

    const job = {
      jobId: `job-${Date.now()}`,
      // code must be a string that evaluates to a function: (p)=>{ ... }
      // example: return sum and note
      code: '(p) => { return { sum: p.a + p.b, note: "executed remotely" }; }',
      params: { a: 12, b: 30 }
    };

    channel.send(JSON.stringify(job));
    console.log('[client] job sent:', job.jobId);
  };

  channel.onmessage = (ev) => {
    try {
      const res = JSON.parse(ev.data);
      console.log('[client] job result received:', res);
    } catch (e) {
      console.log('[client] raw message:', ev.data);
    }
  };

  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      socket.emit('signal', { from: socket.id, payload: { type: 'ice', candidate: ev.candidate } });
    }
  };

  // create offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // broadcast offer (compute node will pick it up via signaling)
  socket.emit('signal', { from: socket.id, payload: { type: 'offer', sdp: pc.localDescription.sdp } });

  // listen for answers and ice from signaling server
  socket.on('signal', async (data) => {
    if (!data || data.from === socket.id) return;
    const payload = data.payload;
    if (payload.type === 'answer') {
      console.log('[client] received answer — setting remote description');
      await pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp });
    } else if (payload.type === 'ice') {
      try {
        await pc.addIceCandidate(payload.candidate);
      } catch (e) {
        console.warn('[client] addIceCandidate failed', e);
      }
    }
  });
}
