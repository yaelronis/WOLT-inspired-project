import sys
import socket

BUFFER_SIZE = 65536

def main ():
    ip = sys.argv[1]
    port = int(sys.argv[2])
    sock = socket.create_connection((ip, port))
    while True:
        request_utf = input()
        request_ascii = bytes(request_utf, 'ascii')
        sock.sendall(request_ascii)
        response_ascii = sock.recv(BUFFER_SIZE)
        response_utf = response_ascii.decode('utf-8')
        print(response_utf)

if __name__ == "__main__":
    main()
