let schedule = [
     {
        "beginTime": new Date("2024-03-17T23:00:00.000+01:00"),
        "endTime": new Date("2024-03-17T23:20:00.000+01:00"),
        "name": "Day of Dungeons 2024 Setup",
        "description": ""
     },
     {
        "beginTime": new Date("2024-03-17T23:37:00.000+01:00"),
        "endTime": new Date("2024-03-17T23:50:00.000+01:00"),
        "name": "Test",
        "description": ""
     },
     {
        "beginTime": new Date("2024-03-23T10:00:00.000+01:00"),
        "endTime": new Date("2024-03-23T11:30:00.000+01:00"),
        "name": "Elven & Stuutjes",
        "description": "(NL) Our favourite Belgian actual play podcasters Stuutjes & Draken and Elven voor Twaalven talk about their lore and behind the scene secrets"
     }, {
        "beginTime": new Date("2024-03-23T11:45:00.000+01:00"),
        "endTime": new Date("2024-03-23T12:15:00.000+01:00"),
        "name": "Taverne De Drakenvleugel",
        "description": "(NL) Book launch for a TTRPG-inspired short story anthology, presented by the authors"
     }, {
        "beginTime": new Date("2024-03-23T12:30:00.000+01:00"),
        "endTime": new Date("2024-03-23T13:30:00.000+01:00"),
        "name": "Cosplay Catwalk",
        "description": ""
     }, {
        "beginTime": new Date("2024-03-23T14:00:00.000+01:00"),
        "endTime": new Date("2024-03-23T16:30:00.000+01:00"),
        "name": "Live Play",
        "description": "Legendary adventurers take to the stage to provide you with entertainment during this interactive D&D play session"
     }, {
        "beginTime": new Date("2024-03-23T17:00:00.000+01:00"),
        "endTime": new Date("2024-03-23T17:15:00.000+01:00"),
        "name": "Cosplay Awards",
        "description": ""
     }, {
        "beginTime": new Date("2024-03-23T17:30:00.000+01:00"),
        "endTime": new Date("2024-03-23T18:30:00.000+01:00"),
        "name": "Worlds at a Glance",
        "description": "Immerse your players in vivid towns and villages. Learn to create memorable locations and inhabitants of your fantasy cities"
     }, {
        "beginTime": new Date("2024-03-24T10:00:00.000+01:00"),
        "endTime": new Date("2024-03-24T11:00:00.000+01:00"),
        "name": "Player's Power Hour",
        "description": "Sharpen your decision-making and table etiquette to become an even more impactful and pleasant player"
     }, {
        "beginTime": new Date("2024-03-24T11:15:00.000+01:00"),
        "endTime": new Date("2024-03-24T12:15:00.000+01:00"),
        "name": "Character Creation",
        "description": "Embark on a creative journey that fuses the art of roleplay with the technical mastery of character design"
     }, {
        "beginTime": new Date("2024-03-24T12:30:00.000+01:00"),
        "endTime": new Date("2024-03-24T13:30:00.000+01:00"),
        "name": "Cosplay Catwalk",
        "description": ""
     }, {
        "beginTime": new Date("2024-03-24T14:00:00.000+01:00"),
        "endTime": new Date("2024-03-24T16:30:00.000+01:00"),
        "name": "Live Play",
        "description": "Legendary adventurers take to the stage to provide you with entertainment during this interactive D&D play session"
     }, {
        "beginTime": new Date("2024-03-24T17:00:00.000+01:00"),
        "endTime": new Date("2024-03-24T17:15:00.000+01:00"),
        "name": "Cosplay Awards",
        "description": ""
     }, {
        "beginTime": new Date("2024-03-24T17:30:00.000+01:00"),
        "endTime": new Date("2024-03-24T18:00:00.000+01:00"),
        "name": "Taverne De Drakenvleugel",
        "description": "(NL) Book launch for a TTRPG-inspired short story anthology, presented by the authors"
     }
];

let gui = {};
['remaining', 'time', 'content'].forEach(id => gui[id] = document.getElementById(id));

let iterator = schedule.values();
let currentEvent = iterator.next().value;
let nextEvent = iterator.next().value;
while (nextEvent.beginTime.getTime() - 10*60*1000 <= Date.now()) {
    currentEvent = nextEvent;
    nextEvent = iterator.next().value;
}
gui.time.textContent = getTimeString(new Date());
updateRemaining();
updateContent();

// Update every second
window.setInterval(() => {
    // Update current time
    gui.time.textContent = getTimeString(new Date());
    updateRemaining();
    // Update current event
    if (nextEvent != undefined && nextEvent.beginTime.getTime() - 10*60*1000 <= Date.now()) {
        currentEvent = nextEvent;
        nextEvent = iterator.next().value;
        updateContent();
    }
}, 1000);

function updateRemaining() {
    if (currentEvent.beginTime.getTime() > Date.now()) {
        if (document.body.classList.contains('warn-0-mins')) {
            document.body.classList.remove('warn-0-mins');
        }
        let minutesLeft = Math.ceil((currentEvent.beginTime.getTime() - Date.now()) / (60*1000));
        gui.remaining.textContent = "Start in " + minutesLeft + " min";
        return;
    }

    let minutesLeft = Math.ceil((currentEvent.endTime.getTime() - Date.now()) / (60*1000));
    let alertNeeded = false;
    if (minutesLeft <= 0) {
        if (!document.body.classList.contains('warn-0-mins')) {
            document.body.classList.remove('warn-5-mins');
            document.body.classList.add('warn-0-mins');
            document.body.classList.add('highlight');
            setTimeout(() => document.body.classList.remove('highlight'), 4500);
        }
    } else if (minutesLeft <= 5) {
        if (!document.body.classList.contains('warn-5-mins')) {
            document.body.classList.remove('warn-10-mins');
            document.body.classList.add('warn-5-mins');
            document.body.classList.add('highlight');
            setTimeout(() => document.body.classList.remove('highlight'), 4000);
        }
    } else if (minutesLeft <= 10) {
        if (!document.body.classList.contains('warn-10-mins')) {
            document.body.classList.add('warn-10-mins');
            document.body.classList.add('highlight');
            setTimeout(() => document.body.classList.remove('highlight'), 3750);
        }
    }

    gui.remaining.textContent = Math.abs(minutesLeft) + " min " + (minutesLeft >= 0 ? "remaining" : "overshoot");
}

function updateContent() {
    gui.content.innerHTML = '<span class="times">' + getTimeString(currentEvent.beginTime) + " - " + getTimeString(currentEvent.endTime) + "</span><br>" + currentEvent.name;
}

function getTimeString(date) {
    return date.toLocaleTimeString('nl').substring(0, 5);
}