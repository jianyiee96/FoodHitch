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
// var token = '840173157:AAG6AkTgKONfFA8bZIiFZsIOs3CWeN23mDc';

// Food Hitch (Wee Keat's)
const token = '820547613:AAHrmNtJ3xBKhbAOGCQfbF1QCnWGYX2_Pgs';

// Run our bot on local
var bot = new TelegramBot(token, { polling: true });

// When a user first users this bot, it will prompt the user to start the registration process. (maybe could make "delete" as a new function, then add a new command called /delete)
// refine the checking command "/" and NaN
bot.onText(/\/start/, msg => {

    const chatId = msg.from.id;
    const groupId = msg.chat.id;
    const name = msg.from.first_name;
    const username = msg.from.username;
    var number = 'Default';

    if (msg.chat.type == 'group') {
        bot.sendMessage(groupId, "I am not supposed to be here...Bye!")
        bot.leaveChat(groupId);
    } else {
        isHosting(chatId, function (bol) {
            console.log(bol);

            if (bol) {
                bot.sendMessage(chatId, "You are currently hosting an order! You can only update/delete your information when you are not hosting!");
            } else {

                var isJoin = isJoining(chatId, function (bol1) {
                    // console.log(bol1);

                    if (bol1) {
                        bot.sendMessage(chatId, "You have an accepted/pending join request!\nYou can only update/delete your information when you do not have an accepted/pending join request!");
                    } else {
                        con.connect(function (err) {
                            var checkRegistration = `SELECT * FROM foodhitch.user WHERE iduser = '${chatId}'`;
                            // to check if a user has already registered before.
                            con.query(checkRegistration, function (err, result) {
                                if (result.length == 0) { //User is new (not in database)
                                    bot.sendMessage(chatId, "Welcome " + name + ". Please proceed with the registration...");
                                    setTimeout(function () { }, 1000);
                                    bot.sendMessage(chatId, 'What is your contact number? (Please do not put any special characters)');
                                    bot.once('message', msg => {
                                        // number = parseInt(msg.text.toString());
                                        number = msg.text.toString();
                                        console.log(number);
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
                    }
                });
            }
        });
    }
});

// to update account credentials
bot.onText(/\/update/, msg => {

    const chatId = msg.from.id;
    const groupId = msg.chat.id;

    if (msg.chat.type == 'group') {
        bot.sendMessage(groupId, "I am not supposed to be here...Bye!")
        bot.leaveChat(groupId);
    } else {
        isRegistered(chatId, function (bol2) {
            if (bol2) {
                console.log("Registered");
                //Procees with operation
                isHosting(chatId, function (bol) {
                    console.log(bol);
                    if (bol) {
                        bot.sendMessage(chatId, "You are currently hosting an order! You can only update/delete your information when you are not hosting!");
                    } else {
                        isJoining(chatId, function (bol1) {
                            console.log(bol1);

                            if (bol1) {
                                bot.sendMessage(chatId, "You have an accepted/pending join request!\nYou can only update/delete your information when you do not have an accepted/pending join request!");
                            } else {
                                //do Stuffs
                                updateAccount(chatId);
                            }
                        });
                    }
                });
            } else {
                console.log("Unregisted");
                bot.sendMessage(chatId, "Your account is not registered! Please register using /start");
            }
        });
    }
});

// When a user wants to host a deliver order, "/host" will prompt the user to input relevant details.
bot.onText(/\/host/, msg => {
    // console.log('ho');
    const chatId = msg.chat.id;

    isRegistered(chatId, function (bo2) {

        if (bo2) {
            // console.log("Registered");
            // Procees with operation
            // Checks if the user is currently hosting..
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
                                    // If hosting already...
                                    currentHosting(chatId, result);
                                } else {
                                    //If he is not hosting...
                                    bot.sendMessage(chatId, 'Do you want to host a delivery order?', {
                                        reply_markup: {
                                            inline_keyboard: [
                                                [
                                                    { text: "Yes", callback_data: 'yes' },
                                                    { text: "No", callback_data: 'no' }
                                                ]
                                            ]
                                        }
                                    });

                                    bot.once('callback_query', callbackQuery => {
                                        const msg = callbackQuery.message;
                                        const chatId = msg.chat.id;
                                        const data = callbackQuery.data;
                                        if (data === 'yes') {
                                            hostAnOrder(chatId, callbackQuery);
                                        } else if (data === 'no') {
                                            bot.sendMessage(chatId, "Ok not hosting...Bye...");
                                        } else {
                                            bot.sendMessage(chatId, "Please try again!! /host");
                                        }
                                    });
                                }
                            }
                        });
                    }
                })
            });

        } else {
            // console.log("Unregisted");
            bot.sendMessage(chatId, "Your account is not registered! Please register using /start");
        }

    });




});

