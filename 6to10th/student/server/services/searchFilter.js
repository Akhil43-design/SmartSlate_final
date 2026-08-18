const https = require('https');
const http = require('http');

const BLOCKED_TERMS = [
    'adult', 'porn', 'xxx', 'sex', 'casino', 'gambling', 'betting', 'torrent',
    'warez', 'hack', 'crack', 'exploit', 'malware', 'violence', 'weapons'
];

function isSafeQuery(query) {
    if (!query || typeof query !== 'string') return false;
    const lower = query.toLowerCase();
    for (const term of BLOCKED_TERMS) {
        if (lower.includes(term)) return false;
    }
    return true;
}

async function searchSafeWeb(query) {
    if (!isSafeQuery(query)) {
        return {
            safe: false,
            message: 'Query blocked by SmartSlate Safe Web Filter. Please search for educational topics.',
            results: []
        };
    }

    const lowerQ = query.toLowerCase().trim();

    const curatedData = [
        {
            keywords: ['photosynthesis', 'plant', 'chloroplast', 'leaf', 'botany'],
            title: 'Photosynthesis - National Geographic Kids',
            snippet: 'Photosynthesis is the process used by plants, algae, and certain bacteria to harness energy from sunlight.',
            url: 'https://kids.nationalgeographic.com/science/article/photosynthesis',
            category: 'Science & Biology'
        },
        {
            keywords: ['solar system', 'planet', 'mars', 'jupiter', 'space', 'astronomy', 'nasa'],
            title: 'NASA Solar System Exploration for Students',
            snippet: 'Explore the 8 planets in our solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.',
            url: 'https://solarsystem.nasa.gov/planets/overview/',
            category: 'Astronomy & Space'
        },
        {
            keywords: ['ratio', 'fraction', 'math', 'algebra', 'geometry', 'equation'],
            title: 'Khan Academy: Ratios, Rates & Proportions',
            snippet: 'Learn how to compare two quantities using ratios and solve real-world word problems.',
            url: 'https://www.khanacademy.org/math/cc-fifth-grade-math',
            category: 'Mathematics'
        },
        {
            keywords: ['silk road', 'history', 'trade', 'ancient', 'china'],
            title: 'World History Encyclopedia: The Silk Road',
            snippet: 'The Silk Road was an ancient network of Eurasian trade routes.',
            url: 'https://www.worldhistory.org/Silk_Road/',
            category: 'World History'
        }
    ];

    const matchedResults = curatedData.filter(item =>
        item.keywords.some(k => lowerQ.includes(k))
    );

    if (matchedResults.length > 0) {
        return {
            safe: true,
            query,
            total: matchedResults.length,
            results: matchedResults
        };
    }

    return {
        safe: true,
        query,
        total: 2,
        results: [
            {
                title: `Encyclopedia Article: ${query}`,
                snippet: `Detailed student reference article covering ${query}, including key historical background and scientific definitions.`,
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
                category: 'Reference & General Knowledge'
            },
            {
                title: `Interactive Learning Module: ${query}`,
                snippet: `Educational guides, diagrams, and quizzes designed to build core concepts in ${query}.`,
                url: `https://www.bbc.co.uk/bitesize/search?q=${encodeURIComponent(query)}`,
                category: 'Study Guide'
            }
        ]
    };
}

module.exports = {
    isSafeQuery,
    searchSafeWeb
};
