var socket_io = require('socket.io');


// scoket.io middleware
// OTI Authentication
io.use((socket, next) => {
    /*if (socket.handshake.query && socket.handshake.query.token && socket.handshake.query.oti){
        //get credentials sent by the client
        var oti = data.oti;
        var token = data.token;

        axios.post(gatekeeper_url, {
            oti: oti,
            token: token
        })
        .then(function (response) {
            console.log(response);
            if (response.status != 200) return callback(new Error(response.error));
            // save auth datas
            socket.user = response.data
            socket.oti = oti
            return callback(null, true);
        })
        .catch(function (error) {
            console.log(error);
            return callback(new Error(error));
        });
    }else{
        next(new Error('Authentication error'));
    }*/
    console.log('middleware');
    next();
});

// Handle connection
io.on('connection', function (socket) {

});


exports.io = io;