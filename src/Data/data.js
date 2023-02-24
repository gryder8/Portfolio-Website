/**src/Data/data.js**/
const HEADER = "Gavin Ryder";

const NAVBAR_DATA = [
    { id: 1, url: "/", label: "Home" },
    { id: 2, url: "#projects", label: "Projects" },
    { id: 3, url: "#my-experience", label: "Experience" },
    { id: 4, url: "#about", label: "About Me" },
    { id: 5, url: "#footer", label: "Contact" }
];
const BANNER_DATA = {
    HEADING: "Hey there, I'm Gavin 👋",
    DESCRIPTION:
        "CSE Student @ SCU, SWE Intern @ Apple, iOS Developer",
    GITHUB_URL:
        "https://github.com/gryder8",
    VISIT_GITHUB: "GitHub",
    LINKEDIN_URL: "https://www.linkedin.com/in/gavin-r-5a3900190/",
    VISIT_LINKEDIN: "LinkedIn"
};
const PROJECT_DATA = {
    HEADING: "Projects",
    ALL_PROJECTS: "All Experience",
    PROJECT_LIST: [
        {
            LABEL: "SCU Food Reviews",
            PROJECT_URL: "https://github.com/gryder8/SCU-Food-Reviews",
            APP_STORE_URL: "",
            DESCRIPTION:
                "Using Swift and SwiftUI, I made an iOS App that interfaces with SAM CLI and supports Google Sign-In to allow SCU students to rate food offered on campus.",
            URL: "images/foodreviewsicon.png"
        },
        {
            LABEL: "MLB The Show Flips",
            PROJECT_URL: "https://github.com/gryder8/MLB-The-Show-Flips-App",
            APP_STORE_URL: "",
            DESCRIPTION:
                "Using SwiftUI and async/await with Swift 5.5, I built an iOS application to help players determine which cards on the market were the most profitable to flip using MLB The Show's Market REST API",
            URL: "images/MLBTS-Flips.png"
        },
        {
            LABEL: "Pocket Workout Timer",
            PROJECT_URL: "https://github.com/gryder8/WorkoutTimer",
            APP_STORE_URL: "https://apps.apple.com/us/app/pocket-workout-timer/id1532840175",
            DESCRIPTION:
                "Used Swift and UIKit to build an app that lets you customize and time your workout routine, with customizable sounds and UI colors.",
            URL: "images/WorkoutAppIcon.png"
        },
        {
            LABEL: "SwiftUI Wordle",
            PROJECT_URL: "https://github.com/gryder8/Wordle",
            APP_STORE_URL: "",
            DESCRIPTION: "Cloned from an existing project, I fixed bugs and added additional functionality such as hints.",
            URL: "images/WordleIcon.png"
        },
        {
            LABEL: "Risky Roads",
            PROJECT_URL: "https://github.com/gryder8/Risky-Roads",
            APP_STORE_URL: "",
            DESCRIPTION: "Project made during INRIX Hacks 2021 which uses Flask backend and Swift frontend to pass route data to an iOS app to show the user the fastest and safest route between 2 destinations",
            URL: "images/roads.png"
        },
        {
            LABEL: "LAHS Bell Timer",
            PROJECT_URL: "https://github.com/gryder8/BellTimer",
            APP_STORE_URL: "https://apps.apple.com/us/app/lahs-bell-timer/id1460500252",
            DESCRIPTION:
                "Back in high school, I made this app which shows a countdown to the next bell. It uses files hosted on a server and a local cache to get the latest information",
            URL: "images/BellTimerIcon.png"
        }
    ],
    NOTE: "I've also built an iOS app for a client using SwiftUI, but the details of that are under an NDA and the code is not public."
};

const EXPERIENCE_DATA = {
    HEADING: "Work Experience",
    EXPERIENCE_LIST: [
        {
            DESCRIPTION:
                "Worked in the Applications Special Projects Group, using Swift and SwiftUI as well as some CoreData and Combine.",
            IMAGE_URL: "images/apple-logo.jpeg",
            NAME: "Apple",
            DESIGNATION: "Software Engineering Intern"
        },
        {
            DESCRIPTION:
                "Part of a student and faculty lead startup to make dance education more accessible using IoT wearables",
            IMAGE_URL: "images/swing-beats-icon.jpeg",
            NAME: "Swingbeats",
            DESIGNATION: "iOS Lead"
        },
        {
            DESCRIPTION:
                "Remotely managed a team of 7 interns, planning sprints and delegating development work to myself and others",
            IMAGE_URL: "images/real-estate-logo.jpeg",
            NAME: "Real Estate Dashboard Inc.",
            DESIGNATION: "Lead iOS Intern"
        }
    ],
};

const ABOUT_DATA = {
    HEADING: "About Me",
    TITLE: "A little more about me",
    IMAGE_URL: "images/portrait.jpg",
    ABOUT_ME_LIST: [
        "My favorite programming language is Swift, but I also know Java, C and C++!",
        "I'm from the Bay Area (born & raised)",
        "I started coding when I was about 13",
        "In my free time, I like to exercise, hang out with friends, listen to music, or play video games",
        "I also love to ski and watch baseball",

    ]
};


const SOCIAL_DATA = {
    HEADING: "My Social Media",
    IMAGES_LIST: [
        "images/github-icon.png",
        "images/linkedin-icon.png",
    ]
};

const FOOTER_DATA = {
    DESCRIPTION:
        "If you're interested in working with me or reaching out to me about an opportunity you can reach me here:",
    CONTACT_DETAILS: {
        HEADING: "Contact Me",
        MOBILE: "+1 650-417-5625",
        EMAIL: "gavin.ryder82@icloud.com"
    }
};

const ALL_DATA = {
    HEADER,
    NAVBAR_DATA,
    BANNER_DATA,
    PROJECT_DATA,
    ABOUT_DATA,
    EXPERIENCE_DATA,
    SOCIAL_DATA,
    FOOTER_DATA
};
export default ALL_DATA;