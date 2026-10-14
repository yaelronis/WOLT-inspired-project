#pragma once

#include <memory>
#include <mutex>
#include <optional>
#include <string>
#include <unordered_set>

namespace TCP {
    class Client {
        private:
            // this class should be opaque to consumer code
            friend class Server;

            // client socket number, should not be negative
            const int socket;

            // throws `std::runtime_error` if socket is negative
            Client(int socket);
    };

    class Server {
            // enable call to private constructor
            friend class std::unique_ptr<Server>;

        private:
            // server socket number, should not be negative
            const int socket;

            // clients are active after being accepted, and before disconnecting.
            // disconnection occures when `socket.h::recv` returns 0.
            std::unordered_set<int> clients;
            std::mutex clients_mutex;

            // ::send and ::recv should fail quickly should this return false on a client
            bool is_active(Client client);

        public:
            // throws `std::runtime_error` if socket is negative
            Server(int socket);
            // binds to port, throws `std::runtime_error` if port is negative
            static std::unique_ptr<Server> bind(int port);

            // listens to this server's socket,
            // accepting a max of `queue_size` waiting clients,
            // if client queue is full, further requests are refused
            void listen(int queue_size);

            // accepts and returns an opaque Client object.
            // this object should be used in `receive` and `send` methods
            Client accept();

            // receives message from client as string.
            // if this client isn't active, throws `std::runtime_error`.
            // returns empty if client has disconnected, and Client object should be discarder
            std::optional<std::string> receive(Client client);

            // sends text message to client.
            // if this client isn't active, or communication fails, throws `std::runtime_error`.
            void send(Client client, const std::string& message);

            // closes all sockets
            ~Server();
    };

}
