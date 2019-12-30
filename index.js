const express = require('express');
const electron = require('electron');
const path = require('path');
const dns = require('dns');
const os = require('os');

const { app, BrowserWindow, Menu, ipcMain } = electron;

let mainWin;
let server;

function getIp(){
    return new Promise(res => {
        dns.lookup(os.hostname(), function (err, add, fam) {
            res(add);
        })
    })
}

ipcMain.on('startserver', () => {
    const app = express();
    const port = 5000;

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'www/downloadpage.html'));
    })

    server = app.listen(port, () => {
        getIp().then(ip => {
            mainWin.webContents.send('serverstarted', ip, port);
        })
    })
})

ipcMain.on('stopserver', () => {
    if(server !== undefined){
        server.close();
        server = undefined;
    }

    mainWin.webContents.send('serverstopped');
})

app.on('ready', () => {
    mainWin = new BrowserWindow({
        width: 800,
        height: 500,
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWin.on('closed', () => {
        mainWin = null;
        app.quit();
    })

    mainWin.loadFile(path.join(__dirname, 'www/wifidownloader.html'));

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
})

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                click: () => {
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'Server'
    }
]
if(process.env.NODE_ENV !== 'production'){
    menuTemplate.push({
        label: 'Dev',
        submenu: [
            {
                label: 'Devtools',
                accelerator: 'Ctrl+Shift+I',
                click: (item, focusedWin) => {
                    focusedWin.toggleDevTools();
                }
            }
        ]
    })
}
