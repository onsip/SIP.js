var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var webpack = require('webpack');

var pkg = require('./package.json');
var year = new Date().getFullYear();
var banner = '\
\n\
 SIP version ' + pkg.version + '\n\
 Copyright (c) 2014-' + year + ' Junction Networks, Inc <http://www.onsip.com>\n\
 Homepage: https://sipjs.com\n\
 License: https://sipjs.com/license/\n\
\n\
\n\
 ~~~SIP.js contains substantial portions of JsSIP under the following license~~~\n\
 Homepage: http://jssip.net\n\
 Copyright (c) 2012-2013 José Luis Millán - Versatica <http://www.versatica.com>\n\
\n\
 Permission is hereby granted, free of charge, to any person obtaining\n\
 a copy of this software and associated documentation files (the\n\
 "Software"), to deal in the Software without restriction, including\n\
 without limitation the rights to use, copy, modify, merge, publish,\n\
 distribute, sublicense, and/or sell copies of the Software, and to\n\
 permit persons to whom the Software is furnished to do so, subject to\n\
 the following conditions:\n\
\n\
 The above copyright notice and this permission notice shall be\n\
 included in all copies or substantial portions of the Software.\n\
\n\
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,\n\
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n\
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND\n\
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE\n\
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION\n\
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\n\
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\
\n\
 ~~~ end JsSIP license ~~~\n\
\n\n\n';

module.exports = {
  entry: {
    'sip': __dirname + '/src/index.js',
    'sip.min': __dirname + '/src/index.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
    library: 'SIP',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          presets: ['env']
        }
      },
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
            "challenge",
            "sipfrag",
            "Referred_By"
          ]
        }
      }
    ]
  },
  plugins: [
    new UglifyJSPlugin({
      test: /^sip\.min\.js$/,
      uglifyOptions: {
        output: {
          ascii_only: true
        }
      }
    }),
    new webpack.BannerPlugin({
      banner: banner
    })
  ]
};
