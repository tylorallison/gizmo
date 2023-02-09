const glob = require("glob");
const fs = require('fs');

let contents = "";

glob("js/**/*.js", (error, filesWithJs) => {
    if (error) {
        console.log(error);
    }
    for (const file of filesWithJs) {
        if (file === 'js/index.js') continue;
        if (file === 'js/main.js') continue;
        contents += `export * from './${file.slice(3)}'\n`;
    }
    fs.writeFileSync("js/index.js", contents);
    
});
