const webSocket = require('ws');

const wss = new webSocket.Server({port: 8081});

// 웹소켓서버에 connection 이벤트가 일어나면 connection 함수를 실행해라 
wss.on('connection', function connection(ws) { 
    // 다른 포트로 넘겨주고 하는 것들은 이미 일어났을 것이다. 따라서 관심사가 아니다.
    ws.on('message', function incoming(message) { // 소켓으로 메세지가 오면 incoming 함수를 실행해라.
        // ws.send(message); 이건 메세지를 보내온 클라이언트에게 다시 보내주는 것
        wss.clients.forEach(function each(client) { // 메세지를 보내온 클라이언트를 제외한 다른 클라이언트에게 보여야 하므로
            if (client !== ws && client.readyState === webSocket.OPEN) { // 보내온 클라이언트 제외 and 받을 수 있는 상태라면
                client.send(message);
            }
        })
    })
});

