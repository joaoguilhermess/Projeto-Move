const net = require("net");
const fs = require("fs");
const stream = require("stream");

const FilesPath = "./files/";
const Port = 6000;

var app = net.createServer(function (socket) {
	if (!fs.existsSync(FilesPath)) {
		fs.mkdirSync(FilesPath);
	}

	socket.on("data", function(data) {

		if (!socket.file) {
			var args = data.toString().split(">");
			
			if (args[0] == "dir") {
				if (!fs.existsSync(FilesPath + args[1].replaceAll("?", " "))) {
					fs.mkdirSync(FilesPath + args[1].replaceAll("?", " "));
				}

				socket.type = "dir";
				socket.dir = args[1];
			} else { 
				socket.type = "file";
				socket.file = args[1].replaceAll("?", " ");
				socket.fileSize = parseInt(args[2]);
				socket.current = 0;

				socket.fileStream = fs.createWriteStream(FilesPath + socket.file);

				socket.fileStream.write(args.slice(3).join(" "));
			}

		} else if (socket.type == "file") {
			socket.fileStream.write(data);

			socket.current += data.length;
		
			process.stdout.write("\r\x1b[1m\x1b[30m" + "Receiving File: " + socket.file + " " + (socket.current/socket.fileSize * 100).toFixed(1) + "%" + "\x1b[0m");
		}
	});

	socket.on("end", function() {
		if (socket.type == "dir") {
			console.log("\nDirecory Received:", socket.dir);
		} else {
			console.log("\nFile Received:", socket.file);
			socket.fileStream.close();
		}
	});
});

app.listen(Port, function() {
	console.log("Ready");
});