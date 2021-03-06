const axios = require('axios');
var socket_io = require('socket.io');

var io = socket_io();

const LOGIN_URL = process.env.GATEKEEPER_URL + '/api/v1/sessions/1';
const SHIPPING_URL = process.env.XPRESS_URL + '/api/v1/shippings';

/**
 * List of all Drivers
 */
var drivers = {};

/**
 * List of all client i.e connected client
 */

// scoket.io middleware
// OTI Authentication
io.use((socket, next) => { // 1. admin, 2. driver, 3. user
    if (socket.handshake.query && socket.handshake.query.name && socket.handshake.query.type){
        socket.driver_id = socket.handshake.query.name;
        socket.type = socket.handshake.query.type;
        return next();
    }else if(socket.handshake.query && socket.handshake.query.tracking_number){
        if(socket.handshake.query.tracking_number == null){
            next(new Error("Error: Tracking number cannot be empty"))
        }else{
            // Store the tracking number
            socket.tracking_number = socket.handshake.query.tracking_number;
            next();
        }
    }else{
        return next(new Error('Middleware => middleware query is empty'));
    }
    next();
});

// Handle connection
io.on('connection', function (socket) {

    // Return counts
    socket.on('count:total', function() {
        socket.emit('counted:total', drivers);
    })


    /**
     * Traceback tracking number to the driver
     */
    socket.on('traceback:trackingnumber', function() {
        // Traceback tracking to drivers id and return the drivers id to the client
        // Sync get drivers id
        axios.get(SHIPPING_URL + '/' + socket.tracking_number)
        .then(function (response) {
            // Check response status code
            if(response.status != 200) return callback(new Error(response.error))
            // Save drivers id to socket
            socket.driver_id = response.data.driver_id;
            // Send back response to the client
            socket.emit('traceback:trackingnumber:return', response.data);
        })
        .catch(function (error) {
            // Handle error
            socket.emit('error', error);
        })
        .then(function () {
            // Always executed
        })
    });

    /**
     * Get all trails for drivers id
     */
    socket.on('trail:get:history', function() {
        // Get tails history of drivers id
        socket.emit('trail:get:history:return', drivers[socket.driver_id]);
    });

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
     * Step 1 for admin
     */
    socket.on('driver:connection:join', function() {
        drivers[socket.driver_id] = {}
        // Set drivers status to online 
        drivers[socket.driver_id]['status'] = 'Online';
        // Add emtpy tracks object since there is not gps location
        // start - contains when tracking starts
        // current - stores current drivers location
        // trails - contains all tracking location
        drivers[socket.driver_id]['tracks'] = { "start": socket.handshake.query.location, "current": {}, "trails": [] };
        socket.emit('tests', drivers);
        socket.broadcast.emit('counted:total', drivers);
    })

    /**
     * Update Location
     */
    socket.on('location:update', function(data) {
        if(typeof data != 'object'){
            socket.emit('location:update:return', {
                'sucess': false,
                'message': 'Location cannot be empty'
            })
            return; 
        }
        // First check if start location is empty or not 
        // If start location is null create one else update create location
        // Update Drivers location and emit to all connection
        if(drivers[socket.driver_id]['tracks']['start'] == null){
            drivers[socket.driver_id]['tracks']['start'] = data;
            drivers[socket.driver_id]['tracks']['trails'] = [data];
            drivers[socket.driver_id]['tracks']['current'] = data;
        }else{
            drivers[socket.driver_id]['tracks']['current'] = data;
            //drivers[socket.driver_id]['tracks']['trails'].push(data);
        }
        // Emit location to all clients
        socket.broadcast.emit('tracking', data);
        socket.emit('location:update:return', {
            'name': socket.driver_id,
            'data': data,
            'sucess': true,
            'message': 'Location Updated'
        });
        socket.emit('tests', drivers);
    })


    /**
     * Testing Sockets
     */
    socket.on('tests', function(data) {
        socket.emit('tests', {
            request_datas: data,
            drivers: drivers
        })
    })

    /**
     * Disconnect
     */
    socket.on('disconnect', function() {
        // Change drivers status to ofline
        //drivers[socket.driver_id]['status'] = 'Offline';
        //delete drivers[socket.driver_id];  
    })
});


exports.io = io;