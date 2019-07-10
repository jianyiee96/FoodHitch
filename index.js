// Telegram bot library for node.js
var TelegramBot = require('node-telegram-bot-api');
var mysql = require('mysql');
// test
//Database connection
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "foodhitch88",
    dateStrings: true
});

// Token of the bot from @botfather
var token = '840173157:AAG6AkTgKONfFA8bZIiFZsIOs3CWeN23mDc';

// Run our bot on local
var bot = new TelegramBot(token, { polling: true });

// When a user first users this bot, it will prompt the user to start the registration process.

bot.onText(/\/start/, msg => {

    const chatId = msg.chat.id;
    const name = msg.from.first_name;
    const username = msg.from.username;
    var number = 'Default';
    var address = 'Default';

    bot.sendMessage(chatId, "Welcome " + name + ". Please proceed with the registration.");
    bot.sendMessage(chatId, 'What is your contact number?', {
        reply_markup: {
            force_reply: true
        }
    }).then(msg => {
        bot.onReplyToMessage(chatId, msg.message_id, msg => {
            number = msg.text.toString();

            if (number.indexOf('/') < 0) { //Command check

                bot.sendMessage(chatId, 'Your Hall (PGP/KE7/KR/T/E/R/S/OTHERS)?', {
                    reply_markup: {
                        force_reply: true
                    }
                }).then(msg => {
                    bot.onReplyToMessage(chatId, msg.message_id, msg => {
                        address = msg.text.toString();

                        if (address.indexOf('/') < 0) { //Command check

                            if (number != 'Default' && address != 'Default') { //input validation

                                bot.sendMessage(chatId, "Your information is registered as follows:\n" +
                                    "Name: " + name + "\n" + "Contact: " + number + "\n" +
                                    "Hall: " + address + "\n\nRegistering...."
                                )

                                //Inserting into database.
                                con.connect(function (err) {

                                    var sql = "INSERT INTO foodhitch.user (iduser, name, number, address, telegram) VALUES (" + chatId + ", '" + name + "', '" + number + "', '" + address + "','" + username + "')";
                                    con.query(sql, function (err, result) {
                                        if (err) {
                                            bot.sendMessage(chatId, "Error!! Try again /start");
                                        } else {
                                            bot.sendMessage(chatId, "Success!!");
                                        }
                                    });
                                });
                            } else {
                                bot.sendMessage(chatId, "Please try again and follow the instructions! /start");
                            }
                        } else {
                            console.log("Exited start function due to '/' detected.");
                        }
                    });
                });
            } else {
                console.log("Exited start function due to '/' detected.");
            }
        });
    });
});

