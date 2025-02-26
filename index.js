let lastMoveTimeoutId = null;
const MINUTE = 60*1000;

let timeShift = 0;

let gui = {};
['remaining', 'time', 'content', 'settings-button', 'controls', 'event-name', 'monitor-name', 'fake-time'].forEach(id => gui[id] = document.getElementById(id));
gui.settings = {};
['currentTime', 'schedule', 'hour-plus', 'minute-plus', 'time-offset', 'settings-close'].forEach(id => gui.settings[id] = document.getElementById(id));

gui["event-name"].textContent = eventName;
gui["monitor-name"].textContent = monitorName;
if (!schedule) {
    schedule = [];
}

updateGui();
// Wait until the nearest minute, then update every minute
setTimeout(() => {
    window.setInterval(updateGui, MINUTE);
    updateGui();
}, MINUTE - Date.now() % MINUTE);

['mousemove', 'keydown', 'keyup'].forEach(event => document.addEventListener(event, showCursor));
function showCursor() {
    document.body.classList.remove('hide-cursor');
    clearTimeout(lastMoveTimeoutId);
    lastMoveTimeoutId = setTimeout(() => document.body.classList.add('hide-cursor'), 5000);
}

gui['settings-button'].addEventListener('click', () => {
    document.body.classList.add('show-settings');
});
gui.settings['settings-close'].addEventListener('click', () => {
    document.body.classList.remove('show-settings');
});
document.addEventListener('keydown', event => {
    if (!document.body.classList.contains('show-settings') && event.key == "s") {
        document.body.classList.add('show-settings');
    }
    if (document.body.classList.contains('show-settings') && event.key == "Escape") {
        document.body.classList.remove('show-settings');
    }
});

var activeEvent = null;

function updateGui() {
    updateContent();
    updateCurrentTime();
    updateRemainingTime();
}

function updateContent() {
    // Retrieve current event
    let iterator = schedule.values();
    let currentEvent = iterator.next().value,
        nextEvent = iterator.next().value;

    while (nextEvent != undefined && constructTodayTime(currentEvent.endTime) <= getNow() && constructTodayTime(nextEvent.beginTime) - 10*MINUTE <= getNow()) {
        currentEvent = nextEvent;
        nextEvent = iterator.next().value;

        // Don't remove the last event from the screen until 10 minutes past its time
        if (nextEvent == undefined && constructTodayTime(currentEvent.endTime) + 10*MINUTE > getNow()) {
            nextEvent = currentEvent;
            break;
        }
    }
    if (nextEvent == undefined) {
        activeEvent = null;
        gui.content.innerHTML = '<em>Reached end of schedule</em>';
    } else {
        activeEvent = currentEvent;
        gui.content.innerHTML = '<span class="period">' + currentEvent.beginTime + " - " + currentEvent.endTime + "</span>" + currentEvent.name;
    }
}

function updateCurrentTime() {
    // Deal with going over midnight in the future
    if (constructTodayTime("23:59") + MINUTE <= getNow()) {
        timeShift -= 24*60*MINUTE;
    }
    // Sanity check
    if (constructTodayTime("00:00") > getNow()) {
        timeShift += 24*60*MINUTE;
    }
    gui.time.textContent = gui['fake-time'].value = new Date(getNow()).toLocaleTimeString('en-GB').substring(0, 5);
}

function updateRemainingTime() {
    if (activeEvent == null) { // End of the schedule
        document.body.classList.remove('warn-0-mins');
        document.body.classList.remove('warn-5-mins');
        document.body.classList.remove('warn-10-mins');
        gui.remaining.textContent = '';
        return;
    }
    if (constructTodayTime(activeEvent.beginTime) > getNow()) { // Upcoming event
        document.body.classList.remove('warn-0-mins');
        let minutesLeft = Math.ceil((constructTodayTime(activeEvent.beginTime) - getNow()) / MINUTE);
        gui.remaining.textContent = "Start in " + minutesLeft + " min";
    } else { // Ongoing event
        let minutesLeft = Math.ceil((constructTodayTime(activeEvent.endTime) - getNow()) / MINUTE);
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
}

function getNow() {
    return Date.now() + timeShift;
}

function constructTodayTime(timestring) {
    let today = new Date();
    today.setHours(timestring.substring(0, 2));
    today.setMinutes(timestring.substring(3));
    return today.getTime();
}

gui['fake-time'].addEventListener("change", () => {
    timeShift = constructTodayTime(gui['fake-time'].value) - Date.now();
    updateGui();
});
