let lastMoveTimeoutId = null;
const MINUTE = 60*1000;

let timeShift = 0;

let gui = {};
['remaining', 'time', 'content', 'settings-button', 'controls', 'event-name', 'monitor-name', 'fake-time'].forEach(id => gui[id] = document.getElementById(id));
gui.settings = {};
['schedule', 'settings-close', 'schedule-item-template', 'settings-event-name', 'settings-monitor-name', 'settings-schedule-add-item', 'settings-schedule-reset'].forEach(id => gui.settings[id] = document.getElementById(id));

gui.settings["settings-event-name"].value = localStorage.getItem("eventName") || eventName;
gui.settings["settings-event-name"].addEventListener("change", event => {
    localStorage.setItem("eventName", event.target.value);
    updateContent();
});
gui.settings["settings-monitor-name"].value = localStorage.getItem("monitorName") || monitorName;
gui.settings["settings-monitor-name"].addEventListener("change", event => {
    localStorage.setItem("monitorName", event.target.value);
    updateContent();
});
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

(localStorage.getItem('schedule') != null ? JSON.parse(localStorage.getItem('schedule')) : schedule).forEach(addItem);
gui.settings['settings-schedule-add-item'].addEventListener('click', () => {
    addItem({
        beginTime: gui.settings.schedule.childElementCount == 0 ? "09:00" : increaseTime(gui.settings.schedule.lastElementChild.querySelector('input[name="end"]').value, 30),
        endTime: gui.settings.schedule.childElementCount == 0 ? "10:00" : increaseTime(gui.settings.schedule.lastElementChild.querySelector('input[name="end"]').value, 60),
        name: ""
    });
    gui.settings.schedule.lastElementChild.querySelector('input[name="begin"]').focus();
});
gui.settings['settings-schedule-reset'].addEventListener('click', resetSchedule);

function updateGui() {
    updateContent();
    updateCurrentTime();
    updateRemainingTime();
    validateSettings();
}

