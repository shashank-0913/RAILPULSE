const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch(e) {
          resolve({ status: res.statusCode, data: raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("STRICT NAME & ID MATCHING SECURITY TEST");
  console.log("==================================================");

  // Test 1: Aadhaar Match (Rajesh Kumar Verma)
  console.log("\n[Test 1] Aadhaar 9845 2314 7890 + Matching Name (Sh. Rajesh Kumar Verma):");
  const t1 = await post('/api/auth/verify-id', {
    idType: 'aadhaar',
    idNumber: '9845 2314 7890',
    fullName: 'Sh. Rajesh Kumar Verma'
  });
  console.log(`  Status: ${t1.status} | Success: ${t1.data.success}`);
  console.log(`  Message: ${t1.data.message}`);
  if (t1.status !== 200) throw new Error("Test 1 failed");

  // Test 2: Aadhaar Mismatch (John Doe)
  console.log("\n[Test 2] Aadhaar 9845 2314 7890 + Mismatched Name (John Doe):");
  const t2 = await post('/api/auth/verify-id', {
    idType: 'aadhaar',
    idNumber: '9845 2314 7890',
    fullName: 'John Doe'
  });
  console.log(`  Status: ${t2.status} | Success: ${t2.data.success}`);
  console.log(`  Message: ${t2.data.message}`);
  if (t2.status !== 403) throw new Error("Test 2 should have been rejected (403)");

  // Test 3: Aadhaar Match (Shashank Sharma)
  console.log("\n[Test 3] Aadhaar 1234 5678 9012 + Matching Name (Shashank Sharma):");
  const t3 = await post('/api/auth/verify-id', {
    idType: 'aadhaar',
    idNumber: '1234 5678 9012',
    fullName: 'Shashank Sharma'
  });
  console.log(`  Status: ${t3.status} | Success: ${t3.data.success}`);
  console.log(`  Message: ${t3.data.message}`);
  if (t3.status !== 200) throw new Error("Test 3 failed");

  // Test 4: PAN Match (Dr. Priya Sundaram)
  console.log("\n[Test 4] PAN ABCDE1234F + Matching Name (Dr. Priya Sundaram):");
  const t4 = await post('/api/auth/verify-id', {
    idType: 'pan',
    idNumber: 'ABCDE1234F',
    fullName: 'Dr. Priya Sundaram'
  });
  console.log(`  Status: ${t4.status} | Success: ${t4.data.success}`);
  console.log(`  Message: ${t4.data.message}`);
  if (t4.status !== 200) throw new Error("Test 4 failed");

  // Test 5: PAN Mismatch (Random Hacker)
  console.log("\n[Test 5] PAN ABCDE1234F + Mismatched Name (Random Hacker):");
  const t5 = await post('/api/auth/verify-id', {
    idType: 'pan',
    idNumber: 'ABCDE1234F',
    fullName: 'Random Hacker'
  });
  console.log(`  Status: ${t5.status} | Success: ${t5.data.success}`);
  console.log(`  Message: ${t5.data.message}`);
  if (t5.status !== 403) throw new Error("Test 5 should have been rejected (403)");

  // Test 6: Passport Match (Arunav Sengupta)
  console.log("\n[Test 6] Passport K4892150 + Matching Name (Arunav Sengupta):");
  const t6 = await post('/api/auth/verify-id', {
    idType: 'passport',
    idNumber: 'K4892150',
    fullName: 'Arunav Sengupta'
  });
  console.log(`  Status: ${t6.status} | Success: ${t6.data.success}`);
  console.log(`  Message: ${t6.data.message}`);
  if (t6.status !== 200) throw new Error("Test 6 failed");

  // Test 7: Passport Mismatch (Fake Passenger)
  console.log("\n[Test 7] Passport K4892150 + Mismatched Name (Fake Passenger):");
  const t7 = await post('/api/auth/verify-id', {
    idType: 'passport',
    idNumber: 'K4892150',
    fullName: 'Fake Passenger'
  });
  console.log(`  Status: ${t7.status} | Success: ${t7.data.success}`);
  console.log(`  Message: ${t7.data.message}`);
  if (t7.status !== 403) throw new Error("Test 7 should have been rejected (403)");

  console.log("\n" + "=".repeat(50));
  console.log("ALL 7 STRICT IDENTITY TESTS PASSED PERFECTLY!");
  console.log("=".repeat(50));
}

runTests().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
