const net = require("net");
const fs = require("fs");
const stream = require("stream");

const Port = 6000;
const Host = "192.168.0.107";

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
				this.IterateDir(n);
			} else {
				await this.SendFile(n);
			}
		}
	}

	static async SendFile(name) {
		var socket = await this.connect();

		return new Promise(function(resolve, reject) {
			console.log("Sending File:", name);

			socket.write("file>" + name.replaceAll(" ", "?") + ">" + fs.statSync(name).size);

			var fileStream = fs.createReadStream(name);	

			stream.pipeline(fileStream, socket, function(e) {
				if (!e) {
					console.log("File Sent:", name);
					socket.end();
					fileStream.close();
					resolve();
				} else {
					console.log("error", e);
				}
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
	console.log("a");
	Client.IterateDir(name);
} else {
	Client.SendFile(name);
}