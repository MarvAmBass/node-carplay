
const EventEmitter = require('events');
const spawn = require('child_process').spawn;
const {Readable} = require('stream');

class VideoParse extends EventEmitter {
    constructor(width, height, bitrate, ws, updateState, reader) {
        super();
        this._parsers = {
            1: spawn('ffplay', [
                "-hide_banner",
                "-fs",
                "-loglevel", "error",
                "-"
                ])
        }



        this.updateState = updateState;
        this._bytesToRead = 0;
        this._bytesRead = [];
        this._bytesSize = 0;

        this._audioParse = true;
        this._navi = false;
        this._audioType = 1;
        this._naviPendingStop = false;

        process.on('SIGABRT', () => {
            this.quit()
        })
        process.on('SIGINT', () => {
            this.quit()
        })
        process.on('SIGTERM', () => {
            this.quit()
        })
    }


    setActive = (bytesToRead) => {
        this._bytesToRead = bytesToRead;

        this.updateState(6)
    }


    addBytes = (bytes) => {
        this._bytesRead.push(bytes)
        this._bytesSize += Buffer.byteLength(bytes)
        //console.log(this._bytesSize, this._bytesToRead)
        if (this._bytesSize === this._bytesToRead) {
            this.pipeData()
        }
    }
    pipeData = () => {
        let fullData = Buffer.concat(this._bytesRead)
        let outputData = fullData.slice(20, this._bytesToRead)

        let decodeType = 1 // for video there is only one setting
        this._parsers[decodeType].stdin.write(outputData)

        this._bytesToRead = 0;
        this._bytesRead = [];
        this._bytesSize = 0;
        this.updateState(0);
    }

    quit = () => {
        Object.keys(this._parsers).forEach((key) => {
            console.log("killing ffplay: ", key)
            this._parsers[key].kill("SIGINT")
        })
        process.exit()
    }
}

module.exports = VideoParse;
