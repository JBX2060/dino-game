const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const WSS = require("ws");
const http = require("http");
const crypto = require("crypto");
const protocol = require("./protocol");
const GameServer = require("./gameserver");
const GameClient = require("./client");
const readline = require("readline");

const app = express();
const port = process.env.MASTERPORT || 55554;
const namespace = "/api";
const PASSWORD_SALT =
  "aiapd8tfa3pd8tfn3pad8tap3d84t3q4pntardi4tad4otupadrtouad37q2aioymkznsxhmytcaoeyadou37wty3ou7qjoaud37tyadou37j4ywdou7wjytaousrt7jy3t";
const SERVER_SECRET =
  "n98r4w4qbd9rt40ygr4wd34pawd3dngaytgnaiarn3f38bnfat4pay3vui";

let database = { accounts: [], links: [] };
let changed = false;
const databaseFilePath = path.join(__dirname, "database.json");

if (fs.existsSync(databaseFilePath)) {
  const databaseData = fs.readFileSync(databaseFilePath, "utf8");
  try {
    database = JSON.parse(databaseData);
    if (Array.isArray(database)) database = { accounts: [], links: [] }; // remove after first run
  } catch (e) {
    database = {};
  }
}

process.stdin.on("data", async (data) => {
  const databaseBackup = JSON.parse(JSON.stringify(database));
  const input = data.toString().trim();

  try {
    const code = `(async () => { ${input} })()`;

    await eval(code);

    console.log("Changes made. Please wait for the auto-save.");
  } catch (error) {
    console.error("Error executing command:", error);

    database = databaseBackup;
    console.log("Changes reverted due to an error.");
  }
});

const hash = (s) => crypto.createHash("sha512").update(s, "utf8").digest("hex");

app.use(cors());
app.use(function (req, res, next) {
  res.setHeader("X-Powered-By", "https://rwar.fun/");
  next();
});

function is_valid_uuid(uuid) {
  return (
    uuid.length === 36 &&
    uuid.match(/[0-9a-z]{8}-([0-9a-z]{4}-){3}[0-9a-z]{12}/) !== null
  );
}

function log(type, args, color = 31) {
  // todo: save to some sort of log file
  console.log(
    `\u001b[${color}[${new Date().toJSON()}::[${type}]:\t${args.join(
      "\t"
    )}\u001b[0m`
  );
}

function apply_missing_defaults(account) {
  const defaults = {
    password: "",
    username: "",
    xp: 0,
    petals: { "1:0": 5 },
    failed_crafts: {},
    mob_gallery: {},
  };

  // Fill in any missing defaults
  for (let prop in defaults) {
    if (!account.hasOwnProperty(prop)) {
      account[prop] = defaults[prop];
    }
  }

  // Remove any extra properties
  for (let prop in account) {
    if (!defaults.hasOwnProperty(prop)) {
      delete account[prop];
    }
  }

  return account;
}

async function write_db_entry(username, data) {
  if (!database.accounts.includes(username)) database.accounts.push(username);
  changed = true;
  database[username] = data;
}

async function db_read_user(username, password) {
  if (!database.accounts.includes(username)) database.accounts.push(username);
  if (
    connected_clients[username] &&
    (connected_clients[username].password === password ||
      password === SERVER_SECRET)
  )
    return connected_clients[username].user;

  const user = { value: database[username] };
  if (!user.value) {
    return null;
  }

  if (password !== SERVER_SECRET && password !== user.value.password)
    return null;

  apply_missing_defaults(user.value);
  return user.value;
}

async function db_read_or_create_user(username, password) {
  if (!database.accounts.includes(username)) database.accounts.push(username);
  if (
    connected_clients[username] &&
    (connected_clients[username].password === password ||
      password === SERVER_SECRET)
  )
    return connected_clients[username].user;

  const user = { value: database[username] };
  if (!user.value) {
    log("account create", [username]);
    const user = apply_missing_defaults({});
    user.password = hash(username + PASSWORD_SALT);
    user.username = username;
    await write_db_entry(username, user);
    return user;
  }

  apply_missing_defaults(user.value);
  return user.value;
}

