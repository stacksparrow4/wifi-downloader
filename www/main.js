const electron = window.require('electron');
const { ipcRenderer } = electron;


const startServerBtn = document.getElementById('startserver');
const status = document.getElementById('status');
const downloadUrl = document.getElementById('downloadurl');

let serverRunning = false;
let waitingForResp = false;

startServerBtn.addEventListener('click', () => {
    if(serverRunning){
        ipcRenderer.send('stopserver');
        waitingForResp = true;
    }else {
        ipcRenderer.send('startserver');
        waitingForResp = true;
    }
    startServerBtn.innerText = 'Starting server...';
})

ipcRenderer.on('serverstarted', (e, ip, port) => {
    waitingForResp = false;
    serverRunning = true;
    startServerBtn.innerText = 'Stop server';

    const url = `${ip}:${port}`;

    status.innerHTML = `<p>Server is now running. Go to:</p><a href="#">${url}</a><p>on any device that is connected to the same wifi network as you.</p>`;
})

ipcRenderer.on('serverstopped', () => {
    waitingForResp = false;
    serverRunning = false;
    startServerBtn.innerText = 'Start server';
    status.innerHTML = '';
})

const dropArea = document.getElementById('droparea');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
}

dropArea.addEventListener('dragenter', highlight, false);
dropArea.addEventListener('dragover', highlight, false);
dropArea.addEventListener('dragleave', unhighlight, false);
dropArea.addEventListener('drop', unhighlight, false);

function highlight() {
    dropArea.classList.add('highlight');
}

function unhighlight() {
    dropArea.classList.remove('highlight');
}