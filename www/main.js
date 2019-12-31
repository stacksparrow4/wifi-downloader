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
        ipcRenderer.send('startserver', addedFiles);
        waitingForResp = true;
    }
    startServerBtn.innerText = 'Copying files and starting server...';
})

ipcRenderer.on('serverstarted', (e, ip, port) => {
    waitingForResp = false;
    serverRunning = true;
    startServerBtn.innerText = 'Stop server';

    const url = `${ip}:${port}`;

    status.innerHTML = `<p class="textcenter">Server is now running. Go to:</p><a class="textcenter" href="#">${url}</a><p class="textcenter">on any device that is connected to the same wifi network as you to download the above files.</p>`;
})

ipcRenderer.on('serverstopped', () => {
    waitingForResp = false;
    serverRunning = false;
    startServerBtn.innerText = 'Start server';
    status.innerHTML = '';
})

const dropArea = document.getElementById('droparea');
const dropText = document.getElementById('droptext');

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

function createP(className, txt){
    const newP = document.createElement('p');
    newP.className = className;
    newP.innerText = txt;
    return newP;
}

function createButton(className, txt, onclick){
    const newB = document.createElement('button');
    newB.className = className;
    newB.innerText = txt;
    newB.addEventListener('click', onclick);
    return newB;
}

function createDiv(className, children){
    const div = document.createElement('div');
    div.className = className;

    for(let i=0;i<children.length;i++){
        div.appendChild(children[i]);
    }

    return div;
}

let addedFiles = [];

function removeFile(name){
    for(let i=0;i<addedFiles.length;i++){
        if(addedFiles[i].name === name){
            addedFiles.splice(i, 1);
            dropArea.removeChild(dropArea.children[i+1]); // Offset by 1 for the initial element

            if(addedFiles.length === 0){
                dropText.style.display = 'block';
            }

            return;
        }
    }
}

dropArea.addEventListener('drop', ({ dataTransfer }) => {
    dropText.style.display = 'none';
    
    const { files } = dataTransfer;

    for(let i=0;i<files.length;i++){
        const currFile = files[i];

        const parts = currFile.name.split('.');
        let type = 'folder';
        let displayName = parts[0];
        if(parts.length > 1){
            type = parts.slice(1).join('.') + ' file';
        }

        const fLabel = createDiv('flex', [
            createP('padded grow', displayName),
            createP('padded', type),
            createButton('removebutton', 'Remove', () => {
                removeFile(currFile.name);
            })
        ]);

        dropArea.appendChild(fLabel);

        addedFiles.push({
            name: currFile.name,
            filePath: currFile.path,
            isFolder: parts.length === 1
        })
    }
})