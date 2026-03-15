const { execSync } = require('child_process');
try {
    const out = execSync('npx tsc --noEmit --pretty false 2>&1', {
        encoding: 'utf8',
        timeout: 120000,
        cwd: __dirname
    });
    console.log(out || 'No errors found');
    process.exit(0);
} catch (e) {
    console.log(e.stdout || '');
    console.log(e.stderr || '');
    process.exit(e.status || 1);
}
