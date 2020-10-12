const axios = require('axios');
var socket_io = require('socket.io');

var io = socket_io();

const LOGIN_URL = process.env.GATEKEEPER_URL + '/api/v1/sessions/1';

/**
 * List of all Drivers
 */
var drivers = {};

// scoket.io middleware
// OTI Authentication
io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token){
        /**
         * Decode token and get driver's info
         */
        //var token = data.token;
        axios.get(LOGIN_URL)
        .then(function (response) {
            // handle success
            if (response.status != 200) return callback(new Error(response.error));
            // save auth datas
            // Save all drivers decoded data to socket.driver
            socket.driver = response.data
            // Add drivers id to socket for easy acess
            socket.driver_id = response.data.id;
            // Uppend driver to drivers
            drivers[response.data.id] = response.data;
            // Set drivers status to online 
            drivers[response.data.id]['status'] = 'Online';
            // Add emtpy tracks object since there is not gps location
            drivers[response.data.id]['tracks'] = {};
            return next();
        })
        .catch(function (error) {
            // handle error
            return next(new Error(error));
        })
        .then(function () {
            // always executed
        });

    }else{
        return next(new Error('No Token query found'));
    }
    next();
});

// Handle connection
io.on('connection', function (socket) {
    /**
     * Get all online drivers
     */
    socket.on('drivers:get:all', function() {
        socket.emit('drivers:receive:all', drivers);
    })

    /**
     * Drivers creates room for real time tracking
     */
    socket.on('room:create', function() {
        // Create New room for driver
        // Create unique room id with socket id and driver's id
        room = socket.id + '#' + socket.driver_id;
        // Check if driver have already created or not if so ignore creating
        // new room
        if(drivers[socket.driver_id]['room'] == null){
            drivers[socket.driver_id]['room'] = room;
            // Emit romm created event with room's id
            socket.emit('room:created', {room: room});
        }else{
            // Emit dirvers have already crated room 
            socket.emit('room:create:notify', {
                message: 'Driver already have a room',
                room: room
            });
        }
    })

    /**
     * Clinet Joing drivers room
     */
    socket.on('rooom:join', function(data) {
        // First trace back the tracking number to the drivers id
        // Identify if the driver is online or is trackable
    })

    /**
     * Update Location
     */
    socket.on('location:update', function(location) {
        // Update Drivers location and emit to all connection
        drivers[socket.driver_id]['track'] = location;
        socket.emit('location:updated', 'Location Updated')
    })


    /**
     * Disconnect
     */
    socket.on('disconnect', function() {
        // Change drivers status to ofline
        drivers[socket.driver_id]['status'] = 'Offline';
    })
});


exports.io = io;