bot.onText(/\/search/, msg => {

    const chatId = msg.from.id;
    const groupId = msg.chat.id;

    if (msg.chat.type == 'group') {
        bot.sendMessage(groupId, "I am not supposed to be here...Bye!")
        bot.leaveChat(groupId);
    } else {
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
                            list = list + "<b>Order ID</b>: " + result[i].id + "\n<b>Ordering</b>: " + result[i].company + "\n<b>Date</b>: " + result[i].time.split(" ")[0] + "\n<b>Expected ordering time</b>: " + result[i].time.split(" ")[1] + "\n<b>Pick up location</b>: " + result[i].pickup + "\n\n";
                            //list = list + result[i].id + ": " + result[i].company + "(" + result[i].address + ")\n" + result[i].time + " @ " + result[i].pickup + "\n\n";
                        }
                        bot.sendMessage(chatId, "===Existing Order Groups===\n\n" + list + "====================", { parse_mode: "HTML" });

                    }
                }
            });
        });
    }
});

bot.onText(/\/join/, msg => {

    const chatId = msg.from.id;
    const groupId = msg.chat.id;

    if (msg.chat.type == 'group') {
        bot.sendMessage(groupId, "I am not supposed to be here...Bye!")
        bot.leaveChat(groupId);
    } else {
        isRegistered(chatId, function (bo2) {

            if (bo2) {
                // console.log("Registered");
                //Procees with operation
                var today = new Date();
                var date = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
                var time = pad(today.getHours()) + ":" + pad(today.getMinutes()) + ":" + pad(today.getSeconds());
                var dateTime = date + ' ' + time;

                var currentJoin = "Order group(s) that you have joined: \n\n";
                var sql = "SELECT *, joinhost.status AS joinhostStatus  FROM foodhitch.joinhost JOIN foodhitch.order ON joinhost.orderid = order.id WHERE  order.status = '0' AND joinhost.joinerid = '" + chatId + "' AND order.time > '" + dateTime + "'";

                con.query(sql, function (err, result) {
                    // console.log(result);
                    if (err) {
                        bot.sendMessage(chatId, "Error!! Try again /join");
                        throw err;
                    } else {
                        for (x = 0; x < result.length; x++) {
                            var status = 'pending';
                            if (result[x].joinhostStatus == '1') {
                                status = 'accepted';
                            } else if (result[x].joinhostStatus == '2') {
                                status = 'declined';
                            }
                            currentJoin = currentJoin + "<b>Order ID</b>: " + result[x].id + "\n<b>Ordering</b>: " + result[x].company + "\n<b>Expected ordering time</b>: " + result[x].time + "\n<b>Your request</b>: " + result[x].request + "\n<b>Status</b>: " + status + "\n\n";
                        }
                        //Here
                        bot.sendMessage(chatId, currentJoin + "Please input the id of hosted order that you are joining.\nYou can use the /search command to obtain it.\n\n", { parse_mode: "HTML" })
                            .then(msg => {
                                bot.once('message', msg => {
                                    var joinid = msg.text.toString();
                                    if (joinid.indexOf('/') < 0 && paramCheck(joinid)) { //Command check
                                        joinOrder(chatId, joinid, dateTime);
                                    } else {
                                        console.log("Exited function due to '/' detected.");
                                    }
                                });
                            });
                    }
                });
            } else {
                console.log("Unregisted");
                bot.sendMessage(chatId, "Your account is not registered! Please register using /start");
            }
        });
    }
});

