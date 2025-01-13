const socket = io('ws://localhost:2800')

const msgInput = document.querySelector('message')
const nameInput = document.querySelector('#name')
const chatRoom = document.querySelector('#room')
const activity = document.querySelector('.activity')
const usersList = document.querySelector('.user-list')
const roomList = document.querySelector('.room-list')
const chatdisplay = document.querySelector('.chat-display')





function sendMessage(e) {
    e.preventDefault()
    if (nameInput.value && msgInput.value && chatRoom.value) {
        socket.emit('message', {
            name: nameInput.value,
            text: msgInput.value

        })
        msgInput.value = ""
    }
    msgInput.focus()
}

function enterRoom(e) {
    e.preventDefault()
    if (nameInput.value && chatRoom.value) {
        socket.emit('enterRoom', {
            name: nameInput.value,
            room: chatRoom.value
        })
    }
}

document.querySelector('.form-msg')
    .addEventListener('submit', sendMessage)

document.querySelector('.form-join')
    .addEventListener('submit', enterRoom)

msgInput.addEventListener('keypress', () => {
    socket.emit('activity', nameInput.value)
})

// Listen for incoming messages
socket.on("message", (data) => {
    activity.textContent = ""; // Clear any existing activity text

    const { name, text, time } = data; // Destructure data object
    const li = document.createElement("li");
    li.className = "post";

    // Determine the appropriate class based on the sender
    if (name === nameInput.value) {
        li.className = "post post--left";
    } else if (name !== nameInput.value && name !== "Admin") {
        li.className = "post post--right";
    }

    // Build the inner HTML for non-admin messages
    if (name !== "Admin") {
        li.innerHTML = `
            <div class="post__header ${name === nameInput.value ? "post__header--user" : "post__header--reply"
            }">
                <span class="post__header--name">${name}</span>
            </div>
            <div class="post__content">
                <p>${text}</p>
                <span class="post__time">${time}</span>
            </div>
            <div class="post__text">${text}</div>`
    } else {
        li.innerHTML = '<div class="post__text">${text}</div>'
    }

    // Append the message to the message list
    document.querySelector(''.chat-display).appendChild(li);

    chatdisplay.scrollTop = chatdisplay.scrollHeight
});

// Activity indicator logic
let activityTimer;
socket.on("activity", (name) => {
    // Update activity text
    activity.textContent = `${name} is typing...`;

    // Clear the timer if it's already running
    clearTimeout(activityTimer);

    // Clear the activity text after 5 seconds
    activityTimer = setTimeout(() => {
        activity.textContent = ""; // Clear the text after 5 seconds
    }, 5000);
});


socket.on('userList', ({ users }) => {
    showUsers(users)
})


socket.on('roomList', ({ rooms }) => {
    showRooms(rooms)
})


function showUsers(users){
    usersList.textContent = ''
    if (users) {
        usersList.innerHTML = '<em>Users in ${chatRoom.value}:</em>'
        users.foreach((user, i) => {
            usersList.textContent += '${user.name}'
            if (users.length > 1 && i !== users.length - 1){
                usersList.textContent += ''
            }
        })
    }
}


function showRooms(rooms){
    roomList.textContent = ''
    if (rooms) {
        roomList.innerHTML = '<em>Active Rooms:</em>'
        rooms.foreach((user, i) => {
            roomList.textContent += '${room}'
            if (users.length > 1 && i !== users.length - 1){
                usersList.textContent += ","
            }
        })
    }
}