function get_unique_petals(petals) {
  petals = structuredClone(petals);
  for (key in petals) petals[key] = 1;
  return petals;
}

function merge_petals(obj1, obj2) {
  for (let key in obj2) {
    if (obj1[key]) {
      obj1[key] += obj2[key];
    } else {
      obj1[key] = obj2[key];
    }
  }
}

async function handle_error(res, cb) {
  try {
    res.end(await cb());
  } catch (e) {
    console.log(e);
    res.end("\x00" + e.stack);
  }
}

app.get(
  `${namespace}/account_link/:old_username/:old_password/:username/:password`,
  async (req, res) => {
    const { old_username, old_password, username, password } = req.params;
    handle_error(res, async () => {
      if (old_username === username) return "same uuid linkage not valid";
      if (!is_valid_uuid(old_username) || !is_valid_uuid(username))
        return "invalid uuid";

      const old_account = await db_read_user(old_username, old_password);
      if (!old_account) {
        return "failed";
      }

      const new_account = await db_read_user(username, password);
      database.links.push([old_username, username, old_account, new_account]);
      changed = true;

      if (!new_account || new_account.xp * 3 <= old_account.xp) {
        log("account_link", [old_username, username]);
        old_account.linked_from = { ...old_account };
        old_account.password = hash(username + PASSWORD_SALT);
        old_account.username = username;
        connected_clients[username] = old_account;
        await write_db_entry(username, old_account);
        await write_db_entry(old_username, null);
        delete connected_clients[username];
      } else {
        log("account_login", [
          old_username,
          username,
          new_account.xp,
          old_account.xp,
        ]);
      }

      return "success";
    });
  }
);

app.get(`${namespace}/user_get_password/:password`, async (req, res) => {
  const { password } = req.params;
  handle_error(res, async () => {
    return hash("e");
  });
});

app.get(`${namespace}/user_get_server_alias/:alias`, async (req, res) => {
  const { alias } = req.params;
  handle_error(res, async () => {
    if (game_servers[alias]) return game_servers[alias].rivet_server_id;
    else return "";
  });
});

app.use((req, res) => {
  res.status(404).send("404 Not Found\n");
});

const saveDatabaseToFile = () => {
  if (changed) {
    changed = false;
    console.log("Saving database to file:", databaseFilePath);
    try {
      const databaseData = JSON.stringify(database);
      fs.writeFileSync(databaseFilePath, databaseData, "utf8");
    } catch (error) {
      console.error("Error saving database:", error);
    }
  }
};

const server = http.createServer(app);
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const wss = new WSS.Server({ server });
const game_servers = {};
const connected_clients = {};

