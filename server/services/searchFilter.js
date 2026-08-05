const https = require('https');
const http = require('http');

// Blocklist for adult / unsafe categories and domains
const BLOCKED_TERMS = [
    'adult', 'porn', 'xxx', 'sex', 'casino', 'gambling', 'betting', 'torrent',
    'warez', 'hack', 'crack', 'exploit', 'malware', 'violence', 'weapons'
];

const BLOCKED_DOMAINS = [
    'pornhub.com', 'xvideos.com', 'bet365.com', 'torrentz.eu', 'thepiratebay.org'
];

function isSafeQuery(query) {
    if (!query || typeof query !== 'string') return false;
    const lower = query.toLowerCase();
    for (const term of BLOCKED_TERMS) {
        if (lower.includes(term)) return false;
    }
    return true;
}

// Perform safe educational web search simulation / proxy
async function searchSafeWeb(query) {
    if (!isSafeQuery(query)) {
        return {
            safe: false,
            message: 'Query blocked by SmartSlate Safe Web Filter. Please search for educational topics.',
            results: []
        };
    }

    const lowerQ = query.toLowerCase().trim();

    // Educational Curated Knowledge Bank for instant offline/Pi performance
    const curatedData = [
        {
            keywords: ['photosynthesis', 'plant', 'chloroplast', 'leaf', 'botany'],
            title: 'Photosynthesis - National Geographic Kids',
            snippet: 'Photosynthesis is the process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy (glucose and oxygen).',
            url: 'https://kids.nationalgeographic.com/science/article/photosynthesis',
            category: 'Science & Biology'
        },
        {
            keywords: ['solar system', 'planet', 'mars', 'jupiter', 'space', 'astronomy', 'nasa'],
            title: 'NASA Solar System Exploration for Students',
            snippet: 'Explore the 8 planets in our solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune, along with dwarf planets and moons.',
            url: 'https://solarsystem.nasa.gov/planets/overview/',
            category: 'Astronomy & Space'
        },
        {
            keywords: ['ratio', 'fraction', 'math', 'algebra', 'geometry', 'equation', 'multiplication'],
            title: 'Khan Academy: Ratios, Rates & Proportions',
            snippet: 'Learn how to compare two quantities using ratios, convert fractions into percentages, and solve real-world word problems.',
            url: 'https://www.khanacademy.org/math/cc-fifth-grade-math',
            category: 'Mathematics'
        },
        {
            keywords: ['silk road', 'history', 'trade', 'ancient', 'china', 'rome', 'greece'],
            title: 'World History Encyclopedia: The Silk Road',
            snippet: 'The Silk Road was an ancient network of Eurasian trade routes active from the Han dynasty until the Ottoman Empire boycotted trade with the West.',
            url: 'https://www.worldhistory.org/Silk_Road/',
            category: 'World History'
        },
        {
            keywords: ['water cycle', 'evaporation', 'precipitation', 'rain', 'clouds'],
            title: 'USGS Water Science School: The Natural Water Cycle',
            snippet: 'Water on Earth is constantly moving! Learn how evaporation, condensation, precipitation, and transpiration cycle water through the atmosphere.',
            url: 'https://www.usgs.gov/special-topics/water-science-school',
            category: 'Earth Science'
        }
    ];

    // Check for matching curated topic
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

    // Dynamic Safe Result for general educational queries
    return {
        safe: true,
        query,
        total: 2,
        results: [
            {
                title: `Encyclopedia Article: ${query}`,
                snippet: `Detailed student reference article covering ${query}, including key historical background, scientific definitions, and practice exercises.`,
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
