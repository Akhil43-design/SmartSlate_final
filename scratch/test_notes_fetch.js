const jwt = require('jsonwebtoken');
const http = require('http');

const fbToken = jwt.sign({
    user_id: '8jKDKLlaa4SwPTipZ9mSIDyqWvH2',
    sub: '8jKDKLlaa4SwPTipZ9mSIDyqWvH2',
    email: 'student_051@smartslate.test',
    name: 'Pooja Krishna',
    iss: 'https://securetoken.google.com/smartslate-bd117',
    aud: 'smartslate-bd117'
}, 'fake_secret_for_client_decoded');

function testNotes() {
    const req = http.request({
        hostname: 'localhost',
        port: 3003,
        path: '/api/notes?bookId=185',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${fbToken}`
        }
    }, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
            console.log('GET /api/notes?bookId=185 Status:', res.statusCode);
            console.log('Response body:', data);
        });
    });
    req.end();
}

testNotes();
