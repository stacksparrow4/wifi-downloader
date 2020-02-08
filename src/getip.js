var os = require('os');

module.exports = () => {
    return new Promise(res => {
        var ifaces = os.networkInterfaces();

        Object.keys(ifaces).forEach(function (ifname) {
            ifaces[ifname].forEach(function (iface) {
                if ('IPv4' !== iface.family || iface.internal !== false) {
                    return;
                }

                res(iface.address);
            });
        });
    })
}