function joinOrder(chatId, joinid, dateTime) { // User chatId, will try and join the order with joinid 

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
                    const hostTime = result[i].time;
                    const pickUp = result[i].pickup;

                    var sql = "SELECT * FROM foodhitch.joinhost WHERE orderId = '" + result[i].id + "' AND status = '0' AND joinerId = '" + chatId + "'";
                    con.query(sql, function (err, result) {
                        if (err) {
                            bot.sendMessage(chatId, "Error!! Try again /host");
                        } else {
                            if (result.length != 1) {
                                console.log(result);
                                if (hostTelegram == 'undefined') {
                                    bot.sendMessage(chatId, "Success! Retrieving information...\n\n<b>Order ID</b>: " + joiningOrderId + "\n<b>Ordering</b>: " + hostingCompany + "\n<b>Expected ordering time</b>: " + hostTime + "\n<b>Pick up location: </b>" + pickUp + "\n\n<b>Host name</b>: " + hostName + "\n<b>Contact</b>: " + hostNumber + "\n<b>Residential Hall</b>: " + hostHall,
                                        { parse_mode: "HTML" });
                                } else {
                                    bot.sendMessage(chatId, "Success! Retrieving information...\n\n<b>Order ID</b>: " + joiningOrderId + "\n<b>Ordering</b>: " + hostingCompany + "\n<b>Expected ordering time</b>: " + hostTime + "\n<b>Pick up location: </b>" + pickUp + "\n\n<b>Host name</b>: " + hostName + "\n<b>Contact</b>: " + hostNumber + "\n<b>Telegram ID</b>: @" + hostTelegram + "\n<b>Residential Hall</b>: " + hostHall,
                                        { parse_mode: "HTML" });
                                }
                            } else {
                                if (hostTelegram == 'undefined') {
                                    bot.sendMessage(chatId, "===Order Information===\n<b>Order ID</b>: " + joiningOrderId + "\n<b>Ordering</b>: " + hostingCompany + "\n<b>Expected ordering time</b>: " + hostTime + "\n<b>Pick up location: </b>" + pickUp + "\n\n===Host Information===\n<b>Host name</b>: " + hostName + "\n<b>Contact</b>: " + hostNumber + "\n<b>Residential Hall</b>: " + hostHall,
                                        { parse_mode: "HTML" });
                                } else {
                                    bot.sendMessage(chatId, "===Order Information===\n<b>Order ID</b>: " + joiningOrderId + "\n<b>Ordering</b>: " + hostingCompany + "\n<b>Expected ordering time</b>: " + hostTime + "\n<b>Pick up location: </b>" + pickUp + "\n\n===Host Information===\n<b>Host name</b>: " + hostName + "\n<b>Contact</b>: " + hostNumber + "\n<b>Telegram ID</b>: @" + hostTelegram + "\n<b>Residential Hall</b>: " + hostHall,
                                        { parse_mode: "HTML" });
                                }
                            }
                        }
                    });

                    // if (hostTelegram == 'undefined') {
                    //     bot.sendMessage(chatId, "Success! Retrieving information...\n\n<b>Order ID</b>: " + joiningOrderId + "\n<b>Ordering</b>: " + hostingCompany + "\n<b>Expected ordering time</b>: " + result[i].time + "\n<b>Pick up location: </b>" + result[i].pickup + "\n\n<b>Host name</b>: " + hostName + "\n<b>Contact</b>: " + hostNumber + "\n<b>Residential Hall</b>: " + hostHall,
                    //         { parse_mode: "HTML" });
                    // } else {
                    //     bot.sendMessage(chatId, "Success! Retrieving information...\n\n<b>Order ID</b>: " + joiningOrderId + "\n<b>Ordering</b>: " + hostingCompany + "\n<b>Expected ordering time</b>: " + result[i].time + "\n<b>Pick up location: </b>" + result[i].pickup + "\n\n<b>Host name</b>: " + hostName + "\n<b>Contact</b>: " + hostNumber + "\n<b>Telegram ID</b>: @" + hostTelegram + "\n<b>Residential Hall</b>: " + hostHall,
                    //         { parse_mode: "HTML" });
                    // }

                    const orderHostInfo = "<b>Order ID</b>: " + joiningOrderId + "\n<b>Ordering</b>: " + hostingCompany + "\n<b>Expected ordering time</b>: " + result[i].time + "\n<b>Pick up location: </b>" + result[i].pickup;

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
                                                        joinerName = result[0].name;
                                                        joinerNumber = result[0].number;
                                                        joinerTelegram = result[0].telegram;
                                                        if (joinerTelegram == 'undefined') {
                                                            joinerTelegram = '';
                                                        }
                                                        joinerHall = result[0].address;

                                                        bot.sendMessage(chatId, "===New join request===\n\nJoining Order:\n" + orderHostInfo + "\n\nYou are joining as a hitch foodie with information as below:\n" + "<b>Hitch Foodie's name</b>: " + joinerName + "\n<b>Hitch Foodie's number</b>: " + joinerNumber + "\n<b>Hitch Foodie's telegram</b>: @" +
                                                            joinerTelegram + "\n<b>Hitch Foodie's hall</b>: " + joinerHall + "\n\n<b>Request</b>: " + request + "\n\n===End of request===\n\nConfirm send request to host?\n\nNote: You won't be able to change your join request upon sending it!!", {
                                                                reply_markup: {
                                                                    inline_keyboard: [
                                                                        [
                                                                            { text: "Yes", callback_data: 'yes' },
                                                                            { text: "No", callback_data: 'no' }
                                                                        ]
                                                                    ]
                                                                },
                                                                parse_mode: "HTML"
                                                            }).then(() => {
                                                                bot.once('callback_query', callbackQuery => {
                                                                    const msg = callbackQuery.message;
                                                                    const chatId = msg.chat.id;
                                                                    const data = callbackQuery.data;

                                                                    if (data === 'yes') {
                                                                        bot.answerCallbackQuery(callbackQuery.id)
                                                                            .then(() =>
                                                                                con.connect(function (err) {
                                                                                    var sql = "INSERT INTO foodhitch.joinhost (joinerid, hostid, request, orderid, status, code) VALUES ('" + joinerId + "','" + hostId + "','" + request + "','" + joiningOrderId + "','0','" + confirmationCode + "')";
                                                                                    con.query(sql, function (err, result) {
                                                                                        if (err) {
                                                                                            bot.sendMessage(chatId, "Error occurred! Please try again!");
                                                                                        } else {
                                                                                            bot.sendMessage(chatId, "Sent request! Please wait for the host to get back to you :)");
                                                                                            bot.sendMessage(hostId, "=== New join request ===\n\nYour host:\n" + orderHostInfo + "\n\n<b>Hitch Foodie's name</b>: " + joinerName + "\n<b>Hitch Foodie's number</b>: " + joinerNumber + "\n<b>Hitch Foodie's telegram</b>: @" +
                                                                                                joinerTelegram + "\n<b>Hitch Foodie's hall</b>: " + joinerHall + "\n\n<b>Request</b>: " + request + "\n\n=== End of request ===\n\nUse /accept and enter confirmation code to accept join request.\nUse /decline and enter confirmation code to decline join request.\n<b>Confirmation code</b>: " + confirmationCode,
                                                                                                { parse_mode: "HTML" });
                                                                                            // console.log("1 record (joinhost) inserted");
                                                                                        }
                                                                                    });
                                                                                })
                                                                            );
                                                                    } else if (data === 'no') {
                                                                        bot.answerCallbackQuery(callbackQuery.id)
                                                                            .then(() => bot.sendMessage(chatId, "Ok not joining...Bye..."));
                                                                    } else {
                                                                        bot.sendMessage(chatId, "Error!! Try again /join");
                                                                    }

                                                                });
                                                            })
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


}

