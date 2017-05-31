#!/usr/bin/env node
const { MeshbluConnectorCommand } = require("./index")
const command = new MeshbluConnectorCommand({ argv: process.argv })
command.run()
