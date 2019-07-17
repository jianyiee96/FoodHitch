// Telegram bot library for node.js
var TelegramBot = require('node-telegram-bot-api');
var mysql = require('mysql');

//Database connection
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "foodhitch88",
    dateStrings: true
});

// Food Hitch
var token = '840173157:AAG6AkTgKONfFA8bZIiFZsIOs3CWeN23mDc';

// Food Hitch (Wee Keat's)
// const token = '820547613:AAHrmNtJ3xBKhbAOGCQfbF1QCnWGYX2_Pgs';

// Run our bot on local
var bot = new TelegramBot(token, { polling: true });

// When a user first users this bot, it will prompt the user to start the registration process. (maybe could make "delete" as a new function, then add a new command called /delete)
// refine the checking command "/" and NaN
bot.onText(/\/start/, msg => {

    const chatId = msg.chat.id;
    const name = msg.from.first_name;
    const username = msg.from.username;
    var number = 'Default';

    con.connect(function (err) {
        var checkRegistration = `SELECT * FROM foodhitch.user WHERE iduser = '${chatId}'`;
        // to check if a user has already registered before.
        con.query(checkRegistration, function (err, result) {
            if (result.length == 0) { //User is new (not in database)
                bot.sendMessage(chatId, "Welcome " + name + ". Please proceed with the registration...");
                setTimeout(function () { }, 1000);
                bot.sendMessage(chatId, 'What is your contact number? (Please do not put any special characters)');
                bot.once('message', msg => {
                    number = parseInt(msg.text.toString());
                    if (isNaN(number)) {
                        bot.sendMessage(chatId, "Sorry, the number input is invalid. Please try again! /start.");
                    } else {
                        number += "";
                        if (number.indexOf('/') < 0) {
                            residentialAddress(chatId, function (address) {
                                if (number != 'Default') { //input validation
                                    // Inserting into database.
                                    con.connect(function (err) {
                                        const sql = "INSERT INTO foodhitch.user (iduser, name, number, address, telegram) VALUES (" +
                                            chatId + ", '" + name + "', '" + number + "', '" + address + "','" + username + "')";
                                        con.query(sql, function (err, result) {
                                            if (err) {
                                                bot.sendMessage(chatId, "Error!! Try again /start");
                                            } else {
                                                bot.sendMessage(chatId, "Registration Successful!!");
                                                setTimeout(function () { }, 1000);
                                                bot.sendMessage(chatId, `Your information is registered as follows:\n<b>Telegram Username:</b> ${username}\n<b>Name:</b> ${name}\n<b>Number:</b> ${number}\n<b>Residential Hall:</b> ${address}`,
                                                    { parse_mode: "HTML" });
                                            }
                                        });
                                    });
                                } else {
                                    bot.sendMessage(chatId, "Please try again and follow the instructions! /start");
                                }
                            });
                        } else {
                            console.log("Exited start function due to '/' detected.");
                        }
                    }
                });
            } else { // user has already registered before.
                bot.sendMessage(chatId, "You have registered before. What would you like to do?", {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Delete Account",
                                    callback_data: "delete"
                                },
                                {
                                    text: "Update Account",
                                    callback_data: "update"
                                }
                            ]
                        ]
                    }
                })

                bot.once("callback_query", callbackQuery => {
                    console.log(callbackQuery);
                    const msg = callbackQuery.message;
                    const chatId = msg.chat.id;
                    const data = callbackQuery.data;
                    if (data === 'delete') {
                        bot.answerCallbackQuery(callbackQuery.id)
                            .then(() => {
                                var deleteSQL = `DELETE FROM foodhitch.user WHERE iduser = '${chatId}'`;
                                con.query(deleteSQL, function (err, result) {
                                    if (err) {
                                        bot.sendMessage(chatId, "Error!! Try again /start");
                                        throw err;
                                    } else {
                                        bot.sendMessage(chatId, "Account deleted successfully!");
                                    }
                                })

                            })
                    } else if (data === 'update') {
                        bot.answerCallbackQuery(callbackQuery.id)
                            .then(() => updateAccount(chatId));
                    }
                })
            }
        });
    });
});

// to update account credentials
bot.onText(/\/update/, msg => {
    const chatId = msg.chat.id;
    updateAccount(chatId);
});

