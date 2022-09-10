const socket = io();

//elements
const messageForm = document.querySelector('#send-chat');
const messageFormInput = messageForm.querySelector('input');
const messageFormButton = messageForm.querySelector('button');
const shareLocationButton = document.querySelector('#send-location');
const messages = document.querySelector('#messages');

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = () => {
    const newMessage = messages.lastElementChild;

    const newMessageStyle = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyle.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = messages.offsetHeight;

    const containerHeight = messages.scrollHeight;

    const scrollOffset = messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        messages.scrollTop = messages.scrollHeight;
    }

}

socket.on('message', (message)=> {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', (url)=> {
    console.log(url);
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('userData', ({room, users})=> {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
})

messageForm.addEventListener('submit', (e)=> {
    e.preventDefault();
    messageFormButton.setAttribute('disabled', 'disabled');
    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error)=> {
        messageFormButton.removeAttribute('disabled');
        messageFormInput.value = '';
        messageFormInput.focus();
        if(error){
            console.log(error);
        }
        console.log('The Message Was Delivered');
    });
});

shareLocationButton.addEventListener('click', ()=> {
    shareLocationButton.setAttribute('disabled', 'disabled');
    if(!navigator.geolocation){
        return alert('Your Browser Does Not Support GeoLocation');
    }
    navigator.geolocation.getCurrentPosition((position)=> {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, ()=> {
            shareLocationButton.removeAttribute('disabled');
            console.log('Location Shared');
        });
    });
});

socket.emit('join', {username, room}, (error)=> {
    if(error){
        alert(error)
        location.href = '/'
    }
});