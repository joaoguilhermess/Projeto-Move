const net = require("net");
const fs = require("fs");
const stream = require("stream");

const Port = 6000;
const Host = "192.168.0.105";

function isDir(name) {
	return fs.statSync(name).isDirectory();
}

class Client {
	static setHost(host, port) {
		this.port = port;
		this.host = host;
	}

	static connect() {
		var socket = new net.Socket();

		socket.connect(this.port, this.host);

		return new Promise(function(resolve, reject) {
			socket.on("connect", function() {
				resolve(socket);
			});
		});
	}

	static async IterateDir(path) {
		var list = fs.readdirSync(path);

		for (var i = 0; i < list.length; i++) {
			var n = path + "/" + list[i];

			if (isDir(n)) {
				await this.SendDirectory(n);
				await this.IterateDir(n);
			} else {
				await this.SendFile(n);
			}
		}
	}

	static async SendFile(name) {
		var socket = await this.connect();

		return new Promise(function(resolve, reject) {
			console.log("\r\x1b[1m\x1b[30m" + "Sending File: " + name + "\x1b[0m");

			var size = fs.statSync(name).size;

			socket.write("file>" + name.replaceAll(" ", "?") + ">" + size);

			var fileStream = fs.createReadStream(name);	

			// stream.pipeline(fileStream, socket, function(e) {
			// 	if (!e) {
			// 		console.log("\nFile Sent:", name);
			// 		socket.end();
			// 		fileStream.close();
			// 		resolve();
			// 	} else {
			// 		console.log("error", e);
			// 		resolve();
			// 	}
			// });

			var current = 0;
			var write = true;

			fileStream.on("data", function(data) {
				if (write) {
					socket.write(data);

					current += data.length;

					process.stdout.write("\r\x1b[1m\x1b[30m" + "Sending File: " + name + " " + (current/size * 100).toFixed(1) + "%" + "\x1b[0m");

					fileStream.pause();
				}
			});

			fileStream.on("error", function(e) {
				console.log("error", e);
				resolve();
			});

			fileStream.on("end", function() {
				console.log("\nFile Sent:", name);
				socket.end();
				fileStream.close();
				resolve();
			});

			socket.on("data", function() {
				fileStream.resume();
			});

			socket.on("end", function() {
				write = false;
				resolve();
			});
		});
	}

	static async SendDirectory(name) {
		var socket = await this.connect();

		return new Promise(function(resolve, reject) {
			console.log("Sending Directory:", name);

			socket.write("dir>" + name.replaceAll(" ", "?"));

			socket.end();
			resolve();
		});
	}
}


var name = (process.argv.slice(2))[0];

Client.setHost(Host, Port);

if (isDir(name)) {
	Client.SendDirectory(name);
	Client.IterateDir(name);
} else {
	Client.SendFile(name);
}