// When a user wants to host a deliver order, "/host" will prompt the user to input relevant details.
bot.onText(/\/host/, msg => {

    const chatId = msg.chat.id;
    var orderFrom = 'Default';
    var orderTime = 'Default';
    var pickuUp = 'Default';

    //Checks if the user is currently hosting..
    con.connect(function (err) {
        var checkRegistration = `SELECT * FROM foodhitch.user WHERE iduser = '${chatId}'`;
        con.query(checkRegistration, function (err, result) {
            if (err) {
                bot.sendMessage(chatId, "You have not registered. Please register using /start");
            } else {
                var sql = "SELECT * FROM foodhitch.order JOIN foodhitch.user ON foodhitch.user.iduser = foodhitch.order.userid WHERE status = '0' AND userid = '" + chatId + "';";
                con.query(sql, function (err, result) {
                    if (err) {
                        bot.sendMessage(chatId, "Error!! Try again /host");
                        throw err;
                    } else {
                        if (result.length != 0) {
                            //If hosting already...
                            const currentHostId = result[0].id;
                            const currentHostName = result[0].name;

                            var view = "Hitch foodies for your current host: \nOrder id: " + result[0].id + "\nOdering: " + result[0].company + "\n" + result[0].time + " @ " + result[0].pickup + "\n\n";

                            const hostInfo = "Order id: " + result[0].id + "\nOrdering: " + result[0].company + "\n" + result[0].time + " @ " + result[0].pickup + "\n";

                            bot.sendMessage(chatId, 'You have an existing host: \n' + hostInfo + "What would you like to do?", {
                                reply_markup: JSON.stringify({
                                    keyboard: [
                                        ['Update status: Completed'],
                                        ['Update status: Cancel'],
                                        ['View joins'],
                                        ['Broadcast message'],
                                        ['Do nothing']
                                    ],
                                    resize_keyboard: true,
                                    one_time_keyboard: true
                                })
                            }).then(msg => {
                                bot.once('message', msg => {
                                    const hostResponseString = msg.text.toString().toLowerCase();
                                    var hostResponse;
                                    if (hostResponseString === 'do nothing') hostResponse = '1';
                                    if (hostResponseString === 'update status: completed') hostResponse = '2';
                                    if (hostResponseString === 'update status: cancel') hostResponse = '3';
                                    if (hostResponseString === 'view joins') hostResponse = '4';
                                    if (hostResponseString === 'broadcast message') hostResponse = '5';
                                    if (hostResponse.indexOf('/') < 0) { //Command check
                                        if (!(hostResponse === '1' || hostResponse === '2' || hostResponse === '3' || hostResponse === '4' || hostResponse === '5')) {
                                            bot.sendMessage(chatId, 'Invalid response');
                                        } else if (hostResponse === '1') {
                                            bot.sendMessage(chatId, 'Doing nothing');
                                        } else if (hostResponse === '5') {
                                            bot.sendMessage(chatId, "Please send the message that you would like to broadcast to your hitch foodies:")
                                                .then(msg => {
                                                    bot.once('message', msg => {
                                                        const broadcast = msg.text.toString();
                                                        if (broadcast.indexOf('/') < 0) {
                                                            // console.log(broadcast);
                                                            var sql = "SELECT * FROM foodhitch.joinhost JOIN foodhitch.user ON foodhitch.user.iduser = foodhitch.joinhost.joinerId WHERE foodhitch.joinhost.status = '1' AND orderId = '" + currentHostId + "'";
                                                            con.query(sql, function (err, result) {
                                                                if (err) {
                                                                    bot.sendMessage(chatId, "Error!! Try again /host");
                                                                    throw err;
                                                                } else {
                                                                    // console.log("Number of joins to be broadcasted to: " + result.length);
                                                                    // console.log(result);
                                                                    for (x = 0; x < result.length; x++) {
                                                                        bot.sendMessage(result[x].joinerId, "===Broadcast===\n" + hostInfo + "\n==============\n" + currentHostName + ":\n " + broadcast);
                                                                    }
                                                                }
                                                            });
                                                        } else {
                                                            console.log("Exited hosting function due to '/' detected.");
                                                        }
                                                    });
                                                });
                                        } else if (hostResponse === '4') {
                                            var sql = "SELECT * FROM foodhitch.joinhost JOIN foodhitch.user ON foodhitch.user.iduser = foodhitch.joinhost.joinerId WHERE status != '2' AND orderId = '" + currentHostId + "'";
                                            con.query(sql, function (err, result) {
                                                if (err) {
                                                    bot.sendMessage(chatId, "Error!! Try again /host");
                                                    throw err;
                                                } else {
                                                    // console.log("Number of joins: " + result.length);
                                                    // console.log(result);
                                                    view = view + "Number of joins: " + result.length + "\n";
                                                    for (x = 0; x < result.length; x++) {
                                                        view = view + "\n" + (x + 1) + ": " + result[x].name + "\nNumber: " + result[x].number + "\nOrder request: " + result[x].request + "\nStatus: ";
                                                        if (result[x].status == 0) {
                                                            view = view + "Pending" + "\nConfirmation code: " + result[x].code + "\n\n";
                                                        } else {
                                                            view = view + "Accepted\n\n";
                                                        }
                                                    }
                                                    bot.sendMessage(chatId, view);
                                                }
                                            });
                                        } else {
                                            con.connect(function (err) {
                                                var sql = "UPDATE foodhitch.order SET status ='" + hostResponse + "' WHERE userid = '" + chatId + "' AND status = '0'";
                                                con.query(sql, function (err, result) {
                                                    if (err) {
                                                        bot.sendMessage(chatId, "Error!! Try again /host");
                                                        throw err;
                                                    } else {
                                                        bot.sendMessage(chatId, "Update Success!!");
                                                        var sql = "SELECT * FROM foodhitch.joinhost JOIN foodhitch.user ON foodhitch.user.iduser = foodhitch.joinhost.joinerId WHERE foodhitch.joinhost.status = '1' AND orderId = '" + currentHostId + "'";
                                                        con.query(sql, function (err, result) {
                                                            if (err) {
                                                                bot.sendMessage(chatId, "Error!! Try again /host");
                                                                throw err;
                                                            } else {
                                                                // console.log("Number of joins to be broadcasted to: " + result.length);
                                                                // console.log(result);
                                                                var status = "";
                                                                if (hostResponse === '2') {
                                                                    status = 'The host has set this order as completed!';
                                                                } else if (hostResponse === '3') {
                                                                    status = 'The host has cancelled this order!';
                                                                }
                                                                for (x = 0; x < result.length; x++) {
                                                                    bot.sendMessage(result[x].joinerId, "===Broadcast===\n" + hostInfo + "\n==============\n\n" + status);
                                                                }
                                                            }
                                                        });
                                                    }
                                                });
                                            });
                                        }
                                    } else {
                                        console.log("Exited hosting function due to '/' detected.");
                                    }
                                });
                            });
                        } else {
                            //If he is not hosting...
                            bot.sendMessage(chatId, 'Do you want to host a delivery order?', {
                                reply_markup: JSON.stringify({
                                    keyboard: [['YES', 'NO']],
                                    resize_keyboard: true,
                                    one_time_keyboard: true
                                })
                            }).then(msg => {
                                bot.once('message', msg => {
                                    const response = msg.text.toString().toLowerCase();
                                    if (response.indexOf('/') < 0) { //Command check
                                        if (response === 'yes') {
                                            bot.sendMessage(chatId, "Hosting a delivery order...\n" + "What are you ordering? (Eg. Macdonalds)")
                                                .then(msg => {
                                                    bot.once('message', msg => {
                                                        orderFrom = msg.text.toString();
                                                        if (orderFrom.indexOf('/') < 0) { //Command check
                                                            bot.sendMessage(chatId, "Ordering: " + orderFrom);
                                                            setTimeout(function () { }, 500);
                                                            bot.sendMessage(chatId, "How many hours later do you plan to order your food?", {
                                                                reply_markup: JSON.stringify({
                                                                    keyboard:
                                                                        [
                                                                            ['1', '2', '3'],
                                                                            ['4', '5', '6']
                                                                        ],
                                                                    resize_keyboard: true,
                                                                    one_time_keyboard: true
                                                                })
                                                            }).then(msg => {
                                                                bot.once('message', msg => {
                                                                    orderTime = msg.text.toString();
                                                                    if (orderTime.indexOf('/') < 0) { //Command check
                                                                        if (!(orderTime <= 6 && orderTime >= 1)) {
                                                                            bot.sendMessage(chatId, "Invalid hour! Bye..");
                                                                        } else { //need to fix cases where hour exceeds 24.
                                                                            var today = new Date();
                                                                            today.setHours(today.getHours() + parseInt(orderTime));
                                                                            var date = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
                                                                            var time = pad(today.getHours()) + ":" + pad(today.getMinutes()) + ":" + pad(today.getSeconds());
                                                                            var dateTime = date + ' ' + time;
                                                                            bot.sendMessage(chatId, "You shall order " + orderFrom + " at around: \n" + dateTime);
                                                                            bot.sendMessage(chatId, "Describe your intended pickup location: ")
                                                                                .then(msg => {
                                                                                    bot.once('message', msg => {
                                                                                        pickUp = msg.text.toString();
                                                                                        if (pickUp.indexOf('/') < 0) { //Command check
                                                                                            bot.sendMessage(chatId, "Hosting order...\n\nOrdering from: " + orderFrom + "\nOrder time: " + dateTime + "\nPick up location: " + pickUp + "\n");
                                                                                            con.connect(function (err) {
                                                                                                var sql = "INSERT INTO foodhitch.order (userid, company, time, pickup) VALUES (" + chatId + ", '" + orderFrom + "', '" + dateTime + "', '" + pickUp + "')";
                                                                                                con.query(sql, function (err, result) {
                                                                                                    if (err) {
                                                                                                        bot.sendMessage(chatId, "Error!! Try again /host");
                                                                                                        throw err;
                                                                                                    } else {
                                                                                                        bot.sendMessage(chatId, "Success!!");
                                                                                                    }
                                                                                                });
                                                                                            });
                                                                                        } else {
                                                                                            console.log("Exited hosting function due to '/' detected.");
                                                                                        }
                                                                                    })
                                                                                })
                                                                        }
                                                                    } else {
                                                                        console.log("Exited hosting function due to '/' detected.");
                                                                    }
                                                                });
                                                            });
                                                        } else {
                                                            console.log("Exited hosting function due to '/' detected.");
                                                        }
                                                    });
                                                });
                                        } else if (response === 'no') {
                                            bot.sendMessage(chatId, "Ok not hosting.. Bye...")
                                        } else {
                                            bot.sendMessage(chatId, "Sorry, invalid command! Bye...");
                                        }
                                    } else {
                                        console.log("Exited hosting function due to '/' detected.");
                                    }
                                });
                            });
                        }
                    }
                });
            }
        })
    });
});