wss.on("connection", (ws, req) => {
  if (req.url !== `/api/${SERVER_SECRET}`) return ws.close();

  const game_server = new GameServer();
  game_server[game_server.alias] = game_server;

  ws.on("message", async (message) => {
    const data = new Uint8Array(message);
    const decoder = new protocol.BinaryReader(data);

    switch (decoder.ReadUint8()) {
      case 0: {
        const uuid = decoder.ReadStringNT();
        const pos = decoder.ReadUint8();
        log("attempt init", [uuid]);

        if (
          !is_valid_uuid(uuid) ||
          connected_clients[uuid] ||
          uuid === "b5f62776-ef1c-472d-8ccd-b329edee545b"
        ) {
          log("player force disconnect", [uuid]);
          const encoder = new protocol.BinaryWriter();
          encoder.WriteUint8(2);
          encoder.WriteUint8(pos);
          encoder.WriteStringNT(uuid);
          ws.send(encoder.data.subarray(0, encoder.at));
          break;
        }

        try {
          const user = await db_read_or_create_user(uuid, SERVER_SECRET);
          connected_clients[uuid] = new GameClient(user, game_server.alias);
          game_server.clients[pos] = uuid;

          const encoder = new protocol.BinaryWriter();
          encoder.WriteUint8(1);
          encoder.WriteUint8(pos);
          connected_clients[uuid].write(encoder);
          ws.send(encoder.data.subarray(0, encoder.at));
        } catch (e) {
          console.log(e);
        }
        break;
      }
      case 1: {
        const uuid = decoder.ReadStringNT();
        if (
          connected_clients[uuid] &&
          connected_clients[uuid].server !== game_server.alias
        )
          break;

        const pos = game_server.clients.indexOf(uuid);
        if (pos !== -1) {
          log("client delete", [uuid]);
          const client = connected_clients[uuid];
          if (!client) break;
          write_db_entry(client.user.username, client.user);
          game_server.clients[pos] = 0;
        }
        delete connected_clients[uuid];
        break;
      }
      case 2: {
        const uuid = decoder.ReadStringNT();
        if (!connected_clients[uuid]) break;
        if (
          connected_clients[uuid] &&
          connected_clients[uuid].server !== game_server.alias
        )
          break;

        const user = connected_clients[uuid].user;
        user.xp = decoder.ReadFloat64();
        user.petals = {};
        user.failed_crafts = {};

        let id = decoder.ReadUint8();
        while (id) {
          const rarity = decoder.ReadUint8();
          const count = decoder.ReadVarUint();
          user.petals[id + ":" + rarity] = count;
          id = decoder.ReadUint8();
        }

        id = decoder.ReadUint8();
        while (id) {
          const rarity = decoder.ReadUint8();
          const count = decoder.ReadVarUint();
          user.failed_crafts[id + ":" + rarity] = count;
          id = decoder.ReadUint8();
        }

        await write_db_entry(uuid, user);
        break;
      }
      case 3: {
        let petals = {};
        let id = decoder.ReadUint8();
        while (id) {
          let rarity = decoder.ReadUint8();
          petals[`${id}:${rarity}`] ||= 0;
          petals[`${id}:${rarity}`]++;
          id = decoder.ReadUint8();
        }
        break;
      }
      case 101:
        game_server.rivet_server_id = decoder.ReadStringNT();
        log("server id recv", [game_server.rivet_server_id]);
        break;
    }
  });

  log("game connect", [game_server.alias]);
  game_servers[game_server.alias] = game_server;

  const encoder = new protocol.BinaryWriter();
  encoder.WriteUint8(0);
  encoder.WriteStringNT(game_server.alias);
  ws.send(encoder.data.subarray(0, encoder.at));

  ws.on("close", async () => {
    log("game disconnect", [game_server.alias]);
    for (const uuid of game_server.clients) {
      if (
        connected_clients[uuid] &&
        connected_clients[uuid].server === game_server.alias
      )
        await write_db_entry(uuid, connected_clients[uuid].user);
      delete connected_clients[uuid];
    }
    delete game_servers[game_server.alias];
  });
});

const backupDatabase = () => {
  const date = Date.now();
  //const timestamp = date.toISOString().replace(/:/g, '-');
  const backupFilePath = path.join(
    __dirname,
    `./DatabaseBackups/database-${date}.json`
  );

  console.log(`Backing up database to ${backupFilePath}`);
  const databaseData = JSON.stringify(database);
  fs.writeFileSync(backupFilePath, databaseData, "utf8");
};

const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

const purgeOldBackups = () => {
  const backupDirPath = path.join(__dirname, "DatabaseBackups");
  const files = fs.readdirSync(backupDirPath);
  //const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);

  files.forEach((file) => {
    const filePath = path.join(backupDirPath, file);
    const stats = fs.statSync(filePath);
    const fileCreationTime = new Date(stats.ctime).getTime();

    if (fileCreationTime < twoDaysAgo) {
      console.log(`Deleting old backup: ${file}`);
      fs.unlinkSync(filePath);
    }
  });
};

let quit = false;
const try_save_exit = () => {
  if (!quit) {
    quit = true;
    saveDatabaseToFile();
  }
  process.exit();
};

for (const error of [
  "beforeExit",
  "exit",
  "SIGTERM",
  "SIGINT",
  "uncaughtException",
])
  process.on(error, (args) => {
    console.log(error, args);
    try_save_exit();
  });

//setInterval(backupDatabase, 60e3 * 5);
//setInterval(purgeOldBackups);
setInterval(saveDatabaseToFile, 10000);
setInterval(() => {
  log("player count", [Object.keys(connected_clients).length]);
}, 15000);
