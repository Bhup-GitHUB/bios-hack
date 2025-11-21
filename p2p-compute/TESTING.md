# 🧪 Testing Guide for P2P Compute Platform

## Table of Contents
- [Quick Test](#quick-test)
- [Testing File Sharing Between Two PCs](#testing-file-sharing-between-two-pcs)
- [Testing Distributed Computing](#testing-distributed-computing)
- [Testing Mobile Devices](#testing-mobile-devices)
- [Automated Testing](#automated-testing)
- [Troubleshooting Tests](#troubleshooting-tests)

## Quick Test

### 1. Single Computer Test (Two Browser Windows)

**Setup:**
```bash
cd p2p-compute
npm install
npm run build
npm start
```

**Steps:**
1. Open browser: `http://localhost:3000`
2. Enter name: "Peer-1", click "Connect to Network"
3. Open another browser window/tab: `http://localhost:3000`
4. Enter name: "Peer-2", click "Connect to Network"
5. Both windows should show each other in "Connected Peers"

**Expected Result:** ✅ Both peers see each other connected

---

## Testing File Sharing Between Two PCs

### Prerequisites
- Two computers on the same network (WiFi or LAN)
- Node.js installed on the server computer
- Any modern browser on both computers

### Test Case 1: Share a Small File

**PC 1 (Server):**
```bash
cd p2p-compute
npm start
# Note the Network URL: http://192.168.1.100:3000
```

**PC 2 (Client):**
1. Open browser
2. Navigate to: `http://192.168.1.100:3000` (use your actual IP)
3. Enter name: "PC-2"
4. Click "Connect to Network"

**PC 1 (Browser):**
1. Open browser: `http://localhost:3000`
2. Enter name: "PC-1"
3. Click "Connect to Network"
4. Wait for "PC-2" to appear in Connected Peers (green indicator)

**File Transfer:**
1. On PC-1 browser:
   - Click "📁 File Sharing" tab
   - Select "PC-2" from dropdown
   - Drag and drop a small file (< 5MB) or click to select
   - Click "Send"
2. On PC-2 browser:
   - Accept the file transfer prompt
   - Wait for progress bar to reach 100%

**Expected Results:**
- ✅ Peer connection established (green dot)
- ✅ File transfer starts
- ✅ Progress bar shows upload/download progress
- ✅ File received on PC-2
- ✅ Console logs show chunk transfer

**Test Data:**
- Test file: Create a text file `test.txt` with content
- Expected transfer time: < 5 seconds for small files

### Test Case 2: Share a Large File

Repeat Test Case 1 with a larger file (50-100MB):

**Expected Results:**
- ✅ Transfer completes without errors
- ✅ Progress updates smoothly
- ✅ No browser memory issues
- ✅ File integrity maintained

### Test Case 3: Multiple Files

**Steps:**
1. Select multiple files at once (Ctrl+Click or Cmd+Click)
2. Send to peer
3. Verify all files transfer successfully

**Expected Results:**
- ✅ All files appear in queue
- ✅ Each file shows individual progress
- ✅ All files received correctly

---

## Testing Distributed Computing

### Test Case 1: Simple Array Computation

**Setup:** Two peers connected (see above)

**Steps:**
1. Click "⚡ Compute Tasks" tab
2. Enter data: `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`
3. Enter function: `function(x) { return x * x; }`
4. Click "Submit Task"

**Expected Results:**
- ✅ Task distributed to connected peer
- ✅ Result received: `[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]`
- ✅ Shows which peer processed the task
- ✅ Execution time displayed

**Example Output:**
```
Task abc123... 
Result: [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
Processed by: Peer-2
```

### Test Case 2: Complex Computation

**Data:** `[1, 2, 3, 4, 5]`
**Function:**
```javascript
function(x) { 
  let sum = 0;
  for(let i = 1; i <= x; i++) {
    sum += i;
  }
  return sum;
}
```

**Expected Result:** `[1, 3, 6, 10, 15]` (sum of numbers 1 to x)

### Test Case 3: String Processing

**Data:** `["hello", "world", "p2p", "computing"]`
**Function:** `function(x) { return x.toUpperCase(); }`

**Expected Result:** `["HELLO", "WORLD", "P2P", "COMPUTING"]`

---

## Testing Mobile Devices

### Test Case 1: Phone to PC File Transfer

**Setup:**
- Server running on PC: `http://192.168.1.100:3000`
- Phone on same WiFi network

**Steps:**
1. On phone browser: Navigate to `http://192.168.1.100:3000`
2. Enter name: "Phone-1", connect
3. On PC browser: Connect as "PC-1"
4. From phone: Select PC-1, choose file from phone
5. Send file

**Expected Results:**
- ✅ Mobile UI is responsive
- ✅ File picker opens on phone
- ✅ File transfers successfully
- ✅ Touch interactions work smoothly

### Test Case 2: PC to Phone File Transfer

Same as above, but send from PC to phone.

---

## Automated Testing

### Unit Tests (Future Implementation)

```bash
npm test
```

### Integration Tests

Create a test script `test-integration.sh`:

```bash
#!/bin/bash

echo "Starting integration test..."

# Start server
npm start &
SERVER_PID=$!
sleep 3

# Test health endpoint
curl http://localhost:3000/health
HEALTH_CHECK=$?

if [ $HEALTH_CHECK -eq 0 ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  kill $SERVER_PID
  exit 1
fi

# Test peers API
curl http://localhost:3000/api/peers
API_CHECK=$?

if [ $API_CHECK -eq 0 ]; then
  echo "✅ API check passed"
else
  echo "❌ API check failed"
  kill $SERVER_PID
  exit 1
fi

# Cleanup
kill $SERVER_PID
echo "✅ Integration tests completed"
```

---

## Troubleshooting Tests

### Issue: Peers Not Connecting

**Diagnosis:**
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for WebSocket connection

**Solutions:**
- Ensure both devices on same network
- Check firewall allows port 3000
- Verify correct IP address
- Try different browser

**Test Command:**
```bash
# Check if server is accessible
curl http://192.168.1.100:3000/health
```

### Issue: File Transfer Fails

**Diagnosis:**
- Check browser console for errors
- Monitor memory usage (DevTools > Performance)
- Check peer connection status (green indicator)

**Solutions:**
- Try smaller file first
- Refresh both browsers
- Check network stability
- Close other tabs to free memory

**Debug Mode:**
Open console and check for:
```javascript
// Should see:
"✅ Connected to peer: abc123..."
"📤 Sending file test.txt in 10 chunks"
"📦 Received chunk 1/10 of test.txt"
```

### Issue: Task Not Executing

**Diagnosis:**
- Check if peers are connected (green dot)
- Verify function syntax is correct
- Check console for JavaScript errors

**Solutions:**
- Ensure peer is connected
- Test function locally first:
  ```javascript
  const fn = function(x) { return x * x; };
  console.log([1,2,3].map(fn)); // Test
  ```
- Refresh and reconnect

### Issue: High Memory Usage

**Monitor Memory:**
```bash
# Check server memory
curl http://localhost:3000/health | jq '.memory'
```

**Solutions:**
- Limit file size to < 100MB
- Close unnecessary browser tabs
- Restart server periodically
- Implement file streaming (future enhancement)

---

## Performance Benchmarks

### File Transfer Speed Test

| File Size | Expected Transfer Time (Same Network) |
|-----------|--------------------------------------|
| 1 MB      | < 1 second                          |
| 10 MB     | < 5 seconds                         |
| 50 MB     | < 20 seconds                        |
| 100 MB    | < 40 seconds                        |

### Compute Task Benchmark

| Array Size | Expected Processing Time |
|------------|-------------------------|
| 10 items   | < 100ms                |
| 100 items  | < 500ms                |
| 1000 items | < 2 seconds            |

---

## Test Checklist

Before releasing or deploying:

- [ ] Single computer test (2 browser windows) ✅
- [ ] Two PC file transfer (small file < 5MB) ✅
- [ ] Two PC file transfer (large file 50-100MB) ✅
- [ ] Multiple file transfer ✅
- [ ] Compute task (simple array) ✅
- [ ] Compute task (complex function) ✅
- [ ] Mobile to PC transfer ✅
- [ ] PC to mobile transfer ✅
- [ ] 3+ peers connected simultaneously ✅
- [ ] Peer disconnect/reconnect ✅
- [ ] Server restart with active connections ✅
- [ ] Cross-browser test (Chrome, Firefox, Safari) ✅
- [ ] Network interruption recovery ✅
- [ ] Memory leak check (long-running session) ✅

---

## Continuous Testing

### Set Up Monitoring

1. **Server Health Check:**
```bash
# Add to cron (check every 5 minutes)
*/5 * * * * curl http://localhost:3000/health || echo "Server down!"
```

2. **Log Monitoring:**
```bash
# Watch server logs
npm start | tee server.log
```

3. **Performance Monitoring:**
```javascript
// In browser console
setInterval(() => {
  console.log('Memory:', performance.memory);
}, 10000);
```

---

## Reporting Issues

When reporting issues, include:

1. **Environment:**
   - OS: Windows 10 / macOS 13 / Ubuntu 22.04
   - Browser: Chrome 120 / Firefox 121
   - Node.js: v18.17.0

2. **Steps to Reproduce:**
   ```
   1. Started server on PC-1
   2. Connected from PC-2
   3. Attempted to send 50MB file
   4. Transfer failed at 45%
   ```

3. **Console Output:**
   ```
   Error: Peer connection lost
   at handlePeerData:165
   ```

4. **Network Info:**
   - Server IP: 192.168.1.100
   - Both devices on WiFi
   - Router: TP-Link Archer C7

---

## Next Steps

After successful testing:

1. ✅ Deploy to production
2. ✅ Set up monitoring
3. ✅ Create user documentation
4. ✅ Plan feature enhancements

---

**Happy Testing! 🧪🚀**

