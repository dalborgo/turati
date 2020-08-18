import fs from 'fs'

const directoryPath = '\\\\10.0.0.17\\Asten\\MARCO\\'
fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err)
  }
  files.forEach(function (file) {
    console.log(file)
  })
})