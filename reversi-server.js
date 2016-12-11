'use strict'

let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);

server.listen(4747, function() {
    console.log('listening on:4747');
});

let MAX = 30;//最大支持连接房间数
let hall = null;//大厅
let queue = null;//匹配队列
let rooms = [];//游戏房间

function Hall() {
    this.people = 0;
    this.socket = null;
}

function Room(){
	this.people = 0;
    this.socket = null;
}

function Queue(){
    this.people = 0;
    this.socket = null;
}

hall = new Hall();

queue = new Queue();

for(let n = 0;n < MAX;n++){
	rooms[n] = new Room();
}

function getFreeRoom(){
	for(let n = 0;n < MAX;n++){
		if(rooms[n].people === 0){
			return n;
		}
	}
	return -1;
}

io.people = 0;
io.on('connection',function(socket){
    io.people++;
    console.log('someone connected');
    socket.on('disconnect',function(){
        io.people--;
        console.log('someone disconnected');
    });
})

hall.socket = io.of('/hall').on('connection', function(socket) {

	hall.people++;

    console.log('a player connected.There are '+hall.people+' people in hall');

	hall.socket.emit('people changed',hall.people);

    socket.on('disconnect',function(){
        hall.people--;
		console.log('a player disconnected.There are '+hall.people+' people in hall');
		hall.socket.emit('people changed',hall.people);
    });
});

queue.socket = io.of('/queue').on('connection',function(socket){

	queue.people++;

    console.log('someone connect queue socket.There are '+queue.people+' people in queue');

    if(queue.people === 1){
		socket.emit('set stand','black');
	}else if(queue.people === 2){
		socket.emit('set stand','white');
		let roomId = getFreeRoom();
        console.log(roomId+"roomId");
		if(roomId >= 0){
			queue.socket.emit('match success',roomId);
            console.log('match success.There are '+queue.people+' people in queue');
		}else{
            console.log('no free room!');
        }
	}

	socket.on('cancel match',function(){
		queue.people--;
        console.log('someone cancel match.There are '+queue.people+' people in queue');
	});

    socket.on('disconnect',function(){
        queue.people--;
        console.log('someone disconnected match.There are '+queue.people+' people in queue');
    });

});

for(let i = 0;i < MAX;i++){
	rooms[i].socket = io.of('/rooms'+i).on('connection',function(socket){

		rooms[i].people++;
		console.log('some one connected room'+i+'.There are '+rooms[i].people+' people in the room');

		socket.on('update chessboard',function(chessCoor){
			socket.broadcast.emit('update chessboard',chessCoor);
		});

		socket.on('force change turn',function(){
			socket.broadcast.emit('force change turn');
		});

		socket.on('disconnect',function(){
			rooms[i].people--;
            console.log('someone disconnected room'+i+'.There are '+rooms[i].people+' people in the room');
		});

	});
}
