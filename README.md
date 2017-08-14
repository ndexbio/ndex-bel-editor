# NetWorkBench

This webapp has two linked functions:

An edtior to revise network in the CNS schema
A workbench to compare / merge

# Building and Managing the Application

The source code for this project was scaffolded using the Yeoman Angular.js generator:  [yo angular generator](https://github.com/yeoman/generator-angular) (version 0.15.1.)

It uses the Bower system to manage external javascript libraries.

It is built using the Grunt framework.

## Cloning the Project

To clone this project run:

`git clone https://github.com/ndexbio/networkbench.git`

this will clone the repository into a newly created directory  `networkbench`

## Getting a Specific Release 

After cloning, you can get a specific release based on a tag.  Each tag corresponds to a released version, while other commits to the repository may only correspond to an intermediate code update. To select and use a specific release, get the list of tags and checkout the release with a specific tag.  For example, to get a release tagged `demo_v01_041316`:

`cd networkbench` <br />
`git tag -l` <br />
`git checkout tags/demo_v01_041316`  <br />

## Installing Yeoman, Bower, and Grunt

This application is scaffolded with Yeoman, built with Grunt, and manages its javascript libraries with Bower.

To install these tools, issue

`npm install -g yo grunt-cli bower`

More information on installing Yeoman and using it for building applications is available at the link below: https://www.safaribooksonline.com/blog/2013/07/02/web-applications-with-yeoman/

### Building 

After checking out the required branch and installing the tools, issue the following command to install dependencies
and update them:

`npm install` <br />
`bower update` <br />

### Running Locally

Issue the following command to build the code and to launch a local Node.js web server running the site. A window in your default browser will automatically open.  Any changes (well, almost any) to the code will be 'noticed' by Grunt and the site will be automatically refreshed.

`grunt serve`

### Building for Deployment

Please follow steps on cloning, installing and building the project described above. To build version for deploying, issue

`grunt build` <br />

from the project's root directory.  This command creates or updates a `dist` directory.  Copy the contents of the `dist` directory to your web server. You can compress it for your convenience, for example 

`cd dist` <br />
`tar -zcvf ndex-cravar-webapp.tar.gz *`

The actual javascripts are in `dist/scripts` directory.  They have been `uglified` by the `grunt build` command, i.e., all project's javascript files have been combined together, and have new lines removed to make the resulting scripts more compact.

In case you want your deployment scripts to be readable, please modify your Gruntfile.js to disable your `uglify` task by 

1) removing `uglifyjs` from `useminPrepare` :

    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>',
        flow: {
          html: {
            steps: {
              js: ['concat', 'uglifyjs'],
              css: ['cssmin']
            },
            post: {}
          }
        }
      }
    },
    
2) and removing `uglify` from
  
    grunt.registerTask('build', [
    'clean:dist',
    'wiredep',
    'useminPrepare',
    'concurrent:dist',
    'postcss',
    'ngtemplates',
    'concat',
    'ngAnnotate',
    'copy:dist',
    'cdnify',
    'cssmin',
    'uglify',
    'filerev',
    'usemin',
    'htmlmin']);

After removing `uglifyjs` and `uglify`, rebuild your project with `grunt build`, and re-deploy it.


### Testing

Running `grunt test` will run the unit tests with karma.
