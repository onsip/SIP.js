/*global module:false*/

module.exports = function(grunt) {

  var srcFiles = [
    'src/SIP.js',
    'src/Utils.js',
    'src/LoggerFactory.js',
    'src/EventEmitter.js',
    'src/Constants.js',
    'src/Exceptions.js',
    'src/Timers.js',
    'src/Transport.js',
    'src/Parser.js',
    'src/SIPMessage.js',
    'src/URI.js',
    'src/NameAddrHeader.js',
    'src/Transactions.js',
    'src/Dialogs.js',
    'src/RequestSender.js',
    'src/RegisterContext.js',
    'src/MediaHandler.js',
    'src/ClientContext.js',
    'src/ServerContext.js',
    'src/Session.js',
    'src/Subscription.js',
    'src/WebRTC.js',
    'src/UA.js',
    'src/Hacks.js',
    'src/SanityCheck.js',
    'src/DigestAuthentication.js',
    'src/tail.js'
  ];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '\
/*\n\
 * SIP version <%= pkg.version %>\n\
 * Copyright (c) 2014-<%= grunt.template.today("yyyy") %> Junction Networks, Inc <http://www.onsip.com>\n\
 * Homepage: http://sipjs.com\n\
 * License: http://sipjs.com/license/\n\
 *\n\
 *\n\
 * ~~~SIP.js contains substantial portions of JsSIP under the following license~~~\n\
 * Homepage: http://jssip.net\n\
 * Copyright (c) 2012-2013 José Luis Millán - Versatica <http://www.versatica.com> \n\
 *\n\
 * Permission is hereby granted, free of charge, to any person obtaining\n\
 * a copy of this software and associated documentation files (the\n\
 * "Software"), to deal in the Software without restriction, including\n\
 * without limitation the rights to use, copy, modify, merge, publish,\n\
 * distribute, sublicense, and/or sell copies of the Software, and to\n\
 * permit persons to whom the Software is furnished to do so, subject to\n\
 * the following conditions:\n\
 * \n\
 * The above copyright notice and this permission notice shall be\n\
 * included in all copies or substantial portions of the Software.\n\
 * \n\
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,\n\
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n\
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND\n\
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE\n\
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION\n\
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\n\
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\
 *\n\
 * ~~~ end JsSIP license ~~~\n\
 */\n\n\n'
    },
    concat: {
      dist: {
        src: srcFiles,
        dest: 'dist/<%= pkg.name %>.js',
        options: {
          banner: '<%= meta.banner %>',
          separator: '\n\n',
          process: true
        },
        nonull: true
      },
      post_dist: {
        src: [
          'dist/<%= pkg.name %>.js',
          'src/Grammar/dist/Grammar.js'
        ],
        dest: 'dist/<%= pkg.name %>.js',
        nonull: true
      },
      devel: {
        src: srcFiles,
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js',
        options: {
          banner: '<%= meta.banner %>',
          separator: '\n\n',
          process: true
        },
        nonull: true
      },
      post_devel: {
        src: [
          'dist/<%= pkg.name %>-<%= pkg.version %>.js',
          'src/Grammar/dist/Grammar.js'
        ],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js',
        nonull: true
      }
    },
    includereplace: {
      dist: {
        files: {
          'dist': 'dist/<%= pkg.name %>.js'
        }
      },
      devel: {
        files: {
          'dist': 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
        }
      }
    },
    jshint: {
      dist: 'dist/<%= pkg.name %>.js',
      devel: 'dist/<%= pkg.name %>-<%= pkg.version %>.js',
      options: {
        browser: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: false,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        onecase: true,
        unused: true,
        supernew: true,
        globals: {
          module: true,
          define: true,
          global: true
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
        }
      },
      devel: {
        files: {
	  'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': ['dist/<%= pkg.name %>-<%= pkg.version %>.js']
        }
      },
      options: {
        banner: '<%= meta.banner %>'
      }
    },
    jasmine: {
      components: {
        src: [
        'dist/<%= pkg.name %>-<%= pkg.version %>.js'
        ],
        options: {
          specs: 'test/spec/*.js',
          keepRunner : true,
          helpers: 'test/helpers/*.js'
        }
      }
    },
    peg: {
      grammar: {
        src: 'src/Grammar/src/Grammar.pegjs',
        dest: 'src/Grammar/dist/Grammar.js',
        options: {
          exportVar: 'SIP.Grammar',
          optimize: 'size',
          allowedStartRules: [
             'Contact',
             'Name_Addr_Header',
             'Record_Route',
             'Request_Response',
             'SIP_URI',
             'Subscription_State',
             'Via',
             'absoluteURI',
             'Call_ID',
             'Content_Length',
             'Content_Type',
             'CSeq',
             'displayName',
             'Event',
             'From',
             'host',
             'Max_Forwards',
             'Proxy_Authenticate',
             'quoted_string',
             'Refer_To',
             'stun_URI',
             'To',
             'turn_URI',
             'uuid',
             'WWW_Authenticate',
             'challenge'
          ]
        }
      }
    }
  });


  // Load Grunt plugins.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-include-replace');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-peg');


  // Task for building SIP.js Grammar.js and Grammar.min.js files.
  grunt.registerTask('post_peg', function(){
    // Modify the generated Grammar.js file with custom changes.
    console.log('"grammar" task: applying custom changes to Grammar.js ...');
    var fs = require('fs');
    var grammar = fs.readFileSync('src/Grammar/dist/Grammar.js').toString();
    var modified_grammar = grammar.replace(/throw peg.*maxFailPos.*/, 'return -1;');
    modified_grammar = modified_grammar.replace(/return peg.*result.*/, 'return data;');
    modified_grammar = modified_grammar.replace(/parse:( *)parse/, 'parse:$1function (input, startRule) {return parse(input, {startRule: startRule});}');
    fs.writeFileSync('src/Grammar/dist/Grammar.js', modified_grammar);
    console.log('OK');
  });

  grunt.registerTask('grammar', ['peg', 'post_peg']);

  // Task for building sip-devel.js (uncompressed), sip-X.Y.Z.js (uncompressed)
  // and sip-X.Y.Z.min.js (minified).
  // Both sip-devel.js and sip-X.Y.Z.js are the same file with different name.
grunt.registerTask('build', ['concat:devel', 'includereplace:devel', 'jshint:devel', 'concat:post_devel', 'concat:dist', 'includereplace:dist', 'jshint:dist', 'concat:post_dist', 'uglify:dist', 'uglify:devel']);

  // Task for building sip-devel.js (uncompressed).
  grunt.registerTask('devel', ['concat:devel', 'includereplace:devel', 'jshint:devel', 'concat:post_devel']);

  // Test tasks.
  grunt.registerTask('test',['jasmine']);

  // Travis CI task.
  // Doc: http://manuel.manuelles.nl/blog/2012/06/22/integrate-travis-ci-into-grunt/
  grunt.registerTask('travis', ['grammar', 'devel', 'test']);

  // Default task is an alias for 'build'.
  // I know this is annoying... but you could always do grunt build. This encourages better code testing! --Eric Green
  grunt.registerTask('default', ['build','test']);

};
