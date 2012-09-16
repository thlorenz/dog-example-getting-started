var director =  require('director')
  , dog      =  require('dog')
  , http     =  require('http')
  , fs       =  require('fs')
  , path     =  require('path')
  , root     =  'http://localhost:3000/'
  , posts    =  { }
  , blogCss
  ;

function getPreviewCss () {

  return [
      '.blog-post {'
    , '   margin-left: auto;'
    , '   margin-right: auto;'
    , '   width: 750px;'
    , '   background: #E4FFF3;'
    , '   padding: 5px 20px 20px 20px;'
    , '   border-radius: 10px;'
    , '}'
    ].join('\n');
}

function wrapnServe (res, html) {
  var body = [
    '<!DOCTYPE HTML>'
  , '<html>'
  , '<head>'
  , '   <title>My Blog</title>'
  , '   <link rel="stylesheet" href="/styles/blog.css" type="text/css" media="screen" charset="utf-8" />'
  , '</head>'
  , '<body>'
  , html
  , '</body>'
  , '</html'
  ].join('\n');

  res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': body.length });
  res.end(body); 
}

function serveSite () {

  function getRoot () {
    var postList = Object.keys(posts).map(function (name) {
      return '<li><a href="/post/' + name + '">' + posts[name].metadata.title + '</a></li>';
    });
    wrapnServe(this.res, '<ul>' + postList + '</ul>');
  }

  function getPost (post) {
    wrapnServe(this.res, posts[post].html);
  }

  function getImage (file) {
    var res = this.res
      , imgMime = path.extname(file).slice(1)
      , imageFile = path.join(dog.provider.getImagesDir(), file);
    
    fs.readFile(imageFile, function (err, data) {
      // error handling omitted for brevity
      res.writeHead(200, { 'Content-Type': 'image/' + imgMime, 'Content-Length': data.length });
      res.end(data); 
    });
  }

  function getBlogCss () {
    this.res.writeHead(200, { 'Content-Type': 'text/css', 'Content-Length': blogCss.length });
    this.res.end(blogCss); 
  }

  var router = new director.http.Router({
      '/'                :  { get :  getRoot }
    , '/post/:post'      :  { get :  getPost }
    , '/styles/blog.css' :  { get :  getBlogCss }
    , '/images/:file'    :  { get :  getImage }
  });

  var server = http.createServer(function (req, res) {

    router.dispatch(req, res, function (err) {
      if (err) {
        console.error('app', err);
        res.writeHead(404);
        res.end();
      }
    });
  });

  server.listen(3000, function () {
    console.log('server listening at ', root);
  });
}

/*
 * Initialize the blog
 */

// Tell dog where our blog lives
dog.provider.provideFrom(__dirname);

// Keep css for our blog in memory
dog.provider.concatenateStyles(function (err, css) {
  if (err) { console.error(err); return; }
  
  blogCss = css + getPreviewCss();
  
  // Keep all posts (including rendered html) in memory as well
  dog.provider.provideAll(function (err, metadata) {
    if (err) { console.error(err); return; }

    metadata.forEach(function (meta) {
      posts[meta.name] = meta;      
    });

    serveSite();
  });
});



