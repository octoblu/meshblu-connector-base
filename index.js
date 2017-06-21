const OctoDash = require("octodash")
const path = require("path")
const MeshbluConnectorRunner = require("meshblu-connector-runner/dist/runner.js")
const MeshbluHttp = require("meshblu-http")

const CLI_OPTIONS = [
  {
    names: ["uuid", "u"],
    type: "string",
    env: "MESHBLU_UUID",
    required: true,
    help: "Meshblu UUID",
    helpArg: "UUID",
  },
  {
    names: ["token", "t"],
    type: "string",
    env: "MESHBLU_TOKEN",
    required: true,
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
  {
    names: ["env-file"],
    type: "string",
    default: path.join(process.cwd(), ".env"),
    env: "MESHBLU_ENV_FILE",
    help: "dotenv file",
    helpArg: "FILE",
    completionType: "file",
  },
]

class MeshbluConnectorCommand {
  constructor(options) {
    if (!options) options = {}
    let { connectorPath, cliOptions, argv } = options
    if (!cliOptions) cliOptions = CLI_OPTIONS
    if (!connectorPath) connectorPath = process.cwd()
    this.connectorPath = connectorPath
    this.connectorPackageJSON = require(path.join(this.connectorPath, "package.json"))
    process.env.MESHBLU_CONNECTOR_CWD = process.cwd()
    this.octoDash = new OctoDash({
      argv,
      cliOptions,
      name: this.connectorPackageJSON.name,
      version: this.connectorPackageJSON.version,
    })
  }

  run() {
    const options = this.octoDash.parseOptions()
    this.startConnectorRunner({ options })
  }

  startConnectorRunner({ options }) {
    const { uuid, token, domain } = options
    const meshbluConfig = { uuid, token, domain, resolveSrv: true }
    const connectorPath = this.connectorPath
    const logger = {
      trace: console.info,
      debug: console.info,
      info: console.log,
      warn: console.log,
      error: console.error,
      fatal: console.error,
    }
    this.verifyMeshbluDevice({ meshbluConfig }, error => {
      if (error) return this.octoDash.die(error)
      this.runner = new MeshbluConnectorRunner({ meshbluConfig, connectorPath, logger })
      this.runner.run()
    })
  }

  verifyMeshbluDevice({ meshbluConfig }, callback) {
    const meshbluHttp = new MeshbluHttp(meshbluConfig)
    meshbluHttp.whoami(callback)
  }
}

module.exports.MeshbluConnectorCommand = MeshbluConnectorCommand
