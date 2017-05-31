const dashdash = require("dashdash")
const path = require("path")
const MeshbluConnectorRunner = require("meshblu-connector-runner/runner")
const MeshbluHttp = require("meshblu-http")

const IS_WINDOWS = process.platform == "win32"
var EventLogger
if (IS_WINDOWS) EventLogger = require("node-windows").EventLogger

const CLI_OPTIONS = [
  {
    name: "version",
    type: "bool",
    help: "Print connector version and exit.",
  },
  {
    names: ["help", "h"],
    type: "bool",
    help: "Print this help and exit.",
  },
  {
    names: ["uuid", "u"],
    type: "string",
    env: "MESHBLU_UUID",
    help: "Meshblu UUID",
    helpArg: "UUID",
  },
  {
    names: ["token", "t"],
    type: "string",
    env: "MESHBLU_TOKEN",
    help: "Meshblu Token",
    helpArg: "TOKEN",
  },
  {
    names: ["domain", "d"],
    type: "string",
    default: "octoblu.com",
    env: "MESHBLU_DOMAIN",
    help: "Meshblu SRV Domain",
    helpArg: "DOMAIN",
  },
]

class MeshbluConnectorCommand {
  constructor(options) {
    if (!options) options = {}
    var { argv, cliOptions, connectorPath } = options
    if (!cliOptions) cliOptions = CLI_OPTIONS
    if (!connectorPath) connectorPath = process.cwd()
    if (!argv) return this.die(new Error("MeshbluConnectorCommand requires options.argv"))
    this.argv = argv
    this.connectorPath = connectorPath
    this.cliOptions = cliOptions
  }

  parseArgv({ argv, options }) {
    var parser = dashdash.createParser({ options })
    try {
      var opts = parser.parse(argv)
    } catch (e) {
      return {}
    }
    return opts
  }

  run() {
    const opts = this.parseArgv({ options: this.cliOptions, argv: this.argv })
    const { uuid, token } = opts
    if (!uuid) return this.die(new Error("MeshbluConnectorCommand requires --uuid or MESHBLU_UUID"))
    if (!token) return this.die(new Error("MeshbluConnectorCommand requires --token or MESHBLU_TOKEN"))
    this.startConnectorRunner({ options: opts })
  }

  startConnectorRunner({ options }) {
    const { uuid, token, domain } = options
    const meshbluConfig = { uuid, token, domain, resolveSrv: true }
    const connectorPath = this.connectorPath
    var logger

    if (IS_WINDOWS) {
      logger = new EventLogger("connector")
    } else {
      logger = {
        trace: console.info,
        debug: console.info,
        info: console.log,
        warning: console.log,
        error: console.error,
        fatal: console.error,
      }
    }
    this.verifyMeshbluDevice({ meshbluConfig }, (error, device) => {
      if (error) return this.die(error)
      this.runner = new MeshbluConnectorRunner({ meshbluConfig, connectorPath, logger })
      this.runner.run()
    })
  }

  verifyMeshbluDevice({ meshbluConfig }, callback) {
    const meshbluHttp = new MeshbluHttp(meshbluConfig)
    meshbluHttp.whoami(callback)
  }

  die(error) {
    console.error("Meshblu Connector Command: error: %s", error.message)
    process.exit(1)
  }
}

module.exports.MeshbluConnectorCommand = MeshbluConnectorCommand
