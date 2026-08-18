const { execSync } = require('child_process');

function killPort(port) {
  try {
    const stdout = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        console.log(`Killing PID ${pid} on port ${port}`);
        try {
          execSync(`taskkill /PID ${pid} /F`);
        } catch (e) {}
      }
    }
  } catch (e) {
    console.log(`Port ${port} is free.`);
  }
}

killPort(3004);
killPort(3005);
console.log('Done killing old servers.');
