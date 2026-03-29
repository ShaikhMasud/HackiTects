const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk('c:\\Riyaz\\Personal\\Projects\\WardWatch\\HackiTects\\client\\src', function(err, results) {
  if (err) throw err;
  results.filter(f => f.endsWith('.jsx')).forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the specific fallback we added earlier
    content = content.replace(/\|\| "http:\/\/localhost:5000"/g, '|| "https://hackitects.onrender.com"');
    
    // Just in case any raw http://localhost:5000 remains:
    content = content.replace(/http:\/\/localhost:5000/g, 'https://hackitects.onrender.com');
    
    fs.writeFileSync(file, content, 'utf8');
  });
  console.log('Force-replaced all local fallbacks to hackitects.onrender.com!');
});