function updateContent() {
    gui["event-name"].textContent = localStorage.getItem("eventName") || eventName;
    gui["monitor-name"].textContent = localStorage.getItem("monitorName") || monitorName;
    let data = localStorage.getItem('schedule') != null ? JSON.parse(localStorage.getItem('schedule')) : schedule;
    let iterator = data.values();
    let currentEvent = iterator.next().value,
        nextEvent = iterator.next().value;

    while (nextEvent != undefined &&
            constructTodayTime(currentEvent.endTime) <= getNow() &&
            (constructTodayTime(nextEvent.beginTime) + constructTodayTime(currentEvent.endTime)) / 2 <= getNow()) {
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
    let previousWarning = document.body.classList.contains('warn-0-mins') ? 0 :document.body.classList.contains('warn-5-mins') ? 5 : document.body.classList.contains('warn-10-mins') ? 10 : null;
    document.body.classList.remove('warn-0-mins');
    document.body.classList.remove('warn-5-mins');
    document.body.classList.remove('warn-10-mins');
    document.body.classList.remove('warn-start');
    if (activeEvent == null) { // End of the schedule
        gui.remaining.textContent = '';
        return;
    }
    if (constructTodayTime(activeEvent.beginTime) > getNow()) { // Upcoming event
        let minutesLeft = Math.ceil((constructTodayTime(activeEvent.beginTime) - getNow()) / MINUTE);
        gui.remaining.textContent = "Start in " + minutesLeft + " min";
    } else { // Ongoing event
        let minutesLeft = Math.ceil((constructTodayTime(activeEvent.endTime) - getNow()) / MINUTE);
        if (minutesLeft <= 0) {
            document.body.classList.add('warn-0-mins');
            if (previousWarning != 0) {
                document.body.classList.add('highlight');
                setTimeout(() => document.body.classList.remove('highlight'), 4500);
            }
        } else if (minutesLeft <= 5) {
            document.body.classList.add('warn-5-mins');
            if (previousWarning != 5) {
                document.body.classList.add('highlight');
                setTimeout(() => document.body.classList.remove('highlight'), 4000);
            }
        } else if (minutesLeft <= 10) {
            document.body.classList.add('warn-10-mins');
            if (previousWarning != 10) {
                document.body.classList.add('highlight');
                setTimeout(() => document.body.classList.remove('highlight'), 3750);
            }
        } else if (previousWarning == 5) {
            document.body.classList.add('warn-0-mins');
            document.body.classList.add('highlight');
            setTimeout(() => document.body.classList.remove('highlight'), 4500);
        }
        if (gui.remaining.textContent.startsWith('Start in')) {
            document.body.classList.add('warn-start');
            document.body.classList.add('highlight');
            setTimeout(() => document.body.classList.remove('highlight'), 4500);
        }
        gui.remaining.textContent = Math.abs(minutesLeft) + " min " + (minutesLeft >= 0 ? "remaining" : "overshoot");
    }
}

function validateSettings() {
    gui.settings.schedule.querySelectorAll(".error").forEach(div => div.classList.remove('error'));
    Array.from(gui.settings.schedule.children).forEach(event => {
        let previousEventEnd = event.previousElementSibling?.querySelector('input[name="end"]').value;
        if (previousEventEnd != null && (
                constructTodayTime(previousEventEnd) > constructTodayTime(event.querySelector('input[name="begin"]').value) ||
                constructTodayTime(event.querySelector('input[name="begin"]').value) >= constructTodayTime(event.querySelector('input[name="end"]').value)
            )) {
            event.classList.add('error');
        }
        if (event.querySelector('input[name="name"]').value == "") {
            event.classList.add('error');
        }
    })
}

function saveSchedule() {
    localStorage.setItem('schedule', JSON.stringify(Array.from(gui.settings.schedule.querySelectorAll('div')).map(item => {
        return {
            beginTime: item.querySelector('input[name="begin"]').value,
            endTime: item.querySelector('input[name="end"]').value,
            name: item.querySelector('input[name="name"]').value
        };
    })));
    updateGui();
}

function moveItemUp(event) {
    if (event.target.parentNode.previousElementSibling == null) {
        return;
    }
    gui.settings.schedule.insertBefore(event.target.parentNode, event.target.parentNode.previousElementSibling);
    saveSchedule();
}

function moveItemDown(event) {
    if (event.target.parentNode.nextElementSibling == null) {
        return;
    }
    gui.settings.schedule.insertBefore(event.target.parentNode.nextElementSibling, event.target.parentNode);
    saveSchedule();
}

function removeItem(event) {
    event.target.parentNode.remove();
    saveSchedule();
}

function addItem(data) {
    let scheduleItem = gui.settings['schedule-item-template'].content.cloneNode(true);
    scheduleItem.querySelector('input[name="begin"]').value = data.beginTime;
    scheduleItem.querySelector('input[name="begin"]').addEventListener('change', saveSchedule);
    scheduleItem.querySelector('input[name="end"]').value = data.endTime;
    scheduleItem.querySelector('input[name="end"]').addEventListener('change', saveSchedule);
    scheduleItem.querySelector('input[name="name"]').value = data.name;
    scheduleItem.querySelector('input[name="name"]').addEventListener('change', saveSchedule);
    scheduleItem.querySelector('button[name="move-item-up"]').addEventListener('click', moveItemUp);
    scheduleItem.querySelector('button[name="move-item-down"]').addEventListener('click', moveItemDown);
    scheduleItem.querySelector('button[name="delete-item"]').addEventListener('click', removeItem);
    gui.settings.schedule.appendChild(scheduleItem);
}

function resetSchedule() {
    localStorage.removeItem('schedule');
    Array.from(gui.settings.schedule.children).forEach(event => event.remove());
    schedule.forEach(addItem)
    updateGui();
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

function increaseTime(time, offset) {
    let hours = parseInt(time.substring(0, 2)),
        minutes = parseInt(time.substring(3, 5));
    hours += Math.floor((minutes + offset) / 60);
    minutes = (minutes + offset) % 60;
    return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
}

gui['fake-time'].addEventListener("change", () => {
    timeShift = constructTodayTime(gui['fake-time'].value) - Date.now();
    updateGui();
});