// When a user wants to host a deliver order, "/host" will prompt the user to input relevant details.
bot.onText(/\/host/, msg => {

    const chatId = msg.chat.id;
    var orderFrom = 'Default';
    var orderTime = 'Default';
    var pickuUp = 'Default';

    //Checks if the user is currently hosting..
    con.connect(function (err) {


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

                    var view = "Hitch foodies for your current host: \nOrder id: " + result[0].id + "\nOdering: "+ result[0].company + "\n" + result[0].time + " @ " + result[0].pickup + "\n\n";

                    const hostInfo = "Order id: " + result[0].id + "\nOrdering: " + result[0].company + "\n" + result[0].time + " @ " + result[0].pickup +"\n";

                    bot.sendMessage(chatId, 'You have an existing host: \n'+ hostInfo +
                        "what would you like to do?\n 1) Do nothing\n 2) Update status: Completed\n 3) Update status: Cancel\n 4) View joins\n 5) Broadcast message", {
                            reply_markup: {
                                force_reply: true
                            }
                        }).then(msg => {
                            bot.onReplyToMessage(chatId, msg.message_id, msg => {
                                const hostResponse = msg.text.toString();

                                if (hostResponse.indexOf('/') < 0) { //Command check

                                    if (!(hostResponse === '1' || hostResponse === '2' || hostResponse === '3' || hostResponse === '4' || hostResponse === '5')) {
                                        bot.sendMessage(chatId, 'Invalid response');
                                    } else {

                                        if (hostResponse === '1') {
                                            bot.sendMessage(chatId, 'Doing nothing');
                                        } else if (hostResponse === '5') {

                                            bot.sendMessage(chatId, "Reply to this message what you want to broadcast to your hitch foodies:", {
                                                reply_markup: {
                                                    force_reply: true
                                                }
                                            }).then(msg => {
                                                bot.onReplyToMessage(chatId, msg.message_id, msg => {
                                                    const broadcast = msg.text;

                                                    if (broadcast.indexOf('/') < 0) {
                                                        console.log(broadcast);

                                                        var sql = "SELECT * FROM foodhitch.joinhost JOIN foodhitch.user ON foodhitch.user.iduser = foodhitch.joinhost.joinerId WHERE foodhitch.joinhost.status = '1' AND orderId = '" + currentHostId + "'";
                                                        con.query(sql, function (err, result) {
                                                            if (err) {
                                                                bot.sendMessage(chatId, "Error!! Try again /host");
                                                                throw err;
                                                            } else {
                                                                console.log("Number of joins to be broadcasted to: " + result.length);
                                                                console.log(result);

                                                                for (x = 0; x < result.length; x++) {                                                                    
                                                                    bot.sendMessage(result[x].joinerId, "===Broadcast===\n"+hostInfo +"\n==============\n"+currentHostName+":\n "+broadcast);
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
                                                    console.log("Number of joins: " + result.length);
                                                    console.log(result);

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
                                                                console.log("Number of joins to be broadcasted to: " + result.length);
                                                                console.log(result);
                                                                var status = "";
                                                                if(hostResponse === '2'){
                                                                    status = 'The host has set this order as completed!';
                                                                } else if(hostResponse === '3'){
                                                                    status = 'The host has cancelled this order!';
                                                                }

                                                                for (x = 0; x < result.length; x++) {                                                                    
                                                                    bot.sendMessage(result[x].joinerId, "===Broadcast===\n"+hostInfo +"\n==============\n\n"+status);
                                                                }
                                                            }
                                                        });
                                                    }
                                                });
                                            });
                                        }
                                    }
                                } else {
                                    console.log("Exited hosting function due to '/' detected.");
                                }
                            });
                        });
                } else {
                    //If he is not hosting...
                    bot.sendMessage(chatId, 'Do you want to host a delivery order? (Y/N)', {
                        reply_markup: {
                            force_reply: true
                        }
                    }).then(msg => {
                        bot.onReplyToMessage(chatId, msg.message_id, msg => {
                            const response = msg.text.toString().toLowerCase();

                            if (response.indexOf('/') < 0) { //Command check

                                if (response.indexOf('y') === 0) {


                                    bot.sendMessage(chatId,
                                        "Hosting a delivery order...\n" + "What are you ordering? (Eg. Macdonalds)", {
                                            reply_markup: {
                                                force_reply: true
                                            }
                                        }).then(msg => {
                                            bot.onReplyToMessage(chatId, msg.message_id, msg => {
                                                orderFrom = msg.text.toString();

                                                if (orderFrom.indexOf('/') < 0) { //Command check

                                                    bot.sendMessage(chatId, "Ordering: " + orderFrom);

                                                    setTimeout(function () {
                                                    }, 500);

                                                    bot.sendMessage(chatId, "How many hours later do you plan to order your food? (1-6 hours)", {
                                                        reply_markup: {
                                                            force_reply: true
                                                        }
                                                    }).then(msg => {
                                                        bot.onReplyToMessage(chatId, msg.message_id, msg => {
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
                                                                    bot.sendMessage(chatId, "Describe your intended pickup location: ", {
                                                                        reply_markup: {
                                                                            force_reply: true
                                                                        }
                                                                    }).then(msg => {
                                                                        bot.onReplyToMessage(chatId, msg.message_id, msg => {
                                                                            pickUp = msg.text.toString();

                                                                            if (pickUp.indexOf('/') < 0) { //Command check
                                                                                bot.sendMessage(chatId, "Hosting order...\n\nOrdering from: " + orderFrom + "\nOrder time: " + dateTime + "\nPick up location: " + pickUp + "\n")

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
                                } else if (response.indexOf('n') === 0) {
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


                var list = "";

                for (i = 0; i < result.length; i++) {

                    list = list + "Order ID: "+result[i].id + "\nType of Food: "+result[i].company + "\nDate: "+result[i].time.split(" ")[0] + "\nExpected ordering time: "+ result[i].time.split(" ")[1] + "\nPick up location: " + result[i].pickup + "\n\n";

                    //list = list + result[i].id + ": " + result[i].company + "(" + result[i].address + ")\n" + result[i].time + " @ " + result[i].pickup + "\n\n";
                }

                if (result.length == 0) {
                    bot.sendMessage(chatId, "There is no existing host!");
                } else {
                    bot.sendMessage(chatId, "===Existing Order Groups===\n\n" + list + "====================");
                    //bot.sendMessage(chatId, "Existing hosts: \n[Id]: [Food](HALL)\n[Order time] @ [Pick Up]\n\n" + list);
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

    var currentJoin = "Order hosts that you have joined: \n\n";
    var sql = "SELECT *, joinhost.status AS joinhostStatus  FROM foodhitch.joinhost JOIN foodhitch.order ON joinhost.orderid = order.id WHERE  order.status = '0' AND joinhost.joinerid = '" + chatId + "' AND order.time > '" + dateTime + "'";

    con.query(sql, function (err, result) {
        if (err) {
            bot.sendMessage(chatId, "Error!! Try again /join");
            throw err;
        } else {

            console.log(result.length);
            console.log(result);

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
            bot.sendMessage(chatId, currentJoin + "Please input the id of hosted order that you are joining.\nYou can use the /search command to obtain it.\n\n", {
                reply_markup: {
                    force_reply: true
                }
            }).then(msg => {
                bot.onReplyToMessage(chatId, msg.message_id, msg => {

                    var joinid = msg.text.toString();

                    if (joinid.indexOf('/') < 0) { //Command check

                        var sql = "SELECT foodhitch.user.iduser, foodhitch.user.name, foodhitch.user.address, foodhitch.user.telegram, foodhitch.user.number , foodhitch.order.id, foodhitch.order.company, foodhitch.order.time, foodhitch.order.pickup FROM foodhitch.order JOIN foodhitch.user ON user.iduser=order.userid WHERE status = '0' AND order.userid != '" + chatId + "' AND time > '" + dateTime + "'";
                        con.query(sql, function (err, result) {
                            if (err) {
                                bot.sendMessage(chatId, "Error!! Try again /join");
                            } else {

                                var found = '0';

                                console.log(result);

                                for (i = 0; i < result.length; i++) {

                                    if (result[i].id == joinid) {

                                        if (result[i].telegram == 'undefined') {
                                            bot.sendMessage(chatId, "Success! Retrieving information...\n\nOrder " + result[i].id + ": " + result[i].company + "(" + result[i].address + ")\n" + result[i].time + " @ " + result[i].pickup + "\n\nHost name: " + result[i].name + "\nContact: " + result[i].number + "\nHall: " + result[i].address);
                                        } else {
                                            bot.sendMessage(chatId, "Success! Retrieving information...\n\nOrder " + result[i].id + ": " + result[i].company + "(" + result[i].address + ")\n" + result[i].time + " @ " + result[i].pickup + "\n\nHost name: " + result[i].name + "\nContact: " + result[i].number + "\nTelegram id: @" + result[i].telegram + "\nHall: " + result[i].address);
                                        }

                                        const orderHostInfo = "Order " + result[i].id + ": " + result[i].company + "(" + result[i].address + ")\n" + result[i].time + " @ " + result[i].pickup;

                                        const joiningOrderId = result[i].id;
                                        const hostName = result[i].name;
                                        const hostNumber = result[i].number;
                                        const hostTelegram = result[i].telegram;
                                        const hostHall = result[i].address;
                                        const hostId = result[i].iduser;
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
                                                    bot.sendMessage(chatId, "Please type down your order. Be specific and clear or else the host might not accept your join request!", {
                                                        reply_markup: {
                                                            force_reply: true
                                                        }
                                                    }).then(msg => {
                                                        bot.onReplyToMessage(chatId, msg.message_id, msg => {
                                                            request = msg.text.toString();

                                                            if (request.indexOf('/') < 0) { //Command check
                                                                console.log("Request: " + request);

                                                                var sql = "SELECT * FROM foodhitch.user WHERE iduser = '" + chatId + "'";
                                                                con.query(sql, function (err, result) {
                                                                    if (err) {
                                                                        bot.sendMessage(chatId, "Error!! Try again /host");
                                                                        throw err;
                                                                    } else {
                                                                        console.log("Joiner's name: " + result[0].name);
                                                                        console.log("Joiner's contact " + result[0].number);
                                                                        console.log("Joiner's telegram: " + result[0].telegram);
                                                                        console.log("Joiner's hall: " + result[0].address);

                                                                        joinerName = result[0].name;
                                                                        joinerNumber = result[0].number;
                                                                        joinerTelegram = result[0].telegram;

                                                                        if (joinerTelegram == 'undefined') {
                                                                            joinerTelegram = '';
                                                                        }

                                                                        joinerHall = result[0].address;


                                                                        bot.sendMessage(chatId, "===New join request===\n\nJoining host:\n" + orderHostInfo + "\n\nJoiner's name: " + joinerName + "\nJoiner's number: " + joinerNumber + "\nJoiner's telegram: @" +
                                                                            joinerTelegram + "\nJoiner's hall: " + joinerHall + "\n\nRequest: " + request + "\n===End of request===\n\nConfirm send request to host? (Y/N)\n\nNote: You won't be able to change your join request upon sending it!!", {
                                                                                reply_markup: {
                                                                                    force_reply: true
                                                                                }
                                                                            }).then(msg => {
                                                                                bot.onReplyToMessage(chatId, msg.message_id, msg => {
                                                                                    const response = msg.text.toString().toLowerCase();

                                                                                    if (response.indexOf('/') < 0) { //Command check

                                                                                        if (response.indexOf('y') === 0) {

                                                                                            con.connect(function (err) {

                                                                                                var sql = "INSERT INTO foodhitch.joinhost (joinerid, hostid, request, orderid, status, code) VALUES ('" + joinerId + "','" + hostId + "','" + request + "','" + joiningOrderId + "','0','" + confirmationCode + "')";
                                                                                                con.query(sql, function (err, result) {
                                                                                                    if (err) {
                                                                                                        bot.sendMessage(chatId, "Error occurred! Please try again!");
                                                                                                    } else {
                                                                                                        bot.sendMessage(chatId, "Sent request! Please wait for the host to get back to you :)");
                                                                                                        bot.sendMessage(hostId, "===New join request===\n\nYour host:\n" + orderHostInfo + "\n\nJoiner's name: " + joinerName + "\nJoiner's number: " + joinerNumber + "\nJoiner's telegram: @" +
                                                                                                            joinerTelegram + "\nJoiner's hall: " + joinerHall + "\n\nRequest: " + request + "\n===End of request===\n\nUse /accept and enter confirmation code to accept join request.\nConfirmation code: " + confirmationCode);

                                                                                                        console.log("1 record (joinhost) inserted");
                                                                                                    }
                                                                                                });
                                                                                            });
                                                                                        } else if (response.indexOf('n') === 0) {
                                                                                            bot.sendMessage(chatId, "Ok not joining.. Bye...")
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

bot.onText(/\/accept/, msg => {

    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Please enter confirmation code: ', {
        reply_markup: {
            force_reply: true
        }
    }).then(msg => {
        bot.onReplyToMessage(chatId, msg.message_id, msg => {
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

                                bot.sendMessage(chatId, "Valid code! For this request: \n1) Accept\n2) Decline", {
                                    reply_markup: {
                                        force_reply: true
                                    }
                                }).then(msg => {
                                    bot.onReplyToMessage(chatId, msg.message_id, msg => {
                                        const reply = msg.text;

                                        if (reply.indexOf('/') < 0) { //Command check

                                            if (!(reply == '1' || reply == '2')) {
                                                bot.sendMessage(chatId, 'Invalid response');
                                            } else {

                                                con.connect(function (err) {

                                                    var sql = "UPDATE foodhitch.joinhost SET status ='" + reply + "' WHERE code = '" + code + "' AND status = '0'";
                                                    con.query(sql, function (err, result) {
                                                        if (err) {
                                                            bot.sendMessage(chatId, "Error!! Try again /host");
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

                                                                            if (reply == '1') { //accept join, update database and update joiner that his requested is accepted.
                                                                                bot.sendMessage(chatId, "Accepted join request!");
                                                                                bot.sendMessage(joinerId, "YOU JOIN REQUEST WAS ACCEPTED! \n\n" + orderInfo + " \n\nRequest: " + request);
                                                                            } else if (reply == '2') { //Decline join, provide reason

                                                                                bot.sendMessage(chatId, "Declined join request!");
                                                                                bot.sendMessage(joinerId, "YOU JOIN REQUEST WAS DECLINED! \n\n" + orderInfo + "\n\nRequest: " + request);

                                                                            }
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                                });
                                            }
                                        } else {
                                            console.log("Exited function due to '/' detected.");
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
});


function pad(num) {
    var size = 2;
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function makeid(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
