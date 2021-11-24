const RSocketTcpClient = require('rsocket-tcp-client').default;
const {RSocketClient, BufferEncoders, encodeCompositeMetadata, encodeAndAddWellKnownMetadata, encodeRoute} = require("rsocket-core");
const {MESSAGE_RSOCKET_ROUTING} = require("rsocket-core");

const rsocketClient = new RSocketClient({
    setup: {
        dataMimeType: 'application/json',
        keepAlive: 1000000,
        lifetime: 100000,
        metadataMimeType: 'message/x.rsocket.composite-metadata.v0',
        payload: {
            // please supply app metadata
            metadata: encodeCompositeMetadata([
                ['message/x.rsocket.application+json', convertToBuffer(JSON.stringify({
                    name: 'demo-app'
                }))],
            ]),
        }
    },
    transport: new RSocketTcpClient({
        host: "127.0.0.1",
        port: 9999
    }, BufferEncoders)
});

const monoRSocket = rsocketClient.connect();

monoRSocket.then(rsocket => {
    rsocket.requestResponse({
        data: convertToBuffer(JSON.stringify([1])),
        // rsocket routing info: service name + method name
        metadata: encodeCompositeMetadata([
            [MESSAGE_RSOCKET_ROUTING, encodeRoute("com.alibaba.user.UserService.findById")],
        ]),
    }).subscribe({
        onComplete: (payload) => console.log(JSON.parse(payload.data)),
        onError: error => {
            console.error(error);
        },
    });
});


/**
 * @param data {string|Buffer|Object} text/json data or json data
 * @return {Buffer|null}
 */
function convertToBuffer(data) {
    if (data === null) {
        return null;
    } else if (Buffer.isBuffer(data)) {
        return data;
    } else if (typeof data === 'string' || data instanceof String) {
        return Buffer.from(data);
    } else {
        return Buffer.from(JSON.stringify(data));
    }

}