bot.onText(/\/search/, msg => {

    const chatId = msg.chat.id;

    var today = new Date();
    var date = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    var time = pad(today.getHours()) + ":" + pad(today.getMinutes()) + ":" + pad(today.getSeconds());
    var dateTime = date + ' ' + time;

    con.connect(function (err) {
        var sql = "SELECT foodhitch.user.name, foodhitch.user.address, foodhitch.order.id, foodhitch.order.company, foodhitch.order.time, foodhitch.order.pickup FROM foodhitch.order JOIN foodhitch.user ON user.iduser=order.userid WHERE status = '0'  AND order.userid != '" + chatId + "' AND time > '" + dateTime + "'";
        con.query(sql, function (err, result) {
            if (err) {
                bot.sendMessage(chatId, "Error!! Try again /host");
                throw err;
            } else {
                if (result.length == 0) {
                    bot.sendMessage(chatId, "There is no existing host!");
                } else {
                    var list = "";
                    for (i = 0; i < result.length; i++) {
                        list = list + "Order ID: " + result[i].id + "\nType of Food: " + result[i].company + "\nDate: " + result[i].time.split(" ")[0] + "\nExpected ordering time: " + result[i].time.split(" ")[1] + "\nPick up location: " + result[i].pickup + "\n\n";
                        //list = list + result[i].id + ": " + result[i].company + "(" + result[i].address + ")\n" + result[i].time + " @ " + result[i].pickup + "\n\n";
                    }
                    bot.sendMessage(chatId, "===Existing Order Groups===\n\n" + list + "====================");
                }
            }
        });
    });
});

