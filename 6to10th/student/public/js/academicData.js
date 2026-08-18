/* SmartSlate Academic Curriculum Data Model (Classes 5 to 10)
   Data-driven architecture supporting dynamic subjects, chapters, textbook readings,
   video lessons, step-by-step solutions, practice tests, and assignments.
*/

const AcademicData = {
    // Current student academic information (Dynamically loaded from Firestore students/{uid})
    studentProfile: null,

    // Current active class in the session (default 8, or loaded from user profile)
    selectedClass: 8,

    // Supported classes for middle & secondary school (6 to 10)
    supportedClasses: [6, 7, 8, 9, 10],

    // Curriculum data by class level
    classes: {
        5: {
            id: 5,
            name: "Class 5",
            gradeLabel: "Grade 5 Elementary",
            description: "Foundations of Science, Mathematics, Languages, and Social Studies",
            subjects: [
                {
                    id: "math-5",
                    name: "Mathematics",
                    code: "MATH",
                    icon: "📐",
                    color: "#3B82F6",
                    bgGradient: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                    description: "Large Numbers, Fractions, Shapes & Measurement",
                    progress: 78,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-5m-1",
                            number: 1,
                            title: "The Fish Tale (Numbers & Speed)",
                            readTime: "15 min",
                            summary: "Understanding large numbers, basic speed-distance-time relations, and real-life calculations.",
                            keyConcepts: ["Place value up to 7 digits", "Speed = Distance / Time", "Fish market commerce calculations"],
                            textbookContent: `
                                <h3>Chapter 1: The Fish Tale</h3>
                                <p class="lead">Numbers are all around us in daily trade, distances, and nature. Let us explore the world of fishermen and boats to understand how big numbers and arithmetic help in real life.</p>
                                
                                <div class="study-box info">
                                    <h4>💡 Key Concept: Large Numbers</h4>
                                    <p>1 Lakh = 100,000 (five zeros). 100 Lakhs = 1 Crore (seven zeros: 10,000,000).</p>
                                </div>

                                <h4>1. Speed and Distance of Boats</h4>
                                <p>A log boat goes about <strong>4 km in one hour</strong>. How far can it go in 6 hours?</p>
                                <div class="study-box formula">
                                    <strong>Distance = Speed × Time</strong><br>
                                    Distance = 4 km/h × 6 hours = <strong>24 km</strong>.
                                </div>

                                <h4>2. Women's Meenkar Bank</h4>
                                <p>20 fisherwomen have set up their own bank. Each saves ₹25 every month. Total collection per month = 20 × 25 = <strong>₹500</strong>.</p>
                            `,
                            videos: [
                                { id: "v1", title: "Introduction to Large Numbers & Lakhs", duration: "6:45", instructor: "Anita Sharma" },
                                { id: "v2", title: "Calculating Speed and Time with Boats", duration: "8:20", instructor: "Rohan Verma" }
                            ],
                            solutions: [
                                {
                                    q: "Q1. A motor boat travels at 20 km per hour. How far can it go in three and a half hours?",
                                    steps: [
                                        "Given speed of motor boat = 20 km/h",
                                        "Time = 3.5 hours",
                                        "Distance = Speed × Time = 20 × 3.5 = 70 km",
                                        "Answer: The motor boat travels 70 km."
                                    ]
                                },
                                {
                                    q: "Q2. If 1 kg of fresh fish becomes 1/3 kg of dried fish, how much dried fish will be made from 6000 kg fresh fish?",
                                    steps: [
                                        "Weight of fresh fish = 6000 kg",
                                        "Dried fish = (1/3) × 6000 kg = 2000 kg",
                                        "Answer: 2000 kg of dried fish."
                                    ]
                                }
                            ],
                            practice: [
                                {
                                    id: "p5m1-1",
                                    question: "How many thousands make One Lakh?",
                                    options: ["10 thousands", "100 thousands", "1000 thousands", "10,000 thousands"],
                                    correct: 1,
                                    explanation: "1 Lakh = 100,000 = 100 × 1,000 (100 thousands)."
                                },
                                {
                                    id: "p5m1-2",
                                    question: "If a boat travels at 15 km/h, how long will it take to travel 45 km?",
                                    options: ["2 hours", "3 hours", "4 hours", "5 hours"],
                                    correct: 1,
                                    explanation: "Time = Distance / Speed = 45 / 15 = 3 hours."
                                }
                            ]
                        },
                        {
                            id: "ch-5m-2",
                            number: 2,
                            title: "Shapes and Angles",
                            readTime: "18 min",
                            summary: "Discovering acute, right, and obtuse angles in daily objects, clocks, and yoga postures.",
                            keyConcepts: ["Right angle = 90°", "Acute angle < 90°", "Obtuse angle > 90°"],
                            textbookContent: `
                                <h3>Chapter 2: Shapes and Angles</h3>
                                <p>Rohini and Mohini are twin sisters who love making shapes with matchsticks. They discovered that shapes with the same number of sides can look completely different if their angles change.</p>
                                <div class="study-box info">
                                    <h4>📐 Angle Types</h4>
                                    <ul>
                                        <li><strong>Right Angle (L-shape):</strong> Exactly 90°</li>
                                        <li><strong>Acute Angle:</strong> Less than a right angle (&lt; 90°)</li>
                                        <li><strong>Obtuse Angle:</strong> More than a right angle (&gt; 90°)</li>
                                    </ul>
                                </div>
                            `,
                            videos: [
                                { id: "v3", title: "Recognizing Angles with Clock Hands", duration: "7:10", instructor: "Anita Sharma" }
                            ],
                            solutions: [
                                {
                                    q: "Q1. What angle is formed by the hands of a clock at 3:00?",
                                    steps: [
                                        "At 3:00, the minute hand points to 12 and the hour hand points to 3.",
                                        "The angle between 12 and 3 is exactly 90 degrees.",
                                        "Answer: A Right Angle (90°)."
                                    ]
                                }
                            ],
                            practice: [
                                {
                                    id: "p5m2-1",
                                    question: "An angle measuring 45° is called a(n):",
                                    options: ["Right angle", "Acute angle", "Obtuse angle", "Straight angle"],
                                    correct: 1,
                                    explanation: "Angles less than 90° are acute angles."
                                }
                            ]
                        }
                    ]
                },
                {
                    id: "sci-5",
                    name: "Environmental Studies",
                    code: "EVS",
                    icon: "🌿",
                    color: "#10B981",
                    bgGradient: "linear-gradient(135deg, #10B981, #047857)",
                    description: "Super Senses, Seeds, Plants & Animal Adaptations",
                    progress: 65,
                    pendingTasks: 2,
                    chapters: [
                        {
                            id: "ch-5s-1",
                            number: 1,
                            title: "Super Senses of Animals",
                            readTime: "12 min",
                            summary: "Explore how ants, dogs, eagles, and tigers use sight, smell, and hearing far beyond human capability.",
                            keyConcepts: ["Ant pheromone trails", "Eagle 8-meter vision", "Tiger whisker vibrations"],
                            textbookContent: `
                                <h3>Chapter 1: Super Senses</h3>
                                <p>Animals have amazing senses that allow them to find food, sense danger from miles away, and communicate without words.</p>
                                <div class="study-box info">
                                    <h4>🐾 Animal Superpowers</h4>
                                    <p>• <strong>Ants:</strong> Leave a scent trail on the ground that fellow ants follow.<br>
                                    • <strong>Silkworm:</strong> Can find female worm from many kilometers away by her smell.<br>
                                    • <strong>Kite, Eagle, Vulture:</strong> Can see things from 8 metres away what we see from 2 metres.</p>
                                </div>
                            `,
                            videos: [{ id: "v4", title: "How Animals Use Super Senses", duration: "9:15", instructor: "Dr. Vikram Roy" }],
                            solutions: [
                                {
                                    q: "Q1. Why do dogs sniff along the road?",
                                    steps: [
                                        "Dogs can make out if another dog has entered their area by the smell of urine or potty.",
                                        "They sniff to mark and recognize territorial boundaries."
                                    ]
                                }
                            ],
                            practice: [
                                {
                                    id: "p5s1-1",
                                    question: "Which bird can see 4 times further than humans?",
                                    options: ["Pigeon", "Eagle", "Sparrow", "Crow"],
                                    correct: 1,
                                    explanation: "Eagles, kites, and vultures can see from 8 meters what humans see from 2 meters."
                                }
                            ]
                        }
                    ]
                },
                {
                    id: "eng-5",
                    name: "English (Marigold)",
                    code: "ENG",
                    icon: "📖",
                    color: "#8B5CF6",
                    bgGradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
                    description: "Ice-cream Man, Flying Together & Teamwork",
                    progress: 82,
                    pendingTasks: 0,
                    chapters: [
                        {
                            id: "ch-5e-1",
                            number: 1,
                            title: "Ice-Cream Man & Wonderful Waste",
                            readTime: "10 min",
                            summary: "Summertime joy, delicious treats, and how a king's chef invented Avial from vegetable scraps.",
                            keyConcepts: ["Poetic imagery", "Reducing food waste", "Traditional Kerala recipe: Avial"],
                            textbookContent: `<h3>Wonderful Waste!</h3><p>Waste can be quite useful! Don't throw away vegetable scraps. The Maharaja of Travancore ordered a grand feast and the cook created the famous dish Avial from scrap peels.</p>`,
                            videos: [{ id: "v5", title: "Story of Avial & Cooking from Scraps", duration: "5:30", instructor: "Ms. Clara" }],
                            solutions: [{ q: "Q1. What dish was invented from vegetable scraps?", steps: ["The cook sliced vegetable scraps into long strips, added coconut and green chillies, curd, and curry leaves to create Avial."] }],
                            practice: [{ id: "p5e1-1", question: "Where was the dish Avial first created?", options: ["Bengal", "Kerala (Travancore)", "Punjab", "Gujarat"], correct: 1, explanation: "Avial was created in the royal kitchen of Travancore in Kerala." }]
                        }
                    ]
                },
                {
                    id: "hin-5",
                    name: "Hindi (Rimjhim)",
                    code: "HIN",
                    icon: "🇮🇳",
                    color: "#F59E0B",
                    bgGradient: "linear-gradient(135deg, #F59E0B, #D97706)",
                    description: "राख की रस्सी, फसलों के त्योहार व खिलौनेवाला",
                    progress: 70,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-5h-1",
                            number: 1,
                            title: "राख की रस्सी (तिब्बती लोककथा)",
                            readTime: "12 min",
                            summary: "लोनपो गार और उनके बेटे की बुद्धिमानी की रोचक कहानी।",
                            keyConcepts: ["तिब्बती संस्कृति", "चालाकी बनाम बुद्धिमत्ता", "समस्या समाधान"],
                            textbookContent: `<h3>पाठ १: राख की रस्सी</h3><p>लोनपो गार तिब्बत के बत्तीसवें राजा सोन्गवसैन गाम्पो के मंत्री थे। वे अपनी चालाकी और हाजिरजवाबी के लिए दूर-दूर तक प्रसिद्ध थे।</p>`,
                            videos: [{ id: "v6", title: "राख की रस्सी - सचित्र कहानी", duration: "6:10", instructor: "सुनीता शर्मा" }],
                            solutions: [{ q: "प्रश्न १. लोनपो गार अपने बेटे के लिए क्यों चिंतित रहते थे?", steps: ["उनका बेटा बहुत सीधा-सादा और भोला था। वे सोचते थे कि उनके बाद उसका काम कैसे चलेगा।"] }],
                            practice: [{ id: "p5h1-1", question: "लोनपो गार किस देश के मंत्री थे?", options: ["नेपाल", "तिब्बत", "भूटान", "भारत"], correct: 1, explanation: "लोनपो गार तिब्बत के ३२वें राजा के मंत्री थे।" }]
                        }
                    ]
                },
                {
                    id: "comp-5",
                    name: "Computer Science",
                    code: "CS",
                    icon: "💻",
                    color: "#EC4899",
                    bgGradient: "linear-gradient(135deg, #EC4899, #BE185D)",
                    description: "Computer Fundamentals, Scratch Coding & Stylus Drawing",
                    progress: 90,
                    pendingTasks: 0,
                    chapters: [
                        {
                            id: "ch-5c-1",
                            number: 1,
                            title: "Input & Output Devices",
                            readTime: "14 min",
                            summary: "Learn how keyboards, mice, monitors, and SmartSlate stylus pens process and display data.",
                            keyConcepts: ["Input vs Output", "Storage devices", "Stylus digitizer"],
                            textbookContent: `<h3>Hardware Essentials</h3><p>Computer systems receive data via Input devices (Keyboard, Mouse, Stylus, Mic), process with the CPU, and present information via Output devices (Monitor, Speaker, Printer).</p>`,
                            videos: [{ id: "v7", title: "Inside a Tablet Computer", duration: "7:45", instructor: "Rohan Verma" }],
                            solutions: [{ q: "Q1. Is a SmartSlate stylus pen an input or output device?", steps: ["A stylus digitizer captures pen strokes and coordinates and inputs them to the processor, so it is an input device."] }],
                            practice: [{ id: "p5c1-1", question: "Which of the following is an input device?", options: ["Monitor", "Printer", "Touchscreen Stylus", "Speaker"], correct: 2, explanation: "Stylus captures touch and drawing input." }]
                        }
                    ]
                }
            ]
        },

        6: {
            id: 6,
            name: "Class 6",
            gradeLabel: "Grade 6 Middle School",
            description: "Introduction to specialized sciences, algebraic thinking, and ancient history",
            subjects: [
                {
                    id: "math-6",
                    name: "Mathematics",
                    code: "MATH",
                    icon: "📐",
                    color: "#3B82F6",
                    bgGradient: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                    description: "Knowing Our Numbers, Whole Numbers, Integers & Fractions",
                    progress: 74,
                    pendingTasks: 2,
                    chapters: [
                        {
                            id: "ch-6m-1",
                            number: 1,
                            title: "Knowing Our Numbers",
                            readTime: "16 min",
                            summary: "Comparing numbers, Indian and International place value charts, and Roman numerals.",
                            keyConcepts: ["Indian: Lakhs & Crores", "International: Millions & Billions", "Roman numeral rules: I, V, X, L, C, D, M"],
                            textbookContent: `
                                <h3>Chapter 1: Knowing Our Numbers</h3>
                                <p>Numbers help us count objects, compare quantities, and organize large records.</p>
                                <div class="study-box info">
                                    <h4>📊 Place Value Systems</h4>
                                    <p><strong>Indian System:</strong> Ones, Tens, Hundreds, Thousands, Ten Thousands, Lakhs, Ten Lakhs, Crores.<br>
                                    <strong>International System:</strong> Ones, Tens, Hundreds, Thousands, Ten Thousands, Hundred Thousands, Millions, Ten Millions, Hundred Millions.</p>
                                </div>
                            `,
                            videos: [{ id: "v6-1", title: "Indian vs International Number System", duration: "8:50", instructor: "Prof. Sarah Lin" }],
                            solutions: [{ q: "Q1. Express 73,75,307 in words using the Indian system.", steps: ["Grouping commas: 73,75,307", "Words: Seventy-three lakh seventy-five thousand three hundred seven."] }],
                            practice: [{ id: "p6m1-1", question: "How many Millions make One Crore?", options: ["1 Million", "10 Millions", "100 Millions", "1000 Millions"], correct: 1, explanation: "1 Crore = 10,000,000 = 10 Millions." }]
                        }
                    ]
                },
                {
                    id: "sci-6",
                    name: "Science",
                    code: "SCI",
                    icon: "🔬",
                    color: "#10B981",
                    bgGradient: "linear-gradient(135deg, #10B981, #047857)",
                    description: "Components of Food, Fiber to Fabric, Sorting Materials & Light",
                    progress: 80,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-6s-1",
                            number: 1,
                            title: "Components of Food & Balanced Diet",
                            readTime: "14 min",
                            summary: "Carbohydrates, fats, proteins, vitamins, minerals, dietary fibers, and deficiency diseases.",
                            keyConcepts: ["Nutrient tests (Iodine for starch)", "Energy givers vs body builders", "Deficiency diseases (Scurvy, Rickets, Beriberi)"],
                            textbookContent: `<h3>Components of Food</h3><p>Food provides energy and nutrients required for growth, tissue repair, and immunity.</p>`,
                            videos: [{ id: "v6-3", title: "Testing Starch and Protein in Lab", duration: "6:40", instructor: "Dr. Vikram Roy" }],
                            solutions: [{ q: "Q1. Which vitamin deficiency causes night blindness?", steps: ["Vitamin A deficiency causes poor vision and loss of vision in darkness (night blindness)."] }],
                            practice: [{ id: "p6s1-1", question: "Iodine solution turns blue-black in the presence of:", options: ["Proteins", "Starch (Carbohydrate)", "Fats", "Vitamin C"], correct: 1, explanation: "Iodine test produces blue-black color when starch is present." }]
                        }
                    ]
                },
                {
                    id: "sst-6",
                    name: "Social Science",
                    code: "SST",
                    icon: "🌍",
                    color: "#F97316",
                    bgGradient: "linear-gradient(135deg, #F97316, #C2410C)",
                    description: "History: Early Cities; Geography: Solar System; Civics: Diversity",
                    progress: 68,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-6ss-1",
                            number: 1,
                            title: "In the Earliest Cities (Harappa & Mohenjo-Daro)",
                            readTime: "16 min",
                            summary: "Town planning, Great Bath, drainage systems, and craftsmanship of the Indus Valley Civilization.",
                            keyConcepts: ["Citadel vs Lower Town", "Baked brick drainage", "Harappan seals & bronze figurines"],
                            textbookContent: `<h3>The Harappan Civilization</h3><p>Over 4,500 years ago, cities like Harappa and Mohenjo-Daro developed along the Indus river valley with remarkable grid planning.</p>`,
                            videos: [{ id: "v6-4", title: "Virtual Tour of Mohenjo-Daro", duration: "10:15", instructor: "Anita Sharma" }],
                            solutions: [{ q: "Q1. How was the Great Bath at Mohenjo-Daro made water-tight?", steps: ["It was lined with bricks, coated with plaster, and sealed with a layer of natural tar (bitumen)."] }],
                            practice: [{ id: "p6ss1-1", question: "The Great Bath was discovered in which ancient city?", options: ["Lothal", "Mohenjo-Daro", "Kalibangan", "Ropar"], correct: 1, explanation: "The Great Bath is a famous structure of Mohenjo-Daro." }]
                        }
                    ]
                },
                {
                    id: "eng-6",
                    name: "English (Honeysuckle)",
                    code: "ENG",
                    icon: "📖",
                    color: "#8B5CF6",
                    bgGradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
                    description: "Who Did Patrick's Homework, A Tale of Two Birds & Grammar",
                    progress: 85,
                    pendingTasks: 0,
                    chapters: [
                        {
                            id: "ch-6e-1",
                            number: 1,
                            title: "Who Did Patrick's Homework?",
                            readTime: "12 min",
                            summary: "Patrick hated homework until he found an elf—and discovered that true learning came from within himself.",
                            keyConcepts: ["Self-reliance", "Vocabulary building", "Subject-verb agreement"],
                            textbookContent: `<h3>Who Did Patrick's Homework?</h3><p>Patrick never did homework. "Too boring," he said. He played hockey, basketball and Nintendo instead.</p>`,
                            videos: [{ id: "v6-5", title: "Patrick's Homework Story Animation", duration: "6:20", instructor: "Ms. Clara" }],
                            solutions: [{ q: "Q1. Who actually did Patrick's homework?", steps: ["Patrick himself did all the homework because he had to look up words, do calculations, and read histories to guide the elf."] }],
                            practice: [{ id: "p6e1-1", question: "What games did Patrick prefer playing over homework?", options: ["Cricket and Chess", "Hockey, Basketball & Nintendo", "Football and Tennis", "Swimming"], correct: 1, explanation: "Patrick played hockey, basketball, and Nintendo." }]
                        }
                    ]
                },
                {
                    id: "hin-6",
                    name: "Hindi (Vasant)",
                    code: "HIN",
                    icon: "🇮🇳",
                    color: "#EC4899",
                    bgGradient: "linear-gradient(135deg, #EC4899, #BE185D)",
                    description: "वह चिड़िया जो, बचपन, नादान दोस्त",
                    progress: 72,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-6h-1",
                            number: 1,
                            title: "वह चिड़िया जो (कविता - केदारनाथ अग्रवाल)",
                            readTime: "10 min",
                            summary: "नीले पंखों वाली नन्ही चिड़िया के संतोषी और साहसी स्वभाव का सुंदर वर्णन।",
                            keyConcepts: ["कविता भावार्थ", "पर्यायवाची शब्द", "प्रकृति प्रेम"],
                            textbookContent: `<h3>वह चिड़िया जो</h3><p>वह चिड़िया जो चोंच मार कर, दूध-भरे जुंडी के दाने रुचि से, रस से खा लेती है—वह छोटी संतोषी चिड़िया, नीले पंखों वाली मैं हूँ, मुझे अन्न से बहुत प्यार है।</p>`,
                            videos: [{ id: "v6-6", title: "कविता वाचन एवं व्याख्या", duration: "5:45", instructor: "सुनीता शर्मा" }],
                            solutions: [{ q: "प्रश्न १. चिड़िया को किन-किन चीजों से प्यार है?", steps: ["चिड़िया को अन्न के दानों से, जंगल और उसके एकांत से, तथा नदी के जल से बहुत प्यार है।"] }],
                            practice: [{ id: "p6h1-1", question: "'वह चिड़िया जो' कविता के रचयिता कौन हैं?", options: ["जयशंकर प्रसाद", "केदारनाथ अग्रवाल", "सूर्यकांत त्रिपाठी निराला", "महादेवी वर्मा"], correct: 1, explanation: "यह कविता केदारनाथ अग्रवाल द्वारा रचित है।" }]
                        }
                    ]
                },
                {
                    id: "sansk-6",
                    name: "Sanskrit (Ruchira)",
                    code: "SKT",
                    icon: "🕉️",
                    color: "#14B8A6",
                    bgGradient: "linear-gradient(135deg, #14B8A6, #0F766E)",
                    description: "शब्दपरिचयः, धातु रूपाणि व संस्कृत वर्णमाला",
                    progress: 60,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-6sk-1",
                            number: 1,
                            title: "प्रथमः पाठः - शब्दपरिचयः १",
                            readTime: "12 min",
                            summary: "अकारान्त पुंल्लिङ्ग शब्दानां प्रयोगः (सः, तौ, ते, एषः, एतौ, एते)।",
                            keyConcepts: ["पुंल्लिङ्ग एकवचन/द्विवचन/बहुवचन", "धातु रूप (अस्ति/स्तः/सन्ति)"],
                            textbookContent: `<h3>शब्दपरिचयः १</h3><p>एषः कः? एषः चषकः। किम् एषः बृहत्? न, एषः लघुः।<br>सः कः? सः सौचिकः। सौचिकः किं करोति? किं सः खेलति? न, सः वस्त्रं सीव्यति।</p>`,
                            videos: [{ id: "v6-7", title: "संस्कृत उच्चारण एवं शब्दार्थ", duration: "7:00", instructor: "आचार्य शास्त्री" }],
                            solutions: [{ q: "प्रश्न १. 'सौचिकः' पदस्य कः अर्थः?", steps: ["सौचिकः इत्युक्ते दर्जी (Tailor) इति अर्थः भवति।"] }],
                            practice: [{ id: "p6sk1-1", question: "'चषकः' शब्दस्य अर्थः अस्ति:", options: ["वस्त्रम्", "ग्लास (Cup)", "चम्मच", "घटः"], correct: 1, explanation: "चषकः इत्युक्ते ग्लास (Cup/Tumbler)।" }]
                        }
                    ]
                }
            ]
        },

        7: {
            id: 7,
            name: "Class 7",
            gradeLabel: "Grade 7 Middle School",
            description: "Rational numbers, cellular respiration, medieval empires, and grammar depth",
            subjects: [
                {
                    id: "math-7",
                    name: "Mathematics",
                    code: "MATH",
                    icon: "📐",
                    color: "#3B82F6",
                    bgGradient: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                    description: "Fractions & Decimals, Simple Equations, Lines & Angles, Triangles",
                    progress: 75,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-7m-1",
                            number: 1,
                            title: "Fractions and Decimals",
                            readTime: "15 min",
                            summary: "Multiplication and division of fractions and decimal representations.",
                            keyConcepts: ["Reciprocal of fractions", "Multiplication of decimals", "Word problem formulation"],
                            textbookContent: `<h3>Fractions and Decimals</h3><p>To divide a fraction by another fraction, multiply by the reciprocal of the divisor.</p>`,
                            videos: [{ id: "v7-1", title: "Fraction Division Made Simple", duration: "8:10", instructor: "Prof. Sarah Lin" }],
                            solutions: [{ q: "Q1. Find (3/5) ÷ (1/2)", steps: ["(3/5) ÷ (1/2) = (3/5) × (2/1) = 6/5 = 1 1/5"] }],
                            practice: [{ id: "p7m1-1", question: "What is 0.2 × 0.3?", options: ["0.6", "0.06", "6.0", "0.006"], correct: 1, explanation: "2 × 3 = 6 with 2 decimal places = 0.06." }]
                        }
                    ]
                },
                {
                    id: "sci-7",
                    name: "Science",
                    code: "SCI",
                    icon: "🔬",
                    color: "#10B981",
                    bgGradient: "linear-gradient(135deg, #10B981, #047857)",
                    description: "Nutrition in Plants & Animals, Heat, Acids & Bases, Physical Changes",
                    progress: 70,
                    pendingTasks: 2,
                    chapters: [
                        {
                            id: "ch-7s-1",
                            number: 1,
                            title: "Nutrition in Plants",
                            readTime: "14 min",
                            summary: "Autotrophic and heterotrophic nutrition, chlorophyll, stomata, and insectivorous plants.",
                            keyConcepts: ["Photosynthesis equation", "Stomatal guard cells", "Pitcher plant & Cuscuta"],
                            textbookContent: `<h3>Nutrition in Plants</h3><p>Green plants synthesize carbohydrates using carbon dioxide, water, and solar energy captured by chlorophyll.</p>`,
                            videos: [{ id: "v7-2", title: "Stomata & Chloroplast Mechanism", duration: "7:25", instructor: "Dr. Vikram Roy" }],
                            solutions: [{ q: "Q1. Why is Cuscuta called a parasite?", steps: ["Cuscuta lacks chlorophyll and climbs on host trees to derive ready-made nutrients, depriving the host."] }],
                            practice: [{ id: "p7s1-1", question: "Which organism is an example of an insectivorous plant?", options: ["Cuscuta", "Pitcher Plant", "Mushroom", "Algae"], correct: 1, explanation: "Pitcher plant traps insects to fulfill nitrogen requirements." }]
                        }
                    ]
                },
                {
                    id: "sst-7",
                    name: "Social Science",
                    code: "SST",
                    icon: "🌍",
                    color: "#F97316",
                    bgGradient: "linear-gradient(135deg, #F97316, #C2410C)",
                    description: "Delhi Sultans, Mughal Empire, Environment & State Government",
                    progress: 65,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-7ss-1",
                            number: 1,
                            title: "The Delhi Sultans (1206–1526)",
                            readTime: "16 min",
                            summary: "Mamluk, Khalji, Tughlaq, Sayyid, and Lodi dynasties, administrative reforms and architecture.",
                            keyConcepts: ["Iqta system", "Alauddin Khalji's market control", "Ibn Battuta's travelogue"],
                            textbookContent: `<h3>The Delhi Sultanate</h3><p>Delhi first became a capital under the Tomara Rajputs and grew into a powerful sultanate beginning with Qutb-ud-din Aibak in 1206.</p>`,
                            videos: [{ id: "v7-3", title: "Rise and Administration of Delhi Sultans", duration: "11:00", instructor: "Anita Sharma" }],
                            solutions: [{ q: "Q1. What was the language of administration under Delhi Sultans?", steps: ["Persian was the official administrative language of the Delhi Sultanate."] }],
                            practice: [{ id: "p7ss1-1", question: "Which ruler introduced the 'Token Currency' of bronze/copper in Delhi?", options: ["Alauddin Khalji", "Muhammad bin Tughlaq", "Balban", "Iltutmish"], correct: 1, explanation: "Muhammad bin Tughlaq introduced token currency in 1329 CE." }]
                        }
                    ]
                },
                {
                    id: "eng-7",
                    name: "English (Honeycomb)",
                    code: "ENG",
                    icon: "📖",
                    color: "#8B5CF6",
                    bgGradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
                    description: "Three Questions, The Gift of Chappals & Quality",
                    progress: 80,
                    pendingTasks: 0,
                    chapters: [
                        {
                            id: "ch-7e-1",
                            number: 1,
                            title: "Three Questions (Leo Tolstoy)",
                            readTime: "14 min",
                            summary: "A king seeks answers: What is the most important time, who are the most important people, and what is the most important thing to do?",
                            keyConcepts: ["Living in the present", "Selfless action", "Compassion"],
                            textbookContent: `<h3>Three Questions</h3><p>The most important time is NOW because it is the only time we have any power. The most important person is the one you are with, and the most important pursuit is to do that person good.</p>`,
                            videos: [{ id: "v7-4", title: "Leo Tolstoy's Three Questions Meaning", duration: "6:50", instructor: "Ms. Clara" }],
                            solutions: [{ q: "Q1. What were the hermit's answers to the three questions?", steps: ["1. Most important time: The present moment.", "2. Most important person: Whoever you are with right now.", "3. Most important affair: To do good to them."] }],
                            practice: [{ id: "p7e1-1", question: "Who authored the classic parable 'Three Questions'?", options: ["Rabindranath Tagore", "Leo Tolstoy", "O. Henry", "R.K. Narayan"], correct: 1, explanation: "Three Questions was written by Russian author Leo Tolstoy." }]
                        }
                    ]
                },
                {
                    id: "hin-7",
                    name: "Hindi (Vasant Part 2)",
                    code: "HIN",
                    icon: "🇮🇳",
                    color: "#EC4899",
                    bgGradient: "linear-gradient(135deg, #EC4899, #BE185D)",
                    description: "हम पंछी उन्मुक्त गगन के, दादी माँ, हिमालय की बेटियां",
                    progress: 74,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-7h-1",
                            number: 1,
                            title: "हम पंछी उन्मुक्त गगन के (शिवमंगल सिंह सुमन)",
                            readTime: "11 min",
                            summary: "स्वतंत्रता का महत्व और पिंजरे में बंद पक्षियों की व्यथा।",
                            keyConcepts: ["स्वाधीनता का मूल्य", "प्रकृति व प्राणी प्रेम"],
                            textbookContent: `<h3>हम पंछी उन्मुक्त गगन के</h3><p>हम पंछी उन्मुक्त गगन के, पिंजरबद्ध न गा पाएँगे। कनक-तीलियों से टकराकर, पुलकित पंख टूट जाएँगे।</p>`,
                            videos: [{ id: "v7-5", title: "कविता वाचन एवं भावार्थ", duration: "6:15", instructor: "सुनीता शर्मा" }],
                            solutions: [{ q: "प्रश्न १. पक्षी पिंजरे में क्यों नहीं रहना चाहते?", steps: ["पक्षी खुले आकाश में उड़ना, बहता जल पीना और कड़वी निंबौरी खाना पसंद करते हैं। सोने का पिंजरा भी उन्हें स्वतंत्रता नहीं दे सकता।"] }],
                            practice: [{ id: "p7h1-1", question: "'कनक-तीलियों' में 'कनक' का क्या अर्थ है?", options: ["चांदी", "सोना", "लोहा", "तांबा"], correct: 1, explanation: "कनक का अर्थ स्वर्ण (Gold) होता है।" }]
                        }
                    ]
                },
                {
                    id: "comp-7",
                    name: "Computer Science",
                    code: "CS",
                    icon: "💻",
                    color: "#06B6D4",
                    bgGradient: "linear-gradient(135deg, #06B6D4, #0E7490)",
                    description: "HTML5 Web Development, Python Basics & Cyber Ethics",
                    progress: 88,
                    pendingTasks: 0,
                    chapters: [
                        {
                            id: "ch-7c-1",
                            number: 1,
                            title: "Introduction to HTML5 Web Basics",
                            readTime: "15 min",
                            summary: "Tags, elements, attributes, headings, paragraphs, lists, and simple web page creation.",
                            keyConcepts: ["HTML structure: &lt;html&gt;, &lt;head&gt;, &lt;body&gt;", "Heading hierarchy H1-H6", "Ordered and unordered lists"],
                            textbookContent: `<h3>Building with HTML5</h3><p>HTML (HyperText Markup Language) provides the fundamental skeletal structure of websites worldwide.</p>`,
                            videos: [{ id: "v7-6", title: "Writing Your First Web Page in 10 Minutes", duration: "9:30", instructor: "Rohan Verma" }],
                            solutions: [{ q: "Q1. What tag is used for inserting line breaks in HTML?", steps: ["The <br> tag inserts a line break and is an empty/self-closing element."] }],
                            practice: [{ id: "p7c1-1", question: "Which tag is used for the largest heading in HTML?", options: ["&lt;head&gt;", "&lt;h6&gt;", "&lt;h1&gt;", "&lt;header&gt;"], correct: 2, explanation: "&lt;h1&gt; creates the top-level largest heading." }]
                        }
                    ]
                }
            ]
        },

        8: {
            id: 8,
            name: "Class 8",
            gradeLabel: "Grade 8 Advanced Middle",
            description: "Algebraic identities, rational numbers, crop production, Indian Constitution & Python",
            subjects: [
                {
                    id: "math-8",
                    name: "Mathematics",
                    code: "MATH",
                    icon: "📐",
                    color: "#2563EB",
                    bgGradient: "linear-gradient(135deg, #2563EB, #1E40AF)",
                    description: "Rational Numbers, Linear Equations, Quadrilaterals, Algebraic Expressions",
                    progress: 80,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-8m-1",
                            number: 1,
                            title: "Rational Numbers & Properties",
                            readTime: "18 min",
                            summary: "Closure, commutativity, associativity, distributive law, and representation on number lines.",
                            keyConcepts: ["Form: p/q (q ≠ 0)", "Additive Inverse: -a/b", "Multiplicative Inverse / Reciprocal: b/a", "Distributive Law: a(b + c) = ab + ac"],
                            textbookContent: `
                                <h3>Chapter 1: Rational Numbers</h3>
                                <p class="lead">A rational number is defined as a number that can be expressed in the form <strong>p/q</strong>, where p and q are integers and q ≠ 0.</p>
                                
                                <div class="study-box info">
                                    <h4>💡 Key Properties of Rational Numbers</h4>
                                    <ul>
                                        <li><strong>Closure Property:</strong> Rational numbers are closed under addition, subtraction, and multiplication. (Division is closed except for division by zero).</li>
                                        <li><strong>Commutative Property:</strong> a + b = b + a and a × b = b × a.</li>
                                        <li><strong>Associative Property:</strong> (a + b) + c = a + (b + c) and (a × b) × c = a × (b × c).</li>
                                        <li><strong>Distributivity:</strong> a × (b + c) = (a × b) + (a × c).</li>
                                    </ul>
                                </div>

                                <h4>Worked Example: Distributive Law</h4>
                                <p>Evaluate using suitable properties: <code>(-3/7) × (2/5) + (5/3) + (-3/7) × (3/5)</code></p>
                                <div class="study-box formula">
                                    Rearranging terms: (-3/7) × [ (2/5) + (3/5) ] + 5/3<br>
                                    = (-3/7) × [ 5/5 ] + 5/3<br>
                                    = (-3/7) × 1 + 5/3 = -3/7 + 5/3 = (-9 + 35) / 21 = <strong>26/21</strong>.
                                </div>
                            `,
                            videos: [
                                { id: "v8m1", title: "Complete Rational Numbers Properties in 15 Minutes", duration: "14:20", instructor: "Prof. Sarah Lin" },
                                { id: "v8m2", title: "Finding Rational Numbers Between Two Values", duration: "9:45", instructor: "Anita Sharma" }
                            ],
                            solutions: [
                                {
                                    q: "Q1. Find the multiplicative inverse (reciprocal) of -13/19.",
                                    steps: [
                                        "Multiplicative inverse of a/b is b/a such that (a/b) × (b/a) = 1.",
                                        "Here, (-13/19) × (-19/13) = 1.",
                                        "Answer: The multiplicative inverse is -19/13."
                                    ]
                                },
                                {
                                    q: "Q2. Verify that -(-x) = x for x = 11/15.",
                                    steps: [
                                        "The additive inverse of x = 11/15 is -x = -11/15 because 11/15 + (-11/15) = 0.",
                                        "The additive inverse of -11/15 is -(-11/15) = 11/15 = x.",
                                        "Hence, -(-x) = x is verified."
                                    ]
                                }
                            ],
                            practice: [
                                {
                                    id: "p8m1-1",
                                    question: "What is the additive identity for rational numbers?",
                                    options: ["1", "0", "-1", "None of these"],
                                    correct: 1,
                                    explanation: "Zero is the additive identity because a + 0 = 0 + a = a."
                                },
                                {
                                    id: "p8m1-2",
                                    question: "Which operation is NOT commutative for rational numbers?",
                                    options: ["Addition", "Multiplication", "Subtraction", "Both Addition & Multiplication"],
                                    correct: 2,
                                    explanation: "Subtraction is not commutative: a - b ≠ b - a in general."
                                },
                                {
                                    id: "p8m1-3",
                                    question: "The multiplicative inverse of -1 is:",
                                    options: ["1", "0", "-1", "Not defined"],
                                    correct: 2,
                                    explanation: "(-1) × (-1) = 1. Therefore, the reciprocal of -1 is -1 itself."
                                }
                            ]
                        },
                        {
                            id: "ch-8m-2",
                            number: 2,
                            title: "Linear Equations in One Variable",
                            readTime: "20 min",
                            summary: "Solving equations with variable on both sides, transposition method, and word problems.",
                            keyConcepts: ["Linear equation: degree = 1", "Transposition rule (change sign)", "Age and number word problem modeling"],
                            textbookContent: `
                                <h3>Chapter 2: Linear Equations in One Variable</h3>
                                <p>An algebraic equation is an equality involving variables and expressions. A linear equation has maximum power of the variable as 1.</p>
                                <div class="study-box info">
                                    <h4>Solving: 2x - 3 = 7</h4>
                                    <p>Step 1: Add 3 to both sides (transposition): 2x = 7 + 3 = 10<br>
                                    Step 2: Divide both sides by 2: x = 10 / 2 = <strong>5</strong>.</p>
                                </div>
                            `,
                            videos: [{ id: "v8m3", title: "Mastering Word Problems with Linear Equations", duration: "12:30", instructor: "Prof. Sarah Lin" }],
                            solutions: [{ q: "Q1. Solve: 5x + 9 = 5 + 3x", steps: ["Transpose 3x to LHS: 5x - 3x + 9 = 5", "2x + 9 = 5", "Transpose 9 to RHS: 2x = 5 - 9 = -4", "x = -4 / 2 = -2", "Answer: x = -2"] }],
                            practice: [{ id: "p8m2-1", question: "If 3x - 5 = 16, then x is equal to:", options: ["5", "7", "9", "11"], correct: 1, explanation: "3x = 16 + 5 = 21 -> x = 21 / 3 = 7." }]
                        }
                    ]
                },
                {
                    id: "sci-8",
                    name: "Science",
                    code: "SCI",
                    icon: "🔬",
                    color: "#059669",
                    bgGradient: "linear-gradient(135deg, #059669, #047857)",
                    description: "Crop Production, Microorganisms, Coal & Petroleum, Force & Pressure",
                    progress: 68,
                    pendingTasks: 2,
                    chapters: [
                        {
                            id: "ch-8s-1",
                            number: 1,
                            title: "Crop Production and Management",
                            readTime: "16 min",
                            summary: "Agricultural practices: soil preparation, sowing, manures vs fertilizers, drip irrigation, harvesting.",
                            keyConcepts: ["Kharif (Monsoon: Paddy, Maize) vs Rabi (Winter: Wheat, Gram)", "Drip vs Sprinkler irrigation", "Biological nitrogen fixation by Rhizobium"],
                            textbookContent: `
                                <h3>Chapter 1: Crop Production & Management</h3>
                                <p>When plants of the same kind are cultivated at one place on a large scale, it is called a crop.</p>
                                <div class="study-box info">
                                    <h4>🌱 Crop Seasons</h4>
                                    <ul>
                                        <li><strong>Kharif Crops:</strong> Sown in rainy season (June to September). E.g., Paddy, Maize, Soyabean, Groundnut.</li>
                                        <li><strong>Rabi Crops:</strong> Grown in winter season (October to March). E.g., Wheat, Gram, Pea, Mustard, Linseed.</li>
                                    </ul>
                                </div>
                            `,
                            videos: [{ id: "v8s1", title: "Modern Irrigation Methods & Precision Agriculture", duration: "10:15", instructor: "Dr. Vikram Roy" }],
                            solutions: [{ q: "Q1. State two advantages of manure over chemical fertilizers.", steps: ["1. Manure enhances the water holding capacity of the soil.", "2. It improves soil texture and increases the population of friendly microbes without causing chemical pollution."] }],
                            practice: [{ id: "p8s1-1", question: "Which of the following is a Kharif crop?", options: ["Wheat", "Mustard", "Paddy", "Gram"], correct: 2, explanation: "Paddy is a Kharif crop grown during rainy season." }]
                        }
                    ]
                },
                {
                    id: "sst-8",
                    name: "Social Science",
                    code: "SST",
                    icon: "🌍",
                    color: "#EA580C",
                    bgGradient: "linear-gradient(135deg, #EA580C, #C2410C)",
                    description: "History: From Trade to Territory; Civics: The Indian Constitution; Geography: Resources",
                    progress: 70,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-8ss-1",
                            number: 1,
                            title: "The Indian Constitution & Secularism",
                            readTime: "18 min",
                            summary: "Key features: Federalism, Parliamentary form of government, Separation of Powers, Fundamental Rights.",
                            keyConcepts: ["6 Fundamental Rights", "Preamble & Secularism", "Directive Principles"],
                            textbookContent: `<h3>Civics Chapter 1: The Indian Constitution</h3><p>A constitution lays down the basic ideals that form the basis of the kind of country that we as citizens aspire to live in.</p>`,
                            videos: [{ id: "v8ss1", title: "Why Do We Need a Constitution?", duration: "9:20", instructor: "Anita Sharma" }],
                            solutions: [{ q: "Q1. What is meant by 'Federalism'?", steps: ["Federalism refers to the existence of more than one level of government in the country (National Center, State governments, and Panchayati Raj)."] }],
                            practice: [{ id: "p8ss1-1", question: "Right to Equality is guaranteed under which article category?", options: ["Fundamental Rights", "Directive Principles", "Fundamental Duties", "Emergency Powers"], correct: 0, explanation: "Right to Equality is one of the 6 core Fundamental Rights in the Indian Constitution." }]
                        }
                    ]
                },
                {
                    id: "eng-8",
                    name: "English (Honeydew)",
                    code: "ENG",
                    icon: "📖",
                    color: "#7C3AED",
                    bgGradient: "linear-gradient(135deg, #7C3AED, #5B21B6)",
                    description: "The Best Christmas Present in the World, Tsunami, Glimpses of the Past",
                    progress: 75,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-8e-1",
                            number: 1,
                            title: "The Best Christmas Present in the World",
                            readTime: "15 min",
                            summary: "Michael Morpurgo's touching story of the 1914 WWI Christmas Truce letter discovered in an old roll-top desk.",
                            keyConcepts: ["Christmas Truce of 1914", "Theme of peace over war", "Connie Macpherson's reunion"],
                            textbookContent: `<h3>The Best Christmas Present in the World</h3><p>An old roll-top desk bought in a junk shop in Bridport reveals a secret tin box containing Captain Jim Macpherson's letter from the battlefield.</p>`,
                            videos: [{ id: "v8e1", title: "Story Analysis & Historical Context of 1914 Truce", duration: "8:40", instructor: "Ms. Clara" }],
                            solutions: [{ q: "Q1. What was the Christmas Truce in the story?", steps: ["On Christmas Day 1914 during World War I, British and German soldiers laid down weapons, shared schnapps and sausages, and played football in No Man's Land."] }],
                            practice: [{ id: "p8e1-1", question: "Who was the author of the letter found in the roll-top desk?", options: ["Hans Wolf", "Jim Macpherson", "Michael Morpurgo", "Connie"], correct: 1, explanation: "Jim Macpherson, captain of the British battalion, wrote the letter to his wife Connie." }]
                        }
                    ]
                },
                {
                    id: "hin-8",
                    name: "Hindi (Vasant Part 3)",
                    code: "HIN",
                    icon: "🇮🇳",
                    color: "#DB2777",
                    bgGradient: "linear-gradient(135deg, #DB2777, #9D174D)",
                    description: "ध्वनि, लाख की चूड़ियाँ, बस की यात्रा, दीवानों की हस्ती",
                    progress: 72,
                    pendingTasks: 0,
                    chapters: [
                        {
                            id: "ch-8h-1",
                            number: 1,
                            title: "लाख की चूड़ियाँ (कामतानाथ)",
                            readTime: "14 min",
                            summary: "मशीनी युग के कारण हाथ के कारीगर बदलू काका के व्यवसाय और जीवन में आए दर्दनाक बदलाव की संवेदनशील कहानी।",
                            keyConcepts: ["मशीनीकरण का प्रभाव", "पारंपरिक हस्तशिल्प", "शहरीकरण बनाम ग्रामीण संस्कृति"],
                            textbookContent: `<h3>लाख की चूड़ियाँ</h3><p>सारे गाँव में बदलू मुझे सबसे अच्छा आदमी लगता था, क्योंकि वह मुझे सुंदर-सुंदर लाख की गोलियाँ बनाकर देता था। वह मनिहार था और चूड़ियाँ बनाना उसका पैतृक पेशा था।</p>`,
                            videos: [{ id: "v8h1", title: "लाख की चूड़ियाँ - पाठ की व्याख्या", duration: "7:50", instructor: "सुनीता शर्मा" }],
                            solutions: [{ q: "प्रश्न १. मशीनी युग से बदलू के जीवन में क्या बदलाव आया?", steps: ["मशीनी काँच की चूड़ियों के प्रचलन से बदलू की लाख की चूड़ियों की माँग खत्म हो गई। उसका व्यवसाय बंद हो गया और वह बेरोजगार तथा बीमार हो गया।"] }],
                            practice: [{ id: "p8h1-1", question: "बदलू का मुख्य व्यवसाय क्या था?", options: ["मिट्टी के बर्तन बनाना", "लाख की चूड़ियाँ बनाना", "कपड़े बुनना", "लोहे के औजार बनाना"], correct: 1, explanation: "बदलू मनिहार था और लाख की चूड़ियाँ बनाता था।" }]
                        }
                    ]
                },
                {
                    id: "tel-8",
                    name: "Telugu (తెలుగు వాచకం)",
                    code: "TEL",
                    icon: "📜",
                    color: "#D97706",
                    bgGradient: "linear-gradient(135deg, #D97706, #B45309)",
                    description: "త్యాగనిరతి, సముద్ర ప్రయాణం, బండారి బసవన్న",
                    progress: 65,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-8t-1",
                            number: 1,
                            title: "త్యాగనిరతి (నన్నయ భట్టు)",
                            readTime: "12 min",
                            summary: "శిబి చక్రవర్తి తన ఆశ్రయానికి వచ్చిన పావురాన్ని రక్షించడానికి తన దేహాన్ని దానం చేసిన త్యాగ గుణం.",
                            keyConcepts: ["శరణాగత రక్షణ", "శిబి చక్రవర్తి కథ", "నన్నయ కవిత్వ శైలి"],
                            textbookContent: `<h3>త్యాగనిరతి</h3><p>శరణు కోరి వచ్చిన వారిని ప్రాణాలర్పించైనా రక్షించాలనే ఉన్నతమైన భారతీయ ధర్మాన్ని ఈ పాఠం తెలియజేస్తుంది.</p>`,
                            videos: [{ id: "v8t1", title: "త్యాగనిరతి పద్యాలు మరియు భావం", duration: "8:00", instructor: "వెంకటేశ్వర్లు గారు" }],
                            solutions: [{ q: "ప్రశ్న: శిబి చక్రవర్తి త్యాగ గుణాన్ని వివరించండి?", steps: ["డేగ బారినుండి పావురాన్ని రక్షించడానికి శిబి చక్రవర్తి తన శరీర మాంసాన్ని తులాభారంలో తూచి ఇవ్వడానికి సిద్ధపడ్డాడు."] }],
                            practice: [{ id: "p8t1-1", question: "'త్యాగనిరతి' పాఠ్యభాగ రచయిత ఎవరు?", options: ["తిక్కన", "నన్నయ", "ఎర్రన", "పోతన"], correct: 1, explanation: "ఆది కవి నన్నయ భట్టు ఆంధ్ర మహాభారతంలోని సభా పర్వం ఆధారంగా ఈ కథను రచించారు." }]
                        }
                    ]
                },
                {
                    id: "comp-8",
                    name: "Computer Science",
                    code: "CS",
                    icon: "💻",
                    color: "#0891B2",
                    bgGradient: "linear-gradient(135deg, #0891B2, #0E7490)",
                    description: "Python Programming, Loops, App Development & Cyber Security",
                    progress: 85,
                    pendingTasks: 0,
                    chapters: [
                        {
                            id: "ch-8c-1",
                            number: 1,
                            title: "Python Data Types, Conditions & Loops",
                            readTime: "18 min",
                            summary: "Variables, integers, floats, strings, if-elif-else statements, for loops, and while loops.",
                            keyConcepts: ["Data types: int, float, str, bool", "Indentation in Python", "For loop with range()"],
                            textbookContent: `
                                <h3>Python Programming Essentials</h3>
                                <p>Python is a clean, readable programming language widely used in AI, web development, and data science.</p>
                                <div class="study-box code">
                                    <pre># Loop and condition example
for i in range(1, 6):
    if i % 2 == 0:
        print(f"{i} is Even")
    else:
        print(f"{i} is Odd")</pre>
                                </div>
                            `,
                            videos: [{ id: "v8c1", title: "Python for Beginners - Hands-on in 15 Minutes", duration: "12:00", instructor: "Rohan Verma" }],
                            solutions: [{ q: "Q1. What will range(2, 8, 2) generate in Python?", steps: ["range(start, stop, step) starts at 2, steps by 2, and stops before 8.", "Values: [2, 4, 6]"] }],
                            practice: [{ id: "p8c1-1", question: "Which symbol is used for comments in Python?", options: ["//", "/* */", "#", "--"], correct: 2, explanation: "The # symbol is used for single-line comments in Python." }]
                        }
                    ]
                },
                {
                    id: "sansk-8",
                    name: "Sanskrit (Ruchira Part 3)",
                    code: "SKT",
                    icon: "🕉️",
                    color: "#0D9488",
                    bgGradient: "linear-gradient(135deg, #0D9488, #115E59)",
                    description: "सुभाषितानि, बिलस्य वाणी न कदापि मे श्रुता, डीजीभारतम्",
                    progress: 62,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-8sk-1",
                            number: 1,
                            title: "सुभाषितानि (सुन्दर वचनानि)",
                            readTime: "12 min",
                            summary: "गुणा गुणज्ञेषु गुणा भवन्ति, साहित्यसंगीतकला विहीनः साक्षात् पशुः पुच्छविषाणहीनः।",
                            keyConcepts: ["सुभाषित श्लोक", "अन्वय व सरलार्थ"],
                            textbookContent: `<h3>सुभाषितानि</h3><p>गुणा गुणज्ञेषु गुणा भवन्ति ते निर्गुणं प्राप्य भवन्ति दोषाः।<br>सुस्वादुतोयाः प्रभवन्ति नद्यः समुद्रमासाद्य भवन्त्यपेयाः॥</p>`,
                            videos: [{ id: "v8sk1", title: "सुभाषितानि श्लोक गान एवं व्याख्या", duration: "7:10", instructor: "आचार्य शास्त्री" }],
                            solutions: [{ q: "प्रश्न १. नद्यः कदा अपेयाः भवन्ति?", steps: ["नद्यः समुद्रं प्राप्य अपेयाः (न पिबनीयाः) भवन्ति।"] }],
                            practice: [{ id: "p8sk1-1", question: "नदियाँ समुद्र में मिलकर कैसी हो जाती हैं?", options: ["स्वादिष्ट", "अपेय (न पीने योग्य)", "सुगन्धित", "शीतल"], correct: 1, explanation: "समुद्र का खारा जल मिलने से नदियों का जल अपेय हो जाता है।" }]
                        }
                    ]
                }
            ]
        },

        9: {
            id: 9,
            name: "Class 9",
            gradeLabel: "Grade 9 Secondary",
            description: "Coordinate geometry, laws of motion, cell biology, and constitutional design",
            subjects: [
                {
                    id: "math-9",
                    name: "Mathematics",
                    code: "MATH",
                    icon: "📐",
                    color: "#2563EB",
                    bgGradient: "linear-gradient(135deg, #2563EB, #1E40AF)",
                    description: "Number Systems, Polynomials, Coordinate Geometry, Linear Equations in Two Variables",
                    progress: 72,
                    pendingTasks: 2,
                    chapters: [
                        {
                            id: "ch-9m-1",
                            number: 1,
                            title: "Number Systems (Real Numbers & Irrationality)",
                            readTime: "20 min",
                            summary: "Irrational numbers on number line, decimal expansions (terminating vs non-terminating recurring), laws of exponents.",
                            keyConcepts: ["√2, √3 irrationality", "Rationalizing denominators", "Laws of exponents for real bases"],
                            textbookContent: `<h3>Chapter 1: Number Systems</h3><p>Real numbers consist of both rational numbers (repeating/terminating) and irrational numbers (non-terminating non-repeating).</p>`,
                            videos: [{ id: "v9m1", title: "Rationalizing Denominators Step-by-Step", duration: "11:30", instructor: "Prof. Sarah Lin" }],
                            solutions: [{ q: "Q1. Rationalize 1 / (√7 - 2).", steps: ["Multiply numerator and denominator by conjugate (√7 + 2):", "(√7 + 2) / [(√7)^2 - (2)^2] = (√7 + 2) / (7 - 4) = (√7 + 2) / 3."] }],
                            practice: [{ id: "p9m1-1", question: "Which of the following is an irrational number?", options: ["√4", "3.141414...", "√5", "22/7"], correct: 2, explanation: "√5 is non-terminating and non-recurring, hence irrational." }]
                        }
                    ]
                },
                {
                    id: "sci-9",
                    name: "Science",
                    code: "SCI",
                    icon: "🔬",
                    color: "#059669",
                    bgGradient: "linear-gradient(135deg, #059669, #047857)",
                    description: "Matter in Our Surroundings, Fundamental Unit of Life, Motion, Force & Laws",
                    progress: 76,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-9s-1",
                            number: 1,
                            title: "Motion & Laws of Motion (Newton's Laws)",
                            readTime: "22 min",
                            summary: "Distance vs displacement, speed vs velocity, acceleration, three kinematic equations: v=u+at, s=ut+1/2at², v²=u²+2as.",
                            keyConcepts: ["Scalar vs vector", "Newton's 1st Law (Inertia), 2nd Law (F = ma), 3rd Law (Action-Reaction)", "Momentum conservation"],
                            textbookContent: `<h3>Motion & Dynamics</h3><p>Newton's second law of motion states that the rate of change of momentum is proportional to applied unbalanced force in the direction of force.</p>`,
                            videos: [{ id: "v9s1", title: "Visualizing Newton's Three Laws with Live Demos", duration: "13:45", instructor: "Dr. Vikram Roy" }],
                            solutions: [{ q: "Q1. A car accelerates from 10 m/s to 30 m/s in 5 s. Calculate acceleration and distance covered.", steps: ["a = (v - u) / t = (30 - 10) / 5 = 4 m/s²", "s = ut + (1/2)at² = 10(5) + 0.5(4)(25) = 50 + 50 = 100 m."] }],
                            practice: [{ id: "p9s1-1", question: "The SI unit of force is:", options: ["Joule", "Newton (kg·m/s²)", "Pascal", "Watt"], correct: 1, explanation: "Force F = ma has SI unit Newton (N)." }]
                        }
                    ]
                },
                {
                    id: "sst-9",
                    name: "Social Science",
                    code: "SST",
                    icon: "🌍",
                    color: "#EA580C",
                    bgGradient: "linear-gradient(135deg, #EA580C, #C2410C)",
                    description: "The French Revolution, Physical Features of India, What is Democracy?",
                    progress: 68,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-9ss-1",
                            number: 1,
                            title: "The French Revolution (1789)",
                            readTime: "18 min",
                            summary: "Storming of Bastille, Three Estates, Declaration of Rights of Man, Reign of Terror & rise of Napoleon.",
                            keyConcepts: ["Liberty, Equality, Fraternity", "Estates-General", "Robespierre & Jacobins"],
                            textbookContent: `<h3>The French Revolution</h3><p>On the morning of 14 July 1789, the city of Paris was in a state of alarm as citizens stormed the fortress-prison Bastille.</p>`,
                            videos: [{ id: "v9ss1", title: "French Revolution Complete Timeline", duration: "14:10", instructor: "Anita Sharma" }],
                            solutions: [{ q: "Q1. What were the Three Estates in French society?", steps: ["First Estate: Clergy (Church)", "Second Estate: Nobility", "Third Estate: Commoners (Peasants, merchants, lawyers who paid all taxes)."] }],
                            practice: [{ id: "p9ss1-1", question: "When was the Bastille fortress stormed?", options: ["14 July 1789", "4 July 1776", "15 August 1792", "21 January 1793"], correct: 0, explanation: "Bastille was stormed on 14 July 1789." }]
                        }
                    ]
                },
                {
                    id: "eng-9",
                    name: "English (Beehive)",
                    code: "ENG",
                    icon: "📖",
                    color: "#7C3AED",
                    bgGradient: "linear-gradient(135deg, #7C3AED, #5B21B6)",
                    description: "The Fun They Had, The Sound of Music, The Road Not Taken",
                    progress: 82,
                    pendingTasks: 0,
                    chapters: [
                        {
                            id: "ch-9e-1",
                            number: 1,
                            title: "The Fun They Had (Isaac Asimov)",
                            readTime: "12 min",
                            summary: "Set in the year 2157: Margie and Tommy discover an ancient printed book and marvel at old schools where human teachers taught children together.",
                            keyConcepts: ["Futuristic vs traditional schooling", "Digital learning machines vs community classrooms"],
                            textbookContent: `<h3>The Fun They Had</h3><p>Margie even wrote about it that night in her diary: "Today Tommy found a real book!" It was a very old book with yellow, crinkly pages.</p>`,
                            videos: [{ id: "v9e1", title: "Asimov's Vision of Future Education", duration: "7:45", instructor: "Ms. Clara" }],
                            solutions: [{ q: "Q1. What was strange about the book Tommy found?", steps: ["The words stood still instead of moving on a screen, and when they turned back to a page, it had the exact same words."] }],
                            practice: [{ id: "p9e1-1", question: "In what year is 'The Fun They Had' set?", options: ["2026", "2050", "2157", "3000"], correct: 2, explanation: "Isaac Asimov set the story on May 17, 2157." }]
                        }
                    ]
                }
            ]
        },

        10: {
            id: 10,
            name: "Class 10",
            gradeLabel: "Grade 10 Board Exam",
            description: "Trigonometry, quadratic equations, optics, chemical reactions, nationalism & AI",
            subjects: [
                {
                    id: "math-10",
                    name: "Mathematics",
                    code: "MATH",
                    icon: "📐",
                    color: "#2563EB",
                    bgGradient: "linear-gradient(135deg, #2563EB, #1E40AF)",
                    description: "Real Numbers, Polynomials, Quadratic Equations, Trigonometry, Statistics",
                    progress: 84,
                    pendingTasks: 2,
                    chapters: [
                        {
                            id: "ch-10m-1",
                            number: 1,
                            title: "Introduction to Trigonometry & Identities",
                            readTime: "24 min",
                            summary: "Trigonometric ratios (sin, cos, tan, cot, sec, cosec), values for 0°, 30°, 45°, 60°, 90°, and standard identities.",
                            keyConcepts: ["sin²θ + cos²θ = 1", "1 + tan²θ = sec²θ", "1 + cot²θ = cosec²θ", "Ratios in right-angled triangles"],
                            textbookContent: `
                                <h3>Chapter 8: Introduction to Trigonometry</h3>
                                <p class="lead">Trigonometry is the branch of mathematics that studies relationships between side lengths and angles of triangles.</p>
                                
                                <div class="study-box formula">
                                    <h4>Fundamental Trigonometric Identities</h4>
                                    <ul>
                                        <li><strong>Identity 1:</strong> sin²θ + cos²θ = 1</li>
                                        <li><strong>Identity 2:</strong> 1 + tan²θ = sec²θ  (or sec²θ - tan²θ = 1)</li>
                                        <li><strong>Identity 3:</strong> 1 + cot²θ = cosec²θ (or cosec²θ - cot²θ = 1)</li>
                                    </ul>
                                </div>

                                <h4>Trigonometric Values Table</h4>
                                <table class="study-table" style="width:100%; border-collapse:collapse; text-align:center; margin-top:8px;">
                                    <thead>
                                        <tr style="background:rgba(37,99,235,0.1);"><th>Ratio</th><th>0°</th><th>30°</th><th>45°</th><th>60°</th><th>90°</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td><strong>sin θ</strong></td><td>0</td><td>1/2</td><td>1/√2</td><td>√3/2</td><td>1</td></tr>
                                        <tr><td><strong>cos θ</strong></td><td>1</td><td>√3/2</td><td>1/√2</td><td>1/2</td><td>0</td></tr>
                                        <tr><td><strong>tan θ</strong></td><td>0</td><td>1/√3</td><td>1</td><td>√3</td><td>ND</td></tr>
                                    </tbody>
                                </table>
                            `,
                            videos: [
                                { id: "v10m1", title: "Proving Trigonometric Identities in 3 Steps", duration: "16:20", instructor: "Prof. Sarah Lin" },
                                { id: "v10m2", title: "Trigonometry Trick for Board Exam MCQ 100% Accuracy", duration: "10:50", instructor: "Prof. Sarah Lin" }
                            ],
                            solutions: [
                                {
                                    q: "Q1. Prove that: (sin θ + cosec θ)² + (cos θ + sec θ)² = 7 + tan²θ + cot²θ",
                                    steps: [
                                        "LHS = sin²θ + cosec²θ + 2·sinθ·cosecθ + cos²θ + sec²θ + 2·cosθ·secθ",
                                        "Since sinθ·cosecθ = 1 and cosθ·secθ = 1:",
                                        "= (sin²θ + cos²θ) + 2(1) + 2(1) + cosec²θ + sec²θ",
                                        "= 1 + 4 + (1 + cot²θ) + (1 + tan²θ)",
                                        "= 7 + tan²θ + cot²θ = RHS. (Hence Proved)"
                                    ]
                                }
                            ],
                            practice: [
                                {
                                    id: "p10m1-1",
                                    question: "If sin A = 1/2, then the value of cot A is:",
                                    options: ["√3", "1/√3", "1", "1/2"],
                                    correct: 0,
                                    explanation: "If sin A = 1/2, angle A = 30°. cot 30° = √3."
                                },
                                {
                                    id: "p10m1-2",
                                    question: "The value of (sec²θ - tan²θ) is equal to:",
                                    options: ["0", "1", "-1", "2"],
                                    correct: 1,
                                    explanation: "Identity: 1 + tan²θ = sec²θ -> sec²θ - tan²θ = 1."
                                }
                            ]
                        }
                    ]
                },
                {
                    id: "sci-10",
                    name: "Science",
                    code: "SCI",
                    icon: "🔬",
                    color: "#059669",
                    bgGradient: "linear-gradient(135deg, #059669, #047857)",
                    description: "Chemical Reactions, Acids & Bases, Light (Reflection & Refraction), Electricity, Life Processes",
                    progress: 78,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-10s-1",
                            number: 1,
                            title: "Chemical Reactions and Equations",
                            readTime: "20 min",
                            summary: "Balancing chemical equations, Combination, Decomposition, Displacement, Double Displacement, Redox and Corrosion.",
                            keyConcepts: ["Law of Conservation of Mass", "Exothermic vs Endothermic", "Oxidation (loss of e-) vs Reduction (gain of e-)"],
                            textbookContent: `<h3>Chemical Reactions and Equations</h3><p>A chemical reaction is represented by a balanced chemical equation with state symbols.</p>`,
                            videos: [{ id: "v10s1", title: "Mastering Equation Balancing in 5 Minutes", duration: "8:30", instructor: "Dr. Vikram Roy" }],
                            solutions: [{ q: "Q1. Balance: Fe + H2O -> Fe3O4 + H2", steps: ["Fe atoms: 3 Fe on LHS", "O atoms: 4 H2O on LHS", "H atoms: 4 H2 on RHS", "Balanced: 3Fe(s) + 4H2O(g) -> Fe3O4(s) + 4H2(g)"] }],
                            practice: [{ id: "p10s1-1", question: "Heating of ferrous sulphate crystals is which type of reaction?", options: ["Combination", "Decomposition", "Displacement", "Neutralization"], correct: 1, explanation: "2FeSO4(s) --Δ--> Fe2O3(s) + SO2(g) + SO3(g) is a thermal decomposition reaction." }]
                        }
                    ]
                },
                {
                    id: "sst-10",
                    name: "Social Science",
                    code: "SST",
                    icon: "🌍",
                    color: "#EA580C",
                    bgGradient: "linear-gradient(135deg, #EA580C, #C2410C)",
                    description: "Rise of Nationalism in Europe, Nationalism in India, Power Sharing, Federalism",
                    progress: 75,
                    pendingTasks: 1,
                    chapters: [
                        {
                            id: "ch-10ss-1",
                            number: 1,
                            title: "The Rise of Nationalism in Europe",
                            readTime: "22 min",
                            summary: "Frédéric Sorrieu's utopian vision, French Revolution, Napoleonic Code (1804), Unification of Italy and Germany.",
                            keyConcepts: ["Civil Code of 1804", "Giuseppe Mazzini & Young Italy", "Otto von Bismarck's Blood & Iron policy"],
                            textbookContent: `<h3>Nationalism in Europe</h3><p>During the nineteenth century, nationalism emerged as a force which brought about sweeping changes in the political and mental world of Europe.</p>`,
                            videos: [{ id: "v10ss1", title: "Unification of Italy & Germany Simplified", duration: "12:15", instructor: "Anita Sharma" }],
                            solutions: [{ q: "Q1. What were the key features of the Civil Code of 1804 (Napoleonic Code)?", steps: ["1. Did away with all privileges based on birth.", "2. Established equality before law.", "3. Secured the right to property and simplified administrative divisions."] }],
                            practice: [{ id: "p10ss1-1", question: "Who founded the secret society called 'Young Italy'?", options: ["Count Cavour", "Giuseppe Mazzini", "Victor Emmanuel II", "Garibaldi"], correct: 1, explanation: "Giuseppe Mazzini founded Young Italy in Marseilles." }]
                        }
                    ]
                },
                {
                    id: "ai-10",
                    name: "Artificial Intelligence",
                    code: "AI",
                    icon: "🤖",
                    color: "#6366F1",
                    bgGradient: "linear-gradient(135deg, #6366F1, #4338CA)",
                    description: "AI Project Cycle, Computer Vision, Natural Language Processing & Python AI",
                    progress: 92,
                    pendingTasks: 0,
                    chapters: [
                        {
                            id: "ch-10ai-1",
                            number: 1,
                            title: "AI Project Cycle & Ethics",
                            readTime: "18 min",
                            summary: "Problem Scoping (4Ws canvas), Data Acquisition, Data Exploration, Modeling (Rule-based vs Learning-based), Evaluation.",
                            keyConcepts: ["4Ws Canvas: Who, What, Where, Why", "Supervised vs Unsupervised vs Reinforcement", "AI Ethics & Bias"],
                            textbookContent: `<h3>The AI Project Cycle</h3><p>Building an AI system involves 5 iterative stages: Scoping, Data Acquisition, Data Exploration, Modeling, and Evaluation.</p>`,
                            videos: [{ id: "v10ai1", title: "How Neural Networks Work (Visual Intuition)", duration: "11:00", instructor: "Rohan Verma" }],
                            solutions: [{ q: "Q1. Explain the 4Ws canvas in AI Problem Scoping.", steps: ["1. Who: Who are the stakeholders facing the problem?", "2. What: What is the exact nature of the problem?", "3. Where: In what context or location does it happen?", "4. Why: Why will solving this benefit people and users?"] }],
                            practice: [{ id: "p10ai1-1", question: "Which stage of the AI cycle involves testing the model accuracy?", options: ["Data Acquisition", "Problem Scoping", "Modeling", "Evaluation"], correct: 3, explanation: "Evaluation verifies model performance on unseen test datasets." }]
                        }
                    ]
                }
            ]
        }
    },

    // Sample Timetable Schedule for Classes
    timetable: {
        5: [
            { period: 1, time: "09:00 - 09:45 AM", subject: "Mathematics", topic: "The Fish Tale", room: "Room 101" },
            { period: 2, time: "09:50 - 10:35 AM", subject: "Environmental Studies", topic: "Super Senses", room: "Bio Lab" },
            { period: 3, time: "10:50 - 11:35 AM", subject: "English", topic: "Ice-Cream Man", room: "Room 101" },
            { period: 4, time: "11:40 - 12:25 PM", subject: "Hindi", topic: "राख की रस्सी", room: "Room 101" },
            { period: 5, time: "01:15 - 02:00 PM", subject: "Computer Science", topic: "Stylus & Hardware", room: "Comp Lab 1" }
        ],
        8: [
            { period: 1, time: "09:00 - 09:45 AM", subject: "Mathematics", topic: "Rational Numbers & Distributivity", room: "Smart Room 8A" },
            { period: 2, time: "09:50 - 10:35 AM", subject: "Science", topic: "Crop Production & Irrigation", room: "Science Lab" },
            { period: 3, time: "10:50 - 11:35 AM", subject: "Social Science", topic: "Indian Constitution & Rights", room: "Smart Room 8A" },
            { period: 4, time: "11:40 - 12:25 PM", subject: "English", topic: "The Best Christmas Present", room: "Language Lab" },
            { period: 5, time: "01:15 - 02:00 PM", subject: "Computer Science", topic: "Python Loops & Logic", room: "AI Lab 2" }
        ],
        10: [
            { period: 1, time: "09:00 - 09:45 AM", subject: "Mathematics", topic: "Trigonometric Identities", room: "Class 10A" },
            { period: 2, time: "09:50 - 10:35 AM", subject: "Science", topic: "Chemical Reactions & Balancing", room: "Chemistry Lab" },
            { period: 3, time: "10:50 - 11:35 AM", subject: "Social Science", topic: "Nationalism in Europe", room: "Class 10A" },
            { period: 4, time: "11:40 - 12:25 PM", subject: "Artificial Intelligence", topic: "AI Project Cycle & Ethics", room: "Robotics Lab" }
        ]
    },

    // Helper methods
    getClass(classNum) {
        const cls = parseInt(classNum) || this.selectedClass;
        return this.classes[cls] || this.classes[8];
    },

    getSubjects(classNum) {
        const cls = this.getClass(classNum);
        return cls ? cls.subjects : [];
    },

    getSubjectById(subjectId, classNum) {
        const subjects = this.getSubjects(classNum);
        return subjects.find(s => s.id === subjectId) || subjects[0];
    },

    getTimetable(classNum) {
        const cls = parseInt(classNum) || this.selectedClass;
        return this.timetable[cls] || this.timetable[8] || [];
    },

    setClass(classNum) {
        const num = parseInt(classNum);
        if (this.supportedClasses.includes(num)) {
            this.selectedClass = num;
            localStorage.setItem('smartslate_selected_class', num);
            return true;
        }
        return false;
    },

    getSubjectTenLessons(subjectOrName, classNum) {
        const name = typeof subjectOrName === 'string' ? subjectOrName : (subjectOrName ? subjectOrName.name : 'Mathematics');
        const lower = name.toLowerCase();

        if (lower.includes('math')) {
            return [
                { number: 1, title: 'Real Numbers', summary: 'Euclid\'s division lemma, fundamental theorem of arithmetic & irrational numbers.', status: 'completed', readTime: '18 min' },
                { number: 2, title: 'Polynomials', summary: 'Geometrical meaning of zeroes, relationship between zeroes & coefficients.', status: 'completed', readTime: '15 min' },
                { number: 3, title: 'Pair of Linear Equations in Two Variables', summary: 'Graphical and algebraic methods: substitution, elimination & cross-multiplication.', status: 'completed', readTime: '22 min' },
                { number: 4, title: 'Quadratic Equations', summary: 'Standard form, factorization method, completing square & quadratic formula.', status: 'completed', readTime: '20 min' },
                { number: 5, title: 'Arithmetic Progressions', summary: 'General term of an AP, sum of first n terms & practical application problems.', status: 'completed', readTime: '16 min' },
                { number: 6, title: 'Triangles', summary: 'Similarity of triangles, Thales theorem, criteria for similarity & Pythagoras theorem.', status: 'in-progress', readTime: '25 min' },
                { number: 7, title: 'Coordinate Geometry', summary: 'Distance formula, section formula & area of triangles on coordinate plane.', status: 'not-started', readTime: '18 min' },
                { number: 8, title: 'Introduction to Trigonometry', summary: 'Trigonometric ratios of acute angles, values for 0°, 30°, 45°, 60°, 90° & identities.', status: 'not-started', readTime: '24 min' },
                { number: 9, title: 'Some Applications of Trigonometry', summary: 'Heights and distances, line of sight, angle of elevation & depression.', status: 'not-started', readTime: '20 min' },
                { number: 10, title: 'Circles, Surface Areas and Volumes', summary: 'Tangents to a circle, surface areas & volumes of combinations of solids.', status: 'not-started', readTime: '26 min' }
            ];
        }

        if (lower.includes('physic') || lower.includes('sci')) {
            return [
                { number: 1, title: 'Light — Reflection and Refraction', summary: 'Spherical mirrors, ray diagrams, mirror formula, magnification & refraction laws.', status: 'completed', readTime: '20 min' },
                { number: 2, title: 'The Human Eye and the Colourful World', summary: 'Structure of human eye, defects of vision & correction, dispersion through prism.', status: 'completed', readTime: '18 min' },
                { number: 3, title: 'Electricity & Circuit Components', summary: 'Ohm\'s law, resistance factors, resistors in series and parallel combinations.', status: 'completed', readTime: '24 min' },
                { number: 4, title: 'Magnetic Effects of Electric Current', summary: 'Magnetic field lines, right-hand thumb rule, solenoid & electromagnetic induction.', status: 'completed', readTime: '22 min' },
                { number: 5, title: 'Sources of Energy & Conservation', summary: 'Conventional and non-conventional energy sources, solar cells & nuclear energy.', status: 'completed', readTime: '15 min' },
                { number: 6, title: 'Force and Laws of Motion', summary: 'Newton\'s three laws of motion, inertia, momentum & conservation of momentum.', status: 'in-progress', readTime: '22 min' },
                { number: 7, title: 'Gravitation and Floatation', summary: 'Universal law of gravitation, free fall, mass vs weight & Archimedes\' principle.', status: 'not-started', readTime: '19 min' },
                { number: 8, title: 'Work, Energy and Power', summary: 'Scientific concept of work, kinetic energy, potential energy & law of conservation.', status: 'not-started', readTime: '21 min' },
                { number: 9, title: 'Sound Waves and Ultrasound', summary: 'Production and propagation of sound, speed of sound, echo & sonar ultrasound.', status: 'not-started', readTime: '18 min' },
                { number: 10, title: 'Thermal Energy and Wave Dynamics', summary: 'Heat transfer, thermal expansion, specific heat capacity & wave dynamics.', status: 'not-started', readTime: '25 min' }
            ];
        }

        if (lower.includes('chem')) {
            return [
                { number: 1, title: 'Chemical Reactions and Equations', summary: 'Balancing chemical equations, combination, decomposition, displacement & redox.', status: 'completed', readTime: '18 min' },
                { number: 2, title: 'Acids, Bases and Salts', summary: 'pH scale, indicator testing, properties of acids/bases & preparation of common salts.', status: 'completed', readTime: '20 min' },
                { number: 3, title: 'Metals and Non-Metals', summary: 'Physical & chemical properties, reactivity series, ionic bonds & metallurgy extraction.', status: 'completed', readTime: '22 min' },
                { number: 4, title: 'Carbon and its Compounds', summary: 'Covalent bonding, versatile nature of carbon, homologous series & functional groups.', status: 'completed', readTime: '25 min' },
                { number: 5, title: 'Periodic Classification of Elements', summary: 'Mendeleev\'s periodic table, modern periodic table & periodic trends in properties.', status: 'completed', readTime: '19 min' },
                { number: 6, title: 'Structure of the Atom & Isotopes', summary: 'Thomson, Rutherford and Bohr models, atomic number, mass number & electronic configuration.', status: 'in-progress', readTime: '21 min' },
                { number: 7, title: 'Chemical Bonding & Molecular Structure', summary: 'Lewis dot structures, ionic vs covalent bonds, polarity & molecular geometry.', status: 'not-started', readTime: '23 min' },
                { number: 8, title: 'States of Matter: Gases and Liquids', summary: 'Gas laws: Boyle\'s law, Charles\'s law, ideal gas equation & intermolecular forces.', status: 'not-started', readTime: '17 min' },
                { number: 9, title: 'Environmental Chemistry & Pollution', summary: 'Atmospheric pollution, acid rain, greenhouse effect & green chemistry techniques.', status: 'not-started', readTime: '16 min' },
                { number: 10, title: 'Organic Chemistry Principles', summary: 'IUPAC nomenclature, isomerism, purification methods & reaction mechanisms.', status: 'not-started', readTime: '24 min' }
            ];
        }

        if (lower.includes('bio')) {
            return [
                { number: 1, title: 'Life Processes & Nutrition', summary: 'Autotrophic and heterotrophic nutrition, human digestive system & respiration.', status: 'completed', readTime: '20 min' },
                { number: 2, title: 'Control and Coordination', summary: 'Human nervous system, reflex arc, brain anatomy & plant hormones (phytohormones).', status: 'completed', readTime: '22 min' },
                { number: 3, title: 'How do Organisms Reproduce?', summary: 'Asexual and sexual reproduction, flowering plant reproduction & reproductive health.', status: 'completed', readTime: '24 min' },
                { number: 4, title: 'Heredity and Evolution', summary: 'Mendel\'s hybridization experiments, monohybrid/dihybrid cross & sex determination.', status: 'completed', readTime: '21 min' },
                { number: 5, title: 'Our Environment & Ecosystem Dynamics', summary: 'Food chains, food webs, trophic levels, energy transfer & ozone layer depletion.', status: 'completed', readTime: '17 min' },
                { number: 6, title: 'The Fundamental Unit of Life — Cell', summary: 'Prokaryotic vs eukaryotic cells, cell organelles, plasma membrane & cell division.', status: 'in-progress', readTime: '25 min' },
                { number: 7, title: 'Plant and Animal Tissues', summary: 'Meristematic & permanent plant tissues, epithelial, muscular, nervous & connective tissues.', status: 'not-started', readTime: '20 min' },
                { number: 8, title: 'Diversity in Living Organisms', summary: 'Five kingdom classification, plant kingdom (Thallophyta to Angiosperms) & Animalia.', status: 'not-started', readTime: '26 min' },
                { number: 9, title: 'Why Do We Fall Ill? (Health & Disease)', summary: 'Infectious vs non-infectious diseases, pathogens, immunity & vaccination principles.', status: 'not-started', readTime: '18 min' },
                { number: 10, title: 'Improvement in Food Resources', summary: 'Crop variety improvement, crop production management, manure, fertilizers & animal husbandry.', status: 'not-started', readTime: '19 min' }
            ];
        }

        if (lower.includes('eng')) {
            return [
                { number: 1, title: 'A Letter to God (GL Fuentes)', summary: 'Lencho\'s unwavering faith in God, the devastating hailstorm & the postmaster\'s kindness.', status: 'completed', readTime: '15 min' },
                { number: 2, title: 'Nelson Mandela: Long Walk to Freedom', summary: 'Inauguration day speech, struggle against apartheid & the meaning of true freedom.', status: 'completed', readTime: '18 min' },
                { number: 3, title: 'Two Stories about Flying', summary: 'His First Flight (young seagull\'s fear) & The Black Aeroplane mystery in dark clouds.', status: 'completed', readTime: '17 min' },
                { number: 4, title: 'From the Diary of Anne Frank', summary: 'Anne\'s intimate diary entries in the Secret Annex and her relationship with teachers.', status: 'completed', readTime: '16 min' },
                { number: 5, title: 'Glimpses of India', summary: 'A Baker from Goa, Coorg\'s coffee plantations & Tea from Assam legends.', status: 'completed', readTime: '18 min' },
                { number: 6, title: 'Mijbil the Otter (Gavin Maxwell)', summary: 'Maxwell\'s journey with his unique pet otter Mijbil from Iraq to London.', status: 'in-progress', readTime: '20 min' },
                { number: 7, title: 'Madam Rides the Bus (Vallikkannan)', summary: 'Eight-year-old Valli\'s solo bus journey to town and her realization of life and mortality.', status: 'not-started', readTime: '19 min' },
                { number: 8, title: 'The Sermon at Benares', summary: 'Lord Buddha\'s teaching to Kisa Gotami about the inevitability of death and grief.', status: 'not-started', readTime: '16 min' },
                { number: 9, title: 'The Proposal (Anton Chekhov)', summary: 'A one-act Russian comedic play exploring marriage proposals, arguments and vanity.', status: 'not-started', readTime: '22 min' },
                { number: 10, title: 'Applied Grammar & Advanced Composition', summary: 'Active/Passive voice, reported speech, formal letter writing & analytical paragraph.', status: 'not-started', readTime: '25 min' }
            ];
        }

        if (lower.includes('comp') || lower.includes('it')) {
            return [
                { number: 1, title: 'Python Programming Fundamentals', summary: 'Syntax, variables, datatypes, operators, input/output & basic arithmetic expressions.', status: 'completed', readTime: '18 min' },
                { number: 2, title: 'Control Flow: If-Else & Loops', summary: 'Conditional branching (if-elif-else), while loops, for loops, range() & break/continue.', status: 'completed', readTime: '22 min' },
                { number: 3, title: 'Functions, Modules & Scope', summary: 'User-defined functions, parameters, return values, built-in math/random modules & variable scope.', status: 'completed', readTime: '20 min' },
                { number: 4, title: 'Strings, Lists & Tuples Data Structures', summary: 'Indexing, slicing, string formatting, list comprehensions, mutability & tuple operations.', status: 'completed', readTime: '24 min' },
                { number: 5, title: 'Dictionaries & Sets in Python', summary: 'Key-value pairs, dictionary methods, hashability, set theory operations & lookups.', status: 'completed', readTime: '21 min' },
                { number: 6, title: 'File Handling & Data Persistence', summary: 'Reading/writing text files, csv processing, with open statements & exception handling.', status: 'in-progress', readTime: '23 min' },
                { number: 7, title: 'Object Oriented Programming (OOP)', summary: 'Classes, objects, constructors (__init__), instance methods, inheritance & encapsulation.', status: 'not-started', readTime: '26 min' },
                { number: 8, title: 'SQL & Relational Databases', summary: 'Relational model, SQLite tables, SELECT, WHERE, INSERT, UPDATE, JOINs & primary keys.', status: 'not-started', readTime: '25 min' },
                { number: 9, title: 'Computer Networks & Internet Protocols', summary: 'Network topologies, OSI model, IP addressing, DNS, TCP/UDP & client-server model.', status: 'not-started', readTime: '20 min' },
                { number: 10, title: 'Cyber Security, Digital Ethics & AI', summary: 'Cyber threats, phishing, encryption, digital footprints, intellectual property & AI ethics.', status: 'not-started', readTime: '22 min' }
            ];
        }

        if (lower.includes('social') || lower.includes('hist')) {
            return [
                { number: 1, title: 'The Rise of Nationalism in Europe', summary: 'French revolution ideals, Napoleonic code, unification of Germany and Italy & imperialism.', status: 'completed', readTime: '20 min' },
                { number: 2, title: 'Nationalism in India', summary: 'Non-cooperation movement, Simon commission, Salt Satyagraha & sense of collective belonging.', status: 'completed', readTime: '22 min' },
                { number: 3, title: 'The Making of a Global World', summary: 'Pre-modern world trade, Silk routes, conquest, colonization & post-war Bretton Woods institutions.', status: 'completed', readTime: '19 min' },
                { number: 4, title: 'Resources and Sustainable Development', summary: 'Classification of resources, resource planning in India, soil conservation & land degradation.', status: 'completed', readTime: '18 min' },
                { number: 5, title: 'Forest and Wildlife Resources', summary: 'Flora and fauna conservation, Project Tiger, biosphere reserves & Community conservation.', status: 'completed', readTime: '17 min' },
                { number: 6, title: 'Water Resources & Multipurpose Projects', summary: 'Water scarcity, dams, rainwater harvesting methods & interstate water disputes.', status: 'in-progress', readTime: '19 min' },
                { number: 7, title: 'Agriculture: Major Crops & Reforms', summary: 'Types of farming, cropping seasons (Kharif, Rabi, Zaid), food crops & institutional reforms.', status: 'not-started', readTime: '21 min' },
                { number: 8, title: 'Power Sharing & Democratic Federalism', summary: 'Belgium and Sri Lanka case studies, majoritarianism vs power sharing & federal decentralization.', status: 'not-started', readTime: '20 min' },
                { number: 9, title: 'Gender, Religion and Caste in Politics', summary: 'Feminist movements, communalism, secular state principles & role of caste in Indian politics.', status: 'not-started', readTime: '22 min' },
                { number: 10, title: 'Money and Credit (Economics)', summary: 'Barter system limitations, modern forms of money, commercial banks, SHGs & formal credit terms.', status: 'not-started', readTime: '20 min' }
            ];
        }

        // Generic 10 lessons fallback
        return [
            { number: 1, title: 'Foundations & Key Concepts', summary: 'Introductory principles, scope, and foundational terminology.', status: 'completed', readTime: '15 min' },
            { number: 2, title: 'Core Principles & Methods', summary: 'Theoretical framework, standard definitions and basic methodologies.', status: 'completed', readTime: '18 min' },
            { number: 3, title: 'Systematic Analysis & Structure', summary: 'Analyzing relationships, patterns and structured models.', status: 'completed', readTime: '20 min' },
            { number: 4, title: 'Formulas, Rules & Frameworks', summary: 'Formulas, standard rules, and analytical applications.', status: 'completed', readTime: '22 min' },
            { number: 5, title: 'Intermediate Applications', summary: 'Solving intermediate level problem sets and case examples.', status: 'completed', readTime: '19 min' },
            { number: 6, title: 'Advanced Analysis & Synthesis', summary: 'Synthesizing principles, deeper analytical inquiry and case evaluations.', status: 'in-progress', readTime: '24 min' },
            { number: 7, title: 'Specialized Topic Modules', summary: 'Specialized subject areas, contextual adaptations and experiments.', status: 'not-started', readTime: '20 min' },
            { number: 8, title: 'Practical Applications & Case Studies', summary: 'Real-world case studies, laboratory manuals and field applications.', status: 'not-started', readTime: '21 min' },
            { number: 9, title: 'Comparative Studies & Synthesis', summary: 'Comparative investigations, cross-functional linkages and evaluations.', status: 'not-started', readTime: '23 min' },
            { number: 10, title: 'Comprehensive Review & Problem Sets', summary: 'End-of-term comprehensive review, formulas compilation and exam mastery.', status: 'not-started', readTime: '25 min' }
        ];
    },

    initSelectedClass() {
        const savedProfile = localStorage.getItem('smartslate_student_profile');
        if (savedProfile) {
            try {
                this.studentProfile = JSON.parse(savedProfile);
                if (this.studentProfile.classNum) {
                    this.selectedClass = parseInt(this.studentProfile.classNum);
                }
            } catch(e) {}
        } else {
            const saved = localStorage.getItem('smartslate_selected_class');
            if (saved && this.supportedClasses.includes(parseInt(saved))) {
                this.selectedClass = parseInt(saved);
                if (this.studentProfile) this.studentProfile.classNum = this.selectedClass;
            } else {
                this.selectedClass = 8; // Default Class 8
                if (this.studentProfile) this.studentProfile.classNum = 8;
            }
        }
        return this.selectedClass;
    },

    updateAcademicInfo(newInfo) {
        if (!newInfo) return;
        this.studentProfile = { ...this.studentProfile, ...newInfo };
        if (newInfo.classNum) {
            this.selectedClass = parseInt(newInfo.classNum);
            localStorage.setItem('smartslate_selected_class', this.selectedClass);
        }
        localStorage.setItem('smartslate_student_profile', JSON.stringify(this.studentProfile));
        return this.studentProfile;
    }
};

// Initialize active class on script load
AcademicData.initSelectedClass();

