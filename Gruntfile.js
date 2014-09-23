/*jshint multistr:true, devel:true*/
/*global module:false*/

module.exports = function(grunt) {

  var pkg = grunt.file.readJSON('package.json');
  var banner = '\
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
 */\n\n\n';

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    name: pkg.name.replace(/\.js$/, ''),
    meta: {
      banner: banner
    },
    browserify: {
      devel: {
        src: 'src/SIP.js',
        dest: 'dist/<%= name %>-<%= pkg.version %>.js'
      },
      options: {
        bundleOptions: {
          standalone: 'SIP'
        },
        postBundleCB: function (err, src, next) {
          // prepend the banner and fill in placeholders
          src = (banner + src).replace(/<%=(.*)%>/g, function (match, expr) {
            // jshint evil:true
            return eval(expr);
          });
          next(err, src);
        }
      }
    },
    copy: {
      dist: {
        src: 'dist/<%= name %>-<%= pkg.version %>.js',
        dest: 'dist/<%= name %>.js'
      }
    },
    jshint: {
      src: ['src/**/*.js', "!src/polyfills/**/*.js"],
      options: {
        jshintrc: true
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/<%= name %>.min.js': ['dist/<%= name %>.js']
        }
      },
      devel: {
        files: {
          'dist/<%= name %>-<%= pkg.version %>.min.js': ['dist/<%= name %>-<%= pkg.version %>.js']
        }
      },
      options: {
        banner: '<%= meta.banner %>'
      }
    },
    jasmine: {
      components: {
        src: [
        'dist/<%= name %>-<%= pkg.version %>.js'
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
             'Content_Disposition',
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
    },
    trimtrailingspaces: {
      main: {
        src: "src/**/*.js",
        options: {
          filter: 'isFile',
          encoding: 'utf8',
          failIfTrimmed: true
        }
      }
    }
  });


  // Load Grunt plugins.
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-peg');
  grunt.loadNpmTasks('grunt-trimtrailingspaces');


  // Task for building SIP.js Grammar.js and Grammar.min.js files.
  grunt.registerTask('post_peg', function(){
    // Modify the generated Grammar.js file with custom changes.
    console.log('"grammar" task: applying custom changes to Grammar.js ...');
    var fs = require('fs');
    var grammar = fs.readFileSync('src/Grammar/dist/Grammar.js').toString();
    var modified_grammar = grammar.replace(/throw peg.*maxFailPos.*/, 'return -1;');
    modified_grammar = modified_grammar.replace(/return peg.*result.*/, 'return data;');
    modified_grammar = modified_grammar.replace(/parse:( *)parse/, 'parse:$1function (input, startRule) {return parse(input, {startRule: startRule});}');
    modified_grammar = modified_grammar.replace(/\(function\(\)/, 'function(SIP)').replace(/\}\)\(\)/, '}');

    // Don't jshint this big chunk of minified code
    modified_grammar =
      "/* jshint ignore:start */\n" +
      modified_grammar +
      "\n/* jshint ignore:end */\n";

    fs.writeFileSync('src/Grammar/dist/Grammar.js', modified_grammar);
    console.log('OK');
  });

  grunt.registerTask('grammar', ['peg', 'post_peg']);

  // Task for building sip-devel.js (uncompressed), sip-X.Y.Z.js (uncompressed)
  // and sip-X.Y.Z.min.js (minified).
  // Both sip-devel.js and sip-X.Y.Z.js are the same file with different name.
  grunt.registerTask('build', ['trimtrailingspaces:main', 'devel', 'copy', 'uglify']);

  // Task for building sip-devel.js (uncompressed).
  grunt.registerTask('devel', ['jshint', 'browserify']);

  grunt.registerTask('quick', ['browserify']);

  // Test tasks.
  grunt.registerTask('test',['jasmine']);

  // Travis CI task.
  // Doc: http://manuel.manuelles.nl/blog/2012/06/22/integrate-travis-ci-into-grunt/
  grunt.registerTask('travis', ['grammar', 'devel', 'test']);

  // Default task is an alias for 'build'.
  // I know this is annoying... but you could always do grunt build. This encourages better code testing! --Eric Green
  grunt.registerTask('default', ['build','test']);

};
