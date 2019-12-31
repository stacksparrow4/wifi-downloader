const express = require('express');
const electron = require('electron');
const path = require('path');
const dns = require('dns');
const os = require('os');
const fs = require('fs');
const rimraf = require('rimraf');
const { ncp } = require('ncp');
const { zip } = require('zip-a-folder');

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

const downloadDir = path.join(__dirname, '/download/');
const zipDir = path.join(__dirname, '/www/download.zip');

async function copyOverFiles(filestocopy){
    rimraf.sync(zipDir);

    if(filestocopy.length === 1 && filestocopy[0].isFolder){
        // There is just a single folder. Just zip that.
        await zip(filestocopy[0].filePath, zipDir);
    }else {
        // Multiple files. Put them all into a dir and zip.
        rimraf.sync(downloadDir); // Clean up just in case
        fs.mkdirSync(downloadDir);

        for(let i=0;i<filestocopy.length;i++){
            const { name, filePath } = filestocopy[i];
            await new Promise(res => {
                ncp(filePath, path.join(downloadDir, name), err => {
                    if(err) throw err;
                    res();
                });
            });
        }

        await zip(downloadDir, zipDir);

        rimraf.sync(downloadDir);
    }
}

function exitApp(){
    rimraf.sync(zipDir); // Clean up
    app.quit();
}

ipcMain.on('startserver', async (e, filestocopy) => {
    await copyOverFiles(filestocopy);

    const app = express();
    const port = 5000;

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'www/downloadpage.html'));
    })

    app.get('/download.zip', (req, res) => {
        res.sendFile(zipDir);
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
        exitApp();
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
                    exitApp();
                }
            }
        ]
    },
    {
        label: 'Server'
    }
]
