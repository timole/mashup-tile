var Config = {
  // Contents of this file will be send to the client
  "domain":     process.env.OPENSHIFT_APP_DNS || '127.0.0.1',

  "serverip":   process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
  "serverport": process.env.OPENSHIFT_NODEJS_PORT || '9000',
  
  "clientport": (process.env.OPENSHIFT_NODEJS_PORT) ? '8000':'9000',
  "protocol":   'ws://',

  "heartbeattmo": 1000, // milliseconds 
  
  "wsclientopts": { reconnection: true, 
                    reconnectionDelay: 2000,
                    reconnectionAttempts: 100,
                    secure: false
                  }
};

module.exports = Config;