bot.onText(/\/join/, msg => {

    const chatId = msg.chat.id;

    var today = new Date();
    var date = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    var time = pad(today.getHours()) + ":" + pad(today.getMinutes()) + ":" + pad(today.getSeconds());
    var dateTime = date + ' ' + time;

    var currentJoin = "Order group(s) that you have joined: \n\n";
    var sql = "SELECT *, joinhost.status AS joinhostStatus  FROM foodhitch.joinhost JOIN foodhitch.order ON joinhost.orderid = order.id WHERE  order.status = '0' AND joinhost.joinerid = '" + chatId + "' AND order.time > '" + dateTime + "'";

    con.query(sql, function (err, result) {
        if (err) {
            bot.sendMessage(chatId, "Error!! Try again /join");
            throw err;
        } else {
            // console.log(result.length);
            // console.log(result);
            for (x = 0; x < result.length; x++) {
                var status = 'pending';
                if (result[x].joinhostStatus == '1') {
                    status = 'accepted';
                } else if (result[x].joinhostStatus == '2') {
                    status = 'declined';
                }
                currentJoin = currentJoin + result[x].company + " @ " + result[x].time + "\nYour request: " + result[x].request + "\nStatus: " + status + "\n\n";
            }
            //Here
            bot.sendMessage(chatId, currentJoin + "Please input the id of hosted order that you are joining.\nYou can use the /search command to obtain it.\n\n")
                .then(msg => {
                    bot.once('message', msg => {
                        var joinid = msg.text.toString();
                        if (joinid.indexOf('/') < 0) { //Command check
                            var sql = "SELECT foodhitch.user.iduser, foodhitch.user.name, foodhitch.user.address, foodhitch.user.telegram, foodhitch.user.number , foodhitch.order.id, foodhitch.order.company, foodhitch.order.time, foodhitch.order.pickup FROM foodhitch.order JOIN foodhitch.user ON user.iduser=order.userid WHERE status = '0' AND order.userid != '" + chatId + "' AND time > '" + dateTime + "'";
                            con.query(sql, function (err, result) {
                                if (err) {
                                    bot.sendMessage(chatId, "Error!! Try again /join");
                                } else {
                                    var found = '0';
                                    // console.log(result);
                                    for (i = 0; i < result.length; i++) {
                                        if (result[i].id == joinid) {
                                            const joiningOrderId = result[i].id;
                                            const hostingCompany = result[i].company;
                                            const hostName = result[i].name;
                                            const hostNumber = result[i].number;
                                            const hostTelegram = result[i].telegram;
                                            const hostHall = result[i].address;
                                            const hostId = result[i].iduser;

                                            if (hostTelegram == 'undefined') {
                                                bot.sendMessage(chatId, "Success! Retrieving information...\n\nOrder " + joiningOrderId + ": " + hostingCompany + "(" + hostHall + ")\n" + result[i].time + " @ " + result[i].pickup + "\n\nHost name: " + hostName + "\nContact: " + hostNumber + "\nHall: " + hostHall);
                                            } else {
                                                bot.sendMessage(chatId, "Success! Retrieving information...\n\nOrder " + joiningOrderId + ": " + hostingCompany + "(" + hostHall + ")\n" + result[i].time + " @ " + result[i].pickup + "\n\nHost name: " + hostName + "\nContact: " + hostNumber + "\nTelegram id: @" + hostTelegram + "\nHall: " + hostHall);
                                            }
                                            const orderHostInfo = "Order " + joiningOrderId + ": " + hostingCompany + "(" + hostHall + ")\n" + result[i].time + " @ " + result[i].pickup;

                                            var joinerName = "";
                                            var joinerNumber = "";
                                            var joinerTelegram = "";
                                            var joinerHall = "";
                                            const joinerId = chatId;
                                            const confirmationCode = makeid(4);

                                            var sql = "SELECT * FROM foodhitch.joinhost WHERE orderId = '" + result[i].id + "' AND status != '2' AND joinerId = '" + chatId + "'";
                                            con.query(sql, function (err, result) {
                                                if (err) {
                                                    bot.sendMessage(chatId, "Error!! Try again /host");
                                                    throw err;
                                                } else {
                                                    if (result.length == 0) {
                                                        bot.sendMessage(chatId, "Please type down your order. Be specific and clear or else the host might not accept your join request!")
                                                            .then(msg => {
                                                                bot.once('message', msg => {
                                                                    request = msg.text.toString();
                                                                    
                                                                    if (request.indexOf('/') < 0) { //Command check
                                                                        console.log("Request: " + request);
                                                                        var sql = "SELECT * FROM foodhitch.user WHERE iduser = '" + chatId + "'";
                                                                        con.query(sql, function (err, result) {
                                                                            if (err) {
                                                                                bot.sendMessage(chatId, "Error!! Try again /host");
                                                                                throw err;
                                                                            } else {
                                                                                // console.log("Joiner's name: " + result[0].name);
                                                                                // console.log("Joiner's contact " + result[0].number);
                                                                                // console.log("Joiner's telegram: " + result[0].telegram);
                                                                                // console.log("Joiner's hall: " + result[0].address);
                                                                                joinerName = result[0].name;
                                                                                joinerNumber = result[0].number;
                                                                                joinerTelegram = result[0].telegram;
                                                                                if (joinerTelegram == 'undefined') {
                                                                                    joinerTelegram = '';
                                                                                }
                                                                                joinerHall = result[0].address;
                                                                                bot.sendMessage(chatId, "===New join request===\n\nJoining host:\n" + orderHostInfo + "\n\nJoiner's name: " + joinerName + "\nJoiner's number: " + joinerNumber + "\nJoiner's telegram: @" +
                                                                                    joinerTelegram + "\nJoiner's hall: " + joinerHall + "\n\nRequest: " + request + "\n===End of request===\n\nConfirm send request to host?\n\nNote: You won't be able to change your join request upon sending it!!", {
                                                                                        reply_markup: JSON.stringify({
                                                                                            keyboard: [['YES', 'NO']],
                                                                                            resize_keyboard: true,
                                                                                            one_time_keyboard: true
                                                                                        })
                                                                                    }).then(msg => {
                                                                                        bot.once('message', msg => {
                                                                                            const response = msg.text.toString().toLowerCase();
                                                                                            if (response.indexOf('/') < 0) { //Command check
                                                                                                if (response.indexOf('yes') === 0) {
                                                                                                    con.connect(function (err) {
                                                                                                        var sql = "INSERT INTO foodhitch.joinhost (joinerid, hostid, request, orderid, status, code) VALUES ('" + joinerId + "','" + hostId + "','" + request + "','" + joiningOrderId + "','0','" + confirmationCode + "')";
                                                                                                        con.query(sql, function (err, result) {
                                                                                                            if (err) {
                                                                                                                bot.sendMessage(chatId, "Error occurred! Please try again!");
                                                                                                            } else {
                                                                                                                bot.sendMessage(chatId, "Sent request! Please wait for the host to get back to you :)");
                                                                                                                bot.sendMessage(hostId, "===New join request===\n\nYour host:\n" + orderHostInfo + "\n\nJoiner's name: " + joinerName + "\nJoiner's number: " + joinerNumber + "\nJoiner's telegram: @" +
                                                                                                                    joinerTelegram + "\nJoiner's hall: " + joinerHall + "\n\nRequest: " + request + "\n===End of request===\n\nUse /accept and enter confirmation code to accept join request.\nUse /decline and enter confirmation code to decline join request.\nConfirmation code: " + confirmationCode);
                                                                                                                // console.log("1 record (joinhost) inserted");
                                                                                                            }
                                                                                                        });
                                                                                                    });
                                                                                                } else if (response.indexOf('no') === 0) {
                                                                                                    bot.sendMessage(chatId, "Ok not joining...Bye...")
                                                                                                } else {
                                                                                                    bot.sendMessage(chatId, "Sorry, invalid command! Bye...");
                                                                                                }
                                                                                            } else {
                                                                                                console.log("Exited function due to '/' detected.");
                                                                                            }
                                                                                        });
                                                                                    });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        console.log("Exited function due to '/' detected.");
                                                                    }
                                                                });
                                                            });
                                                    } else {
                                                        bot.sendMessage(chatId, "You have requested/joined this order!");
                                                    }
                                                }
                                            });
                                            found = 1;
                                        }
                                    }
                                    if (found == '0') {
                                        bot.sendMessage(chatId, "Failed. Unable to find id, try again /join");
                                    }
                                }
                            });
                        } else {
                            console.log("Exited function due to '/' detected.");
                        }
                    });
                });
        }
    });
});

// to accept a join request using confirmation code
bot.onText(/\/accept/, msg => {

    const chatId = msg.chat.id;
    acceptJoin(chatId);

});

// to decline a join request using confirmation code 

bot.onText(/\/decline/, msg => {

    const chatId = msg.chat.id;
    declineJoin(chatId);

});


// To terminate current operation. (Un completed)
bot.onText(/\/cancel/, msg => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Current operation is terminated!");
});


// User accepting a join request.
function acceptJoin(chatId) {

    bot.sendMessage(chatId, '=== Accepting Join Request ===\nPlease enter confirmation code: ')
    .then(msg => {
        bot.once('message', msg => {
            code = msg.text;

            if (code.indexOf('/') < 0) { //Command check

                con.connect(function (err) {

                    var sql = "SELECT * FROM foodhitch.joinhost WHERE status = '0' AND code = '" + code + "' AND hostId = '" + chatId + "'";
                    con.query(sql, function (err, result) {
                        if (err) {
                            bot.sendMessage(chatId, "Error!! Try again /accept");
                            throw err;
                        } else {
                            if (result.length == 0) {
                                bot.sendMessage(chatId, "Invalid confirmation code!");
                            } else {

                                con.connect(function (err) { //accept

                                    var sql = "UPDATE foodhitch.joinhost SET status ='1' WHERE code = '" + code + "' AND status = '0'";
                                    con.query(sql, function (err, result) {
                                        if (err) {
                                            bot.sendMessage(chatId, "Error!! Try again /accept");
                                            throw err;
                                        } else {

                                            var sql = "SELECT * FROM foodhitch.joinhost WHERE code = '" + code + "'";
                                            con.query(sql, function (err, result) {
                                                if (err) {
                                                    bot.sendMessage(chatId, "Error!! Try again /accept");
                                                    throw err;
                                                } else {

                                                    const orderId = result[0].orderId;
                                                    const request = result[0].request;
                                                    const joinerId = result[0].joinerId;

                                                    var sql = "SELECT * FROM foodhitch.order WHERE id = '" + orderId + "'";
                                                    con.query(sql, function (err, result) {
                                                        if (err) {
                                                            bot.sendMessage(chatId, "Error!! Try again /accept");
                                                        } else {


                                                            const orderInfo = "Order id: " + result[0].id + " | " + result[0].company + "\n" + result[0].time + " @ " + result[0].pickup
                                                            bot.sendMessage(chatId, "Accepted join request!");
                                                            bot.sendMessage(joinerId, "YOU JOIN REQUEST WAS ACCEPTED! \n\n" + orderInfo + " \n\nRequest: " + request);
                                                            
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                });
                                
                            }
                        }
                    });
                });
            } else {
                console.log("Exited function due to '/' detected.");
            }
        });
    });
}

function declineJoin(chatId) {
    bot.sendMessage(chatId, '=== Declining Join Request ===\nPlease enter confirmation code: ')
    .then(msg => {
        bot.once('message', msg => {
            code = msg.text;
            
            console.log("Message: "+msg.text);
            console.log("Current user id: "+chatId);
            console.log("Message Chat id "+ msg.chat.id);

            if (code.indexOf('/') < 0) { //Command check

                con.connect(function (err) {

                    var sql = "SELECT * FROM foodhitch.joinhost WHERE status = '0' AND code = '" + code + "' AND hostId = '" + chatId + "'";
                    con.query(sql, function (err, result) {
                        if (err) {
                            bot.sendMessage(chatId, "Error!! Try again /decline");
                            throw err;
                        } else {
                            if (result.length == 0) {
                                bot.sendMessage(chatId, "Invalid confirmation code!");
                            } else {

                                con.connect(function (err) { //decline

                                    var sql = "UPDATE foodhitch.joinhost SET status ='2' WHERE code = '" + code + "' AND status = '0'";
                                    con.query(sql, function (err, result) {
                                        if (err) {
                                            bot.sendMessage(chatId, "Error!! Try again /decline");
                                            throw err;
                                        } else {

                                            var sql = "SELECT * FROM foodhitch.joinhost WHERE code = '" + code + "'";
                                            con.query(sql, function (err, result) {
                                                if (err) {
                                                    bot.sendMessage(chatId, "Error!! Try again  /decline");
                                                    throw err;
                                                } else {

                                                    const orderId = result[0].orderId;
                                                    const request = result[0].request;
                                                    const joinerId = result[0].joinerId;

                                                    var sql = "SELECT * FROM foodhitch.order WHERE id = '" + orderId + "'";
                                                    con.query(sql, function (err, result) {
                                                        if (err) {
                                                            bot.sendMessage(chatId, "Error!! Try again /decline");
                                                        } else {


                                                            const orderInfo = "Order id: " + result[0].id + " | " + result[0].company + "\n" + result[0].time + " @ " + result[0].pickup
                                                            bot.sendMessage(chatId, "Declined join request!");
                                                            bot.sendMessage(joinerId, "YOU JOIN REQUEST WAS DECLINED! \n\n" + orderInfo + " \n\nRequest: " + request);
                                                            
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                });
                                
                            }
                        }
                    });
                });
            } else {
                console.log("Exited function due to '/' detected in decline.");
            }
        });
    });
}


// to update account
function updateAccount(chatId) {
    con.connect(function (err) {
        var retrieveAccount = `SELECT * FROM foodhitch.user WHERE iduser = '${chatId}'`;

        con.query(retrieveAccount, function (err, result) {
            var name = result[0].name;
            var number = result[0].number;
            var address = result[0].address;
            var telegramId = result[0].telegram;
            bot.sendMessage(chatId, `Your registered information is as follows:\n<b>Telegram Username:</b> ${telegramId}\n<b>Name:</b> ${name}\n<b>Number:</b> ${number}\n<b>Residential Hall:</b> ${address}`,
                { parse_mode: "HTML" });
            bot.sendMessage(chatId, "Which field would you like to update?", {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Name",
                                callback_data: "name"
                            },
                            {
                                text: "Number",
                                callback_data: "number"
                            }

                        ],
                        [
                            {
                                text: "Residential Hall",
                                callback_data: "address"
                            },
                            {
                                text: "Telegram Username",
                                callback_data: "telegram"
                            }
                        ],
                        // [
                        //     {
                        //         text: "All",
                        //         callback_data: "all"
                        //     }
                        // ]
                    ]
                }
            });
            bot.once("callback_query", callbackQuery => {
                const chatId = callbackQuery.message.chat.id;
                const data = callbackQuery.data;
                // console.log(data);
                if (data === 'name') {
                    bot.answerCallbackQuery(callbackQuery.id)
                        .then(() => {
                            var firstName = callbackQuery.message.chat.first_name;
                            var lastName = callbackQuery.message.chat.last_name;
                            name = firstName;
                            if (lastName != undefined) name += ` ${lastName}`;

                            var updateSQL = `UPDATE foodhitch.user SET name = '${name}' WHERE iduser = '${chatId}'`;

                            con.query(updateSQL, function (err, result) {
                                if (err) {
                                    bot.sendMessage(chatId, "Error!! Try again /start");
                                    throw err;
                                } else {
                                    bot.sendMessage(chatId, `Your name has been updated successfully to: <b>${name}</b>!`, { parse_mode: "HTML" });
                                }
                            });
                        });
                } else if (data === 'number') {
                    bot.answerCallbackQuery(callbackQuery.id)
                        .then(() => {
                            bot.sendMessage(chatId, "Please key in your new number (Please do not put any special characters).");

                            bot.once('message', msg => {
                                number = parseInt(msg.text.toString());
                                if (isNaN(number)) {
                                    bot.sendMessage(chatId, "Sorry, the number input is invalid. Please try again! /update.");
                                } else {
                                    var updateSQL = `UPDATE foodhitch.user SET number = '${number}' WHERE iduser = '${chatId}'`;

                                    con.query(updateSQL, function (err, result) {
                                        if (err) {
                                            bot.sendMessage(chatId, "Error!! Try again /start");
                                            throw err;
                                        } else {
                                            bot.sendMessage(chatId, `Your number has been updated successfully to: <b>${number}</b>!`, { parse_mode: "HTML" });
                                        }
                                    });
                                }
                            })
                        });
                } else if (data === 'address') {
                    // passing in a callback function to further continue only when an input is given.
                    residentialAddress(chatId, function (newAddress) {
                        bot.answerCallbackQuery(callbackQuery.id)
                            .then(() => {
                                address = newAddress;
                                var updateSQL = `UPDATE foodhitch.user SET address = '${address}' WHERE iduser = '${chatId}'`;

                                con.query(updateSQL, function (err, result) {
                                    if (err) {
                                        bot.sendMessage(chatId, "Error!! Try again /start");
                                        throw err;
                                    } else {
                                        bot.sendMessage(chatId, `Your residential hall has been updated successfully to: <b>${address}</b>!`, { parse_mode: "HTML" });
                                    }
                                });
                            })
                    })
                } else if (data === 'telegram') {
                    bot.answerCallbackQuery(callbackQuery.id)
                        .then(() => {
                            var telegramId = callbackQuery.message.chat.username;

                            var updateSQL = `UPDATE foodhitch.user SET telegram = '${telegramId}' WHERE iduser = '${chatId}'`;

                            con.query(updateSQL, function (err, result) {
                                if (err) {
                                    bot.sendMessage(chatId, "Error!! Try again /start");
                                    throw err;
                                } else {
                                    bot.sendMessage(chatId, `Your telegram username has been updated successfully to: <b>${telegramId}</b>!`, { parse_mode: "HTML" });
                                }
                            });
                        });
                }
            });
        });
    })
}

// to choose residential hall
function residentialAddress(chatId, callback) {
    bot.sendMessage(chatId, 'Please choose your hall of residence.', {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Eusoff", callback_data: "Eusoff" }, { text: "Kent Ridge", callback_data: "Kent Ridge" }],
                [{ text: "King Edward VII", callback_data: "KE7" }, { text: "Prince George's Park", callback_data: "PGP" }],
                [{ text: "Raffles", callback_data: "Raffles" }, { text: "Sheares", callback_data: "Sheares" }],
                [{ text: "Temasek", callback_data: "Temasek" }, { text: "Others", callback_data: "Others" }]
            ]
        }
    })
    bot.once("callback_query", callbackQuery => {
        return callback(callbackQuery.data);
    });
}

// padding
function pad(num) {
    var size = 2;
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

// to make confirmation code
function makeid(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
