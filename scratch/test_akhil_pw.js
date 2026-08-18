const bcrypt = require('bcryptjs');

async function testPw() {
    const hash = '$2a$10$BMh1Oc8w7vAvAQNmsENcjePldrSoQ0dfmUpTtKBOKZLS9NaAHgjRW';
    console.log('1234:', await bcrypt.compare('1234', hash));
    console.log('SmartSlate@123:', await bcrypt.compare('SmartSlate@123', hash));
}

testPw();
