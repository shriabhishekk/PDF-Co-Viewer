const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

// Initialize express and http server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (for the PDF and front-end assets)
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Keep track of connected clients and their roles
let clients = [];
let currentPage = 1; // Shared page number for all clients

io.on("connection", (socket) => {
  console.log("New client connected");

  // Assign role: first client is admin, others are viewers
  const role = clients.length === 0 ? "admin" : "viewer";

  // Add the client with its role to the clients array
  clients.push({ socket, role });

  // Send role and current page to the new client
  socket.emit("setRole", role);
  socket.emit("changePage", currentPage);

  // Admin page change handling
  socket.on("changePage", (newPage) => {
    if (role === "admin") {
      currentPage = newPage;
      // Broadcast the new page number to all clients
      io.emit("changePage", currentPage);
    }
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected");

    // Remove the disconnected client from the clients array
    clients = clients.filter((client) => client.socket !== socket);

    // If the admin disconnected, assign a new admin if any viewers are connected
    if (role === "admin" && clients.length > 0) {
      clients[0].role = "admin"; // Promote the next client to admin
      clients[0].socket.emit("setRole", "admin");
      console.log("New admin assigned after disconnection");
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
