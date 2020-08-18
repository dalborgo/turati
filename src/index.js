import fs from 'fs'
import moment from 'moment'
import readdir from 'recursive-readdir'
import Q from 'q'
import path from 'path'

const destDir = 'e:\\Dati'

async function main (baseDir, months) {
  const splitFolder = baseDir.split('\\')
  const secFolder = splitFolder[splitFolder.length - 1]
  console.info('FOLDER TO COPY:', secFolder)
  try {
    const files = await readdir(baseDir)
    for await (const file of files) {
      const stat = await Q.ninvoke(fs, 'stat', file)
      const endTime = new Date(stat.mtime)
      const date = moment(endTime)
      const now = moment()
      const duration = moment.duration(now.diff(date))
      const months = Math.round(duration.asMonths())
      const minutes = Math.round(duration.asMinutes())
      const basename = path.basename(file)
      const rest = path.dirname(file).replace(baseDir, '')
      const destRest = path.join(destDir, secFolder, rest)
      const dest = path.join(destRest, basename)
      if (minutes > 10) {
        console.log('from:', file)
        console.log('endTime:', moment(endTime).format('YYYY-MM-DD'))
        console.log('months:', months)
        console.log('minutes:', minutes)
        console.log('now:', moment(now).format('YYYY-MM-DD'))
        console.log('dest:', dest)
        const dirExists = fs.existsSync(destRest)
        !dirExists && await Q.nfcall(fs.mkdir, destRest)
        await Q.ninvoke(fs, 'copyFile', file, dest)
      }
    }
  } catch (err) {
    console.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

const promises = []

promises.push(() => main('\\\\10.0.0.17\\Asten\\MARCO\\prova', 2))
promises.push(() => main('\\\\10.0.0.17\\Asten\\MARCO\\prova2', 2))

async function execAll () {
  for (let exec of promises) {
    await exec()
  }
}

execAll().then()
