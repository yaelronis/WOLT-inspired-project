#include "tcp.h"

#include <cstddef>
#include <cstring>
#include <memory>
#include <mutex>
#include <netinet/in.h>
#include <optional>
#include <stdexcept>
#include <string>
#include <sys/socket.h>
#include <unistd.h>
#include <vector>

namespace TCP {

    constexpr std::size_t BUFFER_LEN = 65536;

    Client::Client(int socket) : socket(socket) {
        if (socket < 0) {
            auto socket_str = std::to_string(socket);
            std::string err_msg = "Client socket should be a non-negative, got: " + socket_str;
            throw std::runtime_error(err_msg);
        }
    }

    Server::Server(int socket) : socket(socket) {
        if (socket < 0) {
            auto socket_str = std::to_string(socket);
            std::string err_msg = "Server socket should be a non-negative, got: " + socket_str;
            throw std::runtime_error(err_msg);
        }
    }

    bool Server::is_active(Client client) {
        std::scoped_lock lock(this->clients_mutex);
        return this->clients.contains(client.socket);
    }

    std::unique_ptr<Server> Server::bind(int port) {
        const int PROTOCOL_AUTO = 0;
        // args: ipv4, duplex, automatic protocol
        int sock = ::socket(AF_INET, SOCK_STREAM, PROTOCOL_AUTO);
        struct sockaddr_in sin = {
            .sin_family = AF_INET,              // ipv4
            .sin_port = ::htons(port),          // specified port
            .sin_addr = {.s_addr = INADDR_ANY}, // accept any message
            .sin_zero = {0}                     // unused
        };
        bool error = ::bind(sock, (struct sockaddr*)&sin, sizeof(sin)) == -1;
        if (error) {
            // throw with error info from errno
            throw std::runtime_error(std::strerror(errno));
        }
        return std::make_unique<Server>(sock);
    }

    void Server::listen(int queue_size) {
        bool error = ::listen(this->socket, queue_size) == -1;
        if (error) {
            // throw with error info from errno
            throw std::runtime_error(std::strerror(errno));
        }
    }

    Client Server::accept() {
        int socket = ::accept(this->socket, nullptr, nullptr);
        bool error = socket == -1;
        if (error) {
            // throw with error info from errno
            throw std::runtime_error(std::strerror(errno));
        }
        std::scoped_lock lock(this->clients_mutex);
        this->clients.insert(socket);
        return Client(socket);
    }

    std::optional<std::string> Server::receive(Client client) {
        if (!this->is_active(client)) {
            throw std::runtime_error("Expected client to be connected");
        }
        // generally safer than raw c strings, to be converted to std::string
        std::vector<char> buffer(BUFFER_LEN);
        // no flags needed
        const int FLAGS_NONE = 0;
        // read into vector `buffer`
        long read_bytes = ::recv(client.socket, &buffer[0], buffer.size(), FLAGS_NONE);
        // case: client has disconnected
        if (!read_bytes) {
            std::scoped_lock lock(this->clients_mutex);
            this->clients.erase(client.socket);
            ::close(client.socket);
            return {};
        }
        // case: error reading from socket
        else if (read_bytes == -1) {
            // throw with error info from errno
            throw std::runtime_error(std::strerror(errno));
        }
        // case: read success
        std::string buffer_str(buffer.begin(), buffer.end());
        buffer_str.resize(read_bytes);
        return buffer_str;
    }

    void Server::send(Client client, const std::string& data) {
        if (!this->is_active(client)) {
            throw std::runtime_error("Expected client to be connected");
        }
        // no flags needed
        const int FLAGS_NONE = 0;
        int sent_bytes = ::send(client.socket, data.c_str(), data.length(), FLAGS_NONE);
        if (sent_bytes < 0) {
            // throw with error info from errno
            throw std::runtime_error(std::strerror(errno));
        }
    }

    Server::~Server() {
        std::scoped_lock lock(this->clients_mutex);
        for (int client : this->clients) {
            ::close(client);
        }
        ::close(this->socket);
    }
}