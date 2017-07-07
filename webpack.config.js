var UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: {
    'sip': __dirname + '/src/index.js',
    'sip.min': __dirname + '/src/index.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
    library: 'SIP',
    libraryTarget: 'window'
  },
  module: {
    rules: [
      { 
        test: /\.pegjs$/,
        loader: 'pegjs-loader',
        options: {
          'optimize': 'size',
          'allowedStartRules':
          [
            "Contact",
            "Name_Addr_Header",
            "Record_Route",
            "Request_Response",
            "SIP_URI",
            "Subscription_State",
            "Supported",
            "Require",
            "Via",
            "absoluteURI",
            "Call_ID",
            "Content_Disposition",
            "Content_Length",
            "Content_Type",
            "CSeq",
            "displayName",
            "Event",
            "From",
            "host",
            "Max_Forwards",
            "Min_SE",
            "Proxy_Authenticate",
            "quoted_string",
            "Refer_To",
            "Replaces",
            "Session_Expires",
            "stun_URI",
            "To",
            "turn_URI",
            "uuid",
            "WWW_Authenticate",
            "challenge"
          ]
        }
      }
    ]
  },
  plugins: [
    new UglifyJSPlugin({
      include: ['sip.min.js']
    })
  ]
};
