/*jshint multistr:true, devel:true*/
/*global module:false*/

module.exports = function(grunt) {

  var pkg = grunt.file.readJSON('package.json');
  var year = new Date().getFullYear()
  var banner = '\
/*\n\
 * SIP version ' + pkg.version + '\n\
 * Copyright (c) 2014-' + year + ' Junction Networks, Inc <http://www.onsip.com>\n\
 * Homepage: http://sipjs.com\n\
 * License: http://sipjs.com/license/\n\
 *\n\
 *\n\
 * ~~~SIP.js contains substantial portions of JsSIP under the following license~~~\n\
 * Homepage: http://jssip.net\n\
 * Copyright (c) 2012-2013 José Luis Millán - Versatica <http://www.versatica.com>\n\
 *\n\
 * Permission is hereby granted, free of charge, to any person obtaining\n\
 * a copy of this software and associated documentation files (the\n\
 * "Software"), to deal in the Software without restriction, including\n\
 * without limitation the rights to use, copy, modify, merge, publish,\n\
 * distribute, sublicense, and/or sell copies of the Software, and to\n\
 * permit persons to whom the Software is furnished to do so, subject to\n\
 * the following conditions:\n\
 *\n\
 * The above copyright notice and this permission notice shall be\n\
 * included in all copies or substantial portions of the Software.\n\
 *\n\
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
        src: pkg.main,
        dest: 'dist/<%= name %>-<%= pkg.version %>.js'
      },
      options: {
        browserifyOptions: {
          standalone: 'SIP'
        },
        postBundleCB: function (err, src, next) {
          // prepend the banner
          next(err, banner + src);
        }
      }
    },
    copy: {
      min: {
        src: 'dist/<%= name %>-<%= pkg.version %>.min.js',
        dest: 'dist/<%= name %>.min.js'
      },
      dist: {
        src: 'dist/<%= name %>-<%= pkg.version %>.js',
        dest: 'dist/<%= name %>.js'
      }
    },
    jshint: {
      src: ['src/**/*.js', "!src/polyfills/**/*.js", "!src/Grammar/dist/Grammar.js"],
      options: {
        jshintrc: true
      }
    },
    uglify: {
      devel: {
        files: {
          'dist/<%= name %>-<%= pkg.version %>.min.js': ['dist/<%= name %>-<%= pkg.version %>.js']
        }
      },
      options: {
        beautify : {
          ascii_only : true
        },
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
          vendor: 'test/polyfills/*.js',
          helpers: 'test/helpers/*.js'
        }
      }
    },
    peg: {
      grammar: {
        src: 'src/Grammar/src/Grammar.pegjs',
        dest: 'src/Grammar/dist/Grammar.js',
        options: require('./src/Grammar/peg.json')
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

  grunt.registerTask('grammar', ['peg']);

  // Task for building sip-devel.js (uncompressed), sip-X.Y.Z.js (uncompressed)
  // and sip-X.Y.Z.min.js (minified).
  // Both sip-devel.js and sip-X.Y.Z.js are the same file with different name.
  grunt.registerTask('build', ['trimtrailingspaces:main', 'devel', 'uglify', 'copy']);

  // Task for building sip-devel.js (uncompressed).
  grunt.registerTask('devel', ['jshint', 'quick']);

  grunt.registerTask('quick', ['grammar', 'browserify']);

  // Test tasks.
  grunt.registerTask('test',['jasmine']);

  // Travis CI task.
  // Doc: http://manuel.manuelles.nl/blog/2012/06/22/integrate-travis-ci-into-grunt/
  grunt.registerTask('travis', ['devel', 'test']);

  // Default task is an alias for 'build'.
  // I know this is annoying... but you could always do grunt build. This encourages better code testing! --Eric Green
  grunt.registerTask('default', ['build','test']);

};