// to accept a join request using confirmation code
bot.onText(/\/accept/, msg => {
    const chatId = msg.from.id;
    const groupId = msg.chat.id;

    if (msg.chat.type == 'group') {
        bot.sendMessage(groupId, "I am not supposed to be here...Bye!")
        bot.leaveChat(groupId);
    } else {
        acceptJoin(chatId);
    }
});

// to decline a join request using confirmation code 
bot.onText(/\/decline/, msg => {
    const chatId = msg.from.id;
    const groupId = msg.chat.id;

    if (msg.chat.type == 'group') {
        bot.sendMessage(groupId, "I am not supposed to be here...Bye!")
        bot.leaveChat(groupId);
    } else {
        declineJoin(chatId);
    }
});


// To terminate current operation. (Un completed)
bot.onText(/\/cancel/, msg => {
    const chatId = msg.from.id;
    const groupId = msg.chat.id;

    if (msg.chat.type == 'group') {
        bot.sendMessage(groupId, "I am not supposed to be here...Bye!")
        bot.leaveChat(groupId);
    } else {
        bot.sendMessage(chatId, "Current operation is terminated!");
    }
});


// User accepting a join request.
function acceptJoin(chatId) {

    bot.sendMessage(chatId, '=== Accepting Join Request ===\nPlease enter confirmation code: ')
        .then(msg => {
            bot.once('message', msg => {
                code = msg.text;

                if (code.indexOf('/') < 0 && paramCheck(code)) { //Command check

                    con.connect(function (err) {

                        var sql = "SELECT * FROM foodhitch.joinhost WHERE status = '0' AND code = '" + code + "' AND hostId = '" + chatId + "'";

                        console.log(sql);

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

                console.log("Message: " + msg.text);
                console.log("Current user id: " + chatId);
                console.log("Message Chat id " + msg.chat.id);

                if (code.indexOf('/') < 0 && paramCheck(code)) { //Command check

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
                        ]
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
                                // number = parseInt(msg.text.toString());
                                number = msg.text.toString();

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

                                if (address == 'Eusoff' || address == 'Kent Ridge' || address == 'KE7' || address == 'PGP' ||
                                    address == 'Raffles' || address == 'Sheares' || address == 'Temasek' || address == 'Others') {
                                    var updateSQL = `UPDATE foodhitch.user SET address = '${address}' WHERE iduser = '${chatId}'`;

                                    con.query(updateSQL, function (err, result) {
                                        if (err) {
                                            bot.sendMessage(chatId, "Error!! Try again /start");
                                            throw err;
                                        } else {
                                            bot.sendMessage(chatId, `Your residential hall has been updated successfully to: <b>${address}</b>!`, { parse_mode: "HTML" });
                                        }
                                    });
                                } else {
                                    bot.sendMessage(chatId, "Error!! Try again /update");
                                }

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
                } else {
                    bot.sendMessage(chatId, "Please try again!! /update");
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

// when the user is already hosting
function currentHosting(chatId, result) {
    const currentHostId = result[0].id;
    const currentHostName = result[0].name;

    const hostInfo = `<b>Order ID:</b> ${result[0].id}\n<b>Ordering:</b> ${result[0].company}\n<b>Time:</b> ${result[0].time}\n<b>Pick-up location:</b> ${result[0].pickup}\n`;

    bot.sendMessage(chatId, 'You have an existing host: \n' + hostInfo + "What would you like to do?", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Update status: Completed', callback_data: 'complete' },
                    { text: 'Update status: Cancel', callback_data: 'cancel' }

                ],
                [
                    { text: 'View joins', callback_data: 'view' },
                    { text: 'Broadcast message', callback_data: 'broadcast' },
                    { text: 'Do nothing', callback_data: 'nothing' }
                ]
            ]
        },
        parse_mode: 'HTML'
    });

    bot.once("callback_query", callbackQuery => {
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;
        const data = callbackQuery.data;

        // if (hostResponse.indexOf('/') < 0) { //Command check
        if (data === 'nothing') {
            bot.answerCallbackQuery(callbackQuery.id)
                .then(() => bot.sendMessage(chatId, 'Doing nothing'));
        } else if (data === 'broadcast') {
            bot.answerCallbackQuery(callbackQuery.id)
                .then(() => {
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
                });
        } else if (data === 'view') {
            var view = `Hitch foodies for your current host: \n<b>Order ID:</b> ${result[0].id}\n<b>Ordering:</b> ${result[0].company}\n<b>Time:</b> ${result[0].time}\n<b>Pick-up location:</b> ${result[0].pickup}\n\n`;
            view += "================";
            bot.answerCallbackQuery(callbackQuery.id)
                .then(() => {
                    var sql = "SELECT * FROM foodhitch.joinhost JOIN foodhitch.user ON foodhitch.user.iduser = foodhitch.joinhost.joinerId WHERE status != '2' AND orderId = '" + currentHostId + "'";
                    con.query(sql, function (err, result) {
                        if (err) {
                            bot.sendMessage(chatId, "Error!! Try again /host");
                            throw err;
                        } else {
                            view = view + "\n<b>Number of joins:</b> " + result.length + "\n" + "================";
                            for (x = 0; x < result.length; x++) {
                                view = view + "\n<b>" + (x + 1) + ": " + result[x].name + "</b>\n<b>Number</b>: " + result[x].number + "\n<b>Order request</b>: " + result[x].request + "\n<b>Status</b>: ";
                                if (result[x].status == 0) {
                                    view = view + "Pending" + "\n<b>Confirmation code</b>: " + result[x].code + "\n";
                                } else {
                                    view = view + "Accepted\n";
                                }
                            }
                            bot.sendMessage(chatId, view, { parse_mode: 'HTML' });
                        }
                    });
                })
        } else if (data === 'complete' || data === 'cancel') {
            var updateStatus;
            if (data === 'completed') updateStatus = '2';
            else updateStatus = '3';
            updateHostStatus(chatId, data, updateStatus, currentHostId, hostInfo);
        } else {
            bot.sendMessage(chatId, "Please try again!! /host");
        }
    });
}

// to update status to either "complete" or "cancel"
function updateHostStatus(chatId, hostResponse, updateStatus, currentHostId, hostInfo) {
    con.connect(function (err) {
        var sql = "UPDATE foodhitch.order SET status ='" + updateStatus + "' WHERE userid = '" + chatId + "' AND status = '0'";
        con.query(sql, function (err, result) {
            if (err) {
                bot.sendMessage(chatId, "Error!! Try again /host");
                throw err;
            } else {
                bot.sendMessage(chatId, `Update status to "<b>${hostResponse}</b>" successfully!!`, { parse_mode: "HTML" });
                var sql = "SELECT * FROM foodhitch.joinhost JOIN foodhitch.user ON foodhitch.user.iduser = foodhitch.joinhost.joinerId WHERE foodhitch.joinhost.status = '1' AND orderId = '" + currentHostId + "'";
                con.query(sql, function (err, result) {
                    if (err) {
                        bot.sendMessage(chatId, "Error!! Try again /host");
                        throw err;
                    } else {
                        var status = `The host has set this order as "<b>${hostResponse}</b>"`;
                        for (x = 0; x < result.length; x++) {
                            bot.sendMessage(result[x].joinerId, "===Broadcast===\n" + hostInfo + "\n==============\n\n" + status, { parse_mode: 'HTML' });
                        }
                    }
                });
            }
        });
    });
}

// to host an order
function hostAnOrder(chatId, callbackQuery) {
    var orderFrom;
    bot.answerCallbackQuery(callbackQuery.id)
        .then(() => {
            bot.sendMessage(chatId, "Hosting a delivery order...\n" + "What would you like to order? (Eg. McDonald's)")
                .then(() => {
                    bot.once('message', msg => {
                        orderFrom = removeEmojis(msg.text.toString());
                        if (orderFrom.indexOf('/') < 0) { // Command check
                            bot.sendMessage(chatId, "How many hours later do you plan to order your food?", {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            { text: '1', callback_data: '1' },
                                            { text: '2', callback_data: '2' },
                                            { text: '3', callback_data: '3' }
                                        ],
                                        [
                                            { text: '4', callback_data: '4' },
                                            { text: '5', callback_data: '5' },
                                            { text: '6', callback_data: '6' }
                                        ]
                                    ]
                                }
                            });

                            bot.once('callback_query', callbackQuery => {
                                const msg = callbackQuery.message;
                                const chatId = msg.chat.id;
                                const data = callbackQuery.data;

                                var today = new Date();
                                today.setHours(today.getHours() + parseInt(data));
                                var date = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
                                var time = pad(today.getHours()) + ":" + pad(today.getMinutes()) + ":" + pad(today.getSeconds());
                                var dateTime = date + ' ' + time;
                                bot.answerCallbackQuery(callbackQuery.id)
                                    .then(() => {
                                        bot.sendMessage(chatId, `You shall order <b>${orderFrom}</b> at around:\n<b>${dateTime}</b>`, {
                                            parse_mode: "HTML"
                                        }).then(() => {
                                            bot.sendMessage(chatId, "Describe your intended pickup location: ")
                                                .then(() => {
                                                    bot.once('message', msg => {
                                                        pickUp = msg.text.toString();
                                                        pickUp = removeEmojis(pickUp);

                                                        if (pickUp.indexOf('/') < 0) { //Command check
                                                            bot.sendMessage(chatId, `Hosting order...\n\n<b>Ordering from:</b> ${orderFrom}\n<b>Order time:</b> ${dateTime}\n<b>Pick up location:</b> ${pickUp}\n`, {
                                                                parse_mode: "HTML"
                                                            });
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
                                                    });
                                                });
                                        });

                                    })
                            })
                        } else {
                            console.log("Exited hosting function due to '/' detected.");
                        }
                    });
                });
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

function paramCheck(danger) {
    // console.log('cp1');
    // console.log('cp2');
    if (danger.includes('=') || danger.includes(';') || danger.includes('insert') || danger.includes('includes') || danger.includes('like')) {
        console.log("SQL Injection risk detected!!!");
        return false;
    } else {
        console.log("Input validated");
        return true;
    }

}

function isHosting(chatId, callback) {

    var sql = "SELECT * FROM foodhitch.order JOIN foodhitch.user ON foodhitch.user.iduser = foodhitch.order.userid WHERE status = '0' AND userid = '" + chatId + "';";

    con.query(sql, function (err, result) {

        if (err) {
            bot.sendMessage(chatId, "Error!! Try again /host");
            throw err;
        } else {
            if (result.length != 0) {
                // console.log("User is hosting!");
                return callback(true);
            } else {
                // console.log("User is not hosting!");
                return callback(false);
            }
        }
    });

}

function isJoining(chatId, callback) {

    var today = new Date();
    var date = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    var time = pad(today.getHours()) + ":" + pad(today.getMinutes()) + ":" + pad(today.getSeconds());
    var dateTime = date + ' ' + time;

    var sql = "SELECT *, joinhost.status AS joinhostStatus  FROM foodhitch.joinhost JOIN foodhitch.order ON joinhost.orderid = order.id WHERE  order.status = '0' AND joinhost.joinerid = '" + chatId + "' AND order.time > '" + dateTime + "'";

    con.query(sql, function (err, result) {

        if (err) {
            bot.sendMessage(chatId, "Error!! Try again /join");
            throw err;
        } else {

            var pending = 0;
            var accepted = 0;

            for (x = 0; x < result.length; x++) {
                if (result[x].joinhostStatus == '1') {
                    accepted = 1;
                } else if (result[x].joinhostStatus == '0') {
                    pending = 1;
                }
            }

            if (pending == 1 || accepted == 1) {
                // console.log("User has accepted/pending requests!");
                return callback(true);
            } else {
                // console.log("User does not have accepted/pending requests!");
                return callback(false);
            }

        }
    });


}

function isRegistered(chatId, callback) {
    var sql = `SELECT * FROM foodhitch.user WHERE iduser = '${chatId}'`;

    con.query(sql, function (err, result) {

        if (err) {
            bot.sendMessage(chatId, "Error!! Try again");
            throw err;
        } else {
            if (result.length != 0) {
                // console.log("User is registered!");
                return callback(true);
            } else {
                // console.log("User is not registered!");
                return callback(false);
            }
        }
    });
}

function removeEmojis(string) {
    var regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

    return string.replace(regex, '');
}
